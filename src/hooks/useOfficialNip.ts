import { useQuery } from '@tanstack/react-query';

export function useOfficialNip(nipNumber: string) {
  return useQuery({
    queryKey: ['official-nip', nipNumber],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/${nipNumber}.md`,
        { signal }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NIP ${nipNumber}`);
      }
      
      const content = await response.text();
      return { content, nipNumber };
    },
    enabled: !!nipNumber,
  });
}