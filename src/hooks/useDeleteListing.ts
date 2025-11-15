import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BusinessStallInfo } from '@/hooks/useListings';

export function useDeleteListing() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stall, reason }: { stall: BusinessStallInfo; reason?: string }) => {
      const dTag = stall.dTag;

      // Create the deletion request according to NIP-09
      const deletionEvent = await publishEvent({
        kind: 5,
        content: reason || 'Deletion requested',
        tags: [
          ['a', `30017:${stall.pubkey}:${dTag}`],
          ['e', stall.id],
          ['k', '30017'],
        ],
      });

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the listings UI
      queryClient.invalidateQueries({ queryKey: ['business-stalls'] });
    },
  });
}
