import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

export interface BusinessListingInfo {
  id: string;
  pubkey: string;
  title: string;
  summary?: string;
  content: string;
  image?: string;
  location?: string;
  priceAmount?: number;
  priceCurrency?: string;
  priceFrequency?: string;
  status?: string;
  tags: string[];
  createdAt: number;
  dTag: string;
  event: NostrEvent;
}

function validateListingEvent(event: NostrEvent): boolean {
  if (event.kind !== 30402) return false;

  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  if (!dTag) return false;

  const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
  if (!titleTag) return false;

  return true;
}

function parseListingEvent(event: NostrEvent): BusinessListingInfo {
  const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] || '';
  const summary = event.tags.find(([name]) => name === 'summary')?.[1];
  const location = event.tags.find(([name]) => name === 'location')?.[1];
  const status = event.tags.find(([name]) => name === 'status')?.[1];
  const image = event.tags.find(([name]) => name === 'image')?.[1];

  const priceTag = event.tags.find(([name]) => name === 'price');
  let priceAmount: number | undefined;
  let priceCurrency: string | undefined;
  let priceFrequency: string | undefined;
  if (priceTag) {
    const [, amountStr, currency, frequency] = priceTag;
    const parsedAmount = parseFloat(amountStr || '');
    if (!isNaN(parsedAmount)) {
      priceAmount = parsedAmount;
    }
    priceCurrency = currency;
    priceFrequency = frequency;
  }

  const tags = event.tags
    .filter(([name]) => name === 't')
    .map(([, tag]) => tag);

  return {
    id: event.id,
    pubkey: event.pubkey,
    title,
    summary,
    content: event.content,
    image,
    location,
    priceAmount,
    priceCurrency,
    priceFrequency,
    status,
    tags,
    createdAt: event.created_at,
    dTag,
    event,
  };
}

export function useListings() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['business-listings'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([{ kinds: [30402], limit: 100 }], { signal });
      const validEvents = events.filter(validateListingEvent);
      const listings = validEvents.map(parseListingEvent);

      return listings.sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 5 * 60 * 1000,
  });
}
