import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useNipLikes } from './useNipLikes';
import type { NostrEvent } from '@nostrify/nostrify';

const mockEvent: NostrEvent = {
  id: 'test-event-id',
  pubkey: 'test-author-pubkey',
  created_at: 1234567890,
  kind: 30024,
  tags: [['d', 'test-nip']],
  content: 'Test NIP content',
  sig: 'test-signature',
};

describe('useNipLikes', () => {
  it('should return query result', () => {
    const { result } = renderHook(() => useNipLikes(mockEvent), {
      wrapper: TestApp,
    });

    expect(typeof result.current.isLoading).toBe('boolean');
    expect(result.current.data !== undefined || result.current.isLoading).toBe(true);
  });

  it('should handle undefined event', () => {
    const { result } = renderHook(() => useNipLikes(undefined), {
      wrapper: TestApp,
    });

    expect(typeof result.current.isLoading).toBe('boolean');
  });
});