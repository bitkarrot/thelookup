import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(
      <TestApp>
        <ThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    render(
      <TestApp>
        <ThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button');
    
    // Click to toggle theme
    fireEvent.click(button);
    
    // Button should still be present after click
    expect(button).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestApp>
        <ThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});