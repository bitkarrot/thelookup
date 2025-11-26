import { describe, it, expect, vi } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import { BusinessStallInfo } from './useListings';
import { getClientTag } from '@/lib/siteConfig';

// Mock parseStallEvent function for testing
function parseStallEvent(event: NostrEvent): BusinessStallInfo {
  const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
  
  let content: {
    id?: string;
    name?: string;
    description?: string;
    currency?: string;
  } = {};

  try {
    content = JSON.parse(event.content || '{}');
  } catch {
    // leave content empty-object
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
    shipping: [],
    tags,
    createdAt: event.created_at,
    dTag,
    event,
  };
}

// Mock the getClientTag function
vi.mock('@/lib/siteConfig', () => ({
  getClientTag: vi.fn(() => 'The Lookup'), // Mock with a specific value for testing
}));

describe('useListings client tag filtering', () => {
  it('should filter stalls to only include those with client tag', () => {
    // Mock events with different tags
    const mockEvents: NostrEvent[] = [
      {
        id: '1',
        pubkey: 'pubkey1',
        kind: 30017,
        content: '{"id": "stall1", "name": "Stall 1", "currency": "USD"}',
        tags: [
          ['d', 'stall1'],
          ['t', 'The Lookup'],
          ['t', 'service']
        ],
        created_at: 1000,
        sig: 'sig1'
      },
      {
        id: '2',
        pubkey: 'pubkey2',
        kind: 30017,
        content: '{"id": "stall2", "name": "Stall 2", "currency": "USD"}',
        tags: [
          ['d', 'stall2'],
          ['t', 'product'],
          ['t', 'retail']
        ],
        created_at: 2000,
        sig: 'sig2'
      },
      {
        id: '3',
        pubkey: 'pubkey3',
        kind: 30017,
        content: '{"id": "stall3", "name": "Stall 3", "currency": "USD"}',
        tags: [
          ['d', 'stall3'],
          ['t', 'The Lookup'],
          ['t', 'consulting']
        ],
        created_at: 3000,
        sig: 'sig3'
      }
    ];

    // Parse the events into stalls
    const stalls = mockEvents.map(parseStallEvent);
    
    // Apply the client tag filter (same logic as in useListings)
    const clientTag = getClientTag();
    const clientTaggedStalls = clientTag 
      ? stalls.filter(stall => stall.tags.includes(clientTag))
      : stalls;

    // Should only return stalls with 'client' tag
    expect(clientTaggedStalls).toHaveLength(2);
    expect(clientTaggedStalls[0].stallId).toBe('stall1');
    expect(clientTaggedStalls[1].stallId).toBe('stall3');
    
    // Verify that stall2 (without client tag) is filtered out
    const stallIds = clientTaggedStalls.map(stall => stall.stallId);
    expect(stallIds).not.toContain('stall2');
  });

  it('should return empty array when no stalls have client tag', () => {
    const mockEvents: NostrEvent[] = [
      {
        id: '1',
        pubkey: 'pubkey1',
        kind: 30017,
        content: '{"id": "stall1", "name": "Stall 1", "currency": "USD"}',
        tags: [
          ['d', 'stall1'],
          ['t', 'product'],
          ['t', 'retail']
        ],
        created_at: 1000,
        sig: 'sig1'
      }
    ];

    const stalls = mockEvents.map(parseStallEvent);
    const clientTag = getClientTag();
    const clientTaggedStalls = clientTag 
      ? stalls.filter(stall => stall.tags.includes(clientTag))
      : stalls;

    expect(clientTaggedStalls).toHaveLength(0);
  });

  it('should return all stalls when all have client tag', () => {
    const mockEvents: NostrEvent[] = [
      {
        id: '1',
        pubkey: 'pubkey1',
        kind: 30017,
        content: '{"id": "stall1", "name": "Stall 1", "currency": "USD"}',
        tags: [
          ['d', 'stall1'],
          ['t', 'The Lookup']
        ],
        created_at: 1000,
        sig: 'sig1'
      },
      {
        id: '2',
        pubkey: 'pubkey2',
        kind: 30017,
        content: '{"id": "stall2", "name": "Stall 2", "currency": "USD"}',
        tags: [
          ['d', 'stall2'],
          ['t', 'The Lookup'],
          ['t', 'service']
        ],
        created_at: 2000,
        sig: 'sig2'
      }
    ];

    const stalls = mockEvents.map(parseStallEvent);
    const clientTag = getClientTag();
    const clientTaggedStalls = clientTag 
      ? stalls.filter(stall => stall.tags.includes(clientTag))
      : stalls;

    expect(clientTaggedStalls).toHaveLength(2);
  });

  it('should show all stalls when no VITE_SITE_NAME is configured', () => {
    // Mock getClientTag to return null (no site name configured)
    const mockGetClientTag = vi.mocked(getClientTag);
    mockGetClientTag.mockReturnValueOnce(null);
    
    const clientTag = getClientTag();
    expect(clientTag).toBe(null); // No client tag configured

    const mockEvents: NostrEvent[] = [
      {
        id: '1',
        pubkey: 'pubkey1',
        kind: 30017,
        content: '{"id": "stall1", "name": "Stall 1", "currency": "USD"}',
        tags: [
          ['d', 'stall1'],
          ['t', 'some-client'], // Any client tag
          ['t', 'service']
        ],
        created_at: 1000,
        sig: 'sig1'
      },
      {
        id: '2',
        pubkey: 'pubkey2',
        kind: 30017,
        content: '{"id": "stall2", "name": "Stall 2", "currency": "USD"}',
        tags: [
          ['d', 'stall2'],
          ['t', 'different-client'], // Different client tag
          ['t', 'service']
        ],
        created_at: 2000,
        sig: 'sig2'
      }
    ];

    const stalls = mockEvents.map(parseStallEvent);
    const clientTaggedStalls = clientTag 
      ? stalls.filter(stall => stall.tags.includes(clientTag))
      : stalls;

    // Should return ALL stalls when no client tag is configured
    expect(clientTaggedStalls).toHaveLength(2);
    expect(clientTaggedStalls[0].stallId).toBe('stall1');
    expect(clientTaggedStalls[1].stallId).toBe('stall2');
  });
});
