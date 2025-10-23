import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { FileEditor } from './FileEditor';

// Mock the git repository hook
vi.mock('@/hooks/useGitRepository', () => ({
  useGitRepository: () => ({
    useFileContent: () => ({
      data: 'console.log("Hello, world!");',
      isLoading: false,
      error: null
    })
  })
}));

// Mock the current user hook
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'test-pubkey',
      signer: {
        signEvent: vi.fn()
      }
    }
  })
}));

// Mock the publish hook
vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}));

describe('FileEditor', () => {
  it('renders file editor dialog when open', () => {
    render(
      <TestApp>
        <FileEditor
          repoId="test-repo"
          repositoryNaddr="naddr1test"
          repositoryOwnerPubkey="owner-pubkey"
          filePath="test.js"
          fileName="test.js"
          isOpen={true}
          onClose={() => {}}
        />
      </TestApp>
    );

    expect(screen.getByText('Edit test.js')).toBeInTheDocument();
    expect(screen.getByText('Commit Message')).toBeInTheDocument();
    expect(screen.getByText('File Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit patch/i })).toBeInTheDocument();
  });

  it('renders file editor with edit and preview tabs', () => {
    render(
      <TestApp>
        <FileEditor
          repoId="test-repo"
          repositoryNaddr="naddr1test"
          repositoryOwnerPubkey="owner-pubkey"
          filePath="test.js"
          fileName="test.js"
          isOpen={true}
          onClose={() => {}}
        />
      </TestApp>
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /commit message/i })).toBeInTheDocument();
  });
});