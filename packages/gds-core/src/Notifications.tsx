import type { ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { Alert, Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { StateBlockVariant } from './StateBlock';
import { GdsIcons } from './icons';

/** Semantic severity of a notification, driving its color and accessibility role. */
export type GdsNotificationSeverity = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'loading';
/** Lifecycle status of a notification instance. */
export type GdsNotificationStatus = 'shown' | 'loading' | 'retrying' | 'dismissed' | 'failed' | 'succeeded';
/** How long a notification stays: auto-dismissing (`transient`), sticky (`persistent`/`critical`), or screen-reader-only (`announcement-only`). */
export type GdsNotificationPersistence = 'transient' | 'persistent' | 'critical' | 'announcement-only';
/** ARIA live-region politeness for announcing a notification (`off` suppresses announcement). */
export type GdsNotificationLivePolicy = 'polite' | 'assertive' | 'off';
/** How a new notification is reconciled against an existing one with the same key. */
export type GdsNotificationDedupePolicy = 'replace' | 'ignore' | 'append';
/** Kind of audit event emitted over a notification's lifecycle. */
export type GdsNotificationAuditEventType =
  | 'shown'
  | 'updated'
  | 'dismissed'
  | 'cleared'
  | 'action_clicked'
  | 'retry_started'
  | 'retry_failed'
  | 'retry_succeeded';

/** A user-actionable button attached to a notification. */
export interface GdsNotificationAction {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/** Retry behavior for a failed notification. */
export interface GdsNotificationRetryPolicy {
  /** Text for the retry button. Defaults to "Retry" at render time. */
  label?: string;
  /** Maximum number of retry attempts allowed. */
  maxAttempts?: number;
  /** Per-attempt timeout in milliseconds. */
  timeoutMs?: number;
  /** Invoked when the user triggers a retry; may be async. */
  onRetry: () => void | Promise<void>;
}

/** Delivery/lifecycle policy applied to a notification. */
export interface GdsNotificationPolicy {
  /** Auto-close delay in milliseconds, or `false` to keep it open until dismissed. */
  autoCloseMs?: number | false;
  dedupe?: GdsNotificationDedupePolicy;
  persistence?: GdsNotificationPersistence;
  live?: GdsNotificationLivePolicy;
}

/** A single notification and its full state, including actions, retry, and timestamps. */
export interface GdsNotificationMessage {
  id: string;
  /** Stable key used for deduplication across updates. */
  key?: string;
  title: string;
  message?: ReactNode;
  severity?: GdsNotificationSeverity;
  status?: GdsNotificationStatus;
  persistence?: GdsNotificationPersistence;
  live?: GdsNotificationLivePolicy;
  autoCloseMs?: number | false;
  actions?: GdsNotificationAction[];
  retry?: GdsNotificationRetryPolicy;
  /** Number of retry attempts made so far. */
  retryAttempts?: number;
  createdAt?: number;
  updatedAt?: number;
  /** When true, the notification is announced to assistive tech but not rendered visually. */
  announcementOnly?: boolean;
}

/** Immutable, privacy-safe (metadata-only) record of a notification lifecycle event, for logging/telemetry. */
export interface GdsNotificationAuditEvent {
  type: GdsNotificationAuditEventType;
  id: string;
  key?: string;
  severity: GdsNotificationSeverity;
  status: GdsNotificationStatus;
  timestamp: number;
  actionId?: string;
  retryAttempt?: number;
  /** Always `'metadata-only'` — audit events never carry notification content. */
  privacy: 'metadata-only';
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

function severityToStateVariant(severity: GdsNotificationSeverity): StateBlockVariant {
  if (severity === 'success') return 'success';
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'not-enough-data';
  if (severity === 'neutral') return 'disabled';
  return 'info';
}

/** Generates a unique notification id from a prefix (default `notification`), the current timestamp, and a random suffix. */
export function createGdsNotificationId(prefix = 'notification') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Resolves the ARIA live policy for a message: explicit `live` wins, else `announcement-only` is polite, error/warning are assertive, and everything else is polite. */
export function getGdsNotificationLivePolicy(message: Pick<GdsNotificationMessage, 'severity' | 'live' | 'persistence'>): GdsNotificationLivePolicy {
  if (message.live) return message.live;
  if (message.persistence === 'announcement-only') return 'polite';
  if (message.severity === 'error' || message.severity === 'warning') return 'assertive';
  return 'polite';
}

/** Builds a metadata-only `GdsNotificationAuditEvent` of the given type from a notification, stamping the current time and merging optional action/retry metadata. */
export function createGdsNotificationAuditEvent(
  type: GdsNotificationAuditEventType,
  notification: GdsNotificationMessage,
  metadata: Pick<GdsNotificationAuditEvent, 'actionId' | 'retryAttempt'> = {},
): GdsNotificationAuditEvent {
  return {
    type,
    id: notification.id,
    key: notification.key,
    severity: notification.severity ?? 'info',
    status: notification.status ?? 'shown',
    timestamp: Date.now(),
    privacy: 'metadata-only',
    ...metadata,
  };
}

/** Inline, in-flow alert built on Mantine's `Alert`. Uses `role="alert"` for errors and `role="status"` otherwise, with a matching ARIA live region. */
export function InlineAlert({
  title,
  message,
  severity = 'info',
  status,
  action,
}: InlineAlertProps) {
  const livePolicy = getGdsNotificationLivePolicy({ severity });
  return (
    <Alert
      variant="light"
      color={notificationColorMap[severity]}
      title={title}
      icon={<GdsIcons.Info size="1rem" />}
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={livePolicy === 'off' ? undefined : livePolicy}
      aria-atomic="true"
    >
      <Stack gap="xs">
        {status ? (
          <Badge variant="light" color={notificationColorMap[severity]} w="fit-content">
            {status.replace('-', ' ')}
          </Badge>
        ) : null}
        {message ? <Text size="sm">{message}</Text> : null}
        {action}
      </Stack>
    </Alert>
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
}: {
  notifications: GdsNotificationMessage[];
  onDismiss?: (id: string) => void;
  onClear?: () => void;
  onAction?: (notification: GdsNotificationMessage, action: GdsNotificationAction) => void;
  onRetry?: (notification: GdsNotificationMessage) => void;
  title?: ReactNode;
  emptyMessage?: ReactNode;
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
            Clear all
          </Button>
        </Group>
        {visibleNotifications.length === 0 ? (
          <Text size="sm" c="dimmed">{emptyMessage}</Text>
        ) : (
          <Stack gap="sm">
            {visibleNotifications.map((item) => (
              <InlineAlert
                key={item.id}
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
                        {item.status === 'retrying' ? 'Retrying' : (item.retry.label ?? 'Retry')}
                      </Button>
                    ) : null}
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
