'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { NotificationCenterView } from './Notifications';
import type { GdsNotificationMessage } from './Notifications';

interface GdsNotificationContextValue {
  notifications: GdsNotificationMessage[];
  notify: (message: GdsNotificationMessage) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const GdsNotificationContext = createContext<GdsNotificationContextValue | null>(null);

export function GdsNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<GdsNotificationMessage[]>([]);

  const value = useMemo<GdsNotificationContextValue>(() => ({
    notifications,
    notify: (message) => {
      setNotifications((current) => {
        const rest = current.filter((item) => item.id !== message.id);
        return [...rest, message];
      });
      if (typeof message.autoCloseMs === 'number' && message.autoCloseMs > 0) {
        window.setTimeout(() => {
          setNotifications((current) => current.filter((item) => item.id !== message.id));
        }, message.autoCloseMs);
      }
    },
    dismiss: (id) => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    },
    clear: () => {
      setNotifications([]);
    },
  }), [notifications]);

  return (
    <GdsNotificationContext.Provider value={value}>
      {children}
    </GdsNotificationContext.Provider>
  );
}

export function useGdsNotifications() {
  const context = useContext(GdsNotificationContext);
  if (!context) {
    throw new Error('useGdsNotifications must be used within GdsNotificationProvider.');
  }
  return context;
}

export function NotificationCenter({
  title = 'Notifications',
  emptyMessage = 'No active notifications.',
}: {
  title?: ReactNode;
  emptyMessage?: ReactNode;
}) {
  const { notifications, dismiss, clear } = useGdsNotifications();

  return (
    <NotificationCenterView
      title={title}
      emptyMessage={emptyMessage}
      notifications={notifications}
      onDismiss={dismiss}
      onClear={clear}
    />
  );
}
