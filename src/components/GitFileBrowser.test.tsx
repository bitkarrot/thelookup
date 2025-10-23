import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { GitFileBrowser } from './GitFileBrowser';

// Mock the useGitRepository hook
vi.mock('@/hooks/useGitRepository', () => ({
  useGitRepository: (repoId: string, cloneUrl?: string) => {
    if (!cloneUrl) {
      return {
        state: { isCloning: false, isCloned: false, cloneProgress: 0, error: null },
        isCloned: false,
        cloneRepository: vi.fn(),
        useFileList: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
        useLatestCommit: () => ({ data: null }),
        useFileContent: () => ({ data: null, isLoading: false, error: null }),
      };
    }

    return {
      state: { isCloning: true, isCloned: false, cloneProgress: 0, error: null },
      isCloned: false,
      cloneRepository: vi.fn(),
      useFileList: () => ({
        data: [
          { path: 'README.md', type: 'file' as const, oid: 'abc123', mode: '100644' },
          { path: 'src', type: 'tree' as const, oid: 'def456', mode: '040000' }
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      }),
      useLatestCommit: () => ({ data: null }),
      useFileContent: () => ({ data: 'Hello world', isLoading: false, error: null }),
    };
  },
}));

describe('GitFileBrowser', () => {
  it('shows skeleton loader when repository is being cloned', () => {
    render(
      <TestApp>
        <GitFileBrowser
          repoId="test-repo"
          cloneUrl="https://github.com/example/repo.git"
        />
      </TestApp>
    );

    // Check for skeleton elements (they have animate-pulse class)
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Check for specific skeleton structure
    expect(document.querySelector('.animate-pulse.h-8.w-8')).toBeInTheDocument(); // Refresh button skeleton
    expect(document.querySelector('.animate-pulse.h-4.w-4')).toBeInTheDocument(); // Breadcrumb skeleton
  });

  it('shows message when no clone URL is provided', () => {
    render(
      <TestApp>
        <GitFileBrowser repoId="test-repo" />
      </TestApp>
    );

    expect(screen.getByText('No clone URL available for this repository')).toBeInTheDocument();
  });
});