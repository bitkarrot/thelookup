import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { Layout } from './Layout';

// Mock the useIsMobile hook to test mobile layout
const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

// Mock the NotificationCounter component
vi.mock('@/components/NotificationCounter', () => ({
  NotificationCounter: () => <div data-testid="notification-counter">Counter</div>,
}));

describe('Layout', () => {


  it('should render mobile hamburger menu without notification counter when logged out', () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <TestApp>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestApp>
    );

    // Should have the hamburger menu button
    expect(screen.getByText('Open menu')).toBeInTheDocument();
    
    // Should not have notification counter when logged out
    const counters = screen.queryAllByTestId('notification-counter');
    expect(counters.length).toBe(0);
  });

  it('should render the main content', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(
      <TestApp>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestApp>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});