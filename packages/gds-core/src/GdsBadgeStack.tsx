import type { CSSProperties, ReactNode } from 'react';

/**
 * Badge composition/layering primitive (issue #488, part of epic #484).
 *
 * The Font Awesome layering model: a relatively-positioned square box sized by
 * `size` (default `1em`, so it scales with surrounding text), with each
 * {@link GdsBadgeStackLayer} absolutely positioned and centered inside it.
 * Corner layers (a count dot, a mini status mark) offset themselves with the
 * `corner` prop and scale via `--gds-badge-stack-corner-scale`.
 *
 * Forced-colors safe by construction: layers are inline SVG/DOM using
 * `currentColor` (never `background-image`, which forced-colors strips), and
 * the optional corner cutout is a CSS mask — a geometry operation that
 * survives palette flattening — rather than a ring painted in the page
 * background color, which visibly breaks over the gradient/hero surfaces GDS
 * vibe themes use.
 */

/** Corner position for a {@link GdsBadgeStackLayer}. */
export type GdsBadgeStackCorner = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** Props for {@link GdsBadgeStack}. */
export interface GdsBadgeStackProps {
  /** Box size (width = height); a number is px, a string is any CSS length. Defaults to `1em`. */
  size?: number | string;
  /**
   * Accessible name for the composed mark. When given, the stack renders
   * `role="img"` with this label; when omitted the whole stack is decorative
   * (`aria-hidden`) — pick one, never label individual layers.
   */
  label?: string;
  /** The {@link GdsBadgeStackLayer} children, painted in source order (last on top). */
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Props for {@link GdsBadgeStackLayer}. */
export interface GdsBadgeStackLayerProps {
  /** Anchors the layer to a corner of the stack box instead of centering it. */
  corner?: GdsBadgeStackCorner;
  /**
   * Scale relative to the stack box (e.g. `0.45` for a corner dot). Defaults
   * to `1` centered, `0.5` for corner layers.
   */
  scale?: number;
  /**
   * Cuts a circular hole out of THIS layer under the stack's corner layer, so
   * a corner dot separates from the base mark without a painted ring —
   * a mask survives gradient/image page backgrounds and forced-colors, a ring
   * painted in the page background color does not. Pass the same corner as
   * the overlapping corner layer.
   */
  cutout?: GdsBadgeStackCorner;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Square layering box for composed badge marks; children are
 * {@link GdsBadgeStackLayer} elements painted in source order. See module
 * docs for the accessibility contract (`label` names the whole mark).
 */
export function GdsBadgeStack({ size = '1em', label, children, className, style }: GdsBadgeStackProps) {
  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      data-gds-badge-stack=""
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ '--gds-badge-stack-size': resolvedSize, ...style } as CSSProperties}
    >
      {children}
    </span>
  );
}

/**
 * One layer of a {@link GdsBadgeStack}: centered by default, corner-anchored
 * with `corner`, scaled with `scale`, optionally masked with `cutout` so an
 * overlapping corner layer reads as a separate mark.
 */
export function GdsBadgeStackLayer({ corner, scale, cutout, children, className, style }: GdsBadgeStackLayerProps) {
  const resolvedScale = scale ?? (corner ? 0.5 : 1);
  return (
    <span
      data-gds-badge-stack-layer={corner ?? 'center'}
      data-gds-badge-stack-cutout={cutout || undefined}
      className={className}
      style={{ '--gds-badge-stack-layer-scale': String(resolvedScale), ...style } as CSSProperties}
    >
      {children}
    </span>
  );
}
