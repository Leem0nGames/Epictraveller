import { useState, useCallback } from 'react';

export interface NotificationToast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  return { notifications, addNotification };
}
