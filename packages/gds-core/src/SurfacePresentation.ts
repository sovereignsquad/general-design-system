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
 * Resolves presentation props into a React `CSSProperties` object: `inline` yields
 * only a min-height, while `centered` and `fill` produce a flex column with the
 * requested alignment and justification.
 */
export function resolveSurfacePresentationStyles(props: SurfacePresentationProps): CSSProperties {
  const {
    presentation = 'inline',
    minHeight,
    contentAlign,
    contentJustify,
  } = props;

  if (presentation === 'inline') {
    return {
      minHeight: toCssLength(minHeight),
    };
  }

  const align = contentAlign ?? 'center';
  const justify = contentJustify ?? (presentation === 'centered' ? 'center' : 'start');

  if (presentation === 'fill') {
    return {
      minHeight: toCssLength(minHeight),
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      justifyContent: justify === 'center' ? 'center' : 'flex-start',
    };
  }

  return {
    minHeight: toCssLength(minHeight),
    display: 'flex',
    flexDirection: 'column',
    alignItems: align === 'center' ? 'center' : 'flex-start',
    justifyContent: justify === 'center' ? 'center' : 'flex-start',
  };
}

/** Type guard: whether a string is a valid {@link SurfacePresentation} mode. */
export function isPresentationMode(value: string | undefined): value is SurfacePresentation {
  return value === 'inline' || value === 'centered' || value === 'fill';
}
