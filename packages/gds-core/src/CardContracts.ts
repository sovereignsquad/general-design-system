export type GdsCardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GdsCardDensity = 'compact' | 'comfortable' | 'spacious';
export type GdsCardVariant = 'default' | 'media-top' | 'media-left' | 'compact';
export type GdsCardInteractiveMode = 'none' | 'surface-link' | 'surface-button' | 'flip';

export interface GdsCardContractOptions {
  size?: GdsCardSize;
  density?: GdsCardDensity;
  variant?: GdsCardVariant;
  compact?: boolean;
}

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

export const gdsCardSizePaddingMap: Record<GdsCardSize, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
};

export const gdsCardDensityPaddingMap: Record<GdsCardSize, Record<GdsCardDensity, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>> = {
  xs: { compact: 'xs', comfortable: 'xs', spacious: 'sm' },
  sm: { compact: 'xs', comfortable: 'sm', spacious: 'md' },
  md: { compact: 'sm', comfortable: 'md', spacious: 'lg' },
  lg: { compact: 'md', comfortable: 'lg', spacious: 'xl' },
  xl: { compact: 'lg', comfortable: 'xl', spacious: 'xl' },
};

export const gdsCardTitleOrderMap: Record<GdsCardSize, 3 | 4 | 5 | 6> = {
  xs: 6,
  sm: 5,
  md: 4,
  lg: 4,
  xl: 3,
};

export const gdsCardGapMap: Record<GdsCardDensity, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  compact: 'sm',
  comfortable: 'md',
  spacious: 'lg',
};

export const gdsCardMediaRatioMap: Record<GdsCardVariant, number> = {
  default: 4 / 3,
  'media-top': 4 / 3,
  'media-left': 1,
  compact: 16 / 9,
};

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
