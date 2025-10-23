import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useRecentCustomNips() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['recent-custom-nips'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{
          kinds: [30817],
          limit: 20,
        }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });
}