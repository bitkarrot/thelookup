import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useTheme } from '@/components/AppProvider';

describe('useTheme', () => {
  it('provides theme utilities', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: TestApp,
    });

    expect(result.current.theme).toBe('dark'); // Default theme
    expect(typeof result.current.setTheme).toBe('function');
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('can set theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: TestApp,
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
  });

  it('can toggle theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: TestApp,
    });

    const initialTheme = result.current.theme;

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe(initialTheme === 'light' ? 'dark' : 'light');
  });
});