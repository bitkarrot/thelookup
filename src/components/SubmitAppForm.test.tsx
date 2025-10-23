import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { SubmitAppForm } from './SubmitAppForm';

describe('SubmitAppForm', () => {
  it('renders login prompt when user is not logged in', () => {
    render(
      <TestApp>
        <SubmitAppForm />
      </TestApp>
    );

    expect(screen.getByText('Submit New App')).toBeInTheDocument();
    expect(screen.getByText('Please log in to submit a new app to the directory.')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('renders submit app title', () => {
    render(
      <TestApp>
        <SubmitAppForm />
      </TestApp>
    );

    // Check for main title
    expect(screen.getByText('Submit New App')).toBeInTheDocument();
  });
});