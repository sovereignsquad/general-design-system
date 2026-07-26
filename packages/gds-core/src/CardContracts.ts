/** Overall card size step, scaling padding and title level. */
export type GdsCardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Card content density, tuning padding, gap, and clamp lines. */
export type GdsCardDensity = 'compact' | 'comfortable' | 'spacious';
/** Card layout variant, including media placement and default media ratio. */
export type GdsCardVariant = 'default' | 'media-top' | 'media-left' | 'compact';
/** How the whole card surface behaves as an interactive target. */
export type GdsCardInteractiveMode = 'none' | 'surface-link' | 'surface-button' | 'flip';

/** Author-facing options passed to `resolveGdsCardContract`. */
export interface GdsCardContractOptions {
  /** Size step. Defaults to `md`. */
  size?: GdsCardSize;
  /** Content density. Defaults to `comfortable`. */
  density?: GdsCardDensity;
  /** Layout variant. Defaults to `default`. */
  variant?: GdsCardVariant;
  /** Shortcut that forces `sm`/`compact`/`compact`, overriding the individual props. */
  compact?: boolean;
}

/** Fully resolved card contract: every concrete token/value a card renderer needs, derived from the options. */
export interface GdsCardResolvedContract {
  size: GdsCardSize;
  density: GdsCardDensity;
  variant: GdsCardVariant;
  padding: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  titleOrder: 3 | 4 | 5 | 6;
  descriptionClamp: 2 | 3 | 4;
  mediaRatio: number;
  mediaPlacement: 'top' | 'left';
  actionWrap: 'wrap' | 'nowrap';
  minTouchTarget: number;
  dataAttributes: {
    'data-gds-card-size': GdsCardSize;
    'data-gds-card-density': GdsCardDensity;
    'data-gds-card-variant': GdsCardVariant;
  };
}

/** Baseline padding token for each card size (before density adjustment). */
export const gdsCardSizePaddingMap: Record<GdsCardSize, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
};

/** Padding token per (size, density) pair — the resolved contract's actual padding. */
export const gdsCardDensityPaddingMap: Record<GdsCardSize, Record<GdsCardDensity, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>> = {
  xs: { compact: 'xs', comfortable: 'xs', spacious: 'sm' },
  sm: { compact: 'xs', comfortable: 'sm', spacious: 'md' },
  md: { compact: 'sm', comfortable: 'md', spacious: 'lg' },
  lg: { compact: 'md', comfortable: 'lg', spacious: 'xl' },
  xl: { compact: 'lg', comfortable: 'xl', spacious: 'xl' },
};

/** Heading level (`<h3>`–`<h6>`) for the card title at each size. */
export const gdsCardTitleOrderMap: Record<GdsCardSize, 3 | 4 | 5 | 6> = {
  xs: 6,
  sm: 5,
  md: 4,
  lg: 4,
  xl: 3,
};

/** Internal gap token for each density. */
export const gdsCardGapMap: Record<GdsCardDensity, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  compact: 'sm',
  comfortable: 'md',
  spacious: 'lg',
};

/** Default media aspect ratio (width/height) for each variant. */
export const gdsCardMediaRatioMap: Record<GdsCardVariant, number> = {
  default: 4 / 3,
  'media-top': 4 / 3,
  'media-left': 1,
  compact: 16 / 9,
};

/** Resolves card options into a full `GdsCardResolvedContract` of concrete tokens (padding, gap, title level, clamp, media ratio/placement, touch target, data attributes); `compact` forces the `sm`/`compact`/`compact` preset. */
export function resolveGdsCardContract({
  size = 'md',
  density = 'comfortable',
  variant = 'default',
  compact = false,
}: GdsCardContractOptions = {}): GdsCardResolvedContract {
  const resolvedSize = compact ? 'sm' : size;
  const resolvedDensity = compact ? 'compact' : density;
  const resolvedVariant = compact ? 'compact' : variant;

  return {
    size: resolvedSize,
    density: resolvedDensity,
    variant: resolvedVariant,
    padding: gdsCardDensityPaddingMap[resolvedSize][resolvedDensity],
    gap: gdsCardGapMap[resolvedDensity],
    titleOrder: gdsCardTitleOrderMap[resolvedSize],
    descriptionClamp: resolvedDensity === 'compact' ? 2 : resolvedSize === 'xl' ? 4 : 3,
    mediaRatio: gdsCardMediaRatioMap[resolvedVariant],
    mediaPlacement: resolvedVariant === 'media-left' ? 'left' : 'top',
    actionWrap: resolvedDensity === 'compact' ? 'nowrap' : 'wrap',
    minTouchTarget: resolvedDensity === 'compact' ? 40 : 44,
    dataAttributes: {
      'data-gds-card-size': resolvedSize,
      'data-gds-card-density': resolvedDensity,
      'data-gds-card-variant': resolvedVariant,
    },
  };
}
