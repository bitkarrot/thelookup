import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

interface DeleteReactionParams {
  comment: NostrEvent;
  reaction: string; // emoji or '+'/'-'
}

export function useDeleteReaction() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ comment, reaction }: DeleteReactionParams) => {
      if (!user) {
        throw new Error('User must be logged in to delete reactions');
      }

      // First, find the user's reaction event to delete
      const signal = AbortSignal.timeout(3000);
      const userReactions = await nostr.query([
        {
          kinds: [7],
          authors: [user.pubkey],
          '#e': [comment.id],
        }
      ], { signal });

      // Find the specific reaction to delete
      const reactionToDelete = userReactions.find(r => 
        (r.content || '+') === reaction
      );

      if (!reactionToDelete) {
        throw new Error('Reaction not found');
      }

      // Create a kind 5 deletion event
      const tags: string[][] = [
        ['e', reactionToDelete.id],
        ['k', '7'], // Deleting a kind 7 event
      ];

      return await publishEvent({
        kind: 5,
        content: 'Deleted reaction',
        tags,
      });
    },
    onSuccess: (_, { comment }) => {
      // Invalidate related queries to refresh reaction counts
      queryClient.invalidateQueries({ queryKey: ['comment-reactions', comment.id] });
      queryClient.invalidateQueries({ queryKey: ['comment-reactions'] });
    },
    onError: (error) => {
      console.error('Failed to delete reaction:', error);
    },
  });
}