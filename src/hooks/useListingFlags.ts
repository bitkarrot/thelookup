import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

export interface ListingFlag {
  id: string;
  stallEventId: string;
  stallAuthorPubkey: string;
  reporterPubkey: string;
  reportType: 'fraud' | 'spam' | 'scam' | 'duplicate' | 'inappropriate' | 'impersonation';
  content: string;
  createdAt: number;
  event: NostrEvent;
}

export interface ListingFlagStats {
  total: number;
  byType: Record<string, number>;
}

const LISTING_REPORT_TYPES = {
  fraud: 'Fake information',
  spam: 'Unwanted promotional content',
  scam: 'Malicious/deceptive content',
  duplicate: 'Duplicate entries',
  inappropriate: 'Violates community standards',
  impersonation: 'Fake identity/business',
} as const;

export function useListingFlags(stallEventId: string, stallAuthorPubkey: string, stallDTag: string) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const publishEvent = useNostrPublish();

  const {
    data: flags = [],
    isLoading,
    error,
  } = useQuery<ListingFlag[]>({
    queryKey: ['listing-flags', stallEventId],
    queryFn: async () => {
      if (!stallEventId || !stallAuthorPubkey) return [];
      // TODO: implement querying of NIP-1984 events for this stall
      return [];
    },
    enabled: !!(stallEventId && stallAuthorPubkey),
  });

  const flagStats: ListingFlagStats = flags.reduce(
    (stats, flag) => {
      stats.total++;
      stats.byType[flag.reportType] = (stats.byType[flag.reportType] || 0) + 1;
      return stats;
    },
    { total: 0, byType: {} as Record<string, number> },
  );

  const userFlag: ListingFlag | undefined = flags.find(
    (flag) => flag.reporterPubkey === user?.pubkey,
  );

  const flagMutation = useMutation({
    mutationFn: async ({
      reportType,
      content,
    }: {
      reportType: keyof typeof LISTING_REPORT_TYPES;
      content: string;
    }) => {
      if (!user) throw new Error('User must be signed in to flag content');

      const tags = [
        ['e', stallEventId], // target stall event
        ['p', stallAuthorPubkey], // stall owner
        ['report', reportType], // report type
        ['l', 'listing-flag', 'nostrhub.listings.flags'], // label for listing flags
        ['a', `30017:${stallAuthorPubkey}:${stallDTag}`], // reference to the stall address
        ['k', '30017'], // stall event kind
      ];

      const event = await publishEvent.mutateAsync({
        kind: 1984,
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-flags', stallEventId] });
    },
    onError: (error: any) => {
      console.error('Failed to flag listing:', error);
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
    },
  });

  return {
    flags,
    flagStats,
    userFlag,
    isLoading,
    error,
    canFlag: !!user && !userFlag,
    reportTypes: LISTING_REPORT_TYPES,
    flagListing: flagMutation.mutateAsync,
    isFlagging: flagMutation.isPending,
  };
}
