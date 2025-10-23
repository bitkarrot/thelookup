import { describe, it, expect } from 'vitest';
import { useDeleteApp } from './useDeleteApp';

describe('useDeleteApp', () => {
  it('should be a function', () => {
    expect(typeof useDeleteApp).toBe('function');
  });
});