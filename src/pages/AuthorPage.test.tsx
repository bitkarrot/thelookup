import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import AuthorPage from './AuthorPage';

// Mock the router params with a valid npub
const mockParams = { nip19: 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m' };

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
  };
});

// Mock the hooks to control the data
vi.mock('@/hooks/useAppsByAuthor', () => ({
  useAppsByAuthor: vi.fn(),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

vi.mock('@/hooks/useCustomNipsByAuthor', () => ({
  useCustomNipsByAuthor: vi.fn(),
}));

vi.mock('@/hooks/useRepositories', () => ({
  useRepositoriesByAuthor: vi.fn(),
}));

describe('AuthorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a React component', () => {
    expect(typeof AuthorPage).toBe('function');
  });

  it('renders Apps section when loading', async () => {
    const { useAppsByAuthor } = await import('@/hooks/useAppsByAuthor');
    const { useCurrentUser } = await import('@/hooks/useCurrentUser');
    const { useAuthor } = await import('@/hooks/useAuthor');
    const { useCustomNipsByAuthor } = await import('@/hooks/useCustomNipsByAuthor');
    const { useRepositoriesByAuthor } = await import('@/hooks/useRepositories');
    
    // Mock loading state
    vi.mocked(useAppsByAuthor).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);
    
    // Mock not logged in
    vi.mocked(useCurrentUser).mockReturnValue({
      user: undefined,
      users: [],
    });

    // Mock author data
    vi.mocked(useAuthor).mockReturnValue({
      data: { metadata: { name: 'Test User' } },
      isLoading: false,
      error: null,
    } as never);

    // Mock custom nips data
    vi.mocked(useCustomNipsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    // Mock repositories data
    vi.mocked(useRepositoriesByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <AuthorPage />
      </TestApp>
    );

    // Check that the Apps section heading is present during loading
    await waitFor(() => {
      // Look for the specific Apps section heading with gradient-text class
      const appsHeadings = screen.queryAllByText('Apps');
      const appsSectionHeading = appsHeadings.find(element => 
        element.classList.contains('gradient-text')
      );
      expect(appsSectionHeading).toBeDefined();
    });
  });

  it('hides Apps section when viewing someone else with no apps', async () => {
    const { useAppsByAuthor } = await import('@/hooks/useAppsByAuthor');
    const { useCurrentUser } = await import('@/hooks/useCurrentUser');
    const { useAuthor } = await import('@/hooks/useAuthor');
    const { useCustomNipsByAuthor } = await import('@/hooks/useCustomNipsByAuthor');
    const { useRepositoriesByAuthor } = await import('@/hooks/useRepositories');
    
    // Mock empty apps data (not loading, no error)
    vi.mocked(useAppsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);
    
    // Mock not logged in (viewing someone else's profile)
    vi.mocked(useCurrentUser).mockReturnValue({
      user: undefined,
      users: [],
    });

    // Mock author data
    vi.mocked(useAuthor).mockReturnValue({
      data: { metadata: { name: 'Test User' } },
      isLoading: false,
      error: null,
    } as never);

    // Mock custom nips data
    vi.mocked(useCustomNipsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    // Mock repositories data
    vi.mocked(useRepositoriesByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <AuthorPage />
      </TestApp>
    );

    // Check that the Apps section heading is NOT present in the main content
    // (The navigation "Apps" link should still be there, but not the section heading)
    await waitFor(() => {
      // Look for the specific Apps section heading with gradient-text class
      const appsHeadings = screen.queryAllByText('Apps');
      const appsSectionHeading = appsHeadings.find(element => 
        element.classList.contains('gradient-text')
      );
      expect(appsSectionHeading).toBeUndefined();
    });
  });

  it('shows Apps section when viewing own profile even with no apps', async () => {
    const { useAppsByAuthor } = await import('@/hooks/useAppsByAuthor');
    const { useCurrentUser } = await import('@/hooks/useCurrentUser');
    const { useAuthor } = await import('@/hooks/useAuthor');
    const { useCustomNipsByAuthor } = await import('@/hooks/useCustomNipsByAuthor');
    const { useRepositoriesByAuthor } = await import('@/hooks/useRepositories');
    
    // Mock empty apps data (not loading, no error)
    vi.mocked(useAppsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);
    
    // Mock logged in user viewing their own profile
    vi.mocked(useCurrentUser).mockReturnValue({
      user: {
        pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2', // matches the npub in mockParams
        method: 'extension' as const,
        signer: {} as never,
      },
      users: [],
    });

    // Mock author data
    vi.mocked(useAuthor).mockReturnValue({
      data: { metadata: { name: 'Test User' } },
      isLoading: false,
      error: null,
    } as never);

    // Mock custom nips data
    vi.mocked(useCustomNipsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    // Mock repositories data
    vi.mocked(useRepositoriesByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <AuthorPage />
      </TestApp>
    );

    // Check that the Apps section heading IS present when viewing own profile
    await waitFor(() => {
      // Look for the specific Apps section heading with gradient-text class
      const appsHeadings = screen.queryAllByText('Apps');
      const appsSectionHeading = appsHeadings.find(element => 
        element.classList.contains('gradient-text')
      );
      expect(appsSectionHeading).toBeDefined();
    });
  });

  it('shows combined empty state when viewing someone else with no content', async () => {
    const { useAppsByAuthor } = await import('@/hooks/useAppsByAuthor');
    const { useCurrentUser } = await import('@/hooks/useCurrentUser');
    const { useAuthor } = await import('@/hooks/useAuthor');
    const { useCustomNipsByAuthor } = await import('@/hooks/useCustomNipsByAuthor');
    const { useRepositoriesByAuthor } = await import('@/hooks/useRepositories');
    
    // Mock empty apps data (not loading, no error)
    vi.mocked(useAppsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);
    
    // Mock not logged in (viewing someone else's profile)
    vi.mocked(useCurrentUser).mockReturnValue({
      user: undefined,
      users: [],
    });

    // Mock author data
    vi.mocked(useAuthor).mockReturnValue({
      data: { metadata: { name: 'Test User' } },
      isLoading: false,
      error: null,
    } as never);

    // Mock empty custom nips data (not loading, no error)
    vi.mocked(useCustomNipsByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    // Mock empty repositories data (not loading, no error)
    vi.mocked(useRepositoriesByAuthor).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <AuthorPage />
      </TestApp>
    );

    // Check that the combined empty state is shown
    await waitFor(() => {
      expect(screen.getByText('No Content Found')).toBeInTheDocument();
      expect(screen.getByText(/This author hasn't published any Custom NIPs, Apps, or Repositories on this relay/)).toBeInTheDocument();
    });

    // Check that individual section headings are NOT present
    const appsHeadings = screen.queryAllByText('Apps');
    const appsSectionHeading = appsHeadings.find(element => 
      element.classList.contains('gradient-text')
    );
    expect(appsSectionHeading).toBeUndefined();

    const nipsHeadings = screen.queryAllByText('Custom NIPs');
    const nipsSectionHeading = nipsHeadings.find(element => 
      element.classList.contains('gradient-text')
    );
    expect(nipsSectionHeading).toBeUndefined();
  });
});