import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { NotificationCounter } from './NotificationCounter';

// Mock the hooks
const mockUseCurrentUser = vi.fn();
const mockUseNotifications = vi.fn();
const mockUseNotificationReadState = vi.fn();

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
}));

vi.mock('@/hooks/useNotificationReadState', () => ({
  useNotificationReadState: () => mockUseNotificationReadState(),
}));

describe('NotificationCounter', () => {
  it('should not render when user is not logged in', () => {
    mockUseCurrentUser.mockReturnValue({ user: null });
    mockUseNotifications.mockReturnValue({ data: [] });
    mockUseNotificationReadState.mockReturnValue({ getUnreadCount: () => 0 });

    const { container } = render(
      <TestApp>
        <NotificationCounter />
      </TestApp>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when there are no notifications', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ data: [] });
    mockUseNotificationReadState.mockReturnValue({ getUnreadCount: () => 0 });

    const { container } = render(
      <TestApp>
        <NotificationCounter />
      </TestApp>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when all notifications are read', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ 
      data: [
        { id: 'id1', kind: 7 },
        { id: 'id2', kind: 1111 }
      ] 
    });
    mockUseNotificationReadState.mockReturnValue({ getUnreadCount: () => 0 });

    const { container } = render(
      <TestApp>
        <NotificationCounter />
      </TestApp>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render unread count when there are unread notifications', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ 
      data: [
        { id: 'id1', kind: 7 },
        { id: 'id2', kind: 1111 },
        { id: 'id3', kind: 7 }
      ] 
    });
    mockUseNotificationReadState.mockReturnValue({ getUnreadCount: () => 2 });

    render(
      <TestApp>
        <NotificationCounter />
      </TestApp>
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByLabelText('2 unread notifications')).toBeInTheDocument();
  });

  it('should show 99+ for counts over 99', () => {
    mockUseCurrentUser.mockReturnValue({ user: { pubkey: 'test-pubkey' } });
    mockUseNotifications.mockReturnValue({ 
      data: Array.from({ length: 150 }, (_, i) => ({ id: `id${i}`, kind: 7 }))
    });
    mockUseNotificationReadState.mockReturnValue({ getUnreadCount: () => 150 });

    render(
      <TestApp>
        <NotificationCounter />
      </TestApp>
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.getByLabelText('150 unread notifications')).toBeInTheDocument();
  });
});