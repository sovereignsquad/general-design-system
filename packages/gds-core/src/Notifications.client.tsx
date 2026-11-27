'use client';
import { gdsSafeAreaInset, gdsZIndexToken, useGdsTranslation } from '@sovereignsquad/gds-theme';
import { Box, Button, Group, Text } from '@mantine/core';
import { GdsStack } from './LayoutPrimitives';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { InlineAlert, NotificationCenterView } from './Notifications';
import { createGdsNotificationAuditEvent, getGdsNotificationLivePolicy } from './Notifications.shared';
import type { GdsNotificationPolicy } from './Notifications';
import type { GdsNotificationAction, GdsNotificationAuditEvent, GdsNotificationMessage } from './Notifications.shared';

interface GdsNotificationContextValue {
  notifications: GdsNotificationMessage[];
  notify: (message: GdsNotificationMessage, policy?: GdsNotificationPolicy) => string;
  updateNotification: (id: string, patch: Partial<GdsNotificationMessage>) => void;
  dismissNotification: (id: string) => void;
  runAction: (id: string, actionId: string) => void;
  runRetry: (id: string) => Promise<void>;
  dismiss: (id: string) => void;
  clear: () => void;
}

const GdsNotificationContext = createContext<GdsNotificationContextValue | null>(null);

/** Props for {@link GdsNotificationProvider}. */
export interface GdsNotificationProviderProps {
  children: ReactNode;
  /** Suppress the visible list; notifications become announcement-only for assistive tech. */
  disabled?: boolean;
  /** Default policy (persistence, live region, auto-close, dedupe) applied to each notification. */
  defaultPolicy?: GdsNotificationPolicy;
  /** Receives every notification lifecycle audit event. */
  onAuditEvent?: (event: GdsNotificationAuditEvent) => void;
}

function shouldAutoClose(message: GdsNotificationMessage) {
  if (message.autoCloseMs === false) return false;
  if (message.persistence === 'persistent' || message.persistence === 'critical' || message.persistence === 'announcement-only') return false;
  if (message.announcementOnly) return false;
  if (message.severity === 'error' || message.status === 'retrying' || message.status === 'loading') return false;
  return typeof message.autoCloseMs === 'number' && message.autoCloseMs > 0;
}

function normalizeNotification(message: GdsNotificationMessage, policy?: GdsNotificationPolicy): GdsNotificationMessage {
  const now = Date.now();
  return {
    ...message,
    severity: message.severity ?? 'info',
    status: message.status ?? (message.severity === 'loading' ? 'loading' : 'shown'),
    persistence: message.persistence ?? policy?.persistence ?? 'transient',
    live: message.live ?? policy?.live,
    autoCloseMs: message.autoCloseMs ?? policy?.autoCloseMs,
    createdAt: message.createdAt ?? now,
    updatedAt: now,
  };
}

function notificationMatches(item: GdsNotificationMessage, next: GdsNotificationMessage) {
  return item.id === next.id || (Boolean(next.key) && item.key === next.key);
}

/**
 * Context provider and controller for GDS notifications: exposes {@link useGdsNotifications}
 * to notify, update, and dismiss, and handles dedupe, auto-close timers, retry with
 * attempt limits, and audit events, mirroring announcements into an accessible live region.
 */
