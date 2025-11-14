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
}

interface LightningAddressProfile {
  pubkey: string;
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
}

export function useListingSubmissionPayment() {
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

  const getPaymentConfig = useCallback((): PaymentConfig | null => {
    const paymentEnabled = import.meta.env.VITE_SUBMIT_LISTING_PAYMENT_ENABLED === 'true';

    if (!paymentEnabled) {
      return null;
    }

    const lightningAddress = import.meta.env.VITE_SUBMIT_LISTING_LIGHTNING_ADDRESS;
    const feeAmount = parseInt(import.meta.env.VITE_SUBMIT_LISTING_FEE || '0', 10);

    if (!lightningAddress || !feeAmount || feeAmount <= 0) {
      console.warn('Listing payment enabled but missing Lightning address or fee amount');
      return null;
    }

    return {
      lightningAddress,
      feeAmount,
    };
  }, []);

  const isPaymentRequired = useCallback(() => {
    const config = getPaymentConfig();
    return config !== null;
  }, [getPaymentConfig]);

  const createPaymentMutation = useMutation({
    mutationFn: async (): Promise<PaymentResult> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const config = getPaymentConfig();
      if (!config) {
        throw new Error('Payment not configured');
      }

      toast({
        title: 'Creating Payment Invoice',
        description: 'Connecting to lightning address and generating invoice...',
      });

      const lightningProfile = await fetchLightningAddressProfile(config.lightningAddress);

      const amountMsats = config.feeAmount * 1000;

      const [name, domain] = config.lightningAddress.split('@');
      const lnurlPayUrl = `https://${domain}/.well-known/lnurlp/${name}`;
      const lnurl = encodeLnurl(lnurlPayUrl);

      const zapRelays = [
        import.meta.env.VITE_RELAY_URL || 'wss://relay.nostr.net',
        'wss://relay.primal.net',
      ];

      const zapRequestEvent: NostrEvent = {
        kind: 9734,
        content: `Business listing submission payment via ${window.location.hostname}`,
        tags: [
          ['relays', ...zapRelays],
          ['amount', amountMsats.toString()],
          ['lnurl', lnurl],
          ['p', lightningProfile.pubkey],
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: user.pubkey,
        id: '',
        sig: '',
      };

      const signedZapRequest = await user.signer.signEvent(zapRequestEvent);

      const zapEndpoint = lightningProfile.callback;
      if (!zapEndpoint) {
        throw new Error('Lightning address does not support zaps (NIP-57)');
      }

      const invoiceUrl = `${zapEndpoint}?amount=${amountMsats}&nostr=${encodeURIComponent(
        JSON.stringify(signedZapRequest),
      )}&lnurl=${encodeURIComponent(lnurl)}`;

      const invoiceResponse = await fetch(invoiceUrl);

      if (!invoiceResponse.ok) {
        throw new Error(`Failed to create invoice: ${invoiceResponse.status}`);
      }

      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.pr) {
        throw new Error('No payment request in response');
      }

      toast({
        title: 'Invoice Created',
        description: `Payment invoice for ${config.feeAmount} sats created successfully. You can pay with any Lightning wallet.`,
      });

      return {
        invoice: invoiceData.pr,
        zapRequest: signedZapRequest,
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
      console.error('Listing payment creation error:', error);
      toast({
        title: 'Payment Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create payment invoice',
        variant: 'destructive',
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (!paymentState.zapRequest || !user) {
        throw new Error('No zap request to verify');
      }

      setPaymentState((prev) => ({ ...prev, verifying: true }));

      toast({
        title: 'Verifying Payment',
        description: 'Checking multiple relays for payment confirmation...',
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const config = getPaymentConfig();
      const lightningProfile = await fetchLightningAddressProfile(config!.lightningAddress);

      const zapRequestRelays =
        paymentState.zapRequest.tags.find((tag) => tag[0] === 'relays')?.slice(1) || [];

      const relaysToCheck = [
        ...zapRequestRelays,
        'wss://relay.primal.net',
        'wss://nos.lol',
        'wss://relay.damus.io',
      ];

      const queries = [
        {
          kinds: [9735],
          '#e': [paymentState.zapRequest.id],
          limit: 10,
        },
        {
          kinds: [9735],
          '#p': [lightningProfile.pubkey],
          authors: [user?.pubkey || ''],
          since: Math.floor(Date.now() / 1000) - 600,
          limit: 20,
        },
        {
          kinds: [9735],
          '#p': [lightningProfile.pubkey],
          since: Math.floor(Date.now() / 1000) - 600,
          limit: 50,
        },
        {
          kinds: [9735],
          authors: [user?.pubkey || ''],
          since: Math.floor(Date.now() / 1000) - 600,
          limit: 30,
        },
      ];

      let allReceipts: NostrEvent[] = [];

      for (const relayUrl of relaysToCheck) {
        try {
          if (relayUrl === (import.meta.env.VITE_RELAY_URL || 'wss://relay.nostr.net')) {
            for (const query of queries) {
              try {
                const receipts = await nostr.query([query]);
                allReceipts = [...allReceipts, ...receipts];
              } catch (error) {
                console.log(`Query failed on ${relayUrl}:`, error);
              }
            }
          } else {
            const receipts = await queryRelayForReceipts(relayUrl, queries);
            allReceipts = [...allReceipts, ...receipts];
          }
        } catch (error) {
          console.log(`Failed to connect to ${relayUrl}:`, error);
        }
      }

      const uniqueReceipts = allReceipts.filter(
        (receipt, index, self) => index === self.findIndex((r) => r.id === receipt.id),
      );

      const validReceipt = uniqueReceipts.find((receipt) => {
        try {
          const bolt11Tag = receipt.tags?.find((tag) => tag[0] === 'bolt11');
          const descriptionTag = receipt.tags?.find((tag) => tag[0] === 'description');
          const pTag = receipt.tags?.find((tag) => tag[0] === 'p');

          if (!bolt11Tag || !descriptionTag || !pTag) {
            return false;
          }

          if (pTag[1] !== lightningProfile.pubkey) {
            return false;
          }

          if (bolt11Tag[1] !== paymentState.invoice) {
            return false;
          }

          let zapRequestFromReceipt;
          try {
            zapRequestFromReceipt = JSON.parse(descriptionTag[1]);
          } catch {
            return false;
          }

          if (zapRequestFromReceipt.pubkey !== user.pubkey) {
            return false;
          }

          if (zapRequestFromReceipt.id !== paymentState.zapRequest?.id) {
            return false;
          }

          const amountTag = zapRequestFromReceipt.tags?.find(
            (tag: string[]) => tag[0] === 'amount',
          );
          if (amountTag) {
            const receiptAmount = parseInt(amountTag[1]) / 1000;
            const expectedAmount = getPaymentConfig()?.feeAmount || 0;

            if (receiptAmount >= expectedAmount) {
              return true;
            }
            return false;
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
          description: 'Your payment has been verified. Proceeding with listing submission...',
        });
        return true;
      }

      const fiveMinutesInMs = 5 * 60 * 1000;
      const invoiceAge = paymentState.invoiceCreatedAt
        ? Date.now() - paymentState.invoiceCreatedAt
        : 0;

      if (invoiceAge > fiveMinutesInMs) {
        throw new Error(
          'Payment timeout: Invoice has expired after 5 minutes. Please create a new invoice.',
        );
      }

      return false;
    },
    onSuccess: (verified) => {
      if (verified) {
        setPaymentState((prev) => ({ ...prev, paid: true, verifying: false }));
      } else {
        setPaymentState((prev) => ({ ...prev, verifying: false }));
      }
    },
    onError: (error) => {
      setPaymentState((prev) => ({ ...prev, verifying: false }));
      toast({
        title: 'Payment Verification Failed',
        description: error instanceof Error ? error.message : 'Could not verify payment',
        variant: 'destructive',
      });
    },
  });

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
    isPaymentRequired: isPaymentRequired(),
    paymentConfig: getPaymentConfig(),
    paymentState,
    createPayment: createPaymentMutation.mutate,
    verifyPayment: verifyPaymentMutation.mutate,
    resetPayment,
    isCreatingPayment: createPaymentMutation.isPending,
    isVerifyingPayment: verifyPaymentMutation.isPending || paymentState.verifying,
  };
}

async function fetchLightningAddressProfile(
  lightningAddress: string,
): Promise<LightningAddressProfile> {
  const [name, domain] = lightningAddress.split('@');
  if (!name || !domain) {
    throw new Error('Invalid lightning address format');
  }

  const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${name}`;

  try {
    const response = await fetch(lnurlpUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch lightning address profile: ${response.status}`);
    }

    const profile = await response.json();

    if (!profile.allowsNostr || !profile.nostrPubkey) {
      throw new Error('Lightning address does not support NIP-57 zaps');
    }

    return {
      pubkey: profile.nostrPubkey,
      callback: profile.callback,
      minSendable: profile.minSendable || 1000,
      maxSendable: profile.maxSendable || 11000000000,
      metadata: profile.metadata || '',
    };
  } catch (error) {
    console.error('Error fetching lightning address profile:', error);
    throw new Error(
      `Could not fetch lightning address profile: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

function encodeLnurl(url: string): string {
  const words = Buffer.from(url, 'utf8');
  return `lnurl1${words.toString('hex')}`;
}

async function queryRelayForReceipts(relayUrl: string, queries: object[]): Promise<NostrEvent[]> {
  return new Promise((resolve) => {
    const WebSocketCtor: typeof WebSocket | undefined =
      typeof window !== 'undefined' ? window.WebSocket : undefined;

    if (!WebSocketCtor) {
      console.log(`WebSocket not available for ${relayUrl}`);
      resolve([]);
      return;
    }

    const ws = new WebSocketCtor(relayUrl);
    const subId = 'zap-receipt-' + Math.random().toString(36).substring(7);
    const allReceipts: NostrEvent[] = [];
    let queryCount = 0;
    let completedQueries = 0;

    const timeout = setTimeout(() => {
      ws.close();
      resolve(allReceipts);
    }, 10000);

    ws.onopen = () => {
      queries.forEach((query, index) => {
        const message = JSON.stringify(['REQ', `${subId}-${index}`, query]);
        ws.send(message);
        queryCount++;
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const [type, subscriptionId, eventData] = message;

        if (type === 'EVENT' && subscriptionId.startsWith(subId)) {
          allReceipts.push(eventData);
        } else if (type === 'EOSE' && subscriptionId.startsWith(subId)) {
          completedQueries++;
          if (completedQueries >= queryCount) {
            clearTimeout(timeout);
            ws.close();
            resolve(allReceipts);
          }
        }
      } catch (error) {
        console.log(`Error parsing message from ${relayUrl}:`, error);
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.log(`WebSocket error for ${relayUrl}:`, error);
      resolve([]);
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      resolve(allReceipts);
    };
  });
}
