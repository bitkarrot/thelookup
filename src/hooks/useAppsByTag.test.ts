import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useAppsByTag } from './useAppsByTag';

describe('useAppsByTag', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAppsByTag('social'), {
      wrapper: TestApp,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(null);
  });

  it('does not run query when tag is empty', () => {
    const { result } = renderHook(() => useAppsByTag(''), {
      wrapper: TestApp,
    });

    // Query should be disabled when tag is empty
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});