export function GdsNotificationProvider({
  children,
  disabled = false,
  defaultPolicy,
  onAuditEvent,
}: GdsNotificationProviderProps) {
  const [notifications, setNotifications] = useState<GdsNotificationMessage[]>([]);
  const [announcement, setAnnouncement] = useState<GdsNotificationMessage | null>(null);
  const timers = useRef<Map<string, number>>(new Map());
  const audit = useCallback((
    type: Parameters<typeof createGdsNotificationAuditEvent>[0],
    notification: GdsNotificationMessage,
    metadata: Partial<Pick<GdsNotificationAuditEvent, 'actionId' | 'retryAttempt'>> = {},
  ) => {
    onAuditEvent?.(createGdsNotificationAuditEvent(type, notification, metadata));
  }, [onAuditEvent]);

  const scheduleAutoClose = useCallback((message: GdsNotificationMessage) => {
    const existingTimer = timers.current.get(message.id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      timers.current.delete(message.id);
    }
    if (!shouldAutoClose(message)) return;

    const timer = window.setTimeout(() => {
      setNotifications((current) => {
        const target = current.find((item) => item.id === message.id);
        if (target) audit('dismissed', { ...target, status: 'dismissed' });
        return current.filter((item) => item.id !== message.id);
      });
      timers.current.delete(message.id);
    }, message.autoCloseMs as number);
    timers.current.set(message.id, timer);
  }, [audit]);

  const updateNotification = useCallback((id: string, patch: Partial<GdsNotificationMessage>) => {
    setNotifications((current) => current.map((item) => {
      if (item.id !== id) return item;
      const updated = normalizeNotification({ ...item, ...patch, id }, defaultPolicy);
      audit('updated', updated);
      scheduleAutoClose(updated);
      return updated;
    }));
  }, [audit, defaultPolicy, scheduleAutoClose]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => {
      const target = current.find((item) => item.id === id);
      if (target) audit('dismissed', { ...target, status: 'dismissed' });
      const existingTimer = timers.current.get(id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
        timers.current.delete(id);
      }
      return current.filter((item) => item.id !== id);
    });
  }, [audit]);

  const notify = useCallback((message: GdsNotificationMessage, policy?: GdsNotificationPolicy) => {
    const mergedPolicy = { ...defaultPolicy, ...policy };
    const next = normalizeNotification(message, mergedPolicy);
    audit('shown', next);
    // The provider's live region announces every notification, so visible renderers
    // (NotificationCenter, GdsToastViewport) render without live roles and each message is
    // announced once.
    setAnnouncement(next);

    if (disabled) return next.id;

    const dedupe = mergedPolicy.dedupe ?? 'replace';
    setNotifications((current) => {
      if (dedupe === 'ignore' && current.some((item) => notificationMatches(item, next))) return current;
      if (dedupe === 'append') return [...current, next];
      return [...current.filter((item) => !notificationMatches(item, next)), next];
    });
    scheduleAutoClose(next);
    return next.id;
  }, [audit, defaultPolicy, disabled, scheduleAutoClose]);

  const value = useMemo<GdsNotificationContextValue>(() => ({
    notifications,
    notify,
    updateNotification,
    dismissNotification,
    runAction: (id, actionId) => {
      const target = notifications.find((item) => item.id === id);
      const action = target?.actions?.find((item) => item.id === actionId);
      if (!target || !action || action.disabled) return;
      audit('action_clicked', target, { actionId });
      action.onClick();
    },
    runRetry: async (id) => {
      const target = notifications.find((item) => item.id === id);
      if (!target?.retry) return;

      const attempt = (target.retryAttempts ?? 0) + 1;
      const maxAttempts = target.retry.maxAttempts ?? 3;
      if (attempt > maxAttempts) {
        updateNotification(id, {
          status: 'failed',
          severity: 'error',
          persistence: 'persistent',
          message: target.message ?? 'Retry limit reached.',
        });
        audit('retry_failed', { ...target, status: 'failed', severity: 'error' }, { retryAttempt: attempt });
        return;
      }

      updateNotification(id, { status: 'retrying', severity: 'loading', retryAttempts: attempt, persistence: 'persistent' });
      audit('retry_started', { ...target, status: 'retrying', severity: 'loading' }, { retryAttempt: attempt });

      try {
        if (target.retry.timeoutMs && target.retry.timeoutMs > 0) {
          await Promise.race([
            target.retry.onRetry(),
            new Promise((_, reject) => {
              window.setTimeout(() => reject(new Error('GDS notification retry timed out.')), target.retry?.timeoutMs);
            }),
          ]);
        } else {
          await target.retry.onRetry();
        }
        updateNotification(id, { status: 'succeeded', severity: 'success', autoCloseMs: target.autoCloseMs ?? 3000 });
        audit('retry_succeeded', { ...target, status: 'succeeded', severity: 'success' }, { retryAttempt: attempt });
      } catch {
        updateNotification(id, { status: 'failed', severity: 'error', persistence: 'persistent', retryAttempts: attempt });
        audit('retry_failed', { ...target, status: 'failed', severity: 'error' }, { retryAttempt: attempt });
      }
    },
    dismiss: dismissNotification,
    clear: () => {
      notifications.forEach((item) => audit('cleared', item));
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
      setNotifications([]);
    },
  }), [audit, dismissNotification, notifications, notify, updateNotification]);

  const livePolicy = announcement ? getGdsNotificationLivePolicy(announcement) : 'polite';

  return (
    <GdsNotificationContext.Provider value={value}>
      {children}
      <span
        role={announcement?.severity === 'error' ? 'alert' : 'status'}
        aria-live={livePolicy === 'off' ? undefined : livePolicy}
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announcement ? `${announcement.title}${announcement.message && typeof announcement.message === 'string' ? ` ${announcement.message}` : ''}` : ''}
      </span>
    </GdsNotificationContext.Provider>
  );
}

/** Hook to access the notification controller; throws if used outside a {@link GdsNotificationProvider}. */
export function useGdsNotifications() {
  const context = useContext(GdsNotificationContext);
  if (!context) {
    throw new Error('useGdsNotifications must be used within GdsNotificationProvider.');
  }
  return context;
}

