import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { useAppConfig } from '@/components/AppProvider';

interface UpdateNipParams {
  identifier: string;
  title: string;
  content: string;
  kinds: string[];
  originalEvent: NostrEvent; // The original event to preserve fork markers
}

export function useUpdateNip() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { config } = useAppConfig();

  return useMutation({
    mutationFn: async ({ identifier, title, content, kinds, originalEvent }: UpdateNipParams) => {
      // Preserve fork markers from the original event
      const forkTags = originalEvent.tags.filter((tag: string[]) => {
        // Fork of custom NIP: ['a', value, ?, 'fork']
        if (tag[0] === 'a' && tag.length >= 4 && tag[3] === 'fork') {
          return true;
        }
        // Fork of official NIP: ['i', value, 'fork']
        if (tag[0] === 'i' && tag.length >= 3 && tag[2] === 'fork') {
          return true;
        }
        return false;
      });

      const tags = [
        ['d', identifier.trim()],
        ['title', title.trim()],
        ...kinds.map(kind => ['k', kind]),
        ...forkTags, // Preserve fork markers
      ];

      const newEvent = await publishEvent({
        kind: 30817,
        content: content.trim(),
        tags,
      });

      return newEvent;
    },
    onSuccess: (newEvent) => {
      // Create the naddr for the updated NIP
      const newNaddr = nip19.naddrEncode({
        identifier: newEvent.tags.find(tag => tag[0] === 'd')?.[1] || '',
        pubkey: newEvent.pubkey,
        kind: newEvent.kind,
        relays: [config.relayUrl],
      });

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['custom-nip'] });
      queryClient.invalidateQueries({ queryKey: ['my-nips'] });
      queryClient.invalidateQueries({ queryKey: ['recent-custom-nips'] });
      queryClient.invalidateQueries({ queryKey: ['custom-nips-by-author'] });
      queryClient.invalidateQueries({ queryKey: ['nips-by-kind'] });

      // Also invalidate the specific NIP query
      queryClient.invalidateQueries({ queryKey: ['custom-nip', newNaddr] });
    },
    onError: (error) => {
      console.error('Failed to update NIP:', error);
    },
  });
}