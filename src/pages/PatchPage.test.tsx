import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import PatchPage from './PatchPage';

// Mock the useParams hook
const mockParams = {
  nip19: 'invalid-naddr',
  patchId: 'test-patch-id'
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe('PatchPage', () => {
  it('renders error state for invalid repository address', () => {
    render(
      <TestApp>
        <PatchPage />
      </TestApp>
    );

    // Should show error message for invalid naddr
    expect(screen.getByText('Invalid repository address')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    render(
      <TestApp>
        <PatchPage />
      </TestApp>
    );

    // Component should render successfully
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});