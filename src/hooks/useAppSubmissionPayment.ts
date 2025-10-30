import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWebLN } from '@/hooks/useWebLN';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';
// import { nip57 } from 'nostr-tools';
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
  const { sendPayment, enable: enableWebLN, isAvailable: isWebLNAvailable } = useWebLN();

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
        console.log('🔍 Polling for zap receipt...');

        console.log('📋 Querying for zap receipts on relay:', config.zapReceiptRelay);
        console.log('👤 Looking for zap receipts from our user:', user.pubkey);
        console.log('⏰ Since timestamp:', Math.floor(submissionStartTimeRef.current / 1000));

        // Try multiple relays for better coverage
        const relaysToCheck = [
          config.zapReceiptRelay,           // wss://relay.primal.net (from config)
          'wss://relay.nostr.net',          // User's current relay
          'wss://hivetalk.nostr1.com',     // User's current relay (if different)
          'wss://relay.nostr.band',         // Popular relay
          'wss://nos.lol',                  // Popular relay
          'wss://relay.damus.io',           // Popular relay
        ];

        console.log('🌐 Checking multiple relays:', relaysToCheck);

        // We should look for zap receipts from the sender (our user), not to the recipient
        // The zap receipt contains the original zap request in the description tag
        const filters = [{
          kinds: [9735], // Zap receipts
          since: Math.floor((submissionStartTimeRef.current - 60000) / 1000), // Look back 1 minute
          limit: 20, // Increased limit to see more receipts
        }];

        console.log('🔍 Using filters:', filters);
        console.log('👤 Looking for receipts from user pubkey:', user.pubkey);

        // Query all relays in parallel
        const allEvents = [];
        for (const relay of relaysToCheck) {
          try {
            console.log(`📡 Checking relay: ${relay}`);
            const events = await nostr.query(filters, {
              relayUrls: [relay],
              signal: AbortSignal.timeout(3000)
            });
            allEvents.push(...events);
            console.log(`📊 Found ${events.length} events on ${relay}`);
          } catch (error) {
            console.log(`❌ Error checking ${relay}:`, error);
          }
        }

        console.log(`📊 Total events found across all relays: ${allEvents.length}`);

        // If still no events, try a broader search without time limit
        if (allEvents.length === 0) {
          console.log('🔍 No receipts found with time limit, trying broader search...');
          try {
            const broadFilters = [{
              kinds: [9735],
              limit: 50, // Look for more receipts
            }];

            const broadEvents = await nostr.query(broadFilters, {
              signal: AbortSignal.timeout(5000)
            });

            console.log(`📊 Broader search found ${broadEvents.length} recent zap receipts`);
            allEvents.push(...broadEvents);
          } catch (error) {
            console.log('❌ Error in broader search:', error);
          }

          // TEMPORARY DEBUG: Add a manual override for testing
          console.log('🚨 DEBUG: Since payment was confirmed, trying to find ANY recent zap receipts...');
          console.log('💡 Try looking at: https://nostr.band/?search=kind%3A9735');
          console.log('💡 Or check: https://snort.social/?search=kind%3A9735');
        }

        const events = allEvents;

        console.log('📊 Found zap receipts:', events.length, events);

        if (events.length > 0) {
          console.log('🔍 Validating zap receipts...');

          for (const receipt of events) {
            console.log('🧾 Checking receipt:', receipt);

            // Validate the zap receipt
            const isValid = await validateZapReceipt(receipt);
            console.log('✅ Receipt validation result:', isValid);

            if (isValid) {
              console.log('🎉 Payment verified!');
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
              return; // Exit early since we found a valid receipt
            }
          }
        } else {
          console.log('❌ No zap receipts found yet, will try again...');
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
      console.log('🔍 Validating zap receipt:', receipt);

      const bolt11Tag = receipt.tags.find(tag => tag[0] === 'bolt11');
      const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');

      console.log('⚡ Bolt11 tag:', bolt11Tag);
      console.log('📝 Description tag:', descriptionTag);

      if (!bolt11Tag || !descriptionTag) {
        console.log('❌ Missing required tags');
        return false;
      }

      const zapRequestJson = descriptionTag[1];
      let zapRequest: NostrEvent;

      try {
        zapRequest = JSON.parse(zapRequestJson);
        console.log('📄 Parsed zap request:', zapRequest);
      } catch {
        console.log('❌ Failed to parse zap request JSON');
        return false;
      }

      // Validate zap request
      if (zapRequest.kind !== 9734) {
        console.log('❌ Invalid zap request kind:', zapRequest.kind);
        return false;
      }

      // Check if this zap request is from our user
      if (zapRequest.pubkey !== user?.pubkey) {
        console.log('❌ Zap request not from our user:', zapRequest.pubkey, 'vs', user?.pubkey);
        return false;
      }

      // Check amount matches expected fee
      const amountTag = zapRequest.tags.find(tag => tag[0] === 'amount');
      const amountMsats = parseInt(amountTag?.[1] || '0');
      const expectedMsats = satsToMsats(config.feeSats);

      console.log('💰 Amount check - Found:', amountMsats, 'Expected:', expectedMsats);

      const isValid = amountMsats === expectedMsats;
      console.log('✅ Zap receipt validation result:', isValid);

      return isValid;
    } catch (error) {
      console.error('❌ Error validating zap receipt:', error);
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

    // Note: WebLN is not required for invoice generation, only for automatic wallet integration
    // Users can still pay with QR codes or by copying the invoice

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
      console.log('Resolving lightning address:', config.lightningAddress);
      const lnurlInfo = await getLnurlFromLightningAddress(config.lightningAddress);
      console.log('LNURL info:', lnurlInfo);

      if (!lnurlInfo) {
        throw new Error(`Could not resolve LNURL for ${config.lightningAddress}`);
      }

      if (!lnurlInfo.nostrPubkey) {
        throw new Error(`Lightning address ${config.lightningAddress} does not support NIP-57 zaps`);
      }

      // Create zap request for profile (no event needed)
      const zapRequestParams = {
        profile: lnurlInfo.nostrPubkey,
        amount: satsToMsats(config.feeSats),
        comment: `App submission fee for ${user.pubkey.slice(0, 8)}...`,
        relays: [config.zapReceiptRelay],
      };

      console.log('Creating zap request with params:', zapRequestParams);
      let zapRequestEvent;
      try {
        // Create zap request event manually following NIP-57 specification
        const created_at = Math.floor(Date.now() / 1000);

        zapRequestEvent = {
          kind: 9734, // Zap request
          content: zapRequestParams.comment || '',
          created_at,
          pubkey: user.pubkey,
          tags: [
            ['p', zapRequestParams.profile],
            ['amount', zapRequestParams.amount.toString()],
            ['relays', ...zapRequestParams.relays],
          ],
        };

        console.log('Zap request event created manually:', zapRequestEvent);
      } catch (zapError) {
        console.error('Error creating zap request:', zapError);
        throw new Error(`Failed to create zap request: ${zapError instanceof Error ? zapError.message : 'Unknown error'}`);
      }

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

  const [isPaying, setIsPaying] = useState(false);

  // Manual payment function (for testing or when WebLN is not available)
  const payInvoice = async (invoice: string) => {
    if (!user) throw new Error('You must be logged in to pay');

    setIsPaying(true);
    try {
      // Enable WebLN if not already enabled
      await enableWebLN();

      // Pay the invoice using WebLN
      const result = await sendPayment(invoice);

      toast({
        title: 'Payment Sent',
        description: 'Payment sent successfully. Verifying receipt...',
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsPaying(false);
    }
  };

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
    isWebLNAvailable,
  };
}