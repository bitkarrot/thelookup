import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

export function useNipLikes(event: NostrEvent | undefined) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['nip-likes', event?.id],
    queryFn: async () => {
      if (!event) return { likes: [], isLikedByUser: false, likeCount: 0 };

      const signal = AbortSignal.timeout(3000);
      
      // Query for all reactions to this event
      const reactions = await nostr.query([
        {
          kinds: [7],
          '#e': [event.id],
        }
      ], { signal });

      // Filter for likes (content is '+' or empty)
      const likes = reactions.filter(reaction => 
        reaction.content === '+' || reaction.content === ''
      );

      // Check if current user has liked this NIP
      const isLikedByUser = user ? likes.some(like => like.pubkey === user.pubkey) : false;

      return {
        likes,
        isLikedByUser,
        likeCount: likes.length,
      };
    },
    enabled: !!event,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}