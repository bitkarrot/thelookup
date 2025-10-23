import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

interface LikeNipParams {
  event: NostrEvent;
  naddr?: string;
}

export function useLikeNip() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ event }: LikeNipParams) => {
      if (!user) {
        throw new Error('User must be logged in to like NIPs');
      }

      const tags: string[][] = [
        ['e', event.id],
        ['p', event.pubkey],
        ['k', event.kind.toString()],
      ];

      // For addressable events (kind 30000+), add the 'a' tag
      if (event.kind >= 30000) {
        const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
        tags.push(['a', `${event.kind}:${event.pubkey}:${dTag}`]);
      }

      return await publishEvent({
        kind: 7,
        content: '+',
        tags,
      });
    },
    onSuccess: () => {
      // Invalidate related queries to refresh like counts
      queryClient.invalidateQueries({ queryKey: ['nip-likes'] });
      queryClient.invalidateQueries({ queryKey: ['custom-nip'] });
    },
    onError: (error) => {
      console.error('Failed to like NIP:', error);
    },
  });
}