import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { CustomNipCard } from './CustomNipCard';

// Mock the useAuthor hook
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

import { useAuthor } from '@/hooks/useAuthor';

const mockUseAuthor = useAuthor as ReturnType<typeof vi.fn>;

describe('CustomNipCard', () => {
  const mockEvent = {
    id: 'event1',
    pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    created_at: 1000000,
    kind: 30817,
    tags: [
      ['title', 'Test NIP'],
      ['d', 'test-nip'],
      ['k', '1'],
      ['k', '42'],
    ],
    content: '# Test NIP\n\nThis is a test NIP content that describes the functionality of this custom protocol extension.',
    sig: 'sig1',
  };

  beforeEach(() => {
    mockUseAuthor.mockReturnValue({
      data: {
        metadata: {
          name: 'Test Author',
          picture: 'https://example.com/avatar.jpg',
        },
      },
    });
  });

  it('renders NIP card with basic information', () => {
    render(
      <TestApp>
        <CustomNipCard event={mockEvent} />
      </TestApp>
    );

    expect(screen.getByText('Test NIP')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('This is a test NIP content that describes the functionality of this custom protocol extension.')).toBeInTheDocument();
  });

  it('renders clickable kind badges', () => {
    render(
      <TestApp>
        <CustomNipCard event={mockEvent} />
      </TestApp>
    );

    const kind1Badge = screen.getByText('1');
    const kind42Badge = screen.getByText('42');
    
    expect(kind1Badge).toBeInTheDocument();
    expect(kind42Badge).toBeInTheDocument();
    expect(kind1Badge).toHaveClass('cursor-pointer');
    expect(kind42Badge).toHaveClass('cursor-pointer');
  });

  it('limits displayed kinds based on maxKinds prop', () => {
    render(
      <TestApp>
        <CustomNipCard event={mockEvent} maxKinds={1} />
      </TestApp>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('renders custom actions when provided', () => {
    const actions = <button>Custom Action</button>;
    
    render(
      <TestApp>
        <CustomNipCard event={mockEvent} actions={actions} />
      </TestApp>
    );

    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('handles missing title gracefully', () => {
    const eventWithoutTitle = {
      ...mockEvent,
      tags: [
        ['d', 'test-nip'],
        ['k', '1'],
      ],
    };

    render(
      <TestApp>
        <CustomNipCard event={eventWithoutTitle} />
      </TestApp>
    );

    expect(screen.getByText('Untitled NIP')).toBeInTheDocument();
  });

  it('handles missing author metadata gracefully', () => {
    mockUseAuthor.mockReturnValue({
      data: null,
    });

    render(
      <TestApp>
        <CustomNipCard event={mockEvent} />
      </TestApp>
    );

    // Should show truncated pubkey when no author metadata
    expect(screen.getByText('Swift Falcon')).toBeInTheDocument();
  });

  it('extracts content preview correctly', () => {
    const eventWithMarkdown = {
      ...mockEvent,
      content: '# Header\n\n## Subheader\n\nThis is the first paragraph that should be extracted as preview content.\n\nThis is a second paragraph.',
    };

    render(
      <TestApp>
        <CustomNipCard event={eventWithMarkdown} />
      </TestApp>
    );

    expect(screen.getByText('This is the first paragraph that should be extracted as preview content.')).toBeInTheDocument();
  });

  it('handles long content by truncating', () => {
    const eventWithLongContent = {
      ...mockEvent,
      content: 'This is a very long paragraph that exceeds the maximum character limit and should be truncated with ellipsis to ensure the card remains readable and does not become too tall or overwhelming for users browsing through multiple NIPs.',
    };

    render(
      <TestApp>
        <CustomNipCard event={eventWithLongContent} />
      </TestApp>
    );

    // Should be truncated and end with ellipsis
    const preview = screen.getByText(/This is a very long paragraph.*\.\.\./);
    expect(preview).toBeInTheDocument();
    expect(preview.textContent!.length).toBeLessThanOrEqual(143); // 140 + "..."
  });

  it('handles empty content gracefully', () => {
    const eventWithEmptyContent = {
      ...mockEvent,
      content: '',
    };

    render(
      <TestApp>
        <CustomNipCard event={eventWithEmptyContent} />
      </TestApp>
    );

    expect(screen.getByText('Test NIP')).toBeInTheDocument();
    // Should not crash and should not show any content preview
  });

  it('skips setext-style headers correctly', () => {
    const eventWithSetextHeaders = {
      ...mockEvent,
      content: 'Main Title\n==========\n\nSubtitle\n--------\n\nThis is the actual content that should be extracted as the preview.',
    };

    render(
      <TestApp>
        <CustomNipCard event={eventWithSetextHeaders} />
      </TestApp>
    );

    expect(screen.getByText('This is the actual content that should be extracted as the preview.')).toBeInTheDocument();
    expect(screen.queryByText('Main Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
  });

  it('skips lines that are entirely inline code blocks', () => {
    const eventWithCodeLines = {
      ...mockEvent,
      content: '`someVariable`\n\n  `anotherFunction`  \n\nThis is the description that should be shown as preview.',
    };

    render(
      <TestApp>
        <CustomNipCard event={eventWithCodeLines} />
      </TestApp>
    );

    expect(screen.getByText('This is the description that should be shown as preview.')).toBeInTheDocument();
    expect(screen.queryByText('someVariable')).not.toBeInTheDocument();
    expect(screen.queryByText('anotherFunction')).not.toBeInTheDocument();
  });

  it('displays fork badge when event is a fork of another custom NIP', () => {
    const forkedEvent = {
      ...mockEvent,
      tags: [
        ...mockEvent.tags,
        ['a', '30817:abcd1234:original-nip', '', 'fork'],
      ],
    };

    render(
      <TestApp>
        <CustomNipCard event={forkedEvent} />
      </TestApp>
    );

    expect(screen.getByText('Fork')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('displays fork badge when event is a fork of an official NIP', () => {
    const forkedEvent = {
      ...mockEvent,
      tags: [
        ...mockEvent.tags,
        ['i', 'https://github.com/nostr-protocol/nips/blob/master/01.md', 'fork'],
      ],
    };

    render(
      <TestApp>
        <CustomNipCard event={forkedEvent} />
      </TestApp>
    );

    expect(screen.getByText('Fork')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('does not display fork badge when event is not a fork', () => {
    render(
      <TestApp>
        <CustomNipCard event={mockEvent} />
      </TestApp>
    );

    expect(screen.queryByText('Fork')).not.toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});