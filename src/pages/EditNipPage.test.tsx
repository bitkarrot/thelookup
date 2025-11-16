import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import EditNipPage from './EditNipPage';

// Mock the hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/useCustomNip', () => ({
  useCustomNip: vi.fn(),
}));

vi.mock('@/hooks/useUpdateNip', () => ({
  useUpdateNip: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ naddr: 'naddr1test' }),
    useNavigate: () => vi.fn(),
  };
});

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCustomNip } from '@/hooks/useCustomNip';
import { useUpdateNip } from '@/hooks/useUpdateNip';

const mockUseCurrentUser = useCurrentUser as ReturnType<typeof vi.fn>;
const mockUseCustomNip = useCustomNip as ReturnType<typeof vi.fn>;
const mockUseUpdateNip = useUpdateNip as ReturnType<typeof vi.fn>;

describe('EditNipPage', () => {
  const mockUser = {
    pubkey: 'user123',
    signer: {},
  };

  const mockUpdateNip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseCurrentUser.mockReturnValue({
      user: mockUser,
    });

    mockUseUpdateNip.mockReturnValue({
      mutate: mockUpdateNip,
      isPending: false,
    });
  });

  it('preserves fork markers when editing a forked custom NIP', async () => {
    const forkedEvent = {
      id: 'event1',
      pubkey: 'user123',
      created_at: 1000000,
      kind: 30817,
      tags: [
        ['title', 'Forked NIP'],
        ['d', 'forked-nip'],
        ['k', '1'],
        ['a', '30817:original-author:original-nip', '', 'fork'], // Fork marker
      ],
      content: 'This is a forked NIP content.',
      sig: 'sig1',
    };

    mockUseCustomNip.mockReturnValue({
      data: forkedEvent,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <EditNipPage />
      </TestApp>
    );

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Forked NIP')).toBeInTheDocument();
    });

    // Update the title
    const titleInput = screen.getByDisplayValue('Forked NIP');
    fireEvent.change(titleInput, { target: { value: 'Updated Forked NIP' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update nip/i });
    fireEvent.click(submitButton);

    // Verify that the update hook was called with the correct payload
    expect(mockUpdateNip).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'forked-nip',
        title: 'Updated Forked NIP',
        content: 'This is a forked NIP content.',
        kinds: ['1'],
        originalEvent: forkedEvent,
      }),
      expect.any(Object)
    );
  });

  it('preserves fork markers when editing a forked official NIP', async () => {
    const forkedEvent = {
      id: 'event1',
      pubkey: 'user123',
      created_at: 1000000,
      kind: 30817,
      tags: [
        ['title', 'Forked Official NIP'],
        ['d', 'forked-official-nip'],
        ['k', '42'],
        ['i', 'https://github.com/nostr-protocol/nips/blob/master/01.md', 'fork'], // Fork marker
      ],
      content: 'This is a forked official NIP content.',
      sig: 'sig1',
    };

    mockUseCustomNip.mockReturnValue({
      data: forkedEvent,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <EditNipPage />
      </TestApp>
    );

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Forked Official NIP')).toBeInTheDocument();
    });

    // Update the content
    const contentTextarea = screen.getByDisplayValue('This is a forked official NIP content.');
    fireEvent.change(contentTextarea, { target: { value: 'Updated forked official NIP content.' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update nip/i });
    fireEvent.click(submitButton);

    // Verify that the update hook was called with the correct payload
    expect(mockUpdateNip).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'forked-official-nip',
        title: 'Forked Official NIP',
        content: 'Updated forked official NIP content.',
        kinds: ['42'],
        originalEvent: forkedEvent,
      }),
      expect.any(Object)
    );
  });

  it('preserves multiple fork markers when present', async () => {
    const eventWithMultipleForks = {
      id: 'event1',
      pubkey: 'user123',
      created_at: 1000000,
      kind: 30817,
      tags: [
        ['title', 'Multi-Forked NIP'],
        ['d', 'multi-forked-nip'],
        ['k', '1'],
        ['k', '42'],
        ['a', '30817:original-author:original-nip', '', 'fork'], // Custom NIP fork
        ['i', 'https://github.com/nostr-protocol/nips/blob/master/01.md', 'fork'], // Official NIP fork
      ],
      content: 'This NIP is forked from multiple sources.',
      sig: 'sig1',
    };

    mockUseCustomNip.mockReturnValue({
      data: eventWithMultipleForks,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <EditNipPage />
      </TestApp>
    );

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Multi-Forked NIP')).toBeInTheDocument();
    });

    // Submit the form without changes
    const submitButton = screen.getByRole('button', { name: /update nip/i });
    fireEvent.click(submitButton);

    // Verify that the update hook was called with the correct payload
    expect(mockUpdateNip).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'multi-forked-nip',
        title: 'Multi-Forked NIP',
        content: 'This NIP is forked from multiple sources.',
        kinds: ['1', '42'],
        originalEvent: eventWithMultipleForks,
      }),
      expect.any(Object)
    );
  });

  it('does not add fork markers when editing a non-forked NIP', async () => {
    const regularEvent = {
      id: 'event1',
      pubkey: 'user123',
      created_at: 1000000,
      kind: 30817,
      tags: [
        ['title', 'Regular NIP'],
        ['d', 'regular-nip'],
        ['k', '1'],
      ],
      content: 'This is a regular NIP content.',
      sig: 'sig1',
    };

    mockUseCustomNip.mockReturnValue({
      data: regularEvent,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <EditNipPage />
      </TestApp>
    );

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Regular NIP')).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update nip/i });
    fireEvent.click(submitButton);

    // Verify that the update hook was called with the correct payload
    expect(mockUpdateNip).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'regular-nip',
        title: 'Regular NIP',
        content: 'This is a regular NIP content.',
        kinds: ['1'],
        originalEvent: regularEvent,
      }),
      expect.any(Object)
    );
  });

  it('ignores malformed fork tags', async () => {
    const eventWithMalformedTags = {
      id: 'event1',
      pubkey: 'user123',
      created_at: 1000000,
      kind: 30817,
      tags: [
        ['title', 'NIP with Malformed Tags'],
        ['d', 'malformed-tags-nip'],
        ['k', '1'],
        ['a', '30817:original-author:original-nip'], // Missing 'fork' marker
        ['i', 'https://github.com/nostr-protocol/nips/blob/master/01.md'], // Missing 'fork' marker
        ['a', '30817:valid-author:valid-nip', '', 'fork'], // Valid fork marker
      ],
      content: 'This NIP has some malformed fork tags.',
      sig: 'sig1',
    };

    mockUseCustomNip.mockReturnValue({
      data: eventWithMalformedTags,
      isLoading: false,
      error: null,
    });

    render(
      <TestApp>
        <EditNipPage />
      </TestApp>
    );

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('NIP with Malformed Tags')).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update nip/i });
    fireEvent.click(submitButton);

    // Verify that the update hook was called with the correct payload
    expect(mockUpdateNip).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'malformed-tags-nip',
        title: 'NIP with Malformed Tags',
        content: 'This NIP has some malformed fork tags.',
        kinds: ['1'],
        originalEvent: eventWithMalformedTags,
      }),
      expect.any(Object)
    );
  });
});