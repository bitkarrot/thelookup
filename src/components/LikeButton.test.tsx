import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { LikeButton } from './LikeButton';
import type { NostrEvent } from '@nostrify/nostrify';

const mockEvent: NostrEvent = {
  id: 'test-event-id',
  pubkey: 'test-author-pubkey',
  created_at: 1234567890,
  kind: 30024,
  tags: [['d', 'test-nip']],
  content: 'Test NIP content',
  sig: 'test-signature',
};

describe('LikeButton', () => {
  it('renders correctly', () => {
    render(
      <TestApp>
        <LikeButton event={mockEvent} />
      </TestApp>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});