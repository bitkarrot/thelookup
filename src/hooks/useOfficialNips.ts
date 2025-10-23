import { useQuery } from '@tanstack/react-query';

export interface EventKind {
  kind: string;
  description: string;
  nips: string[];
  deprecated?: boolean;
}

export interface OfficialNip {
  number: string;
  title: string;
  deprecated?: boolean;
  note?: string;
  eventKinds?: EventKind[];
}

const parseEventKindsTable = (readmeContent: string): EventKind[] => {
  const eventKinds: EventKind[] = [];
  const lines = readmeContent.split('\n');

  // Find the Event Kinds section
  const eventKindsStartIndex = lines.findIndex((line) => line.includes('## Event Kinds'));
  if (eventKindsStartIndex === -1) return eventKinds;

  // Start parsing from the table header
  let i = eventKindsStartIndex;
  while (i < lines.length && !lines[i].startsWith('| `')) i++;

  // Parse table rows
  while (i < lines.length && lines[i].startsWith('|')) {
    const line = lines[i].trim();
    if (line.startsWith('| `')) {
      const cells = line.split('|').map((cell) => cell.trim());
      if (cells.length >= 3) {
        const kind = cells[1].replace(/`/g, '').trim();
        const description = cells[2].trim();

        // Parse NIP numbers from the last cell
        const nips: string[] = [];
        let deprecated = false;

        // Handle deprecated NIPs
        if (cells[3].includes('deprecated')) {
          const deprecatedMatch = cells[3].match(/(\d+)\s*\(deprecated\)/);
          if (deprecatedMatch) {
            nips.push(deprecatedMatch[1]);
            deprecated = true;
          }
        } else {
          // Handle multiple NIPs and filter out non-official ones
          const nipMatches = cells[3].match(/\[([A-F0-9]+)\]/g);
          if (nipMatches) {
            nips.push(...nipMatches.map((match) => match.slice(1, -1)));
          }
        }

        // Only add event kind if it has at least one official NIP
        if (nips.length > 0) {
          eventKinds.push({
            kind,
            description,
            nips,
            deprecated,
          });
        }
      }
    }
    i++;
  }

  return eventKinds;
};

const parseNipsFromReadme = (readmeContent: string): OfficialNip[] => {
  const lines = readmeContent.split('\n');
  const nips: OfficialNip[] = [];
  const eventKinds = parseEventKindsTable(readmeContent);

  for (const line of lines) {
    // Match lines that start with "- [NIP-" and extract the NIP info
    const match = line.match(/^- \[NIP-([A-F0-9]+): ([^\]]+)\]/);
    if (match) {
      const [, number, title] = match;

      // Check for additional notes (deprecated, unrecommended, etc.)
      let deprecated = false;
      let note: string | undefined;

      // Look for notes after the link
      const noteMatch = line.match(/\]\([^)]+\)\s*---\s*(.+)$/);
      if (noteMatch) {
        const noteText = noteMatch[1];
        note = noteText;

        // Set deprecated flag if either "unrecommended" or "deprecated" appears
        if (noteText.includes('unrecommended') || noteText.includes('deprecated')) {
          deprecated = true;
        }
      }

      // Find related event kinds for this NIP
      const nipEventKinds = eventKinds.filter((ek) => ek.nips.includes(number));

      nips.push({
        number,
        title,
        deprecated,
        note,
        eventKinds: nipEventKinds.length > 0 ? nipEventKinds : undefined,
      });
    }
  }

  return nips;
};

export const useOfficialNips = () => {
  return useQuery({
    queryKey: ['official-nips'],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        'https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/README.md',
        { signal }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch NIPs README');
      }

      const content = await response.text();
      return parseNipsFromReadme(content);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
