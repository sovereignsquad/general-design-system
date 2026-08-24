import type { CSSProperties } from 'react';

/** How a surface positions its content: inline (normal flow), centered, or fill (flex-grow column). */
export type SurfacePresentation = 'inline' | 'centered' | 'fill';
/** Cross-axis alignment of surface content. */
export type SurfaceContentAlign = 'start' | 'center';
/** Main-axis justification of surface content. */
export type SurfaceContentJustify = 'start' | 'center';

/** Options controlling a surface's presentation mode, minimum height, and content alignment. */
export interface SurfacePresentationProps {
  /** Presentation mode. Defaults to "inline". */
  presentation?: SurfacePresentation;
  /** Minimum height; numbers are treated as pixels. */
  minHeight?: number | string;
  /** Cross-axis alignment. Defaults to "center" for non-inline modes. */
  contentAlign?: SurfaceContentAlign;
  /** Main-axis justification. Defaults to "center" for `centered`, "start" for `fill`. */
  contentJustify?: SurfaceContentJustify;
}

const toCssLength = (value?: number | string): string | undefined => {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
};

/**
 * Resolves presentation props into a React `CSSProperties` object. Every mode is a flex
 * column with a governed gap between stacked children — `inline` adds no alignment beyond
 * that, while `centered` and `fill` additionally apply the requested alignment and
 * justification.
 *
 * The gap is not optional: a body with no gap and multiple stacked children (the common case
 * for a section listing several cards, e.g. `ReferenceSection`/`SectionPanel` wrapping a
 * pattern-catalog family) rendered every child flush against the next with zero space between
 * them, site-wide — a single missing property produced the defect everywhere this component's
 * body held more than one child, confirmed live (0px measured between every pattern-demo card
 * on `/components`, versus the 20px `ReferenceLinkGrid` already used one layer up). Flex-column
 * with a gap is additive over the previous plain block flow — a lone child is unaffected, since
 * `gap` has no effect with nothing to space.
 */
export function resolveSurfacePresentationStyles(props: SurfacePresentationProps): CSSProperties {
  const {
    presentation = 'inline',
    minHeight,
    contentAlign,
    contentJustify,
  } = props;

  const base: CSSProperties = {
    minHeight: toCssLength(minHeight),
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--mantine-spacing-lg)',
  };

  if (presentation === 'inline') {
    return base;
  }

  const align = contentAlign ?? 'center';
  const justify = contentJustify ?? (presentation === 'centered' ? 'center' : 'start');

  return {
    ...base,
    ...(presentation === 'fill' ? { flex: 1 } : {}),
    alignItems: align === 'center' ? 'center' : 'flex-start',
    justifyContent: justify === 'center' ? 'center' : 'flex-start',
  };
}

/** Type guard: whether a string is a valid {@link SurfacePresentation} mode. */
export function isPresentationMode(value: string | undefined): value is SurfacePresentation {
  return value === 'inline' || value === 'centered' || value === 'fill';
}
