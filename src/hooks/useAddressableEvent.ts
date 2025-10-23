import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';


interface AddressableEventParams {
  kind: number;
  pubkey: string;
  identifier: string;
}

export function useAddressableEvent(params: AddressableEventParams | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['addressable-event', params?.kind, params?.pubkey, params?.identifier],
    queryFn: async (c) => {
      if (!params) throw new Error('Event parameters are required');
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([{
        kinds: [params.kind],
        authors: [params.pubkey],
        '#d': [params.identifier],
        limit: 1,
      }], { signal });
      
      if (events.length === 0) {
        throw new Error('Event not found');
      }
      
      return events[0];
    },
    enabled: !!params,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}