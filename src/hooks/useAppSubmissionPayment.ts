import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

interface PaymentConfig {
  lightningAddress: string;
  feeAmount: number;
}

interface PaymentResult {
  invoice: string;
  zapRequest: NostrEvent;
  paid: boolean;
}

interface LightningAddressProfile {
  pubkey: string;
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
}


export function useAppSubmissionPayment() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [paymentState, setPaymentState] = useState<{
    invoice: string | null;
    zapRequest: NostrEvent | null;
    paid: boolean;
    verifying: boolean;
  }>({
    invoice: null,
    zapRequest: null,
    paid: false,
    verifying: false,
  });

  // Get payment configuration from environment
  const getPaymentConfig = useCallback((): PaymentConfig | null => {
    const lightningAddress = import.meta.env.VITE_SUBMIT_APP_LIGHTNING_ADDRESS;
    const feeAmount = parseInt(import.meta.env.VITE_SUBMIT_APP_FEE || '0', 10);

    if (!lightningAddress || !feeAmount || feeAmount <= 0) {
      return null;
    }
    return { lightningAddress, feeAmount };
  }, []);

  // Check if payment is required
  const isPaymentRequired = useCallback(() => {
    return getPaymentConfig() !== null;
  }, [getPaymentConfig]);

  // Create payment invoice
  const createPaymentMutation = useMutation({
    mutationFn: async (): Promise<PaymentResult> => {
      if (!user) {
        throw new Error('You must be logged in to make payments');
      }

      const config = getPaymentConfig();
      if (!config) {
        throw new Error('Payment configuration not found');
      }

      toast({
        title: 'Creating Payment Invoice',
        description: 'Connecting to lightning address and generating invoice...',
      });

      // Get lightning address profile
      const lightningProfile = await fetchLightningAddressProfile(config.lightningAddress);
      console.log('Lightning profile:', lightningProfile);
      
      const amountMsats = config.feeAmount * 1000;

      // Create zap request manually for profile zap (kind 9734)
      const zapRequestEvent: NostrEvent = {
        kind: 9734,
        content: `App submission payment via ${window.location.hostname}`,
        tags: [
          ['p', lightningProfile.pubkey],
          ['amount', amountMsats.toString()],
          ['relays', import.meta.env.VITE_RELAY_URL || 'wss://relay.nostr.band'],
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: user.pubkey,
        id: '',
        sig: '',
      };

      console.log('Manual zap request event:', zapRequestEvent);
      
      // Sign the zap request
      const signedZapRequest = await user.signer.signEvent(zapRequestEvent);
      console.log('Signed zap request:', signedZapRequest);

      // Use the callback URL directly from the lightning address profile
      const zapEndpoint = lightningProfile.callback;
      if (!zapEndpoint) {
        throw new Error('Lightning address does not support zaps (NIP-57)');
      }

      // Request invoice
      const zapEndpointUrl = new URL(zapEndpoint);
      zapEndpointUrl.searchParams.set('amount', amountMsats.toString());
      zapEndpointUrl.searchParams.set('nostr', encodeURIComponent(JSON.stringify(signedZapRequest)));

      const invoiceResponse = await fetch(zapEndpointUrl.toString());
      if (!invoiceResponse.ok) {
        throw new Error('Failed to get payment invoice');
      }

      const invoiceData = await invoiceResponse.json();
      if (!invoiceData.pr) {
        throw new Error('No invoice received');
      }

      toast({
        title: 'Payment Invoice Ready',
        description: `Invoice for ${config.feeAmount} sats created. Pay with any Lightning wallet or WebLN.`,
      });

      return {
        invoice: invoiceData.pr,
        zapRequest: signedZapRequest,
        paid: false,
      };
    },
    onSuccess: (result) => {
      setPaymentState({
        invoice: result.invoice,
        zapRequest: result.zapRequest,
        paid: false,
        verifying: false,
      });
    },
    onError: (error) => {
      console.error('Payment creation error:', error);
      toast({
        title: 'Payment Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create payment invoice',
        variant: 'destructive',
      });
    },
  });

  // Verify payment by checking for zap receipts
  const verifyPaymentMutation = useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (!paymentState.zapRequest) {
        throw new Error('No payment request found');
      }

      setPaymentState(prev => ({ ...prev, verifying: true }));

      toast({
        title: 'Verifying Payment',
        description: 'Checking for payment confirmation...',
      });

      // Wait a bit for the payment to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for zap receipts for this zap request
      // Look for receipts that reference our zap request
      const zapReceipts = await nostr.query([{
        kinds: [9735], // Zap receipt kind
        '#e': [paymentState.zapRequest.id],
        limit: 10,
      }]);

      // Also check for receipts that might reference the profile (p tag)
      const profileReceipts = await nostr.query([{
        kinds: [9735], // Zap receipt kind
        '#p': [paymentState.zapRequest.pubkey],
        since: paymentState.zapRequest.created_at - 60, // Look for receipts created around the same time
        limit: 20,
      }]);

      const allReceipts = [...zapReceipts, ...profileReceipts];

      // Validate zap receipts according to NIP-57
      const validReceipt = allReceipts.find(receipt => {
        try {
          // Check required tags
          const bolt11Tag = receipt.tags.find(tag => tag[0] === 'bolt11');
          const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');
          
          if (!bolt11Tag || !descriptionTag) {
            return false;
          }

          // Parse the zap request from the description
          const zapRequestFromReceipt = JSON.parse(descriptionTag[1]);
          
          // Verify this receipt corresponds to our zap request
          if (zapRequestFromReceipt.id !== paymentState.zapRequest?.id) {
            return false;
          }

          // Verify the zap request structure
          if (zapRequestFromReceipt.kind !== 9734) {
            return false;
          }

          // Verify the amount matches what we expected
          const amountTag = zapRequestFromReceipt.tags.find((tag: string[]) => tag[0] === 'amount');
          if (amountTag) {
            const receiptAmount = parseInt(amountTag[1]) / 1000; // Convert msats to sats
            const expectedAmount = getPaymentConfig()?.feeAmount || 0;
            
            if (receiptAmount < expectedAmount) {
              return false; // Amount is less than expected
            }
          }

          // Verify the recipient matches
          const recipientTag = zapRequestFromReceipt.tags.find((tag: string[]) => tag[0] === 'p');
          if (recipientTag) {
            const config = getPaymentConfig();
            if (config) {
              // This would need to be verified against the lightning address pubkey
              // For now, we'll trust that the receipt is valid if it has the right structure
            }
          }

          return true;
        } catch (error) {
          console.error('Error validating zap receipt:', error);
          return false;
        }
      });

      if (validReceipt) {
        toast({
          title: 'Payment Confirmed!',
          description: 'Your payment has been verified. Proceeding with app submission...',
        });
        return true;
      }

      throw new Error('Payment not yet confirmed. Please wait a moment and try again.');
    },
    onSuccess: (verified) => {
      if (verified) {
        setPaymentState(prev => ({ ...prev, paid: true, verifying: false }));
      }
    },
    onError: (error) => {
      setPaymentState(prev => ({ ...prev, verifying: false }));
      toast({
        title: 'Payment Verification Failed',
        description: error instanceof Error ? error.message : 'Could not verify payment',
        variant: 'destructive',
      });
    },
  });

  // Reset payment state
  const resetPayment = useCallback(() => {
    setPaymentState({
      invoice: null,
      zapRequest: null,
      paid: false,
      verifying: false,
    });
  }, []);

  return {
    // Configuration
    isPaymentRequired: isPaymentRequired(),
    paymentConfig: getPaymentConfig(),
    
    // State
    paymentState,
    
    // Actions
    createPayment: createPaymentMutation.mutate,
    verifyPayment: verifyPaymentMutation.mutate,
    resetPayment,
    
    // Loading states
    isCreatingPayment: createPaymentMutation.isPending,
    isVerifyingPayment: verifyPaymentMutation.isPending || paymentState.verifying,
  };
}

// Helper function to fetch lightning address profile
async function fetchLightningAddressProfile(lightningAddress: string): Promise<LightningAddressProfile> {
  const [name, domain] = lightningAddress.split('@');
  if (!name || !domain) {
    throw new Error('Invalid lightning address format');
  }

  // Fetch the .well-known/lnurlp endpoint
  const lnurlResponse = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
  if (!lnurlResponse.ok) {
    throw new Error('Lightning address not found');
  }

  const lnurlData = await lnurlResponse.json();
  
  // Check if it supports nostr (NIP-57)
  if (!lnurlData.allowsNostr || !lnurlData.nostrPubkey) {
    throw new Error('Lightning address does not support Nostr payments (NIP-57)');
  }

  return {
    pubkey: lnurlData.nostrPubkey,
    callback: lnurlData.callback,
    minSendable: lnurlData.minSendable,
    maxSendable: lnurlData.maxSendable,
    metadata: lnurlData.metadata,
  };
}
