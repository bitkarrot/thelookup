import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';

export function useCustomNip(naddr: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['custom-nip', naddr],
    queryFn: async ({ signal }) => {
      const decoded = nip19.decode(naddr);
      
      if (decoded.type !== 'naddr') {
        throw new Error('Invalid naddr format');
      }

      const addr = decoded.data;
      
      const events = await nostr.query(
        [{
          kinds: [addr.kind],
          authors: [addr.pubkey],
          '#d': [addr.identifier],
          limit: 1,
        }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      if (events.length === 0) {
        throw new Error('NIP not found');
      }

      return events[0];
    },
    enabled: !!naddr,
  });
}