/** Renders the current notifications from context as a dismissible, retryable list with a clear-all control. */
export function NotificationCenter({
  title: titleProp,
  emptyMessage: emptyMessageProp,
}: {
  title?: ReactNode;
  emptyMessage?: ReactNode;
}) {
  const { t } = useGdsTranslation();
  const title = titleProp ?? t('gds.notifications.title', "Notifications");
  const emptyMessage = emptyMessageProp ?? t('gds.notifications.emptyMessage', "No active notifications.");

  const {
    notifications,
    dismissNotification,
    clear,
    runRetry,
    runAction,
  } = useGdsNotifications();

  return (
    <NotificationCenterView
      live={false}
      title={title}
      emptyMessage={emptyMessage}
      notifications={notifications}
      onDismiss={dismissNotification}
      onClear={clear}
      onAction={(notification: GdsNotificationMessage, action: GdsNotificationAction) => {
        runAction(notification.id, action.id);
      }}
      onRetry={(notification) => {
        void runRetry(notification.id);
      }}
    />
  );
}

/** Alias for {@link NotificationCenter}. */
export const GdsNotificationCenter = NotificationCenter;

/** Props for {@link GdsToastViewport}. */
export interface GdsToastViewportProps {
  /** Corner the stack is anchored to. Logical, so `end` is the left edge in right-to-left layouts. Defaults to `bottom-end`. */
  position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  /** Most toasts shown at once; older ones are counted in a summary line. Defaults to 3. */
  maxVisible?: number;
}

/**
 * Visible stack of the active notifications from {@link GdsNotificationProvider}, fixed to a
 * viewport corner above overlays (`gdsZIndexToken.max`) and clear of device safe areas. Items are
 * not live regions: the provider already announces each notification once. Each toast offers its
 * actions, retry and dismiss. `GdsToastProvider` renders one unless `viewport={false}`.
 */
export function GdsToastViewport({ position = 'bottom-end', maxVisible = 3 }: GdsToastViewportProps) {
  const { t } = useGdsTranslation();
  const { notifications, dismissNotification, runAction, runRetry } = useGdsNotifications();
  const visible = notifications.filter((item) => item.persistence !== 'announcement-only' && !item.announcementOnly);
  if (visible.length === 0) return null;
  const shown = visible.slice(-Math.max(1, maxVisible));
  const hiddenCount = visible.length - shown.length;
  const [vertical, horizontal] = position.split('-') as ['top' | 'bottom', 'start' | 'end'];
  const sideInset = `calc(var(--gds-space-md) + max(${gdsSafeAreaInset.left}, ${gdsSafeAreaInset.right}))`;
  const edgeInset = `calc(var(--gds-space-md) + ${vertical === 'top' ? gdsSafeAreaInset.top : gdsSafeAreaInset.bottom})`;

  return (
    <Box
      component="section"
      aria-label={t('gds.toast.regionLabel', 'Recent notifications')}
      data-gds-toast-viewport={position}
      style={{
        position: 'fixed',
        zIndex: gdsZIndexToken.max,
        [vertical]: edgeInset,
        insetInlineStart: horizontal === 'start' ? sideInset : undefined,
        insetInlineEnd: horizontal === 'end' ? sideInset : undefined,
        inlineSize: 'calc(100% - 2 * var(--gds-space-md))',
        display: 'flex',
        justifyContent: horizontal === 'end' ? 'flex-end' : 'flex-start',
        pointerEvents: 'none',
      }}
    >
      <GdsStack gap="sm" maxWidth="aside" style={{ inlineSize: '100%', pointerEvents: 'auto' }}>
        {hiddenCount > 0 ? (
          <Text size="xs" c="dimmed">{t('gds.toast.more', '{count} more').replace('{count}', String(hiddenCount))}</Text>
        ) : null}
        {shown.map((item) => (
          <InlineAlert
            key={item.id}
            live={false}
            severity={item.severity}
            status={item.status}
            title={item.title}
            message={item.message}
            action={(
              <Group gap="xs">
                {item.actions?.map((action) => (
                  <Button key={action.id} size="xs" variant="default" onClick={() => runAction(item.id, action.id)} disabled={action.disabled}>
                    {action.label}
                  </Button>
                ))}
                {item.retry ? (
                  <Button size="xs" variant="default" onClick={() => void runRetry(item.id)} disabled={item.status === 'retrying'}>
                    {item.status === 'retrying' ? t('gds.notifications.status.retrying', 'Retrying') : (item.retry.label ?? t('gds.notifications.retry', 'Retry'))}
                  </Button>
                ) : null}
                <Button size="xs" variant="subtle" onClick={() => dismissNotification(item.id)}>
                  {t('gds.notifications.dismiss', 'Dismiss')}
                </Button>
              </Group>
            )}
          />
        ))}
      </GdsStack>
    </Box>
  );
}
