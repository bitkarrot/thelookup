import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useDeleteRepository() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ event, reason }: { event: NostrEvent; reason?: string }) => {
      const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
      
      // Create the deletion request according to NIP-09
      const deletionEvent = await publishEvent({
        kind: 5,
        content: reason || 'Deletion requested',
        tags: [
          ['a', `30617:${event.pubkey}:${dTag}`],
          ['e', event.id],
          ['k', '30617'],
        ],
      });

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      queryClient.invalidateQueries({ queryKey: ['repositories', 'author'] });
    },
  });
}