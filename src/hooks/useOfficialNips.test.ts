import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOfficialNips } from './useOfficialNips';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOfficialNips', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should parse deprecated flag for both "deprecated" and "unrecommended" text', async () => {
    const mockReadmeContent = `
# NIPs

- [NIP-01: Basic protocol flow description](01.md)
- [NIP-02: Contact List and Petnames](02.md) --- **unrecommended**: deprecated by NIP-65
- [NIP-03: OpenTimestamps Attestations for Events](03.md) --- deprecated
- [NIP-04: Encrypted Direct Message](04.md) --- **unrecommended**: deprecated by NIP-44
- [NIP-05: Mapping Nostr keys to DNS-based internet identifiers](05.md)
`;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockReadmeContent),
    });

    const { result } = renderHook(() => useOfficialNips(), {
      wrapper: TestApp,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();

    const nips = result.current.data!;
    
    // NIP-01 should not be deprecated
    const nip01 = nips.find(nip => nip.number === '01');
    expect(nip01?.deprecated).toBe(false);
    
    // NIP-02 should be deprecated (contains "unrecommended")
    const nip02 = nips.find(nip => nip.number === '02');
    expect(nip02?.deprecated).toBe(true);
    
    // NIP-03 should be deprecated (contains "deprecated")
    const nip03 = nips.find(nip => nip.number === '03');
    expect(nip03?.deprecated).toBe(true);
    
    // NIP-04 should be deprecated (contains "unrecommended")
    const nip04 = nips.find(nip => nip.number === '04');
    expect(nip04?.deprecated).toBe(true);
    
    // NIP-05 should not be deprecated
    const nip05 = nips.find(nip => nip.number === '05');
    expect(nip05?.deprecated).toBe(false);
  });
});