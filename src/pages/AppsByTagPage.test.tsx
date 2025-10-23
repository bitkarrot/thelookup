import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import AppsByTagPage from './AppsByTagPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ tag: 'social' }),
  };
});

// Mock the useAppsByTag hook
vi.mock('@/hooks/useAppsByTag', () => ({
  useAppsByTag: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

describe('AppsByTagPage', () => {
  it('renders page with tag in title', () => {
    render(
      <TestApp>
        <AppsByTagPage />
      </TestApp>
    );

    expect(screen.getByText(/Apps tagged with/)).toBeInTheDocument();
    expect(screen.getByText('social')).toBeInTheDocument();
    expect(screen.getByText('Back to All Apps')).toBeInTheDocument();
  });

  it('shows empty state when no apps found', () => {
    render(
      <TestApp>
        <AppsByTagPage />
      </TestApp>
    );

    expect(screen.getByText(/No apps found with tag "social"/)).toBeInTheDocument();
  });
});