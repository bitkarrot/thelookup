import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useZap } from '@/hooks/useZap';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip57 } from 'nostr-tools';
import {
  getLightningPaymentConfig,
  validateLightningPaymentConfig,
  satsToMsats,
  getLnurlFromLightningAddress
} from '@/lib/lightningPaymentConfig';

export interface AppSubmissionPaymentState {
  invoice: string | null;
  isPolling: boolean;
  paymentStatus: 'pending' | 'paid' | 'timeout' | 'error' | 'generating';
  timeRemaining: number;
  zapReceipt: NostrEvent | null;
  error: string | null;
}

export function useAppSubmissionPayment() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { sendZapAsync } = useZap();

  const [state, setState] = useState<AppSubmissionPaymentState>({
    invoice: null,
    isPolling: false,
    paymentStatus: 'pending',
    timeRemaining: 300, // 5 minutes
    zapReceipt: null,
    error: null,
  });

  const config = getLightningPaymentConfig();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submissionStartTimeRef = useRef<number>(0);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset payment state
  const resetPaymentState = useCallback(() => {
    clearTimers();
    setState({
      invoice: null,
      isPolling: false,
      paymentStatus: 'pending',
      timeRemaining: config.paymentTimeoutSeconds,
      zapReceipt: null,
      error: null,
    });
  }, [clearTimers, config.paymentTimeoutSeconds]);

  // Poll for zap receipts
  const startPollingForZapReceipt = useCallback(async () => {
    if (!user || !config.zapReceiptRelay) return;

    submissionStartTimeRef.current = Date.now();

    const pollForReceipt = async () => {
      try {
        // Get LNURL info to find the recipient pubkey
        const lnurlInfo = await getLnurlFromLightningAddress(config.lightningAddress);
        if (!lnurlInfo?.nostrPubkey) {
          console.error('Could not get nostr pubkey from lightning address');
          return;
        }

        const filters = [{
          kinds: [9735], // Zap receipts
          '#p': [lnurlInfo.nostrPubkey],
          since: Math.floor(submissionStartTimeRef.current / 1000),
          limit: 1,
        }];

        const events = await nostr.query(filters, {
          signal: AbortSignal.timeout(5000)
        });

        if (events.length > 0) {
          const receipt = events[0];

          // Validate the zap receipt
          const isValid = await validateZapReceipt(receipt);
          if (isValid) {
            clearTimers();
            setState(prev => ({
              ...prev,
              paymentStatus: 'paid',
              zapReceipt: receipt,
              isPolling: false,
            }));

            toast({
              title: 'Payment Received!',
              description: `Payment of ${config.feeSats} sats confirmed successfully.`,
            });
          }
        }
      } catch (error) {
        console.error('Error polling for zap receipt:', error);
      }
    };

    // Start polling
    setState(prev => ({ ...prev, isPolling: true }));

    // Initial check
    pollForReceipt();

    // Set up interval for subsequent checks
    pollingIntervalRef.current = setInterval(pollForReceipt, config.pollingIntervalSeconds * 1000);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setState(prev => ({
        ...prev,
        paymentStatus: 'timeout',
        isPolling: false,
        error: 'Payment timed out. Please try again.',
      }));

      toast({
        title: 'Payment Timeout',
        description: 'The payment window has expired. Please try again.',
        variant: 'destructive',
      });
    }, config.paymentTimeoutSeconds * 1000);
  }, [user, nostr, config, clearTimers, toast]);

  // Validate zap receipt
  const validateZapReceipt = async (receipt: NostrEvent): Promise<boolean> => {
    try {
      const bolt11Tag = receipt.tags.find(tag => tag[0] === 'bolt11');
      const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');

      if (!bolt11Tag || !descriptionTag) return false;

      const zapRequestJson = descriptionTag[1];
      let zapRequest: NostrEvent;

      try {
        zapRequest = JSON.parse(zapRequestJson);
      } catch {
        return false;
      }

      // Validate zap request
      if (zapRequest.kind !== 9734) return false;

      // Check amount matches expected fee
      const amountTag = zapRequest.tags.find(tag => tag[0] === 'amount');
      const amountMsats = parseInt(amountTag?.[1] || '0');
      const expectedMsats = satsToMsats(config.feeSats);

      return amountMsats === expectedMsats;
    } catch {
      return false;
    }
  };

  // Generate lightning invoice
  const generateInvoice = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to generate an invoice.',
        paymentStatus: 'error',
      }));
      return;
    }

    const validation = validateLightningPaymentConfig(config);
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        error: validation.errors.join(', '),
        paymentStatus: 'error',
      }));
      return;
    }

    setState(prev => ({ ...prev, paymentStatus: 'generating', error: null }));

    try {
      // Get recipient's pubkey from lightning address
      const lnurlInfo = await getLnurlFromLightningAddress(config.lightningAddress);
      if (!lnurlInfo?.nostrPubkey) {
        throw new Error('Could not resolve lightning address');
      }

      // Create zap request
      const zapRequestEvent = nip57.makeZapRequest({
        profile: lnurlInfo.nostrPubkey,
        amount: satsToMsats(config.feeSats),
        comment: `App submission fee for ${user.pubkey.slice(0, 8)}...`,
        relays: [config.zapReceiptRelay],
      } as any);

      // Sign the zap request
      const signedZapRequest = await user.signer.signEvent(zapRequestEvent);

      // Get invoice from recipient's zap endpoint
      const zapEndpointUrl = new URL(lnurlInfo.callback);
      zapEndpointUrl.searchParams.set('amount', satsToMsats(config.feeSats).toString());
      zapEndpointUrl.searchParams.set('nostr', encodeURIComponent(JSON.stringify(signedZapRequest)));

      const invoiceResponse = await fetch(zapEndpointUrl.toString());
      if (!invoiceResponse.ok) {
        throw new Error('Failed to get invoice from recipient');
      }

      const invoiceData = await invoiceResponse.json();
      if (!invoiceData.pr) {
        throw new Error('No invoice received from recipient');
      }

      setState(prev => ({
        ...prev,
        invoice: invoiceData.pr,
        paymentStatus: 'pending',
        error: null,
      }));

      // Start polling for payment
      await startPollingForZapReceipt();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoice';

      setState(prev => ({
        ...prev,
        error: errorMessage,
        paymentStatus: 'error',
      }));

      toast({
        title: 'Invoice Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [user, config, startPollingForZapReceipt, toast]);

  // Manual payment (for testing or when WebLN is not available)
  const { mutate: payInvoice, isPending: isPaying } = useMutation({
    mutationFn: async (invoice: string) => {
      if (!user) throw new Error('You must be logged in to pay');

      const result = await sendZapAsync({
        recipientPubkey: user.pubkey, // Self-payment for testing
        amount: config.feeSats,
        comment: 'App submission fee payment',
        relays: [config.zapReceiptRelay],
      });

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Payment Sent',
        description: 'Payment sent successfully. Verifying receipt...',
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Payment failed',
        variant: 'destructive',
      });
    },
  });

  // Update countdown timer
  useEffect(() => {
    if (state.isPolling && state.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.isPolling, state.timeRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    state,
    config,
    generateInvoice,
    payInvoice,
    resetPaymentState,
    isPaying,
  };
}