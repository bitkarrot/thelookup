import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { RepositoryCard } from './RepositoryCard';
import type { NostrEvent } from '@nostrify/nostrify';

const mockRepositoryEvent: NostrEvent = {
  id: 'test-repo-id',
  pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  created_at: Math.floor(Date.now() / 1000),
  kind: 30617,
  content: '',
  tags: [
    ['d', 'test-repo'],
    ['name', 'Test Repository'],
    ['description', 'A test repository for NIP-34'],
    ['clone', 'https://github.com/user/test-repo.git'],
    ['web', 'https://github.com/user/test-repo'],
    ['t', 'javascript'],
    ['t', 'nostr'],
  ],
  sig: 'test-signature',
};

describe('RepositoryCard', () => {
  it('renders repository information correctly', () => {
    render(
      <TestApp>
        <RepositoryCard event={mockRepositoryEvent} />
      </TestApp>
    );

    expect(screen.getByText('Test Repository')).toBeInTheDocument();
    expect(screen.getByText('A test repository for NIP-34')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('nostr')).toBeInTheDocument();
    expect(screen.getByText('Browse Repository')).toBeInTheDocument();
  });

  it('falls back to repository ID when name is not provided', () => {
    const eventWithoutName = {
      ...mockRepositoryEvent,
      tags: [
        ['d', 'fallback-repo'],
        ['description', 'Repository without a name'],
      ],
    };

    render(
      <TestApp>
        <RepositoryCard event={eventWithoutName} />
      </TestApp>
    );

    expect(screen.getByText('fallback-repo')).toBeInTheDocument();
  });
});