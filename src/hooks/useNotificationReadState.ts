import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const STORAGE_KEY_PREFIX = 'nostr-notifications-read-';

export function useNotificationReadState() {
  const { user } = useCurrentUser();

  const storageKey = user?.pubkey ? `${STORAGE_KEY_PREFIX}${user.pubkey}` : null;

  // Load read notifications from localStorage synchronously
  const initialReadNotifications = useMemo(() => {
    if (!storageKey) {
      return new Set<string>();
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const readIds = JSON.parse(stored) as string[];
        return new Set(readIds);
      } else {
        return new Set<string>();
      }
    } catch (error) {
      console.warn('Failed to load read notifications from localStorage:', error);
      return new Set<string>();
    }
  }, [storageKey]);

  const [readNotifications, setReadNotifications] = useState<Set<string>>(initialReadNotifications);

  // Update state when user changes (for account switching)
  useEffect(() => {
    setReadNotifications(initialReadNotifications);
  }, [initialReadNotifications]);

  // Save read notifications to localStorage
  const saveToStorage = useCallback((readIds: Set<string>) => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(readIds)));
    } catch (error) {
      console.warn('Failed to save read notifications to localStorage:', error);
    }
  }, [storageKey]);

  // Mark a notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      saveToStorage(newSet);
      return newSet;
    });
  }, [saveToStorage]);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback((notificationIds: string[]) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      notificationIds.forEach(id => newSet.add(id));
      saveToStorage(newSet);
      return newSet;
    });
  }, [saveToStorage]);

  // Mark all notifications as read
  const markAllAsRead = useCallback((allNotificationIds: string[]) => {
    const newSet = new Set(allNotificationIds);
    setReadNotifications(newSet);
    saveToStorage(newSet);
  }, [saveToStorage]);

  // Check if a notification is read
  const isRead = useCallback((notificationId: string) => {
    return readNotifications.has(notificationId);
  }, [readNotifications]);

  // Get count of unread notifications
  const getUnreadCount = useCallback((allNotificationIds: string[]) => {
    return allNotificationIds.filter(id => !readNotifications.has(id)).length;
  }, [readNotifications]);

  return {
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    isRead,
    getUnreadCount,
    readNotifications,
  };
}