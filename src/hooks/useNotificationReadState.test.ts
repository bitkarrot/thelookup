import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationReadState } from './useNotificationReadState';

// Mock the useCurrentUser hook
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'test-pubkey-123',
    },
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useNotificationReadState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty read notifications', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useNotificationReadState());

    expect(result.current.getUnreadCount(['id1', 'id2', 'id3'])).toBe(3);
    expect(result.current.isRead('id1')).toBe(false);
  });

  it('should load read notifications from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['id1', 'id2']));

    const { result } = renderHook(() => useNotificationReadState());

    expect(result.current.isRead('id1')).toBe(true);
    expect(result.current.isRead('id2')).toBe(true);
    expect(result.current.isRead('id3')).toBe(false);
    expect(result.current.getUnreadCount(['id1', 'id2', 'id3'])).toBe(1);
  });

  it('should mark notification as read', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useNotificationReadState());

    act(() => {
      result.current.markAsRead('id1');
    });

    expect(result.current.isRead('id1')).toBe(true);
    expect(result.current.getUnreadCount(['id1', 'id2'])).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nostr-notifications-read-test-pubkey-123',
      JSON.stringify(['id1'])
    );
  });

  it('should mark multiple notifications as read', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useNotificationReadState());

    act(() => {
      result.current.markMultipleAsRead(['id1', 'id2']);
    });

    expect(result.current.isRead('id1')).toBe(true);
    expect(result.current.isRead('id2')).toBe(true);
    expect(result.current.getUnreadCount(['id1', 'id2', 'id3'])).toBe(1);
  });

  it('should mark all notifications as read', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useNotificationReadState());

    act(() => {
      result.current.markAllAsRead(['id1', 'id2', 'id3']);
    });

    expect(result.current.getUnreadCount(['id1', 'id2', 'id3'])).toBe(0);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nostr-notifications-read-test-pubkey-123',
      JSON.stringify(['id1', 'id2', 'id3'])
    );
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useNotificationReadState());

    expect(result.current.getUnreadCount(['id1', 'id2'])).toBe(2);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load read notifications from localStorage:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});