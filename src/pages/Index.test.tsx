import { TestApp } from '@/test/TestApp';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Index from './Index';

// Mock the hooks
vi.mock('@/hooks/useRecentCustomNips', () => ({
  useRecentCustomNips: vi.fn(),
}));

vi.mock('@/hooks/useOfficialNips', () => ({
  useOfficialNips: vi.fn(),
}));

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

import { useAuthor } from '@/hooks/useAuthor';
import { useOfficialNips } from '@/hooks/useOfficialNips';
import { useRecentCustomNips } from '@/hooks/useRecentCustomNips';

const mockUseRecentCustomNips = useRecentCustomNips as ReturnType<typeof vi.fn>;
const mockUseOfficialNips = useOfficialNips as ReturnType<typeof vi.fn>;
const mockUseAuthor = useAuthor as ReturnType<typeof vi.fn>;

describe('Index', () => {
  beforeEach(() => {
    mockUseOfficialNips.mockReturnValue({
      data: [
        {
          number: '01',
          title: 'Basic protocol flow description',
          note: null,

          deprecated: false,
        },
      ],
      isLoading: false,
      error: null,
    });

    mockUseAuthor.mockReturnValue({
      data: {
        metadata: {
          name: 'Test Author',
          picture: 'https://example.com/avatar.jpg',
        },
      },
    });
  });

  it('renders kind badges as clickable elements', () => {
    const mockCustomNips = [
      {
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
        content: 'This is a test NIP content.',
        sig: 'sig1',
      },
    ];

    mockUseRecentCustomNips.mockReturnValue({
      data: mockCustomNips,
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    // Check that kind badges are rendered as clickable elements
    const kind1Badge = screen.getByText('1');
    const kind42Badge = screen.getByText('42');

    expect(kind1Badge).toBeInTheDocument();
    expect(kind42Badge).toBeInTheDocument();
    expect(kind1Badge).toHaveClass('cursor-pointer');
    expect(kind42Badge).toHaveClass('cursor-pointer');
  });

  it('renders empty state when no custom NIPs exist', () => {
    mockUseRecentCustomNips.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    expect(screen.getByText('No custom NIPs found. Try another relay?')).toBeInTheDocument();
  });

  it('filters custom NIPs based on search term', () => {
    const mockCustomNips = [
      {
        id: 'event1',
        pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        created_at: 1000000,
        kind: 30817,
        tags: [
          ['title', 'Lightning Network NIP'],
          ['d', 'lightning-nip'],
          ['k', '1'],
        ],
        content: 'This NIP describes lightning network integration.',
        sig: 'sig1',
      },
      {
        id: 'event2',
        pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        created_at: 1000001,
        kind: 30817,
        tags: [
          ['title', 'Relay Management'],
          ['d', 'relay-nip'],
          ['k', '42'],
        ],
        content: 'This NIP describes relay management features.',
        sig: 'sig2',
      },
    ];

    mockUseRecentCustomNips.mockReturnValue({
      data: mockCustomNips,
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    // Initially both NIPs should be visible
    expect(screen.getByText('Lightning Network NIP')).toBeInTheDocument();
    expect(screen.getByText('Relay Management')).toBeInTheDocument();

    // Search for "lightning" - should only show the first NIP
    const searchInput = screen.getByPlaceholderText('Search the protocol universe...');
    fireEvent.change(searchInput, { target: { value: 'lightning' } });

    expect(screen.getByText('Lightning Network NIP')).toBeInTheDocument();
    expect(screen.queryByText('Relay Management')).not.toBeInTheDocument();

    // Search for kind "42" - should only show the second NIP
    fireEvent.change(searchInput, { target: { value: '42' } });

    expect(screen.queryByText('Lightning Network NIP')).not.toBeInTheDocument();
    expect(screen.getByText('Relay Management')).toBeInTheDocument();

    // Search for content "relay" - should only show the second NIP
    fireEvent.change(searchInput, { target: { value: 'relay' } });

    expect(screen.queryByText('Lightning Network NIP')).not.toBeInTheDocument();
    expect(screen.getByText('Relay Management')).toBeInTheDocument();

    // Clear search - both should be visible again
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByText('Lightning Network NIP')).toBeInTheDocument();
    expect(screen.getByText('Relay Management')).toBeInTheDocument();
  });

  it('shows no results message when search yields no custom NIPs', () => {
    const mockCustomNips = [
      {
        id: 'event1',
        pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        created_at: 1000000,
        kind: 30817,
        tags: [
          ['title', 'Test NIP'],
          ['d', 'test-nip'],
          ['k', '1'],
        ],
        content: 'This is a test NIP content.',
        sig: 'sig1',
      },
    ];

    mockUseRecentCustomNips.mockReturnValue({
      data: mockCustomNips,
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    // Search for something that doesn't match
    const searchInput = screen.getByPlaceholderText('Search the protocol universe...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(screen.queryByText('Test NIP')).not.toBeInTheDocument();
  });

  it('filters official NIPs based on various search term formats', () => {
    mockUseOfficialNips.mockReturnValue({
      data: [
        {
          number: '01',
          title: 'Basic protocol flow description',
          deprecated: false,
        },
        {
          number: 'B0',
          title: 'Custom NIP format',
          deprecated: false,
        },
        {
          number: '29',
          title: 'Relay Information Document',
          deprecated: false,
        },
      ],
      isLoading: false,
      error: null,
    });

    mockUseRecentCustomNips.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText('Search the protocol universe...');

    // Test with "NIP-01" format
    fireEvent.change(searchInput, { target: { value: 'NIP-01' } });
    expect(screen.getByText('NIP-01')).toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test with "nip-01" format (lowercase)
    fireEvent.change(searchInput, { target: { value: 'nip-01' } });
    expect(screen.getByText('NIP-01')).toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test with "NIP01" format (no hyphen)
    fireEvent.change(searchInput, { target: { value: 'NIP01' } });
    expect(screen.getByText('NIP-01')).toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test with "B0" format
    fireEvent.change(searchInput, { target: { value: 'B0' } });
    expect(screen.queryByText('NIP-01')).not.toBeInTheDocument();
    expect(screen.getByText('NIP-B0')).toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test with "nipb0" format (no hyphen, lowercase)
    fireEvent.change(searchInput, { target: { value: 'nipb0' } });
    expect(screen.queryByText('NIP-01')).not.toBeInTheDocument();
    expect(screen.getByText('NIP-B0')).toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test with "29" format
    fireEvent.change(searchInput, { target: { value: '29' } });
    expect(screen.queryByText('NIP-01')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.getByText('NIP-29')).toBeInTheDocument();

    // Test with "nip29" format (no hyphen, lowercase)
    fireEvent.change(searchInput, { target: { value: 'nip29' } });
    expect(screen.queryByText('NIP-01')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.getByText('NIP-29')).toBeInTheDocument();

    // Test with title search
    fireEvent.change(searchInput, { target: { value: 'protocol flow' } });
    expect(screen.getByText('NIP-01')).toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test with no results
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No NIPs found matching your search.')).toBeInTheDocument();
    expect(screen.queryByText('NIP-01')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-B0')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();
  });

  it('filters official NIPs based on event kinds', () => {
    mockUseOfficialNips.mockReturnValue({
      data: [
        {
          number: '01',
          title: 'Basic protocol flow description',
          deprecated: false,
          eventKinds: [
            { kind: '1', description: 'Text note' },
            { kind: '2', description: 'Recommend relay' },
          ],
        },
        {
          number: '42',
          title: 'Custom event kinds',
          deprecated: false,
          eventKinds: [{ kind: '42', description: 'Custom event' }],
        },
        {
          number: '29',
          title: 'Relay Information Document',
          deprecated: false,
          eventKinds: [{ kind: '10002', description: 'Relay list' }],
        },
      ],
      isLoading: false,
      error: null,
    });

    mockUseRecentCustomNips.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText('Search the protocol universe...');

    // Test searching by kind number
    fireEvent.change(searchInput, { target: { value: '1' } });
    expect(screen.getByText('NIP-01')).toBeInTheDocument();
    expect(screen.queryByText('NIP-42')).not.toBeInTheDocument();
    expect(screen.queryByText('NIP-29')).not.toBeInTheDocument();

    // Test searching with non-existent kind
    fireEvent.change(searchInput, { target: { value: '99999' } });
    expect(screen.getByText('No NIPs found matching your search.')).toBeInTheDocument();
  });

  it('renders official NIP kind badges as clickable elements', () => {
    mockUseOfficialNips.mockReturnValue({
      data: [
        {
          number: '01',
          title: 'Basic protocol flow description',
          deprecated: false,
          eventKinds: [
            { kind: '1', description: 'Text note' },
            { kind: '2', description: 'Recommend relay' },
          ],
        },
      ],
      isLoading: false,
      error: null,
    });

    mockUseRecentCustomNips.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    // Find the kind badges in the official NIPs section
    const kindBadges = screen.getAllByText('1').filter(el =>
      el.classList.contains('cursor-pointer')
    );

    expect(kindBadges.length).toBeGreaterThan(0);

    // Verify the badge has the clickable styling
    const kindBadge = kindBadges[0];
    expect(kindBadge).toHaveClass('cursor-pointer');
    expect(kindBadge).toHaveClass('hover:bg-purple-200');
  });
});
