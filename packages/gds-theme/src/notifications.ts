'use client';

import { notifications } from '@mantine/notifications';

/** Semantic tone of a notification; each maps to a Mantine color. */
export type GdsNotificationTone = 'success' | 'error' | 'warning' | 'info' | 'neutral';

/** Options for `showGdsNotification`. */
export interface GdsNotificationOptions {
  /** Notification body text. */
  message: string;
  /** Optional heading. */
  title?: string;
  /** Semantic tone; defaults to `'info'`. */
  tone?: GdsNotificationTone;
  /** Auto-dismiss delay in milliseconds, or `false` to keep it open until dismissed. */
  autoClose?: number | false;
}

const toneColorMap: Record<GdsNotificationTone, string> = {
  success: 'teal',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  neutral: 'gray',
};

/** Shows a Mantine notification, mapping the GDS `tone` to the appropriate color. */
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
