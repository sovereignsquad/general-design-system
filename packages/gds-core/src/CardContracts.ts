export type GdsCardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GdsCardInteractiveMode = 'none' | 'surface-link' | 'surface-button' | 'flip';

export const gdsCardSizePaddingMap: Record<GdsCardSize, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
};

export const gdsCardTitleOrderMap: Record<GdsCardSize, 3 | 4 | 5 | 6> = {
  xs: 6,
  sm: 5,
  md: 4,
  lg: 4,
  xl: 3,
};
