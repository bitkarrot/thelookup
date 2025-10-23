import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IssueStatusBadge } from './IssueStatusBadge';

describe('IssueStatusBadge', () => {
  it('renders open status correctly', () => {
    render(<IssueStatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders resolved status correctly', () => {
    render(<IssueStatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders closed status correctly', () => {
    render(<IssueStatusBadge status="closed" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders draft status correctly', () => {
    render(<IssueStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});