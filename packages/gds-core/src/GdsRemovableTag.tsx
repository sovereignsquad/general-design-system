import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';
import { GdsIcon } from './icons';

/**
 * GdsRemovableTag (issue #491, part of epic #484): the removable filter
 * token, consolidating the four formerly-independent inline copies
 * (`ListingPrimitives`' ActiveFilterChips, `DataToolbar`, `BrowseSurface`,
 * `gds-admin`'s ResponsiveDataView) into one shared, tested component.
 *
 * The whole chip is a real `<button>` (Mantine Badge's polymorphic
 * `component="button"`) with an explicit accessible name — the keyboard
 * contract established when the four copies' `<div onClick>` bug was fixed
 * (#478). Activating it (click, Enter, or Space) fires `onRemove`.
 */

/** Semantic tone for a {@link GdsRemovableTag}; a closed union, no free color. */
export type GdsRemovableTagTone = 'neutral' | 'info' | 'success' | 'warning';

/** Props for {@link GdsRemovableTag}. */
export interface GdsRemovableTagProps extends Omit<BadgeProps, 'color' | 'children'> {
  /** Tag text — what filter/value this token represents. */
  label: ReactNode;
  /** Fired when the tag is activated (click / Enter / Space). */
  onRemove: () => void;
  /**
   * Accessible name for the remove action, e.g. `"Remove filter: Music"`.
   * Required and consumer-supplied so the string is localized where the
   * consumer's copy lives — the component bakes in no language.
   */
  removeLabel: string;
  /** Semantic tone; defaults to `neutral`. */
  tone?: GdsRemovableTagTone;
}

const toneColorMap: Record<GdsRemovableTagTone, string> = {
  neutral: 'gray',
  info: 'blue',
  success: 'green',
  warning: 'yellow',
};

/**
 * Removable filter token: a keyboard-operable Badge-as-button whose whole
 * surface removes the tag, with a trailing canonical Close icon.
 *
 * @example
 * ```tsx
 * <GdsRemovableTag label="Music" removeLabel="Remove filter: Music" onRemove={() => clear('music')} />
 * ```
 */
export function GdsRemovableTag({ label, onRemove, removeLabel, tone = 'neutral', ...props }: GdsRemovableTagProps) {
  return (
    <Badge
      component="button"
      type="button"
      data-gds-badge-fixed-tone="true"
      data-gds-removable-tag=""
      color={toneColorMap[tone]}
      variant="light"
      aria-label={removeLabel}
      onClick={onRemove}
      rightSection={<GdsIcon icon="Close" size="xs" />}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {label}
    </Badge>
  );
}
