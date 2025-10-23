import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook to fetch a specific community definition (kind 34550)
 */
export function useCommunity(pubkey: string, identifier: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['community', pubkey, identifier],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query([{
        kinds: [34550],
        authors: [pubkey],
        '#d': [identifier],
        limit: 1,
      }], { signal });

      return events[0] || null;
    },
    enabled: !!pubkey && !!identifier,
  });
}



/**
 * Validate if an event is a proper community definition
 */
export function validateCommunityEvent(event: NostrEvent): boolean {
  if (event.kind !== 34550) return false;
  
  // Must have a 'd' tag (identifier)
  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  if (!dTag) return false;
  
  return true;
}

/**
 * Extract community metadata from a community definition event
 */
export function extractCommunityMetadata(event: NostrEvent) {
  if (!validateCommunityEvent(event)) return null;
  
  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const nameTag = event.tags.find(([name]) => name === 'name')?.[1];
  const descriptionTag = event.tags.find(([name]) => name === 'description')?.[1];
  const imageTag = event.tags.find(([name]) => name === 'image')?.[1];
  
  // Get moderators
  const moderators = event.tags
    .filter(([name, , , role]) => name === 'p' && role === 'moderator')
    .map(([, pubkey]) => pubkey);
  
  // Get relays
  const relays = event.tags
    .filter(([name]) => name === 'relay')
    .map(([, url, marker]) => ({ url, marker }));
  
  return {
    identifier: dTag,
    name: nameTag || dTag,
    description: descriptionTag,
    image: imageTag,
    moderators,
    relays,
    author: event.pubkey,
    createdAt: event.created_at,
  };
}

