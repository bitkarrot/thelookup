import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

interface ReactToCommentParams {
  comment: NostrEvent;
  reaction: string; // emoji or '+'/'-'
}

export function useReactToComment() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ comment, reaction }: ReactToCommentParams) => {
      if (!user) {
        throw new Error('User must be logged in to react to comments');
      }

      const tags: string[][] = [
        ['e', comment.id],
        ['p', comment.pubkey],
        ['k', comment.kind.toString()],
      ];

      // For addressable events (kind 30000+), add the 'a' tag
      if (comment.kind >= 30000) {
        const dTag = comment.tags.find(tag => tag[0] === 'd')?.[1] || '';
        tags.push(['a', `${comment.kind}:${comment.pubkey}:${dTag}`]);
      }

      return await publishEvent({
        kind: 7,
        content: reaction,
        tags,
      });
    },
    onSuccess: (_, { comment }) => {
      // Invalidate related queries to refresh reaction counts
      queryClient.invalidateQueries({ queryKey: ['comment-reactions', comment.id] });
      queryClient.invalidateQueries({ queryKey: ['comment-reactions'] });
    },
    onError: (error) => {
      console.error('Failed to react to comment:', error);
    },
  });
}