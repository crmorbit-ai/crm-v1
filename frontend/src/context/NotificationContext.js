import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res?.data?.count || 0);
    } catch {
      // silent fail
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Poll every 30 seconds
    intervalRef.current = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(intervalRef.current);
  }, [user, fetchUnreadCount]);

  const decrementUnread = (by = 1) => {
    setUnreadCount(prev => Math.max(0, prev - by));
  };

  const resetUnread = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, decrementUnread, resetUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};
