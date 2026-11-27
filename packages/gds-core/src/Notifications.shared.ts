import { type ReactNode } from 'react';

/** Semantic severity of a notification, driving its color and accessibility role. */
export type GdsNotificationSeverity = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'loading';

/** Lifecycle status of a notification instance. */
export type GdsNotificationStatus = 'shown' | 'loading' | 'retrying' | 'dismissed' | 'failed' | 'succeeded';

/** How long a notification stays: auto-dismissing (`transient`), sticky (`persistent`/`critical`), or screen-reader-only (`announcement-only`). */
export type GdsNotificationPersistence = 'transient' | 'persistent' | 'critical' | 'announcement-only';

/** ARIA live-region politeness for announcing a notification (`off` suppresses announcement). */
export type GdsNotificationLivePolicy = 'polite' | 'assertive' | 'off';

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
