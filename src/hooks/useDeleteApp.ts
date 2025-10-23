import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppInfo } from '@/hooks/useApps';

export function useDeleteApp() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ app, reason }: { app: AppInfo; reason?: string }) => {
      // Create the deletion request according to NIP-09
      const deletionEvent = await publishEvent({
        kind: 5,
        content: reason || 'Deletion requested',
        tags: [
          ['a', `31990:${app.pubkey}:${app.dTag}`],
          ['e', app.id],
          ['k', '31990'],
        ],
      });

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['apps-by-author'] });
    },
  });
}