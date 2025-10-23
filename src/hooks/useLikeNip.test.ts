import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useLikeNip } from './useLikeNip';

describe('useLikeNip', () => {
  it('should return a mutation function', () => {
    const { result } = renderHook(() => useLikeNip(), {
      wrapper: TestApp,
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });
});