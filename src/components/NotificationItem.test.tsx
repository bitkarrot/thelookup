import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { NotificationItem } from './NotificationItem';
import { NostrEvent } from '@/types/nostr';

// Mock the useAuthor hook
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: () => ({
    data: {
      metadata: {
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      },
    },
  }),
}));

// Mock the useNotificationReadState hook
const mockMarkAsRead = vi.fn();
const mockIsRead = vi.fn().mockReturnValue(false);

vi.mock('@/hooks/useNotificationReadState', () => ({
  useNotificationReadState: () => ({
    markAsRead: mockMarkAsRead,
    isRead: mockIsRead,
  }),
}));

const mockReactionEvent: NostrEvent = {
  id: 'reaction-1',
  pubkey: 'a'.repeat(64), // Valid 64-char hex pubkey
  created_at: 1700000000,
  kind: 7,
  tags: [
    ['k', '30817'],
    ['p', 'b'.repeat(64)], // Valid 64-char hex pubkey
    ['a', `30817:${'b'.repeat(64)}:test-nip`],
  ],
  content: '+',
  sig: 'signature',
};

const mockCommentEvent: NostrEvent = {
  id: 'comment-1',
  pubkey: 'a'.repeat(64), // Valid 64-char hex pubkey
  created_at: 1700000001,
  kind: 1111,
  tags: [
    ['k', '30817'],
    ['p', 'b'.repeat(64)], // Valid 64-char hex pubkey
    ['a', `30817:${'b'.repeat(64)}:test-nip`],
  ],
  content: 'This is a great NIP! Thanks for sharing.',
  sig: 'signature',
};

describe('NotificationItem', () => {
  it('should render a reaction notification', () => {
    render(
      <TestApp>
        <NotificationItem event={mockReactionEvent} />
      </TestApp>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Liked')).toBeInTheDocument();
    expect(screen.getByText('liked your NIP')).toBeInTheDocument();
    expect(screen.getByText('View NIP →')).toBeInTheDocument();
  });

  it('should render a comment notification', () => {
    render(
      <TestApp>
        <NotificationItem event={mockCommentEvent} />
      </TestApp>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Commented')).toBeInTheDocument();
    expect(screen.getByText('commented on your NIP')).toBeInTheDocument();
    expect(screen.getByText('This is a great NIP! Thanks for sharing.')).toBeInTheDocument();
    expect(screen.getByText('View NIP →')).toBeInTheDocument();
  });

  it('should display the time ago', () => {
    render(
      <TestApp>
        <NotificationItem event={mockReactionEvent} />
      </TestApp>
    );

    // Should show some form of time ago text
    expect(screen.getByText(/ago$/)).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', () => {
    render(
      <TestApp>
        <NotificationItem event={mockReactionEvent} />
      </TestApp>
    );

    expect(screen.getByLabelText('Unread notification')).toBeInTheDocument();
  });
});