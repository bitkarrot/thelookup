import { describe, it, expect } from 'vitest';
import { useCustomNipsByAuthor } from './useCustomNipsByAuthor';

describe('useCustomNipsByAuthor', () => {
  it('should be a function', () => {
    expect(typeof useCustomNipsByAuthor).toBe('function');
  });
});