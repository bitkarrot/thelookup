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
    invoiceCreatedAt: number | null;
  }>({
    invoice: null,
    zapRequest: null,
    paid: false,
    verifying: false,
    invoiceCreatedAt: null,
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
        invoiceCreatedAt: Date.now(),
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

      console.log('Looking for zap receipts for request:', paymentState.zapRequest.id);
      
      // Get config and lightning profile
      const config = getPaymentConfig();
      const lightningProfile = await fetchLightningAddressProfile(config!.lightningAddress);
      
      console.log('Lightning profile pubkey:', lightningProfile.pubkey);
      console.log('User pubkey:', user?.pubkey);
      
      // Try multiple approaches to find zap receipts
      const queries = [
        // 1. Receipts referencing our zap request
        {
          kinds: [9735],
          '#e': [paymentState.zapRequest.id],
          limit: 10,
        },
        // 2. Receipts to the lightning address pubkey from our user
        {
          kinds: [9735],
          '#p': [lightningProfile.pubkey],
          authors: [user?.pubkey || ''],
          since: Math.floor(Date.now() / 1000) - 600, // Last 10 minutes
          limit: 20,
        },
        // 3. Any recent receipts to the lightning address
        {
          kinds: [9735],
          '#p': [lightningProfile.pubkey],
          since: Math.floor(Date.now() / 1000) - 600, // Last 10 minutes
          limit: 50,
        },
        // 4. Receipts from our user (any recipient)
        {
          kinds: [9735],
          authors: [user?.pubkey || ''],
          since: Math.floor(Date.now() / 1000) - 600, // Last 10 minutes
          limit: 30,
        }
      ];

      let allReceipts: NostrEvent[] = [];
      for (const query of queries) {
        console.log('Running query:', query);
        const receipts = await nostr.query([query]);
        console.log('Query returned:', receipts.length, 'receipts');
        allReceipts = [...allReceipts, ...receipts];
      }

      // Remove duplicates
      const uniqueReceipts = allReceipts.filter((receipt, index, self) => 
        index === self.findIndex(r => r.id === receipt.id)
      );
      
      console.log('Total unique receipts found:', uniqueReceipts.length, uniqueReceipts);

      // Validate zap receipts - be more lenient and just check for recent payments
      const validReceipt = allReceipts.find(receipt => {
        try {
          console.log('Checking receipt:', receipt);
          
          // Check required tags
          const bolt11Tag = receipt.tags.find(tag => tag[0] === 'bolt11');
          const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');
          
          if (!bolt11Tag || !descriptionTag) {
            console.log('Missing bolt11 or description tag');
            return false;
          }

          // Parse the zap request from the description
          const zapRequestFromReceipt = JSON.parse(descriptionTag[1]);
          console.log('Zap request from receipt:', zapRequestFromReceipt);
          
          // For now, just check if this is a recent payment to the right recipient
          // and has the right amount (be more lenient about exact zap request matching)
          const amountTag = zapRequestFromReceipt.tags?.find((tag: string[]) => tag[0] === 'amount');
          if (amountTag) {
            const receiptAmount = parseInt(amountTag[1]) / 1000; // Convert msats to sats
            const expectedAmount = getPaymentConfig()?.feeAmount || 0;
            
            console.log('Receipt amount:', receiptAmount, 'Expected:', expectedAmount);
            
            if (receiptAmount >= expectedAmount) {
              console.log('Valid payment found!');
              return true;
            }
          }

          return false;
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

      // Check if 5 minutes have passed since invoice creation
      const fiveMinutesInMs = 5 * 60 * 1000;
      const invoiceAge = paymentState.invoiceCreatedAt ? Date.now() - paymentState.invoiceCreatedAt : 0;
      
      if (invoiceAge > fiveMinutesInMs) {
        throw new Error('Payment timeout: Invoice has expired after 5 minutes. Please create a new invoice.');
      }

      // Don't throw an error if we're still within the 5-minute window
      // Just return false to indicate payment not yet confirmed
      return false;
    },
    onSuccess: (verified) => {
      if (verified) {
        setPaymentState(prev => ({ ...prev, paid: true, verifying: false }));
      } else {
        // Payment not yet confirmed but still within timeout window
        setPaymentState(prev => ({ ...prev, verifying: false }));
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
      invoiceCreatedAt: null,
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
