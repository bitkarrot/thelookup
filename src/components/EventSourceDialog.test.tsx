import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NostrEvent } from '@nostrify/nostrify';

import { TestApp } from '@/test/TestApp';
import { EventSourceDialog } from './EventSourceDialog';

describe('EventSourceDialog', () => {
  const mockEvent: NostrEvent = {
    id: 'test-event-id',
    kind: 30024,
    content: 'This is test content',
    tags: [
      ['d', 'test-identifier'],
      ['title', 'Test NIP'],
      ['k', '1'],
    ],
    created_at: Math.floor(Date.now() / 1000),
    pubkey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    sig: 'test-signature',
  };

  const mockOnOpenChange = vi.fn();

  it('renders dialog when open', () => {
    render(
      <TestApp>
        <EventSourceDialog
          event={mockEvent}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      </TestApp>
    );

    expect(screen.getByText('Event Source')).toBeInTheDocument();
    // Check for individual parts since syntax highlighting splits the text
    expect(screen.getByText('"kind"')).toBeInTheDocument();
    expect(screen.getByText('30024')).toBeInTheDocument();
    expect(screen.getByText('"This is test content"')).toBeInTheDocument();
    expect(screen.getByText('"test-event-id"')).toBeInTheDocument();
  });

  it('does not render dialog when closed', () => {
    render(
      <TestApp>
        <EventSourceDialog
          event={mockEvent}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      </TestApp>
    );

    expect(screen.queryByText('Event Source')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when dialog is closed', async () => {
    const user = userEvent.setup();
    
    render(
      <TestApp>
        <EventSourceDialog
          event={mockEvent}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      </TestApp>
    );

    // Find and click the close button (X button in dialog)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays formatted JSON with proper indentation', () => {
    render(
      <TestApp>
        <EventSourceDialog
          event={mockEvent}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      </TestApp>
    );

    // Check that the JSON content is displayed with syntax highlighting
    expect(screen.getByText('"kind"')).toBeInTheDocument();
    expect(screen.getByText('30024')).toBeInTheDocument();
    expect(screen.getByText('"This is test content"')).toBeInTheDocument();
    expect(screen.getByText('"test-event-id"')).toBeInTheDocument();
    
    // Check that the pre element exists with the formatted JSON
    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement?.textContent).toContain(JSON.stringify(mockEvent, null, 2));
    
    // Check that syntax highlighting is applied
    const codeElement = document.querySelector('code.language-json');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement).toHaveAttribute('data-highlighted', 'yes');
  });
});