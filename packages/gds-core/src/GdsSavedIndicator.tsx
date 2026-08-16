import { ActionIcon } from '@mantine/core';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';
import type { ReactNode } from 'react';
import { GdsIcon } from './icons';

/**
 * Render location; determines geometry only, not behavior.
 *
 * `corner` composes onto a map pin's upper-right; `button` is the standalone control.
 */
export type GdsSavedIndicatorMode = 'corner' | 'button';

/** Props for {@link GdsSavedIndicator}. */
export interface GdsSavedIndicatorProps {
  /** Whether the item is currently saved. */
  saved: boolean;
  /**
   * Accessible name for the action when not saved, e.g. `"Save Riverside Swim Club"`.
   * Required; no default is shipped.
   */
  saveLabel: string;
  /** Accessible name for the action available when saved, e.g. `"Remove Riverside Swim Club from saved"`. */
  unsaveLabel: string;
  /** Called with the next state when the control is activated. */
  onSaveChange?: (saved: boolean) => void;
  /** Geometry. Defaults to `'button'`. */
  mode?: GdsSavedIndicatorMode;
  /** Disables the control. */
  disabled?: boolean;
  /**
   * Element the corner form anchors to — a pin, a card, a thumbnail.
   * Required by `mode="corner"`. Follows `GdsCountBadge`'s `anchor` convention.
   */
  anchor?: ReactNode;
  /** Size of the anchored composition. Defaults to `'2.5em'`. */
  anchorSize?: string | number;
}

/**
 * Governed save/unsave toggle, rendered as a labelled `button`.
 *
 * The accessible name states the available action, not the current state; `aria-pressed`
 * carries the state.
 *
 * @example
 * ```tsx
 * <GdsSavedIndicator
 *   saved={isSaved}
 *   onSaveChange={setSaved}
 *   saveLabel="Save Riverside Swim Club"
 *   unsaveLabel="Remove Riverside Swim Club from saved"
 * />
 * ```
 */
export function GdsSavedIndicator({
  saved, saveLabel, unsaveLabel, onSaveChange, mode = 'button', disabled, anchor, anchorSize = '2.5em',
}: GdsSavedIndicatorProps) {
  // Control-height scale (md=44px, corner=sm), not a literal pixel value.
  const size = `var(--gds-control-height-${mode === 'corner' ? 'sm' : 'md'})`;

  const control = (
    <ActionIcon
      variant={saved ? 'filled' : 'default'}
      aria-pressed={saved}
      aria-label={saved ? unsaveLabel : saveLabel}
      disabled={disabled}
      onClick={() => onSaveChange?.(!saved)}
      radius="xl"
      data-gds-saved-indicator={mode}
      style={{ width: size, height: size, minWidth: size }}
    >
      {/* Decorative icon; aria-label carries the meaning. */}
      <GdsIcon icon="Favorite" size={mode === 'corner' ? 'xs' : 'sm'} />
    </ActionIcon>
  );

  if (mode !== 'corner' || !anchor) return control;

  // Uses GdsBadgeStack for corner geometry rather than a bespoke offset.
  return (
    <GdsBadgeStack size={anchorSize} label={saved ? unsaveLabel : saveLabel}>
      <GdsBadgeStackLayer cutout="top-end">{anchor}</GdsBadgeStackLayer>
      <GdsBadgeStackLayer corner="top-end" scale={0.45}>{control}</GdsBadgeStackLayer>
    </GdsBadgeStack>
  );
}
