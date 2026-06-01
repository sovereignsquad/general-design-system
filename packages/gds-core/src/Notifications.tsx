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

export function NotificationCenterView({
  notifications,
  onDismiss,
  onClear,
  title = 'Notifications',
  emptyMessage = 'No active notifications.',
}: {
  notifications: GdsNotificationMessage[];
  onDismiss?: (id: string) => void;
  onClear?: () => void;
  title?: ReactNode;
  emptyMessage?: ReactNode;
}) {
  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>{title}</Title>
          <Button size="xs" variant="subtle" onClick={onClear} disabled={notifications.length === 0 || !onClear}>
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
                    <Button size="xs" variant="subtle" onClick={() => onDismiss?.(item.id)} disabled={!onDismiss}>
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
