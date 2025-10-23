import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import KindPage from './KindPage';

// Mock the hooks
vi.mock('@/hooks/useAllNipsByKind', () => ({
  useAllNipsByKind: vi.fn(),
}));

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ k: '1' }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

import { useAllNipsByKind } from '@/hooks/useAllNipsByKind';
import { useAuthor } from '@/hooks/useAuthor';

const mockUseAllNipsByKind = useAllNipsByKind as ReturnType<typeof vi.fn>;
const mockUseAuthor = useAuthor as ReturnType<typeof vi.fn>;

describe('KindPage', () => {
  beforeEach(() => {
    mockUseAuthor.mockReturnValue({
      data: {
        metadata: {
          name: 'Test Author',
        },
      },
    });
  });

  it('renders loading state', () => {
    mockUseAllNipsByKind.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <TestApp>
        <KindPage />
      </TestApp>
    );

    expect(screen.getByText('Kind 1 NIPs')).toBeInTheDocument();
    expect(screen.getByText('Official and custom NIPs that define event kind 1')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseAllNipsByKind.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(
      <TestApp>
        <KindPage />
      </TestApp>
    );

    expect(screen.getByText('Failed to load NIPs for kind 1. Please try again.')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseAllNipsByKind.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <KindPage />
      </TestApp>
    );

    expect(screen.getByText('No NIPs found')).toBeInTheDocument();
    expect(screen.getByText('No NIPs have been found for kind 1 yet.')).toBeInTheDocument();
  });

  it('renders NIPs list', () => {
    const mockNips = [
      {
        type: 'custom' as const,
        data: {
          id: 'event1',
          pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          created_at: 1000000,
          kind: 30817,
          tags: [
            ['title', 'Test NIP'],
            ['d', 'test-nip'],
            ['k', '1'],
          ],
          content: 'This is a test NIP content that describes kind 1 events.',
          sig: 'sig1',
        },
        sortKey: 1000000,
      },
    ];

    mockUseAllNipsByKind.mockReturnValue({
      data: mockNips,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <KindPage />
      </TestApp>
    );

    expect(screen.getByText('Test NIP')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    
    // Check that the kind badge is clickable
    const kindBadge = screen.getByText('1');
    expect(kindBadge).toBeInTheDocument();
    expect(kindBadge).toHaveClass('cursor-pointer');
  });

  it('renders multiple kinds in NIP card', () => {
    const mockNips = [
      {
        type: 'custom' as const,
        data: {
          id: 'event1',
          pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          created_at: 1000000,
          kind: 30817,
          tags: [
            ['title', 'Multi-Kind NIP'],
            ['d', 'multi-kind'],
            ['k', '1'],
            ['k', '2'],
            ['k', '3'],
            ['k', '4'],
            ['k', '5'],
          ],
          content: 'This NIP defines multiple kinds.',
          sig: 'sig1',
        },
        sortKey: 1000000,
      },
    ];

    mockUseAllNipsByKind.mockReturnValue({
      data: mockNips,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <KindPage />
      </TestApp>
    );

    expect(screen.getByText('Multi-Kind NIP')).toBeInTheDocument();
    
    // Check that the kind badges are clickable elements
    expect(screen.getByText('1')).toHaveClass('cursor-pointer');
    expect(screen.getByText('2')).toHaveClass('cursor-pointer');
    expect(screen.getByText('3')).toHaveClass('cursor-pointer');
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('renders official NIPs alongside custom NIPs', () => {
    const mockNips = [
      {
        type: 'official' as const,
        data: {
          number: '01',
          title: 'Basic protocol flow description',
          deprecated: false,
          eventKinds: [
            { kind: '1', description: 'Text note', nips: ['01'] },
          ],
        },
        sortKey: 1,
      },
      {
        type: 'custom' as const,
        data: {
          id: 'event1',
          pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          created_at: 1000000,
          kind: 30817,
          tags: [
            ['title', 'Custom NIP'],
            ['d', 'custom-nip'],
            ['k', '1'],
          ],
          content: 'This is a custom NIP.',
          sig: 'sig1',
        },
        sortKey: 1000000,
      },
    ];

    mockUseAllNipsByKind.mockReturnValue({
      data: mockNips,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <KindPage />
      </TestApp>
    );

    // Should show both official and custom NIPs
    expect(screen.getByText('NIP-01')).toBeInTheDocument();
    expect(screen.getByText('Basic protocol flow description')).toBeInTheDocument();
    expect(screen.getByText('Official')).toBeInTheDocument();
    
    expect(screen.getByText('Custom NIP')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});