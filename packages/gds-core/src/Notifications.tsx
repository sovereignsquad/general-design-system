'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { StateBlockVariant } from './StateBlock';
import { GdsIcons } from './icons';

export type GdsNotificationSeverity = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface GdsNotificationAction {
  id: string;
  label: string;
  onClick: () => void;
}

export interface GdsNotificationMessage {
  id: string;
  title: string;
  message?: ReactNode;
  severity?: GdsNotificationSeverity;
  autoCloseMs?: number | false;
  actions?: GdsNotificationAction[];
}

export interface InlineAlertProps {
  title: string;
  message?: ReactNode;
  severity?: GdsNotificationSeverity;
  action?: ReactNode;
}

export interface BannerNoticeProps extends InlineAlertProps {
  eyebrow?: ReactNode;
}

interface GdsNotificationContextValue {
  notifications: GdsNotificationMessage[];
  notify: (message: GdsNotificationMessage) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const notificationColorMap: Record<GdsNotificationSeverity, string> = {
  success: 'teal',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  neutral: 'gray',
};

function severityToStateVariant(severity: GdsNotificationSeverity): StateBlockVariant {
  if (severity === 'success') return 'success';
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'not-enough-data';
  if (severity === 'neutral') return 'disabled';
  return 'info';
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

export function InlineAlert({
  title,
  message,
  severity = 'info',
  action,
}: InlineAlertProps) {
  return (
    <Alert
      variant="light"
      color={notificationColorMap[severity]}
      title={title}
      icon={<GdsIcons.Info size="1rem" />}
      role={severity === 'error' ? 'alert' : 'status'}
    >
      <Stack gap="xs">
        {message ? <Text size="sm">{message}</Text> : null}
        {action}
      </Stack>
    </Alert>
  );
}

export function BannerNotice({
  eyebrow,
  title,
  message,
  severity = 'info',
  action,
}: BannerNoticeProps) {
  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            {eyebrow ? <Badge variant="light">{eyebrow}</Badge> : null}
            <Badge variant="light" color={notificationColorMap[severity]}>
              {severityToStateVariant(severity).replace('-', ' ')}
            </Badge>
          </Group>
          {action}
        </Group>
        <Title order={4}>{title}</Title>
        {message ? <Text size="sm" c="dimmed">{message}</Text> : null}
      </Stack>
    </Paper>
  );
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
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>{title}</Title>
          <Button size="xs" variant="subtle" onClick={clear} disabled={notifications.length === 0}>
            Clear all
          </Button>
        </Group>
        {notifications.length === 0 ? (
          <Text size="sm" c="dimmed">{emptyMessage}</Text>
        ) : (
          <Stack gap="sm">
            {notifications.map((item) => (
              <InlineAlert
                key={item.id}
                severity={item.severity}
                title={item.title}
                message={item.message}
                action={(
                  <Group gap="xs">
                    {item.actions?.map((action) => (
                      <Button key={action.id} size="xs" variant="default" onClick={action.onClick}>
                        {action.label}
                      </Button>
                    ))}
                    <Button size="xs" variant="subtle" onClick={() => dismiss(item.id)}>
                      Dismiss
                    </Button>
                  </Group>
                )}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
