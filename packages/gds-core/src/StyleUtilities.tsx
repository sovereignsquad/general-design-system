import type { CSSProperties, ReactNode } from 'react';
import { Box, ScrollArea } from '@mantine/core';
import type { BoxProps, ScrollAreaProps } from '@mantine/core';
import { gdsZIndexToken } from '@sovereignsquad/gds-theme';

/** Props for `OverflowContainer`; extends Mantine `ScrollAreaProps` minus `children`. */
export interface OverflowContainerProps extends Omit<ScrollAreaProps, 'children'> {
  children: ReactNode;
  /** Maximum height before the content begins to scroll. */
  maxHeight?: CSSProperties['maxHeight'];
  /** Minimum width of the scrollable content; defaults to 0. */
  minWidth?: CSSProperties['minWidth'];
  /** Accessible label for the scroll region. */
  label?: string;
}

/** Auto-sizing scroll area that caps height at `maxHeight` and scrolls overflow, with an optional accessible label. */
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

/** Props for `FloatingActionPlacement`; extends Mantine `BoxProps`. */
export interface FloatingActionPlacementProps extends BoxProps {
  children: ReactNode;
  /** Screen corner to anchor to; defaults to `'bottom-end'`. */
  position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
  /** Distance from both anchored edges; defaults to `'1rem'`. */
  offset?: string | number;
}

/** Fixed-position container that pins its children to a screen corner at the app z-index layer. */
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

/** Mantine `BoxProps` plus optional `children`, shared by the small box-based layout primitives below. */
export type GdsBoxWithChildrenProps = BoxProps & {
  children?: ReactNode;
};

/** Right-aligned inline cell using tabular figures so numeric columns align. */
export function NumericCell({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box component="span" ta="right" style={{ display: 'block', fontVariantNumeric: 'tabular-nums', ...style }} {...props}>
      {children}
    </Box>
  );
}

/** Visually hides its children while keeping them available to assistive technology. */
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

/** Flex child that may shrink below its content size and truncates overflow with an ellipsis. */
export function ClippedFlexChild({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', ...style }} {...props}>
      {children}
    </Box>
  );
}

/** Props for `LayeredSurfaceSlot`. */
export interface LayeredSurfaceSlotProps extends GdsBoxWithChildrenProps {
  /** Stacking layer: `base` (z-index 1), `raised` (2), or `overlay` (3). Defaults to `base`. */
  layer?: 'base' | 'raised' | 'overlay';
}

/** Relatively-positioned box that sets its z-index from the requested stacking layer. */
export function LayeredSurfaceSlot({ children, layer = 'base', style, ...props }: LayeredSurfaceSlotProps) {
  const zIndex = layer === 'overlay' ? 3 : layer === 'raised' ? 2 : 1;
  return (
    <Box style={{ position: 'relative', zIndex, ...style }} {...props}>
      {children}
    </Box>
  );
}

/** Box that applies the theme monospace font family to its children. */
export function MonospaceInputFrame({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box style={{ fontFamily: 'var(--mantine-font-family-monospace)', ...style }} {...props}>
      {children}
    </Box>
  );
}

/** Padded box with a leading accent border in the primary color, for inset or quoted content. */
export function SemanticInset({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box p="md" style={{ borderInlineStart: '3px solid var(--mantine-primary-color-filled)', ...style }} {...props}>
      {children}
    </Box>
  );
}

/** List-item box with vertical padding and a bottom divider, with list markers removed. */
export function ListItemSection({ children, style, ...props }: GdsBoxWithChildrenProps) {
  return (
    <Box component="li" py="sm" style={{ listStyle: 'none', borderBlockEnd: '1px solid var(--mantine-color-default-border)', ...style }} {...props}>
      {children}
    </Box>
  );
}
