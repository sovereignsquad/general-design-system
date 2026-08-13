import type { ReactNode } from 'react';
import { Badge, VisuallyHidden } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';
import { GdsBadgeStack, GdsBadgeStackLayer } from './GdsBadgeStack';

/**
 * GdsCountBadge (issue #490, part of epic #484): numeric/dot badge,
 * optionally anchored to a parent element's corner via the `GdsBadgeStack`
 * layering model.
 *
 * Announcement design: `role="status"` only announces *changes* to elements
 * already in the DOM — a badge conditionally mounted when `count > 0` never
 * announces its first appearance. So the live region here is **always
 * mounted**: at zero (without `showZero`) the visual pill hides but the
 * `role="status"` wrapper stays, and later count changes announce. Announced
 * word order is "{count} {label}" ("99+ notifications"), never the reverse.
 */

/** Semantic tone for the count pill; a closed union, no free color. */
export type GdsCountBadgeTone = 'danger' | 'info' | 'neutral';

interface GdsCountBadgeBaseProps extends Omit<BadgeProps, 'color' | 'children' | 'variant'> {
  /**
   * What is being counted, for assistive tech — e.g. `"notifications"`,
   * `"unread messages"`. Announced after the number: "99+ notifications".
   * Required: a bare number announces nothing useful.
   */
  label: string;
  /** Semantic tone; defaults to `danger` (the attention-count convention). */
  tone?: GdsCountBadgeTone;
  /**
   * Element to anchor to. When given, renders the anchor with the badge
   * layered on its top-end corner (Font Awesome corner model via
   * `GdsBadgeStack`); the stack box sizes to `anchorSize` (default `1.5em`).
   */
  anchor?: ReactNode;
  /** Stack box size when `anchor` is given. */
  anchorSize?: number | string;
}

/**
 * Props for {@link GdsCountBadge}: `value` (numeric) and `dot` (presence-only)
 * are mutually exclusive at the type level — a dot has no number to cap, so
 * `cap`/`showZero` don't typecheck with it.
 */
export type GdsCountBadgeProps =
  | (GdsCountBadgeBaseProps & {
      /** The count; clamped to a non-negative integer. */
      value: number;
      /** Maximum shown before displaying `{cap}+`; defaults to 99. */
      cap?: number;
      /** Keep the pill visible at zero; default hides it (live region stays mounted). */
      showZero?: boolean;
      dot?: never;
    })
  | (GdsCountBadgeBaseProps & {
      /** Presence-only dot: "there is something", without a number. */
      dot: true;
      value?: never;
      cap?: never;
      showZero?: never;
    });

/*
 * Issue 597. These used to be `--gds-state-danger-dark` etc. paired with a fixed near-white
 * foreground — a pairing that assumed the `-dark` suffix named a DARK COLOUR. It does not: it
 * names the dark-SCHEME value, and `--gds-state-info-dark` resolves to rgb(239, 242, 246).
 * The measured result on /patterns/feedback was 1.07:1 — white on white — and it had been
 * shipping, because a fixed foreground on a themeable background cannot be verified by
 * inspection.
 *
 * The `--gds-badge-solid-*` pairs are DERIVED per preset and per scheme against the surface
 * they land on, so the foreground cannot fall out of step with the fill.
 */
const toneColor: Record<GdsCountBadgeTone, { bg: string; fg: string }> = {
  danger: { bg: 'var(--gds-badge-solid-danger)', fg: 'var(--gds-badge-solid-danger-fg)' },
  info: { bg: 'var(--gds-badge-solid-info)', fg: 'var(--gds-badge-solid-info-fg)' },
  neutral: { bg: 'var(--gds-badge-solid-neutral)', fg: 'var(--gds-badge-solid-neutral-fg)' },
};

/**
 * Numeric or dot count badge with an always-mounted `role="status"` live
 * region (see module docs for why), optionally corner-anchored to `anchor`.
 *
 * @example
 * ```tsx
 * <GdsCountBadge value={126} cap={99} label="notifications" />
 * <GdsCountBadge dot label="unread messages" anchor={<GdsIcon icon="Notifications" size="lg" />} />
 * ```
 */
export function GdsCountBadge(props: GdsCountBadgeProps) {
  const { label, tone = 'danger', anchor, anchorSize = '1.5em', value, cap, showZero, dot, style, ...rest } =
    props as GdsCountBadgeBaseProps & {
      value?: number;
      cap?: number;
      showZero?: boolean;
      dot?: boolean;
    };

  const colors = toneColor[tone];
  const normalizedValue = dot ? undefined : Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
  const normalizedCap = Math.max(1, Math.floor(cap ?? 99));
  const display = dot ? '' : (normalizedValue as number) > normalizedCap ? `${normalizedCap}+` : String(normalizedValue);
  const visible = dot || showZero || (normalizedValue as number) > 0;
  const announcement = dot ? label : `${display} ${label}`;

  const pill = visible ? (
    <Badge
      data-gds-badge-fixed-tone="true"
      data-gds-count-badge={dot ? 'dot' : 'value'}
      variant="filled"
      size={dot ? 'xs' : rest.size}
      circle={dot || undefined}
      aria-hidden="true"
      {...rest}
      style={{ backgroundColor: colors.bg, color: colors.fg, border: 'none', ...style }}
    >
      {dot ? '​' : display}
    </Badge>
  ) : null;

  // The live region always mounts; its text — not the decorative pill — is
  // what assistive tech hears, in "{count} {label}" order.
  const liveRegion = (
    <span role="status">
      <VisuallyHidden>{visible ? announcement : ''}</VisuallyHidden>
    </span>
  );

  if (anchor) {
    return (
      <GdsBadgeStack size={anchorSize} label={visible ? announcement : label}>
        <GdsBadgeStackLayer cutout={visible ? 'top-end' : undefined}>{anchor}</GdsBadgeStackLayer>
        {pill ? (
          <GdsBadgeStackLayer corner="top-end" scale={dot ? 0.4 : 0.6}>
            {pill}
          </GdsBadgeStackLayer>
        ) : null}
        {liveRegion}
      </GdsBadgeStack>
    );
  }

  return (
    <span data-gds-count-badge-root="">
      {pill}
      {liveRegion}
    </span>
  );
}
