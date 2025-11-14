import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

// NIP-15 stall (business) model - kind 30017
export interface StallShippingZone {
  id: string;
  name?: string;
  cost: number;
  regions: string[];
}

export interface BusinessStallInfo {
  id: string; // nostr event id
  pubkey: string;
  stallId: string; // stall "id" from content / d-tag
  name: string;
  description?: string;
  currency: string;
  shipping: StallShippingZone[];
  tags: string[]; // t-tags for categories
  createdAt: number;
  dTag: string;
  event: NostrEvent;
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
  } = {};

  try {
    content = JSON.parse(event.content || '{}');
  } catch {
    // leave content empty-object - validateStallEvent should have already caught bad JSON
  }

  const tags = event.tags
    .filter(([name]) => name === 't')
    .map(([, tag]) => tag);

  return {
    id: event.id,
    pubkey: event.pubkey,
    stallId: content.id ?? dTag,
    name: content.name ?? '',
    description: content.description,
    currency: content.currency ?? '',
    shipping: content.shipping ?? [],
    tags,
    createdAt: event.created_at,
    dTag,
    event,
  };
}

export function useListings() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['business-stalls'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([{ kinds: [30017], limit: 100 }], { signal });
      const validEvents = events.filter(validateStallEvent);
      const stalls = validEvents.map(parseStallEvent);

      return stalls.sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 5 * 60 * 1000,
  });
}
