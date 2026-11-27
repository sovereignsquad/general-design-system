'use client';

import { useId, type ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { type GdsNotificationStatus, type GdsNotificationSeverity, type GdsNotificationMessage, type GdsNotificationAction, type GdsNotificationLivePolicy, type GdsNotificationPersistence, getGdsNotificationLivePolicy } from './Notifications.shared';

/** How a new notification is reconciled against an existing one with the same key. */
export type GdsNotificationDedupePolicy = 'replace' | 'ignore' | 'append';

/** Delivery/lifecycle policy applied to a notification. */
export interface GdsNotificationPolicy {
  /** Auto-close delay in milliseconds, or `false` to keep it open until dismissed. */
  autoCloseMs?: number | false;
  dedupe?: GdsNotificationDedupePolicy;
  persistence?: GdsNotificationPersistence;
  live?: GdsNotificationLivePolicy;
}

/** Props for the `InlineAlert` component. */
export interface InlineAlertProps {
  title: string;
  message?: ReactNode;
  /** Severity driving color and role. Defaults to `info`. */
  severity?: GdsNotificationSeverity;
  status?: GdsNotificationStatus;
  /** Optional action node rendered below the message. */
  action?: ReactNode;
  /**
   * Renders the alert as its own live region (`role="alert"` or `"status"`). Defaults to true.
   * Set false where a provider already announces the message, so it is announced once.
   */
  live?: boolean;
}

/** Props for the `BannerNotice` component. */
export interface BannerNoticeProps extends Omit<InlineAlertProps, 'title'> {
  /** Optional leading badge label shown before the severity badge. Ignored in the `compact` variant. */
  eyebrow?: ReactNode;
  /** Panel title. Required in the default `panel` variant; omit for `compact`. */
  title?: string;
  /**
   * `panel` (default): bordered card with title, optional eyebrow/status badge, and
   * message. `compact`: a one-line centered status strip with no title, for a page-level
   * status line that doesn't warrant a heading (issue 642).
   */
  variant?: 'panel' | 'compact';
}

const notificationColorMap: Record<GdsNotificationSeverity, string> = {
  success: 'teal',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  neutral: 'gray',
  loading: 'blue',
};

function statusLabel(status: GdsNotificationStatus, t: ReturnType<typeof useGdsTranslation>['t']): string {
  const labels: Record<GdsNotificationStatus, string> = {
    shown: '',
    loading: t('gds.notifications.status.loading', 'Loading'),
    retrying: t('gds.notifications.status.retrying', 'Retrying'),
    dismissed: t('gds.notifications.status.dismissed', 'Dismissed'),
    failed: t('gds.notifications.status.failed', 'Failed'),
    succeeded: t('gds.notifications.status.succeeded', 'Succeeded'),
  };
  return labels[status];
}

function severityLabel(severity: GdsNotificationSeverity, t: ReturnType<typeof useGdsTranslation>['t']): string {
  const labels: Record<GdsNotificationSeverity, string> = {
    success: t('gds.notifications.severity.success', 'Success'),
    error: t('gds.notifications.severity.error', 'Error'),
    warning: t('gds.notifications.severity.warning', 'Warning'),
    info: t('gds.notifications.severity.info', 'Info'),
    neutral: t('gds.notifications.severity.neutral', 'Notice'),
    loading: t('gds.notifications.severity.loading', 'In progress'),
  };
  return labels[severity];
}

const inlineAlertTone: Record<GdsNotificationSeverity, { bg: string; fg: string }> = {
  success: { bg: 'var(--gds-badge-soft-success)', fg: 'var(--gds-badge-soft-success-fg)' },
  error: { bg: 'var(--gds-badge-soft-danger)', fg: 'var(--gds-badge-soft-danger-fg)' },
  warning: { bg: 'var(--gds-badge-soft-warning)', fg: 'var(--gds-badge-soft-warning-fg)' },
  info: { bg: 'var(--gds-badge-soft-info)', fg: 'var(--gds-badge-soft-info-fg)' },
  neutral: { bg: 'var(--gds-badge-soft-neutral)', fg: 'var(--gds-badge-soft-neutral-fg)' },
  loading: { bg: 'var(--gds-badge-soft-info)', fg: 'var(--gds-badge-soft-info-fg)' },
};

/**
 * Inline, in-flow alert painted from the severity's soft badge pair, which is contrast-checked
 * per preset and scheme. As a live region (`live`, the default) it uses `role="alert"` for
 * errors and `role="status"` otherwise; with `live={false}` it is a labelled group.
 */
export function InlineAlert({
  title,
  message,
  severity = 'info',
  status,
  action,
  live = true,
}: InlineAlertProps) {
  const { t } = useGdsTranslation();
  const titleId = useId();
  const livePolicy = getGdsNotificationLivePolicy({ severity });
  const statusText = status && status !== 'shown' ? statusLabel(status, t) : null;
  const tone = inlineAlertTone[severity];
  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      role={live ? (severity === 'error' ? 'alert' : 'status') : 'group'}
      aria-live={live && livePolicy !== 'off' ? livePolicy : undefined}
      aria-atomic={live ? 'true' : undefined}
      aria-labelledby={titleId}
      data-gds-inline-alert={severity}
      style={{ background: tone.bg, color: tone.fg, ['--paper-border-color' as string]: 'var(--gds-border-subtle)' }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <GdsIcons.Info size="1rem" aria-hidden="true" style={{ flex: 'none', marginBlockStart: 'var(--gds-space-2xs)' }} />
        <Stack gap="xs" style={{ minWidth: 0, flex: 1 }}>
          <Text id={titleId} size="sm" fw={700} c="inherit">{title}</Text>
          {statusText ? (
            <Badge variant="light" color={notificationColorMap[severity]} w="fit-content">
              {statusText}
            </Badge>
          ) : null}
          {message ? <Text size="sm" c="inherit">{message}</Text> : null}
          {action}
        </Stack>
      </Group>
    </Paper>
  );
}

/**
 * Bordered banner notice, `panel` (default) or `compact`. `panel` shows an optional
 * eyebrow badge, a severity badge, a title, and the message, for page- or
 * section-level messages. `compact` is a one-line centered status strip with no
 * title/eyebrow/badge, for a status line that doesn't warrant a heading.
 */
export function BannerNotice({
  eyebrow,
  title,
  message,
  severity = 'info',
  action,
  variant = 'panel',
}: BannerNoticeProps) {
  const { t } = useGdsTranslation();
  const livePolicy = getGdsNotificationLivePolicy({ severity });

  if (variant === 'compact') {
    return (
      <Paper withBorder radius="lg" p="xs">
        <Group
          justify="center"
          align="center"
          gap="xs"
          wrap="nowrap"
          role={severity === 'error' ? 'alert' : 'status'}
          aria-live={livePolicy === 'off' ? undefined : livePolicy}
          aria-atomic="true"
        >
          <Text size="sm" fw={500} c={notificationColorMap[severity]} ta="center">{message}</Text>
          {action}
        </Group>
      </Paper>
    );
  }

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={livePolicy === 'off' ? undefined : livePolicy}
      aria-atomic="true"
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            {eyebrow ? <Badge variant="light">{eyebrow}</Badge> : null}
            <Badge variant="light" color={notificationColorMap[severity]}>
              {severityLabel(severity, t)}
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

/**
 * Governed notification-center panel rendering a list of `InlineAlert`s with
 * per-item actions, retry, and dismiss, plus a "Clear all" control. Filters out
 * announcement-only messages, which are surfaced to assistive tech elsewhere.
 */
export function NotificationCenterView({
  notifications,
  onDismiss,
  onClear,
  onAction,
  onRetry,
  title: titleProp,
  emptyMessage: emptyMessageProp,
  live = true,
}: {
  notifications: GdsNotificationMessage[];
  onDismiss?: (id: string) => void;
  onClear?: () => void;
  onAction?: (notification: GdsNotificationMessage, action: GdsNotificationAction) => void;
  onRetry?: (notification: GdsNotificationMessage) => void;
  title?: ReactNode;
  emptyMessage?: ReactNode;
  /** Renders each alert as its own live region; false when a provider already announces. Defaults to true. */
  live?: boolean;
}) {
  const { t } = useGdsTranslation();
  const title = titleProp ?? t('gds.notifications.title', "Notifications");
  const emptyMessage = emptyMessageProp ?? t('gds.notifications.emptyMessage', "No active notifications.");

  const visibleNotifications = notifications.filter((item) => item.persistence !== 'announcement-only' && !item.announcementOnly);

  return (
    <Paper withBorder radius="lg" p="md" role="region" aria-label={typeof title === 'string' ? title : 'Notifications'}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>{title}</Title>
          <Button size="xs" variant="subtle" onClick={onClear} disabled={visibleNotifications.length === 0 || !onClear}>
            {t('gds.notifications.clearAll', 'Clear all')}
          </Button>
        </Group>
        {visibleNotifications.length === 0 ? (
          <Text size="sm" c="dimmed">{emptyMessage}</Text>
        ) : (
          <Stack gap="sm">
            {visibleNotifications.map((item) => (
              <InlineAlert
                key={item.id}
                live={live}
                severity={item.severity}
                status={item.status}
                title={item.title}
                message={item.message}
                action={(
                  <Group gap="xs">
                    {item.actions?.map((action) => (
                      <Button
                        key={action.id}
                        size="xs"
                        variant="default"
                        onClick={() => onAction?.(item, action)}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </Button>
                    ))}
                    {item.retry ? (
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => onRetry?.(item)}
                        disabled={!onRetry || item.status === 'retrying'}
                      >
                        {item.status === 'retrying' ? t('gds.notifications.status.retrying', 'Retrying') : (item.retry.label ?? t('gds.notifications.retry', 'Retry'))}
                      </Button>
                    ) : null}
                    <Button size="xs" variant="subtle" onClick={() => onDismiss?.(item.id)} disabled={!onDismiss}>
                      {t('gds.notifications.dismiss', 'Dismiss')}
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
