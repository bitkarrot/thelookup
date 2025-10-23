import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import EventPage from './EventPage';

describe('EventPage', () => {
  it('shows error for invalid nip19 identifier', () => {
    render(
      <TestApp>
        <EventPage nip19="invalid-identifier" />
      </TestApp>
    );

    expect(screen.getByText(/Invalid Nostr identifier/)).toBeInTheDocument();
  });



  it('shows error when no identifier is provided', () => {
    render(
      <TestApp>
        <EventPage />
      </TestApp>
    );

    expect(screen.getByText('No event identifier provided.')).toBeInTheDocument();
  });
});