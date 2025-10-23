import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import EditAppPage from './EditAppPage';

// Mock the useParams hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ naddr: 'naddr1test123' }),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

// Mock the useApp hook
vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({
    data: null,
    isLoading: false,
    error: new Error('App not found'),
  }),
}));

// Mock useCurrentUser to return no user initially
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: null,
  }),
}));

describe('EditAppPage', () => {
  it('renders login prompt when user is not logged in', () => {
    render(
      <TestApp>
        <EditAppPage />
      </TestApp>
    );

    expect(screen.getByText('Edit App')).toBeInTheDocument();
    expect(screen.getByText('Please log in to edit your app.')).toBeInTheDocument();
  });
});