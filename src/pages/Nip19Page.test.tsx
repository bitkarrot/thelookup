import { describe, it, expect } from 'vitest';
import { nip19 } from 'nostr-tools';

describe('Nip19Page logic', () => {
  it('identifies official NIPs correctly', () => {
    const isOfficialNip = (id: string) => /^[0-9A-F]{2}$/i.test(id);
    
    expect(isOfficialNip('01')).toBe(true);
    expect(isOfficialNip('FF')).toBe(true);
    expect(isOfficialNip('1A')).toBe(true);
    expect(isOfficialNip('invalid')).toBe(false);
    expect(isOfficialNip('1')).toBe(false);
    expect(isOfficialNip('123')).toBe(false);
  });

  it('validates naddr correctly', () => {
    const validNaddr = 'naddr1qvzqqqrcvypzqprpljlvcnpnw3pejvkkhrc3y6wvmd7vjuad0fg2ud3dky66gaxaqqxku6tswvkk7m3ddehhxarjqk4nmy';
    
    expect(() => {
      const decoded = nip19.decode(validNaddr);
      expect(decoded.type).toBe('naddr');
    }).not.toThrow();
  });

  it('rejects invalid nip19 strings', () => {
    expect(() => {
      nip19.decode('invalid-string');
    }).toThrow();
  });

  it('identifies unsupported nip19 types', () => {
    const npub = 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m';
    
    const decoded = nip19.decode(npub);
    expect(decoded.type).toBe('npub');
    expect(decoded.type).not.toBe('naddr');
  });
});