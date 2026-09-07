import type { CSSProperties } from 'react';
import { ActionIcon } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsBadgeShapeCircle } from './badge-shapes';
import { GdsIcon } from './icons';

/** Props for {@link GdsNotificationBell}. */
export interface GdsNotificationBellProps {
  /** Shows the unread dot. Defaults to `false`. */
  unread?: boolean;
  /** Activation handler (open the notification surface). */
  onClick?: () => void;
  /** Accessible-name override for the read state; defaults to the locale pack copy. */
  label?: string;
  /** Accessible-name override for the unread state; defaults to the locale pack copy. */
  unreadLabel?: string;
  /** Disables the trigger. */
  disabled?: boolean;
}

// A filled currentColor SVG dot survives forced-colors mode (badge-shapes.ts); a
// background-color-painted span would not. The box-shadow ring is decorative
// separation only — it may be suppressed under forced-colors, which is fine
// because state is carried by the dot's presence plus the aria-label, never by
// the ring alone.
const dotStyle: CSSProperties = {
  position: 'absolute',
  top: '0.2em',
  right: '0.2em',
  width: '0.55em',
  height: '0.55em',
  color: 'var(--gds-badge-attention)',
  boxShadow: '0 0 0 0.15em var(--gds-bg-card)',
  borderRadius: '50%',
  pointerEvents: 'none',
};

/**
 * Notifications trigger affordance: a circular bell button, sized to the GDS
 * interactive-target floor, with an optional unread dot. This is the trigger
 * only — pair it with {@link GdsNotificationProvider}/{@link useGdsNotifications}
 * and open a {@link NotificationCenter} (in a popover/drawer of the consumer's
 * choosing) from `onClick`.
 *
 * @example
 * ```tsx
 * const { notifications } = useGdsNotifications();
 * <GdsNotificationBell unread={notifications.length > 0} onClick={openPanel} />
 * ```
 */
export function GdsNotificationBell({
  unread = false,
  onClick,
  label,
  unreadLabel,
  disabled,
}: GdsNotificationBellProps) {
  const { t } = useGdsTranslation();
  const resolvedLabel = label ?? t('gds.notificationBell.label', 'Notifications');
  const resolvedUnreadLabel = unreadLabel ?? t('gds.notificationBell.unreadLabel', 'Notifications (unread)');
  const size = 'var(--gds-control-height-md)';

  return (
    <ActionIcon
      variant="subtle"
      radius="xl"
      aria-label={unread ? resolvedUnreadLabel : resolvedLabel}
      disabled={disabled}
      onClick={onClick}
      data-gds-notification-bell={unread ? 'unread' : 'read'}
      style={{
        position: 'relative',
        width: size,
        height: size,
        minWidth: size,
        color: 'var(--gds-text-primary)',
      }}
    >
      <GdsIcon icon="Notifications" size="sm" />
      {unread ? (
        <span aria-hidden="true" data-gds-notification-bell-dot="" style={dotStyle}>
          <GdsBadgeShapeCircle size="100%" stroke={0} fill="currentColor" />
        </span>
      ) : null}
    </ActionIcon>
  );
}
