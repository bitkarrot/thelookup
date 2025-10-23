import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import CommunityPage from './CommunityPage';

describe('CommunityPage', () => {
  it('renders community page with loading state', () => {
    render(
      <TestApp>
        <CommunityPage />
      </TestApp>
    );

    // Should show loading skeleton initially
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders community page structure', () => {
    render(
      <TestApp>
        <CommunityPage />
      </TestApp>
    );

    // Should have the layout structure
    expect(document.querySelector('header')).toBeInTheDocument();
    
    // Should have skeleton loading states (check by class name)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});