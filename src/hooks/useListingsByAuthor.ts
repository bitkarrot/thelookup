import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { getClientTag, isClientSideCurationEnabled } from '@/lib/siteConfig';
import { useCuratorFlags } from './useCuratorFlags';
import { debugLog } from '@/lib/debug';
import type { BusinessStallInfo } from './useListings';

// NIP-15 stall (business) model - kind 30017
export interface StallShippingZone {
  id: string;
  name?: string;
  cost: number;
  regions: string[];
}

function validateStallEvent(event: NostrEvent): boolean {
  if (event.kind !== 30017) return false;

  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  if (!dTag) return false;

  // Basic content validation: must parse as JSON with at least id + name + currency
  try {
    const content = JSON.parse(event.content || '{}') as {
      id?: string;
      name?: string;
      currency?: string;
    };

    if (!content.id || !content.name || !content.currency) return false;

    // d tag must match stall id
    if (content.id !== dTag) return false;
  } catch {
    return false;
  }
  return true;
}

function parseStallEvent(event: NostrEvent): BusinessStallInfo {
  const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';

  let content: {
    id?: string;
    name?: string;
    description?: string;
    currency?: string;
    shipping?: StallShippingZone[];
    website?: string;
  } = {};

  try {
    content = JSON.parse(event.content || '{}');
  } catch {
    // leave content empty-object - validateStallEvent should have already caught bad JSON
  }

  const tags = event.tags
    .filter(([name]) => name === 't')
    .map(([, tag]) => tag);

  // Derive image from multiple possible patterns:
  // 1) image tag
  let image: string | undefined;
  const imageTag = event.tags.find(([name]) => name === 'image')?.[1];
  if (imageTag) {
    image = imageTag;
  }

  // 2) content-level image/picture field if present
  const contentWithImage = content as { image?: string; picture?: string };
  if (!image && typeof contentWithImage.image === 'string') {
    image = contentWithImage.image;
  }
  if (!image && typeof contentWithImage.picture === 'string') {
    image = contentWithImage.picture;
  }

  // 3) content is a bare URL string (non-JSON)
  if (!image && event.content && !event.content.trim().startsWith('{')) {
    const trimmed = event.content.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      image = trimmed;
    }
  }

  // Derive website from content or tags
  let website: string | undefined;
  if (content.website && typeof content.website === 'string') {
    website = content.website;
  }
  if (!website) {
    const websiteTag = event.tags.find(([name]) => name === 'website')?.[1];
    if (websiteTag) {
      website = websiteTag;
    }
  }

  return {
    id: event.id,
    pubkey: event.pubkey,
    stallId: content.id ?? dTag,
    name: content.name ?? '',
    description: content.description,
    currency: content.currency ?? '',
    shipping: content.shipping ?? [],
    image,
    website,
    tags,
    createdAt: event.created_at,
    dTag,
    event,
  };
}

export function useListingsByAuthor(pubkey: string | undefined) {
  const { nostr } = useNostr();
  const curationEnabled = isClientSideCurationEnabled();
  const { data: curatorFlags = [] } = useCuratorFlags();

  return useQuery({
    queryKey: ['business-stalls-by-author', pubkey, curationEnabled, curatorFlags.length],
    queryFn: async (c) => {
      if (!pubkey) {
        return [];
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([{ kinds: [30017], authors: [pubkey], limit: 100 }], { signal });
      const validEvents = events.filter(validateStallEvent);
      const stalls = validEvents.map(parseStallEvent);

      // Filter to only show entries tagged with the client tag (if client tag is configured)
      const clientTag = getClientTag();
      const clientTaggedStalls = clientTag 
        ? stalls.filter(stall => {
            // Check if the original event has a 'client' tag with the matching value
            const eventClientTag = stall.event.tags.find(([name]) => name === 'client')?.[1];
            return eventClientTag === clientTag;
          })
        : stalls; // Show all stalls if no client tag is configured

      // Apply client-side curation if enabled
      let curatedStalls = clientTaggedStalls;
      debugLog('📋 [DEBUG] useListingsByAuthor - Curation enabled:', curationEnabled);
      debugLog('📋 [DEBUG] useListingsByAuthor - Curator flags count:', curatorFlags.length);
      debugLog('📋 [DEBUG] useListingsByAuthor - Stalls before curation:', clientTaggedStalls.length);
      
      if (curationEnabled && curatorFlags.length > 0) {
        debugLog('📋 [DEBUG] useListingsByAuthor - Applying curation filter...');
        curatedStalls = clientTaggedStalls.filter(stall => {
          // Check if this stall is flagged by any curator
          const isFlagged = curatorFlags.some(
            flag => flag.stallEventId === stall.id && flag.stallAuthorPubkey === stall.pubkey
          );
          
          if (isFlagged) {
            debugLog(`📋 [DEBUG] useListingsByAuthor - Filtering out flagged stall: ${stall.id} (${stall.name})`);
          }
          
          return !isFlagged; // Only show stalls that are NOT flagged
        });
        debugLog('📋 [DEBUG] useListingsByAuthor - Stalls after curation:', curatedStalls.length);
      }

      return curatedStalls.sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!pubkey,
  });
}
