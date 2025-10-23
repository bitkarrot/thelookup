import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NostrEvent } from '@nostrify/nostrify';

import { useNostrPublish } from './useNostrPublish';

interface DeleteCommentParams {
  comment: NostrEvent;
  reason?: string;
}

export function useDeleteComment() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ comment, reason }: DeleteCommentParams) => {
      // Create a deletion request event (kind 5)
      const deletionEvent = await publishEvent({
        kind: 5,
        content: reason || 'Comment deleted by author',
        tags: [
          ['e', comment.id],
          ['k', comment.kind.toString()],
        ],
      });

      return deletionEvent;
    },
    onSuccess: () => {
      // Invalidate comments queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error);
    },
  });
}