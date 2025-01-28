import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  type: 'new_request' | 'new_message' | 'appointment_update';
  message: string;
  timestamp: string;
  data?: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  clearNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children, serviceId }: { children: ReactNode; serviceId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws?serviceId=${serviceId}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data);
      setNotifications(prev => [...prev, notification]);
      
      // Show toast notification
      toast({
        title: notification.type === 'new_request' ? 'Cerere Nouă' : 'Notificare Nouă',
        description: notification.message,
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [serviceId]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, clearNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
