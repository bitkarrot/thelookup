import { describe, it, expect } from 'vitest';
import { validateCommunityEvent, extractCommunityMetadata } from './useCommunity';
import type { NostrEvent } from '@nostrify/nostrify';

describe('useCommunity', () => {
  describe('validateCommunityEvent', () => {
    it('validates a proper community event', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 34550,
        tags: [
          ['d', 'test-community'],
          ['name', 'Test Community'],
        ],
        content: '',
        sig: 'test-sig',
      };

      expect(validateCommunityEvent(event)).toBe(true);
    });

    it('rejects non-community event kinds', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 1,
        tags: [['d', 'test-community']],
        content: '',
        sig: 'test-sig',
      };

      expect(validateCommunityEvent(event)).toBe(false);
    });

    it('rejects events without d tag', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 34550,
        tags: [['name', 'Test Community']],
        content: '',
        sig: 'test-sig',
      };

      expect(validateCommunityEvent(event)).toBe(false);
    });
  });

  describe('extractCommunityMetadata', () => {
    it('extracts metadata from a valid community event', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 34550,
        tags: [
          ['d', 'test-community'],
          ['name', 'Test Community'],
          ['description', 'A test community'],
          ['image', 'https://example.com/image.jpg'],
          ['p', 'moderator1', '', 'moderator'],
          ['p', 'moderator2', '', 'moderator'],
          ['relay', 'wss://relay.example.com', 'requests'],
        ],
        content: '',
        sig: 'test-sig',
      };

      const metadata = extractCommunityMetadata(event);
      
      expect(metadata).toEqual({
        identifier: 'test-community',
        name: 'Test Community',
        description: 'A test community',
        image: 'https://example.com/image.jpg',
        moderators: ['moderator1', 'moderator2'],
        relays: [{ url: 'wss://relay.example.com', marker: 'requests' }],
        author: 'test-pubkey',
        createdAt: 1234567890,
      });
    });

    it('returns null for invalid events', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 1,
        tags: [],
        content: '',
        sig: 'test-sig',
      };

      expect(extractCommunityMetadata(event)).toBe(null);
    });

    it('uses identifier as name when name tag is missing', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 34550,
        tags: [['d', 'test-community']],
        content: '',
        sig: 'test-sig',
      };

      const metadata = extractCommunityMetadata(event);
      
      expect(metadata?.name).toBe('test-community');
      expect(metadata?.identifier).toBe('test-community');
    });
  });


});