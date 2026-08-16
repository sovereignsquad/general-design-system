import type { CSSProperties, ReactNode } from 'react';
import { resolveGdsAccentTokens } from '@sovereignsquad/gds-theme';
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';

/**
 * Icon-only categorical-accent badge: a flat circular disc, no text. `GdsBadge` deliberately
 * requires `label` (meaning never lives in color alone); this is the separate, narrow
 * component for a purely decorative or already-labelled-elsewhere category mark, not an
 * escape hatch on `GdsBadge` itself.
 */

// Non-DOM fallback only, mirroring GdsBadge's own accentToken(); the live value always
// follows the active theme via the var() reference below.
const resolvedAccentTokens = resolveGdsAccentTokens(undefined, 'light');

const accentBackground = (accent: GdsBadgeAccentName, shade: GdsBadgeAccentShade) =>
  `var(--gds-accent-${accent}-${shade}, ${resolvedAccentTokens[`--gds-accent-${accent}-${shade}`]})`;

const accentForeground = (accent: GdsBadgeAccentName) =>
  `var(--gds-accent-${accent}-on, #ffffff)`;

/** Props for {@link GdsIconBadge}. */
export interface GdsIconBadgeProps {
  /** Curated categorization color; same closed palette as `GdsBadge`'s `accent` axis. */
  accent: GdsBadgeAccentName;
  /** Within-accent differentiation step, darker only. Defaults to `'base'`. */
  shade?: GdsBadgeAccentShade;
  /** The motif: a canonical `GdsIcons` key, or any externally-sourced icon element. */
  icon: GdsIconKey | ReactNode;
  /** Accessible name. Omitted = decorative, the common case (meaning carried elsewhere, e.g. an adjacent label). */
  label?: string;
  /** Rendered diameter. Defaults to `'1.5em'`. */
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

/**
 * Flat circular disc in one of the curated accent colors, with a centered icon. Use for a
 * category marker where the label is redundant or carried by surrounding content — an
 * always-labelled category needs `GdsBadge` instead.
 *
 * @example
 * ```tsx
 * <GdsIconBadge accent="teal" icon="Habit" label="Fitness" />
 * <GdsIconBadge accent="ocean" shade="deep" icon="Location" />
 * ```
 */
export function GdsIconBadge({ accent, shade = 'base', icon, label, size = '1.5em', className, style }: GdsIconBadgeProps) {
  const fg = accentForeground(accent);
  return (
    <span
      data-gds-icon-badge=""
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        background: accentBackground(accent, shade),
        color: fg,
        ...style,
      }}
    >
      {isIconKey(icon) ? <GdsIcon icon={icon} size="65%" tone="default" decorative /> : icon}
    </span>
  );
}
