'use client';

import { notifications } from '@mantine/notifications';

export type GdsNotificationTone = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface GdsNotificationOptions {
  message: string;
  title?: string;
  tone?: GdsNotificationTone;
  autoClose?: number | false;
}

const toneColorMap: Record<GdsNotificationTone, string> = {
  success: 'teal',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  neutral: 'gray',
};

export function showGdsNotification({
  message,
  title,
  tone = 'info',
  autoClose,
}: GdsNotificationOptions) {
  notifications.show({
    message,
    title,
    color: toneColorMap[tone],
    autoClose,
  });
}
