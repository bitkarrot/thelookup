import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { TestApp } from '@/test/TestApp';
import { useNotifications } from './useNotifications';

// Mock the useCurrentUser hook
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'test-pubkey-123',
    },
  }),
}));

// Mock the useNostr hook
vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn().mockResolvedValue([
        {
          id: 'reaction-1',
          pubkey: 'author-1',
          created_at: 1700000000,
          kind: 7,
          tags: [
            ['k', '30817'],
            ['p', 'test-pubkey-123'],
            ['a', '30817:test-pubkey-123:my-nip'],
          ],
          content: '+',
          sig: 'sig1',
        },
        {
          id: 'comment-1',
          pubkey: 'author-2',
          created_at: 1700000001,
          kind: 1111,
          tags: [
            ['k', '30817'],
            ['p', 'test-pubkey-123'],
            ['a', '30817:test-pubkey-123:my-nip'],
          ],
          content: 'Great NIP!',
          sig: 'sig2',
        },
        {
          id: 'self-reaction',
          pubkey: 'test-pubkey-123', // Same as current user
          created_at: 1700000002,
          kind: 7,
          tags: [
            ['k', '30817'],
            ['p', 'test-pubkey-123'],
            ['a', '30817:test-pubkey-123:my-nip'],
          ],
          content: '+',
          sig: 'sig3',
        },
      ]),
    },
  }),
  NostrContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe('useNotifications', () => {
  it('should fetch notifications for the current user', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: TestApp,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2); // Should exclude self-notification
    expect(result.current.data?.[0].kind).toBe(1111); // Comment (newer)
    expect(result.current.data?.[1].kind).toBe(7); // Reaction (older)
  });

  it('should sort notifications by creation time (newest first)', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: TestApp,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const notifications = result.current.data;
    expect(notifications?.[0].created_at).toBeGreaterThan(notifications?.[1].created_at || 0);
  });

  it('should filter out self-notifications (events created by the current user)', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: TestApp,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const notifications = result.current.data;
    
    // Should only have 2 notifications (excluding the self-reaction)
    expect(notifications).toHaveLength(2);
    
    // None of the notifications should be from the current user
    notifications?.forEach(notification => {
      expect(notification.pubkey).not.toBe('test-pubkey-123');
    });
    
    // Should not include the self-reaction event
    const selfReactionExists = notifications?.some(n => n.id === 'self-reaction');
    expect(selfReactionExists).toBe(false);
  });
});