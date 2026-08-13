import { ActionIcon } from '@mantine/core';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';
import type { ReactNode } from 'react';
import { GdsIcon } from './icons';

/**
 * Where a saved indicator is rendered, which decides its geometry — not its behaviour.
 *
 * `corner` composes onto a map pin's upper-right; `button` is the standalone control beside a
 * primary action. Both are the same labelled toggle: the corner form is a smaller STEP on the
 * control scale, not a less interactive thing, because a control a user can see is a control a
 * user will try to press.
 */
export type GdsSavedIndicatorMode = 'corner' | 'button';

/** Props for {@link GdsSavedIndicator}. */
export interface GdsSavedIndicatorProps {
  /** Whether the item is currently saved. */
  saved: boolean;
  /**
   * Accessible name for the action available when NOT saved, e.g. `"Save Riverside Swim Club"`.
   *
   * Consumer-supplied and required, following the same rule `GdsMapPinBadge`'s `label` follows:
   * GDS ships no English default, because a default is the string that survives into a
   * localised product. Naming the item matters as much as naming the action — a page of pins
   * otherwise announces "Save" a dozen times with nothing to tell them apart.
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
   *
   * Required by `mode="corner"`. The first version made the CALLER supply a positioned
   * wrapper, which pushed layout styling onto every consumer and was caught by the
   * playground's GDS-only gate: a primitive that needs an inline `style` around it to work is
   * an unfinished primitive. This follows `GdsCountBadge`'s existing `anchor` convention
   * rather than inventing a second one.
   */
  anchor?: ReactNode;
  /** Size of the anchored composition. Defaults to `'2.5em'`. */
  anchorSize?: string | number;
}

/**
 * Governed save/unsave toggle — a heart, rendered as a real labelled control.
 *
 * Issue 546. The map spec puts this in two places: a pin's upper-right corner and the preview
 * card's action row. Building it twice is how the two drift apart, so it ships once.
 *
 * It is a `button` with `aria-pressed`, never a bare icon or a decorative overlay. The
 * accessible name states the ACTION available rather than the current state, so a screen
 * reader announces what pressing will do; `aria-pressed` carries the state itself. Naming the
 * state in the label as well would announce it twice and contradict itself the moment the two
 * disagree.
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
  // The control scale, not the spec's literal 48px: `md` is the 44px step and it moves with the
  // density axis, so a compact theme keeps a coherent control size instead of one button
  // ignoring the theme (Rule 10). `corner` takes the `sm` step — a smaller STEP, not a magic
  // number, and still a real target rather than an icon-sized hit area.
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
      {/* Decorative: the button's own label carries the meaning, so the glyph must not repeat it. */}
      <GdsIcon icon="Favorite" size={mode === 'corner' ? 'xs' : 'sm'} />
    </ActionIcon>
  );

  if (mode !== 'corner' || !anchor) return control;

  // Composed through the governed badge stack, which already owns corner geometry — rather
  // than a bespoke absolute offset here, which would be a second corner model to keep in step
  // with the first.
  return (
    <GdsBadgeStack size={anchorSize} label={saved ? unsaveLabel : saveLabel}>
      <GdsBadgeStackLayer cutout="top-end">{anchor}</GdsBadgeStackLayer>
      <GdsBadgeStackLayer corner="top-end" scale={0.45}>{control}</GdsBadgeStackLayer>
    </GdsBadgeStack>
  );
}
