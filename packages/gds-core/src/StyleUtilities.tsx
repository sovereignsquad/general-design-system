import type { CSSProperties, ReactNode } from 'react';
import { Box, ScrollArea } from '@mantine/core';
import type { BoxProps, ScrollAreaProps } from '@mantine/core';
import { gdsZIndexToken } from '@sovereignsquad/gds-theme';

export interface OverflowContainerProps extends Omit<ScrollAreaProps, 'children'> {
  children: ReactNode;
  maxHeight?: CSSProperties['maxHeight'];
  minWidth?: CSSProperties['minWidth'];
  label?: string;
}

export function OverflowContainer({ children, maxHeight, minWidth = 0, label, ...props }: OverflowContainerProps) {
  return (
    <ScrollArea.Autosize
      mah={maxHeight}
      type="auto"
      aria-label={label}
      style={{ minWidth }}
      {...props}
    >
      {children}
    </ScrollArea.Autosize>
  );
}

export interface FloatingActionPlacementProps extends BoxProps {
  children: ReactNode;
  position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
  offset?: string | number;
}

export function FloatingActionPlacement({
  children,
  position = 'bottom-end',
  offset = '1rem',
  style,
  ...props
}: FloatingActionPlacementProps) {
  const [block, inline] = position.split('-') as ['bottom' | 'top', 'end' | 'start'];
  return (
    <Box
      style={{
        position: 'fixed',
        zIndex: gdsZIndexToken.app,
        [block]: offset,
        [inline === 'end' ? 'right' : 'left']: offset,
        ...style,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export type GdsBoxWithChildrenProps = BoxProps & {
  children?: ReactNode;
};

export function NumericCell({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box component="span" ta="right" style={{ display: 'block', fontVariantNumeric: 'tabular-nums', ...style }} {...props}>
      {children}
    </Box>
  );
}

export function VisuallyHidden({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box
      component="span"
      style={{
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export function ClippedFlexChild({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', ...style }} {...props}>
      {children}
    </Box>
  );
}

export interface LayeredSurfaceSlotProps extends GdsBoxWithChildrenProps {
  layer?: 'base' | 'raised' | 'overlay';
}

export function LayeredSurfaceSlot({ children, layer = 'base', style, ...props }: LayeredSurfaceSlotProps) {
  const zIndex = layer === 'overlay' ? 3 : layer === 'raised' ? 2 : 1;
  return (
    <Box style={{ position: 'relative', zIndex, ...style }} {...props}>
      {children}
    </Box>
  );
}

export function MonospaceInputFrame({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box style={{ fontFamily: 'var(--mantine-font-family-monospace)', ...style }} {...props}>
      {children}
    </Box>
  );
}

export function SemanticInset({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box p="md" style={{ borderInlineStart: '3px solid var(--mantine-primary-color-filled)', ...style }} {...props}>
      {children}
    </Box>
  );
}

export function ListItemSection({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box component="li" py="sm" style={{ listStyle: 'none', borderBlockEnd: '1px solid var(--mantine-color-default-border)', ...style }} {...props}>
      {children}
    </Box>
  );
}
