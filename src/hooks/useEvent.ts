import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';


export function useEvent(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (c) => {
      if (!eventId) throw new Error('Event ID is required');
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([{ ids: [eventId] }], { signal });
      
      if (events.length === 0) {
        throw new Error('Event not found');
      }
      
      return events[0];
    },
    enabled: !!eventId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}