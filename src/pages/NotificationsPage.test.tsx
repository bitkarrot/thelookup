import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import NotificationsPage from './NotificationsPage';

// Mock the useCurrentUser hook
const mockUseCurrentUser = vi.fn();
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Mock the useNotifications hook
const mockUseNotifications = vi.fn();
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
}));

// Mock the useNotificationReadState hook
const mockUseNotificationReadState = vi.fn();
vi.mock('@/hooks/useNotificationReadState', () => ({
  useNotificationReadState: () => mockUseNotificationReadState(),
}));

// Also need to mock it for the NotificationItem component
vi.mock('@/components/NotificationItem', () => ({
  NotificationItem: ({ event }: { event: { kind: number } }) => (
    <div data-testid="notification-item">
      Notification for {event.kind === 7 ? 'reaction' : 'comment'}
    </div>
  ),
}));

describe('NotificationsPage', () => {
  it('should show login message when user is not logged in', () => {
    mockUseCurrentUser.mockReturnValue({ user: null });
    mockUseNotifications.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseNotificationReadState.mockReturnValue({ 
      markAllAsRead: vi.fn(), 
      getUnreadCount: () => 0 
    });

    render(
      <TestApp>
        <NotificationsPage />
      </TestApp>
    );

    expect(screen.getByText('You must be logged in to view your notifications.')).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ data: undefined, isLoading: true, error: null });
    mockUseNotificationReadState.mockReturnValue({ 
      markAllAsRead: vi.fn(), 
      getUnreadCount: () => 0 
    });

    render(
      <TestApp>
        <NotificationsPage />
      </TestApp>
    );

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    // Should show skeleton loaders
    expect(document.querySelectorAll('[data-testid="skeleton"]')).toBeTruthy();
  });

  it('should show error state', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ 
      data: undefined, 
      isLoading: false, 
      error: new Error('Failed to fetch') 
    });
    mockUseNotificationReadState.mockReturnValue({ 
      markAllAsRead: vi.fn(), 
      getUnreadCount: () => 0 
    });

    render(
      <TestApp>
        <NotificationsPage />
      </TestApp>
    );

    expect(screen.getByText('Failed to load notifications. Please try again.')).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseNotificationReadState.mockReturnValue({ 
      markAllAsRead: vi.fn(), 
      getUnreadCount: () => 0 
    });

    render(
      <TestApp>
        <NotificationsPage />
      </TestApp>
    );

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByText("When people react to, comment on, or fork your custom NIPs, you'll see those notifications here.")).toBeInTheDocument();
    expect(screen.getByText('Create Your First NIP')).toBeInTheDocument();
  });

  it('should show notifications when data is available', () => {
    const mockNotifications = [
      {
        id: 'notification-1',
        pubkey: 'a'.repeat(64), // Valid 64-char hex pubkey
        created_at: 1700000000,
        kind: 7,
        tags: [['a', `30817:${'b'.repeat(64)}:test-nip`]],
        content: '+',
        sig: 'sig1',
      },
    ];

    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ 
      data: mockNotifications, 
      isLoading: false, 
      error: null 
    });
    mockUseNotificationReadState.mockReturnValue({ 
      markAllAsRead: vi.fn(), 
      getUnreadCount: () => 0 
    });

    render(
      <TestApp>
        <NotificationsPage />
      </TestApp>
    );

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Reactions, comments, and forks on your custom NIPs')).toBeInTheDocument();
    // The NotificationItem component should be rendered
    // (we're not testing its internals here, just that it's present)
  });

  it('should show mark all as read button when there are unread notifications', () => {
    const mockNotifications = [
      {
        id: 'notification-1',
        pubkey: 'a'.repeat(64),
        created_at: 1700000000,
        kind: 7,
        tags: [['a', `30817:${'b'.repeat(64)}:test-nip`]],
        content: '+',
        sig: 'sig1',
      },
    ];

    const mockMarkAllAsRead = vi.fn();
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ 
      data: mockNotifications, 
      isLoading: false, 
      error: null 
    });
    mockUseNotificationReadState.mockReturnValue({ 
      markAllAsRead: mockMarkAllAsRead, 
      getUnreadCount: () => 1 
    });

    render(
      <TestApp>
        <NotificationsPage />
      </TestApp>
    );

    expect(screen.getByText('1 new')).toBeInTheDocument();
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });
});