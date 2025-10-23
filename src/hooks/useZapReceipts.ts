import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

interface ZapReceipt {
  event: NostrEvent;
  amount: number;
  sender?: string;
  comment?: string;
  bolt11: string;
  zapRequest: NostrEvent;
}

interface UseZapReceiptsOptions {
  eventId?: string;
  pubkey?: string;
}

export function useZapReceipts({ eventId, pubkey }: UseZapReceiptsOptions) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['zapReceipts', eventId, pubkey],
    queryFn: async ({ signal }) => {
      const filters: Array<{ kinds: number[]; '#e'?: string[]; '#p'?: string[]; '#a'?: string[] }> = [];

      if (eventId) {
        filters.push({ kinds: [9735], '#e': [eventId] });
      }

      if (pubkey) {
        filters.push({ kinds: [9735], '#p': [pubkey] });
      }

      if (filters.length === 0) {
        return [];
      }

      const zapReceiptEvents = await nostr.query(filters, { signal });

      // Parse and validate zap receipts
      const zapReceipts: ZapReceipt[] = [];

      for (const event of zapReceiptEvents) {
        try {
          const bolt11Tag = event.tags.find(tag => tag[0] === 'bolt11');
          const descriptionTag = event.tags.find(tag => tag[0] === 'description');
          const senderTag = event.tags.find(tag => tag[0] === 'P');

          if (!bolt11Tag || !descriptionTag) {
            continue; // Invalid zap receipt
          }

          const bolt11 = bolt11Tag[1];
          const zapRequestJson = descriptionTag[1];
          const sender = senderTag?.[1];

          let zapRequest: NostrEvent;
          try {
            zapRequest = JSON.parse(zapRequestJson);
          } catch {
            continue; // Invalid JSON in description
          }

          // Validate zap request
          if (zapRequest.kind !== 9734) {
            continue; // Not a zap request
          }

          // Extract amount from zap request
          const amountTag = zapRequest.tags.find(tag => tag[0] === 'amount');
          const amount = amountTag ? parseInt(amountTag[1]) / 1000 : 0; // Convert msats to sats

          const zapReceipt: ZapReceipt = {
            event,
            amount,
            sender,
            comment: zapRequest.content,
            bolt11,
            zapRequest,
          };

          zapReceipts.push(zapReceipt);
        } catch {
          // Skip invalid zap receipts
          continue;
        }
      }

      // Deduplicate zap receipts by event ID (in case same receipt has both e and a tags)
      const uniqueZapReceipts = zapReceipts.filter((receipt, index, array) => 
        array.findIndex(r => r.event.id === receipt.event.id) === index
      );

      // Sort by amount (highest first)
      return uniqueZapReceipts.sort((a, b) => b.amount - a.amount);
    },
    enabled: !!(eventId || pubkey),
  });
}

export function useZapReceiptsForEvent(eventId: string) {
  return useZapReceipts({ eventId });
}

export function useZapReceiptsForPubkey(pubkey: string) {
  return useZapReceipts({ pubkey });
}
