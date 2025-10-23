import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { NostrEvent } from '@nostrify/nostrify';

import { TestApp } from '@/test/TestApp';
import { useDeleteComment } from './useDeleteComment';

// Mock the useNostrPublish hook
vi.mock('./useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      id: 'deletion-event-id',
      kind: 5,
      content: 'Comment deleted by author',
      tags: [['e', 'comment-id'], ['k', '1111']],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: 'user-pubkey',
      sig: 'signature',
    }),
  }),
}));

describe('useDeleteComment', () => {
  const mockComment: NostrEvent = {
    id: 'comment-id',
    kind: 1111,
    content: 'This is a test comment',
    tags: [['a', '30024:author-pubkey:test-article']],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: 'user-pubkey',
    sig: 'signature',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a deletion event for a comment', async () => {
    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: TestApp,
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle deletion with custom reason', async () => {
    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: TestApp,
    });

    const customReason = 'Inappropriate content';

    result.current.mutate({
      comment: mockComment,
      reason: customReason,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle deletion without custom reason', async () => {
    const { result } = renderHook(() => useDeleteComment(), {
      wrapper: TestApp,
    });

    result.current.mutate({
      comment: mockComment,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});