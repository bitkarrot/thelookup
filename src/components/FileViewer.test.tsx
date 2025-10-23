import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { FileViewer } from './FileViewer';

// Mock the useGitRepository hook
vi.mock('@/hooks/useGitRepository', () => ({
  useGitRepository: () => ({
    useFileContent: () => ({
      data: 'console.log("Hello, world!");',
      isLoading: false,
      error: null,
    }),
  }),
}));

// Mock the SyntaxHighlighter to avoid Prism.js issues in tests
vi.mock('./SyntaxHighlighter', () => ({
  SyntaxHighlighter: ({ code }: { code: string }) => <pre>{code}</pre>,
}));

describe('FileViewer', () => {
  it('renders file viewer dialog when open', () => {
    render(
      <TestApp>
        <FileViewer
          repoId="test-repo"
          filePath="src/index.js"
          fileName="index.js"
          isOpen={true}
          onClose={() => {}}
        />
      </TestApp>
    );

    expect(screen.getByText('index.js')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument(); // file type badge
  });

  it('does not render when closed', () => {
    render(
      <TestApp>
        <FileViewer
          repoId="test-repo"
          filePath="src/index.js"
          fileName="index.js"
          isOpen={false}
          onClose={() => {}}
        />
      </TestApp>
    );

    expect(screen.queryByText('index.js')).not.toBeInTheDocument();
  });
});