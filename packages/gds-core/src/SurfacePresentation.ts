import type { CSSProperties } from 'react';

export type SurfacePresentation = 'inline' | 'centered' | 'fill';
export type SurfaceContentAlign = 'start' | 'center';
export type SurfaceContentJustify = 'start' | 'center';

export interface SurfacePresentationProps {
  presentation?: SurfacePresentation;
  minHeight?: number | string;
  contentAlign?: SurfaceContentAlign;
  contentJustify?: SurfaceContentJustify;
}

const toCssLength = (value?: number | string): string | undefined => {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
};

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

export function isPresentationMode(value: string | undefined): value is SurfacePresentation {
  return value === 'inline' || value === 'centered' || value === 'fill';
}
