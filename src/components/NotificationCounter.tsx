import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationReadState } from '@/hooks/useNotificationReadState';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface NotificationCounterProps {
  className?: string;
}

export function NotificationCounter({ className }: NotificationCounterProps) {
  const { user } = useCurrentUser();
  const { data: notifications } = useNotifications();
  const { getUnreadCount } = useNotificationReadState();

  if (!user || !notifications || notifications.length === 0) {
    return null;
  }

  const unreadCount = getUnreadCount(notifications.map(n => n.id));

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span 
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${className}`}
      aria-label={`${unreadCount} unread notifications`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}