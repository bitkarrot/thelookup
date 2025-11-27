import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { isClientSideCurationEnabled, getCuratorPubkeys } from '@/lib/siteConfig';
import { debugLog, debugWarn, debugError } from '@/lib/debug';

export interface CuratorFlag {
  stallEventId: string;
  stallAuthorPubkey: string;
  curatorPubkey: string;
  reportType: string;
  content: string;
  createdAt: number;
  event: NostrEvent;
}

/**
 * Hook to fetch all curator flags for content curation
 * Only runs when client-side curation is enabled and curator pubkeys are configured
 */
export function useCuratorFlags() {
  const { nostr } = useNostr();
  const curationEnabled = isClientSideCurationEnabled();
  const curatorPubkeys = getCuratorPubkeys();

  return useQuery<CuratorFlag[]>({
    queryKey: ['curator-flags', curatorPubkeys],
    queryFn: async (c) => {
      if (!curationEnabled || curatorPubkeys.length === 0) {
        return [];
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      try {
        debugLog('🏛️ [DEBUG] useCuratorFlags - Querying with curator pubkeys:', curatorPubkeys);
        
        // Query for kind 1984 events from curator pubkeys
        const events = await nostr.query([
          {
            kinds: [1984],
            authors: curatorPubkeys,
            limit: 500, // Get more flags since we're checking all curators
          }
        ], { signal });

        debugLog(`🏛️ [DEBUG] useCuratorFlags - Found ${events.length} curator flag events`);
        events.forEach((event, index) => {
          debugLog(`🏛️ [DEBUG] Curator Flag Event ${index + 1}:`, JSON.stringify(event, null, 2));
        });

        const curatorFlags: CuratorFlag[] = [];

        for (const event of events) {
          try {
            // Find the report type from tags
            const reportTag = event.tags.find(([name]) => name === 'report');
            const reportType = reportTag?.[1];

            if (!reportType) {
              continue; // Skip events without report type
            }

            // Find the target event and author
            const eTag = event.tags.find(([name]) => name === 'e')?.[1];
            const pTag = event.tags.find(([name]) => name === 'p')?.[1];

            if (!eTag || !pTag) {
              continue; // Skip events without proper references
            }

            // Check if this is flagging a kind 30017 (stall) event
            const kTag = event.tags.find(([name]) => name === 'k')?.[1];
            if (kTag !== '30017') {
              continue; // Only process stall flags for now
            }

            curatorFlags.push({
              stallEventId: eTag,
              stallAuthorPubkey: pTag,
              curatorPubkey: event.pubkey,
              reportType,
              content: event.content || '',
              createdAt: event.created_at,
              event,
            });
          } catch (error) {
            debugWarn('Failed to parse curator flag event:', event.id, error);
          }
        }

        return curatorFlags.sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
        debugError('Failed to fetch curator flags:', error);
        return [];
      }
    },
    enabled: curationEnabled && curatorPubkeys.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Helper hook to check if a specific stall is flagged by curators
 */
export function useIsStallFlagged(stallEventId: string, stallAuthorPubkey: string) {
  const { data: curatorFlags = [] } = useCuratorFlags();

  const isFlagged = curatorFlags.some(
    flag => flag.stallEventId === stallEventId && flag.stallAuthorPubkey === stallAuthorPubkey
  );

  const flags = curatorFlags.filter(
    flag => flag.stallEventId === stallEventId && flag.stallAuthorPubkey === stallAuthorPubkey
  );

  return {
    isFlagged,
    flags,
    flagCount: flags.length,
  };
}
