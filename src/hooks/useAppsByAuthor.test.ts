import { describe, it, expect } from 'vitest';
import { useAppsByAuthor } from './useAppsByAuthor';

describe('useAppsByAuthor', () => {
  it('should be a function', () => {
    expect(typeof useAppsByAuthor).toBe('function');
  });
});