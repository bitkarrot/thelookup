import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { SubmitPatchDialog } from './SubmitPatchDialog';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('SubmitPatchDialog', () => {
  it('renders trigger button and opens dialog', () => {
    render(
      <TestApp>
        <SubmitPatchDialog>
          <button>Submit Patch</button>
        </SubmitPatchDialog>
      </TestApp>
    );

    // Check trigger button is rendered
    expect(screen.getByText('Submit Patch')).toBeInTheDocument();

    // Click to open dialog
    fireEvent.click(screen.getByText('Submit Patch'));

    // Check dialog content is rendered
    expect(screen.getByText('Submit a Patch')).toBeInTheDocument();
    expect(screen.getByText('Learn how to submit patches to this repository using ngit')).toBeInTheDocument();
  });

  it('displays installation and usage instructions', () => {
    render(
      <TestApp>
        <SubmitPatchDialog>
          <button>Submit Patch</button>
        </SubmitPatchDialog>
      </TestApp>
    );

    // Open dialog
    fireEvent.click(screen.getByText('Submit Patch'));

    // Check installation command
    expect(screen.getByText('curl -Ls https://ngit.dev/install.sh | bash')).toBeInTheDocument();
    
    // Check submit command
    expect(screen.getByText('ngit send')).toBeInTheDocument();
    
    // Check steps
    expect(screen.getByText('Install ngit')).toBeInTheDocument();
    expect(screen.getByText('Clone and make your changes')).toBeInTheDocument();
    expect(screen.getByText('Submit your patch')).toBeInTheDocument();
    
    // Check link to ngit.dev
    expect(screen.getByText('ngit.dev')).toBeInTheDocument();
  });

  it('copies commands to clipboard when copy buttons are clicked', () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    
    render(
      <TestApp>
        <SubmitPatchDialog>
          <button>Submit Patch</button>
        </SubmitPatchDialog>
      </TestApp>
    );

    // Open dialog
    fireEvent.click(screen.getByText('Submit Patch'));

    // Copy install command
    const installCopyButton = screen.getByRole('button', { name: 'Copy install command' });
    fireEvent.click(installCopyButton);
    expect(writeTextSpy).toHaveBeenCalledWith('curl -Ls https://ngit.dev/install.sh | bash');
    
    // Copy submit command
    const submitCopyButton = screen.getByRole('button', { name: 'Copy submit command' });
    fireEvent.click(submitCopyButton);
    expect(writeTextSpy).toHaveBeenCalledWith('ngit send');
  });
});