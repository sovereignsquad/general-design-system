import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';
import { GdsIcon, isGdsIconKey } from './icons';
import type { GdsIconKey } from './icons';

/**
 * Editorial/brand meaning labels, distinct from `StatusBadge` (system status). Variants map
 * to brand tokens; meaning is conveyed by label text, never color alone.
 */

/** Editorial/brand meaning conveyed by a {@link MeaningBadge}. */
export type MeaningVariant = 'attention' | 'validation' | 'info' | 'urgency';

/** Props for {@link MeaningBadge}; extends Mantine `BadgeProps` minus `color`/`children`. */
export interface MeaningBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  variant: MeaningVariant;
  /** Badge text; meaning is always carried by this label, never color alone. */
  label: ReactNode;
  /**
   * Leading icon. Pass a canonical `GdsIcons` key (e.g. `"Warning"`, `"Star"`)
   * to render the governed icon through `GdsIcon` — the preferred, dictionary-
   * enforced path. Any other `ReactNode` renders as given, for the rare case a
   * consumer must supply custom markup.
   */
  icon?: GdsIconKey | ReactNode;
}

interface MeaningTokens {
  bg: string;
  fg: string;
}

/*
 * Foreground is derived per preset and scheme for each fill. Literal fallbacks remain for
 * consumers on older token sets.
 */
const meaningTokens: Record<MeaningVariant, MeaningTokens> = {
  attention: {
    bg: 'var(--gds-brand-accent, var(--mantine-color-orange-5))',
    fg: 'var(--gds-brand-accent-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',
  },
  validation: {
    bg: 'var(--gds-badge-solid-success, var(--gds-state-success, var(--mantine-color-teal-6)))',
    fg: 'var(--gds-badge-solid-success-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',
  },
  info: {
    bg: 'var(--gds-bg-info-tag, #f1ece4)',
    fg: 'var(--gds-bg-info-tag-fg, var(--gds-text-primary, var(--mantine-color-dark-7)))',
  },
  urgency: {
    bg: 'var(--gds-brand-accent-tint, #f3ded5)',
    fg: 'var(--gds-brand-accent-tint-fg, var(--gds-text-primary, var(--mantine-color-dark-7)))',
  },
};

/**
 * Renders an editorial/brand meaning badge for the given `variant`; returns
 * `null` when `label` is empty. An `icon` given as a canonical `GdsIcons` key
 * renders through the governed `GdsIcon` (decorative, inheriting the badge's
 * text color); any other `ReactNode` renders as-is.
 */
export function MeaningBadge({ variant, label, icon, style, ...props }: MeaningBadgeProps) {
  if (!label) {
    return null;
  }

  const tokens = meaningTokens[variant] ?? meaningTokens.info;
  const leftSection =
    typeof icon === 'string' && isGdsIconKey(icon) ? <GdsIcon icon={icon} size="xs" /> : icon;

  return (
    <Badge
      variant="filled"
      leftSection={leftSection}
      {...props}
      style={{ backgroundColor: tokens.bg, color: tokens.fg, ...style }}
    >
      {label}
    </Badge>
  );
}
