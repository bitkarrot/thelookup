import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useDeleteRepository } from './useDeleteRepository';

// Mock the useNostrPublish hook
vi.mock('./useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'test-deletion-event' }),
  }),
}));

describe('useDeleteRepository', () => {
  it('should be a function', () => {
    expect(typeof useDeleteRepository).toBe('function');
  });

  it('should return a mutation object', () => {
    const { result } = renderHook(() => useDeleteRepository(), {
      wrapper: TestApp,
    });

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });
});