import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NostrEvent } from '@/types/nostr';

export function useDeleteNip() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ event, reason }: { event: NostrEvent; reason?: string }) => {
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      if (!dTag) {
        throw new Error('Event does not have a d tag');
      }

      // Create the deletion request according to NIP-09
      const deletionEvent = await publishEvent({
        kind: 5,
        content: reason || 'Deletion requested',
        tags: [
          ['a', `${event.kind}:${event.pubkey}:${dTag}`],
          ['e', event.id],
          ['k', event.kind.toString()],
        ],
      });

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['my-nips'] });
      queryClient.invalidateQueries({ queryKey: ['recent-custom-nips'] });
    },
  });
}