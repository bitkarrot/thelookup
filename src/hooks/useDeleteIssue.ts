import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useDeleteIssue() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ event, reason }: { event: NostrEvent; reason?: string }) => {
      // Create the deletion request according to NIP-09
      const deletionEvent = await publishEvent({
        kind: 5,
        content: reason || 'Issue deletion requested',
        tags: [
          ['e', event.id],
          ['k', '1621'],
        ],
      });

      return deletionEvent;
    },
    onSuccess: (_, variables) => {
      // Extract repository info from the issue event to invalidate the correct queries
      const aTag = variables.event.tags.find(([name]) => name === 'a')?.[1];
      if (aTag) {
        const [, pubkey, identifier] = aTag.split(':');
        if (pubkey && identifier) {
          queryClient.invalidateQueries({ 
            queryKey: ['repository-issues', pubkey, identifier] 
          });
        }
      }
    },
  });
}