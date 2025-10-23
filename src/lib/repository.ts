import type { NostrEvent } from '@nostrify/nostrify';

export interface RepositoryData {
  id: string;
  name?: string;
  description?: string;
  web: string[];
  clone: string[];
  relays: string[];
  maintainers: string[];
  tags: string[];
  earliestCommit?: string;
}

export interface RepositoryState {
  refs: Array<{
    name: string;
    commit: string;
    parents?: string[];
  }>;
  head?: string;
}

/**
 * Parse repository announcement event into structured data
 */
export function parseRepositoryEvent(event: NostrEvent): RepositoryData {
  const tags = event.tags;
  
  const id = tags.find(([name]) => name === 'd')?.[1] || '';
  const name = tags.find(([name]) => name === 'name')?.[1] || id;
  const description = tags.find(([name]) => name === 'description')?.[1];
  const earliestCommit = tags.find(([name, _value, marker]) => name === 'r' && marker === 'euc')?.[1];
  
  // Collect multiple values for certain tags
  const web = new Set<string>();
  const clone = new Set<string>();
  const relays = new Set<string>();
  const maintainers = new Set<string>();
  const repoTags = new Set<string>();

  const isWebURL = (url: string) => isURL(url, ['http:', 'https:']);
  const isRelayURL = (url: string) => isURL(url, ['ws:', 'wss:']);

  for (const [name, ...values] of tags) {
    if (name === 'web') {
      values.filter(isWebURL).forEach(value => web.add(value));
    } else if (name === 'clone') {
      values.filter(isWebURL).forEach(value => clone.add(value));
    } else if (name === 'relays') {
      values.filter(isRelayURL).forEach(value => relays.add(value));
    } else if (name === 'maintainers') {
      values.forEach(value => maintainers.add(value));
    } else if (name === 't') {
      if (values[0]) {
        repoTags.add(values[0]);
      }
    }
  }

  return {
    id,
    name,
    description,
    web: [...web],
    clone: [...clone],
    relays: [...relays],
    maintainers: [...maintainers],
    tags: [...repoTags],
    earliestCommit,
  };
}

/**
 * Parse repository state event into structured data
 */
export function parseRepositoryState(event: NostrEvent): RepositoryState {
  const tags = event.tags;
  
  const refs: RepositoryState['refs'] = [];
  const head = tags.find(([name]) => name === 'HEAD')?.[1];
  
  // Parse refs tags
  for (const tag of tags) {
    if (tag[0].startsWith('refs/')) {
      const [_name, commit, ...parents] = tag.slice(1);
      if (commit) {
        refs.push({
          name: tag[0],
          commit,
          parents: parents.length > 0 ? parents : undefined,
        });
      }
    }
  }
  
  return {
    refs,
    head,
  };
}

/**
 * Extract issue subject from tags
 */
export function getIssueSubject(event: NostrEvent): string | undefined {
  return event.tags.find(([name]) => name === 'subject')?.[1];
}

/**
 * Extract issue labels from tags
 */
export function getIssueLabels(event: NostrEvent): string[] {
  return event.tags.filter(([name]) => name === 't').map(([, _value]) => _value).filter(Boolean);
}

/**
 * Check if a patch is a root patch
 */
export function isRootPatch(event: NostrEvent): boolean {
  return event.tags.some(([name, _value]) => name === 't' && _value === 'root');
}

/**
 * Check if a patch is a root revision
 */
export function isRootRevision(event: NostrEvent): boolean {
  return event.tags.some(([name, _value]) => name === 't' && _value === 'root-revision');
}

/**
 * Get commit ID from patch event
 */
export function getPatchCommitId(event: NostrEvent): string | undefined {
  return event.tags.find(([name]) => name === 'commit')?.[1];
}

/**
 * Get parent commit ID from patch event
 */
export function getPatchParentCommitId(event: NostrEvent): string | undefined {
  return event.tags.find(([name]) => name === 'parent-commit')?.[1];
}

/**
 * Format repository clone URL for display
 */
export function formatCloneUrl(url: string): string {
  // Remove common prefixes for cleaner display
  return url.replace(/^(https?:\/\/|git@|ssh:\/\/)/, '');
}

/**
 * Get repository display name (fallback to ID if no name)
 */
export function getRepositoryDisplayName(repo: RepositoryData): string {
  return repo.name || repo.id;
}

function isURL(url: string, protocol?: string[]): boolean {
  try {
    const { protocol: urlProtocol } = new URL(url);
    return !protocol || protocol.includes(urlProtocol);
  } catch {
    return false;
  }
}