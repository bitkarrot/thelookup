import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { TestApp } from '@/test/TestApp';
import { EventViewer } from './EventViewer';

// Mock the useAppsByKind hook
vi.mock('@/hooks/useApps', () => ({
  useAppsByKind: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

const mockTextNoteEvent: NostrEvent = {
  id: 'test-event-id',
  pubkey: 'test-pubkey',
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [
    ['t', 'nostr'],
    ['t', 'test'],
  ],
  content: 'This is a test note',
  sig: 'test-signature',
};

const mockUserMetadataEvent: NostrEvent = {
  id: 'test-metadata-id',
  pubkey: 'test-pubkey',
  created_at: Math.floor(Date.now() / 1000),
  kind: 0,
  tags: [],
  content: JSON.stringify({
    name: 'Test User',
    about: 'This is a test user',
    picture: 'https://example.com/avatar.jpg',
  }),
  sig: 'test-signature',
};

describe('EventViewer', () => {
  it('renders text note events correctly', () => {
    render(
      <TestApp>
        <EventViewer event={mockTextNoteEvent} />
      </TestApp>
    );

    expect(screen.getByText('Short Text Note')).toBeInTheDocument();
    expect(screen.getByText('This is a test note')).toBeInTheDocument();
    expect(screen.getByText('#nostr')).toBeInTheDocument();
    expect(screen.getByText('#test')).toBeInTheDocument();
  });

  it('renders user metadata events correctly', () => {
    render(
      <TestApp>
        <EventViewer event={mockUserMetadataEvent} />
      </TestApp>
    );

    expect(screen.getByText('User Metadata')).toBeInTheDocument();
    expect(screen.getByText('@Test User')).toBeInTheDocument();
    expect(screen.getByText('This is a test user')).toBeInTheDocument();
  });

  it('shows raw JSON for unsupported event kinds', () => {
    const unsupportedEvent: NostrEvent = {
      ...mockTextNoteEvent,
      kind: 99999, // Unsupported kind
    };

    render(
      <TestApp>
        <EventViewer event={unsupportedEvent} />
      </TestApp>
    );

    expect(screen.getByText('Kind 99999')).toBeInTheDocument();
    expect(screen.getByText(/This event kind \(99999\) is not yet supported/)).toBeInTheDocument();
  });

  it('includes raw event data toggle', () => {
    render(
      <TestApp>
        <EventViewer event={mockTextNoteEvent} />
      </TestApp>
    );

    expect(screen.getByText('Raw Event Data')).toBeInTheDocument();
  });

  it('shows supported applications section when apps are available', async () => {
    const { useAppsByKind } = await import('@/hooks/useApps');
    
    // Mock apps data
    vi.mocked(useAppsByKind).mockReturnValue({
      data: [
        {
          id: 'app1',
          pubkey: 'app1-pubkey',
          name: 'Test App',
          about: 'A test application',
          picture: 'https://example.com/app.jpg',
          supportedKinds: [1],
          webHandlers: [{ url: 'https://testapp.com/event/<bech32>' }],
          iosHandlers: [],
          androidHandlers: [],
          createdAt: Date.now(),
          dTag: 'test-app',
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useAppsByKind>);

    render(
      <TestApp>
        <EventViewer event={mockTextNoteEvent} />
      </TestApp>
    );

    expect(screen.getByText('Open with Application')).toBeInTheDocument();
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('A test application')).toBeInTheDocument();
    expect(screen.getByText('Open with Test App')).toBeInTheDocument();
  });
});