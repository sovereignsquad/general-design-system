import { forwardRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { Box } from '@mantine/core';
import type { BoxProps } from '@mantine/core';

/** Breakpoint keys used across the layout primitives, from `base` (no min-width) up through `xl`. */
export type GdsLayoutBreakpoint = 'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Spacing-scale token for gap/padding/margin. `0`/`none` is zero; `xs`–`xl` map to Mantine spacing vars; `2xl` is 1.5× `xl`. */
export type GdsLayoutToken = 0 | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
/** Width/size token: the spacing tokens plus named content widths (`aside`, `content`, `narrow`, `page`, `wide`) and `full` (100%). */
export type GdsLayoutSize = Exclude<GdsLayoutToken, 0> | 'aside' | 'content' | 'narrow' | 'page' | 'wide' | 'full';
/** Either a single value applied at all breakpoints, or a partial per-breakpoint map. */
export type GdsResponsiveValue<T> = T | Partial<Record<GdsLayoutBreakpoint, T>>;
/** Cross-axis (`align-items`) alignment keyword. */
export type GdsLayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
/** Main-axis (`justify-content`) distribution keyword. */
export type GdsLayoutJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
/** CSS `overflow` keyword accepted by the layout primitives. */
export type GdsLayoutOverflow = 'visible' | 'hidden' | 'auto' | 'clip';
/** Flex-wrap keyword (`reverse` maps to `wrap-reverse`). */
export type GdsLayoutWrap = 'wrap' | 'nowrap' | 'reverse';

/** Normalized form of a `GdsResponsiveValue`: a base value plus a map of breakpoint-specific overrides. */
export interface GdsResponsiveResolution<T> {
  base?: T;
  breakpoints: Partial<Record<Exclude<GdsLayoutBreakpoint, 'base'>, T>>;
}

/** Shared props for every layout primitive: token-based, responsive spacing/alignment on a governed `Box`. */
export interface GdsLayoutPrimitiveBaseProps extends Omit<BoxProps, 'align' | 'children' | 'component' | 'display' | 'gap' | 'justify' | 'm' | 'maw' | 'miw' | 'p' | 'style'> {
  children?: ReactNode;
  /** Element or component to render as, via Mantine's polymorphic `component`. Defaults to `div`. */
  component?: ElementType;
  style?: CSSProperties;
  /** Space between children, as a spacing token; may vary per breakpoint. */
  gap?: GdsResponsiveValue<GdsLayoutToken>;
  /** Inner padding, as a spacing token; may vary per breakpoint. */
  padding?: GdsResponsiveValue<GdsLayoutToken>;
  /** Outer margin, as a spacing token; may vary per breakpoint. */
  margin?: GdsResponsiveValue<GdsLayoutToken>;
  /** Cross-axis alignment; may vary per breakpoint. */
  align?: GdsResponsiveValue<GdsLayoutAlign>;
  /** Main-axis distribution; may vary per breakpoint. */
  justify?: GdsResponsiveValue<GdsLayoutJustify>;
  overflow?: GdsLayoutOverflow;
  /** Minimum-width behavior: `zero` (min-width:0, the flex/grid overflow fix), `content` (max-content), or `auto`. */
  minWidth?: 'auto' | 'zero' | 'content';
  /** Maximum width, as a size token; may vary per breakpoint. */
  maxWidth?: GdsResponsiveValue<GdsLayoutSize>;
}

/** General-purpose layout box with a configurable `display` mode. */
export interface GdsBoxProps extends GdsLayoutPrimitiveBaseProps {
  display?: GdsResponsiveValue<'block' | 'flex' | 'grid' | 'inline-flex' | 'inline-grid' | 'contents'>;
}

/** Vertical flex stack. */
export interface GdsStackProps extends GdsLayoutPrimitiveBaseProps {
  /** Reverse the visual order of children (`column-reverse`). Defaults to `false`. */
  reverse?: boolean;
}

/** Horizontal flex row with configurable wrapping. */
export interface GdsInlineProps extends GdsLayoutPrimitiveBaseProps {
  /** Wrapping behavior; may vary per breakpoint. Defaults to `wrap`. */
  wrap?: GdsResponsiveValue<GdsLayoutWrap>;
}

/** Inline row preset that spreads its children apart (`justify` defaults to `between`). */
export interface GdsClusterProps extends GdsInlineProps {}

/** Equal-width auto-column CSS grid. */
export interface GdsGridProps extends GdsLayoutPrimitiveBaseProps {
  /** Fixed column count, or `auto-fit`/`auto-fill` for responsive track packing; may vary per breakpoint. */
  columns?: GdsResponsiveValue<number | 'auto-fit' | 'auto-fill'>;
  /** Minimum track width used with `auto-fit`/`auto-fill`. */
  minColumnWidth?: GdsLayoutSize;
}

/** Named column-grid track container that `GdsColumnGridItem` spans against. */
export interface GdsColumnGridProps extends GdsLayoutPrimitiveBaseProps {
  /** Total number of tracks in the grid — the same number `GdsColumnGridItem`'s `span` counts against. Defaults to 12, matching the most common column-grid convention (Carbon's 2x Grid, Ant Design's `Grid`). */
  columns?: GdsResponsiveValue<number>;
}

/** A single item within a `GdsColumnGrid`. */
export interface GdsColumnGridItemProps extends GdsLayoutPrimitiveBaseProps {
  /** How many of the parent's tracks this item spans. Omit to let the browser's native CSS grid auto-placement apply (one track). */
  span?: GdsResponsiveValue<number>;
  /** Which track this item starts at (1-indexed), for explicit placement instead of auto-flow. */
  start?: GdsResponsiveValue<number>;
}

/** Two-column split that collapses to a single stacked column below a breakpoint. */
export interface GdsSplitProps extends GdsLayoutPrimitiveBaseProps {
  /** Relative width of the two columns. Defaults to `1:1`. */
  ratio?: '1:1' | '2:1' | '1:2' | '3:2' | '2:3';
  /** Breakpoint below which the split stacks vertically. Defaults to `md`. */
  collapseBelow?: Exclude<GdsLayoutBreakpoint, 'base'>;
}

/** Sidebar-plus-content layout that collapses to a single column below a breakpoint. */
export interface GdsSidebarProps extends GdsLayoutPrimitiveBaseProps {
  /** Which side the fixed-width sidebar sits on. Defaults to `start`. */
  side?: 'start' | 'end';
  /** Width of the sidebar track. Defaults to `content`. */
  sidebarWidth?: GdsLayoutSize;
  /** Breakpoint below which the layout stacks vertically. Defaults to `md`. */
  collapseBelow?: Exclude<GdsLayoutBreakpoint, 'base'>;
}

/** Full-bleed wrapper that pulls its content outward with negative inline margins. */
export interface GdsBleedProps extends GdsLayoutPrimitiveBaseProps {
  /** Amount to bleed outward, as a spacing token; may vary per breakpoint. Defaults to `md`. */
  bleed?: GdsResponsiveValue<GdsLayoutToken>;
}

/** Centered, max-width content container. */
export interface GdsContainerProps extends GdsLayoutPrimitiveBaseProps {
  /** Maximum content width, as a size token; may vary per breakpoint. Defaults to `page`. */
  size?: GdsResponsiveValue<GdsLayoutSize>;
  /** Horizontally center the container with `auto` inline margins. Defaults to `true`. */
  center?: boolean;
}

const breakpointPixels: Record<Exclude<GdsLayoutBreakpoint, 'base'>, number> = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const GdsMantineBox = Box as unknown as ElementType;

const spacingTokenMap: Record<Exclude<GdsLayoutToken, 0>, string> = {
  none: '0',
  xs: 'var(--mantine-spacing-xs)',
  sm: 'var(--mantine-spacing-sm)',
  md: 'var(--mantine-spacing-md)',
  lg: 'var(--mantine-spacing-lg)',
  xl: 'var(--mantine-spacing-xl)',
  '2xl': 'calc(var(--mantine-spacing-xl) * 1.5)',
};

const sizeTokenMap: Record<GdsLayoutSize, string> = {
  none: '0',
  xs: 'var(--mantine-spacing-xs)',
  sm: 'var(--mantine-spacing-sm)',
  md: 'var(--mantine-spacing-md)',
  lg: 'var(--mantine-spacing-lg)',
  xl: 'var(--mantine-spacing-xl)',
  '2xl': 'calc(var(--mantine-spacing-xl) * 1.5)',
  aside: '18rem',
  content: '42rem',
  narrow: '56rem',
  page: '72rem',
  wide: '88rem',
  full: '100%',
};

const alignMap: Record<GdsLayoutAlign, CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const justifyMap: Record<GdsLayoutJustify, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const wrapMap: Record<GdsLayoutWrap, CSSProperties['flexWrap']> = {
  wrap: 'wrap',
  nowrap: 'nowrap',
  reverse: 'wrap-reverse',
};

function isResponsiveRecord<T>(value: GdsResponsiveValue<T> | undefined): value is Partial<Record<GdsLayoutBreakpoint, T>> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

/** Splits a `GdsResponsiveValue` into its base value and per-breakpoint overrides; a bare value becomes the base with no overrides. */
export function normalizeGdsResponsiveValue<T>(value: GdsResponsiveValue<T> | undefined): GdsResponsiveResolution<T> {
  if (value === undefined) {
    return { breakpoints: {} };
  }
  if (!isResponsiveRecord(value)) {
    return { base: value, breakpoints: {} };
  }
  const { base, xs, sm, md, lg, xl } = value;
  return { base, breakpoints: { xs, sm, md, lg, xl } };
}

function resolveSpacing(value: GdsLayoutToken | undefined) {
  if (value === undefined) return undefined;
  if (value === 0) return '0';
  return spacingTokenMap[value];
}

function resolveSize(value: GdsLayoutSize | undefined) {
  if (value === undefined) return undefined;
  return sizeTokenMap[value];
}

function hashLayoutSignature(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return `gds-layout-${Math.abs(hash).toString(36)}`;
}

function responsiveCss<T>(
  className: string,
  property: string,
  value: GdsResponsiveValue<T> | undefined,
  resolver: (value: T) => string | number | undefined,
) {
  const normalized = normalizeGdsResponsiveValue(value);
  const rules = Object.entries(normalized.breakpoints)
    .filter((entry): entry is [Exclude<GdsLayoutBreakpoint, 'base'>, T] => entry[1] !== undefined)
    .map(([breakpoint, nextValue]) => {
      const resolved = resolver(nextValue);
      return resolved === undefined ? '' : `@media (min-width: ${breakpointPixels[breakpoint]}px){.${className}{${property}:${resolved};}}`;
    })
    .filter(Boolean);
  return rules.join('');
}

function baseValue<T>(value: GdsResponsiveValue<T> | undefined, fallback: T): T {
  const normalized = normalizeGdsResponsiveValue(value);
  return normalized.base ?? fallback;
}

function composeResponsiveClass(signature: unknown) {
  return hashLayoutSignature(JSON.stringify(signature));
}

function renderResponsiveStyle(css: string) {
  return css ? <style data-gds-layout>{css}</style> : null;
}

/** Resolves the base (non-responsive) inline style object for a layout primitive from its token props, merging any explicit `style` last. */
export function resolveGdsLayoutStyle({
  display = 'block',
  gap,
  padding,
  margin,
  align,
  justify,
  overflow,
  minWidth,
  maxWidth,
  style,
}: Pick<GdsBoxProps, 'display' | 'gap' | 'padding' | 'margin' | 'align' | 'justify' | 'overflow' | 'minWidth' | 'maxWidth' | 'style'>): CSSProperties {
  return {
    boxSizing: 'border-box',
    display: baseValue(display, 'block'),
    gap: resolveSpacing(baseValue(gap, 'none')),
    padding: resolveSpacing(baseValue(padding, 'none')),
    margin: resolveSpacing(baseValue(margin, 'none')),
    alignItems: alignMap[baseValue(align, 'stretch')],
    justifyContent: justifyMap[baseValue(justify, 'start')],
    overflow,
    minWidth: minWidth === 'zero' ? 0 : minWidth === 'content' ? 'max-content' : undefined,
    maxWidth: resolveSize(baseValue(maxWidth, 'full')),
    ...style,
  };
}

function sharedResponsiveCss(className: string, props: Pick<GdsBoxProps, 'display' | 'gap' | 'padding' | 'margin' | 'align' | 'justify' | 'maxWidth'>) {
  return [
    responsiveCss(className, 'display', props.display, (value) => String(value)),
    responsiveCss(className, 'gap', props.gap, resolveSpacing),
    responsiveCss(className, 'padding', props.padding, resolveSpacing),
    responsiveCss(className, 'margin', props.margin, resolveSpacing),
    responsiveCss(className, 'align-items', props.align, (value) => alignMap[value]),
    responsiveCss(className, 'justify-content', props.justify, (value) => justifyMap[value]),
    responsiveCss(className, 'max-width', props.maxWidth, resolveSize),
  ].join('');
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ') || undefined;
}

/** Foundational governed layout box: token-based responsive spacing, alignment, and sizing over Mantine's `Box`. All other layout primitives compose it. */
export const GdsBox = forwardRef<HTMLElement, GdsBoxProps>(function GdsBox({
  children,
  className,
  component = 'div',
  display = 'block',
  gap,
  padding,
  margin,
  align,
  justify,
  overflow,
  minWidth = 'zero',
  maxWidth,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ display, gap, padding, margin, align, justify, maxWidth });
  const css = sharedResponsiveCss(generatedClassName, { display, gap, padding, margin, align, justify, maxWidth });
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsMantineBox
        ref={ref}
        component={component}
        className={joinClassNames(generatedClassName, className)}
        style={resolveGdsLayoutStyle({ display, gap, padding, margin, align, justify, overflow, minWidth, maxWidth, style })}
        {...props}
      >
        {children}
      </GdsMantineBox>
    </>
  );
});

/** Vertical flex stack (`gap` defaults to `md`, `align` to `stretch`); `reverse` flips to `column-reverse`. */
export const GdsStack = forwardRef<HTMLElement, GdsStackProps>(function GdsStack({
  reverse = false,
  gap = 'md',
  align = 'stretch',
  component = 'div',
  style,
  ...props
}, ref) {
  return (
    <GdsBox
      ref={ref}
      component={component}
      display="flex"
      gap={gap}
      align={align}
      style={{ flexDirection: reverse ? 'column-reverse' : 'column', ...style }}
      {...props}
    />
  );
});

/** Horizontal flex row (`gap` defaults to `sm`, `align` to `center`, `wrap` to `wrap`). */
export const GdsInline = forwardRef<HTMLElement, GdsInlineProps>(function GdsInline({
  gap = 'sm',
  align = 'center',
  justify = 'start',
  wrap = 'wrap',
  component = 'div',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ wrap });
  const css = responsiveCss(generatedClassName, 'flex-wrap', wrap, (value) => wrapMap[value]);
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        component={component}
        display="flex"
        gap={gap}
        align={align}
        justify={justify}
        className={joinClassNames(generatedClassName, className)}
        style={{ flexWrap: wrapMap[baseValue(wrap, 'wrap')], minWidth: 0, ...style }}
        {...props}
      />
    </>
  );
});

/** `GdsInline` preset that pushes children to opposite ends (`justify` defaults to `between`), for toolbar/header rows. */
export const GdsCluster = forwardRef<HTMLElement, GdsClusterProps>(function GdsCluster({
  align = 'center',
  justify = 'between',
  gap = 'sm',
  ...props
}, ref) {
  return <GdsInline ref={ref} align={align} justify={justify} gap={gap} {...props} />;
});

function resolveGridColumns(columns: number | 'auto-fit' | 'auto-fill' | undefined, minColumnWidth: GdsLayoutSize) {
  if (typeof columns === 'number') {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }
  if (columns === 'auto-fill' || columns === 'auto-fit') {
    return `repeat(${columns}, minmax(min(100%, ${resolveSize(minColumnWidth)}), 1fr))`;
  }
  return 'repeat(1, minmax(0, 1fr))';
}

/** Equal-width CSS grid (`columns` defaults to 1 at base, 2 from `md`); `auto-fit`/`auto-fill` pack tracks by `minColumnWidth`. */
export const GdsGrid = forwardRef<HTMLElement, GdsGridProps>(function GdsGrid({
  columns = { base: 1, md: 2 },
  minColumnWidth = 'content',
  gap = 'md',
  component = 'div',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ columns, minColumnWidth });
  const css = responsiveCss(generatedClassName, 'grid-template-columns', columns, (value) => resolveGridColumns(value, minColumnWidth));
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        component={component}
        display="grid"
        gap={gap}
        className={joinClassNames(generatedClassName, className)}
        style={{ gridTemplateColumns: resolveGridColumns(baseValue(columns, 1), minColumnWidth), minWidth: 0, ...style }}
        {...props}
      />
    </>
  );
});

/**
 * Named column-grid primitive (12-column default, configurable), matching
 * the explicit column-grid systems most peer design systems ship (Carbon's
 * 2x Grid, Ant Design's 24-col `Grid`) — `GdsGrid` above covers equal-width
 * auto-column layouts, but has no concept of an item spanning a specific
 * number of shared tracks. See DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md P1
 * item 6.
 */
export const GdsColumnGrid = forwardRef<HTMLElement, GdsColumnGridProps>(function GdsColumnGrid({
  columns = 12,
  gap = 'md',
  component = 'div',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ columns, type: 'column-grid' });
  const css = responsiveCss(generatedClassName, 'grid-template-columns', columns, (value) => `repeat(${value}, minmax(0, 1fr))`);
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        component={component}
        display="grid"
        gap={gap}
        className={joinClassNames(generatedClassName, className)}
        style={{ gridTemplateColumns: `repeat(${baseValue(columns, 12)}, minmax(0, 1fr))`, minWidth: 0, ...style }}
        {...props}
      />
    </>
  );
});

/** A child of `GdsColumnGrid` that spans `span` tracks and optionally starts at `start`; omitting both uses native grid auto-flow. */
export const GdsColumnGridItem = forwardRef<HTMLElement, GdsColumnGridItemProps>(function GdsColumnGridItem({
  span,
  start,
  component = 'div',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ span, start, type: 'column-grid-item' });
  const css = [
    responsiveCss(generatedClassName, 'grid-column-start', start, (value) => value),
    responsiveCss(generatedClassName, 'grid-column-end', span, (value) => `span ${value}`),
  ].join('');
  const baseSpan = normalizeGdsResponsiveValue(span).base;
  const baseStart = normalizeGdsResponsiveValue(start).base;
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        component={component}
        className={joinClassNames(generatedClassName, className)}
        style={{
          gridColumnStart: baseStart,
          gridColumnEnd: baseSpan !== undefined ? `span ${baseSpan}` : undefined,
          minWidth: 0,
          ...style,
        }}
        {...props}
      />
    </>
  );
});

function splitTemplate(ratio: NonNullable<GdsSplitProps['ratio']>) {
  const [start, end] = ratio.split(':').map(Number);
  return `minmax(0, ${start}fr) minmax(0, ${end}fr)`;
}

/** Two-column split at a fixed `ratio` (default `1:1`) that collapses to a single stacked column below `collapseBelow` (default `md`). */
export const GdsSplit = forwardRef<HTMLElement, GdsSplitProps>(function GdsSplit({
  ratio = '1:1',
  collapseBelow = 'md',
  gap = 'lg',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ ratio, collapseBelow, type: 'split' });
  const css = `@media (min-width: ${breakpointPixels[collapseBelow]}px){.${generatedClassName}{grid-template-columns:${splitTemplate(ratio)};}}`;
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        display="grid"
        gap={gap}
        className={joinClassNames(generatedClassName, className)}
        style={{ gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start', ...style }}
        {...props}
      />
    </>
  );
});

/** Fixed-width sidebar beside a fluid content column (`side` default `start`, `sidebarWidth` default `content`), collapsing to one column below `collapseBelow` (default `md`). */
export const GdsSidebar = forwardRef<HTMLElement, GdsSidebarProps>(function GdsSidebar({
  side = 'start',
  sidebarWidth = 'content',
  collapseBelow = 'md',
  gap = 'lg',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ side, sidebarWidth, collapseBelow, type: 'sidebar' });
  const sidebarTrack = `minmax(min(100%, ${resolveSize(sidebarWidth)}), ${resolveSize(sidebarWidth)})`;
  const template = side === 'start' ? `${sidebarTrack} minmax(0, 1fr)` : `minmax(0, 1fr) ${sidebarTrack}`;
  const css = `@media (min-width: ${breakpointPixels[collapseBelow]}px){.${generatedClassName}{grid-template-columns:${template};}}`;
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        display="grid"
        gap={gap}
        className={joinClassNames(generatedClassName, className)}
        style={{ gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start', ...style }}
        {...props}
      />
    </>
  );
});

/** Breaks its content out of the parent's inline padding via negative inline margins (`bleed` default `md`). */
export const GdsBleed = forwardRef<HTMLElement, GdsBleedProps>(function GdsBleed({
  bleed = 'md',
  className,
  style,
  ...props
}, ref) {
  const generatedClassName = composeResponsiveClass({ bleed, type: 'bleed' });
  const css = responsiveCss(generatedClassName, 'margin-inline', bleed, (value) => {
    const resolved = resolveSpacing(value);
    return resolved ? `calc(${resolved} * -1)` : undefined;
  });
  const baseBleed = resolveSpacing(baseValue(bleed, 'md'));
  return (
    <>
      {renderResponsiveStyle(css)}
      <GdsBox
        ref={ref}
        className={joinClassNames(generatedClassName, className)}
        style={{ marginInline: baseBleed ? `calc(${baseBleed} * -1)` : undefined, ...style }}
        {...props}
      />
    </>
  );
});

/** Centered max-width content wrapper (`size` default `page`, `padding` default `md`/`lg` from `md`), centered unless `center` is `false`. */
export const GdsContainer = forwardRef<HTMLElement, GdsContainerProps>(function GdsContainer({
  size = 'page',
  center = true,
  padding = { base: 'md', md: 'lg' },
  className,
  style,
  ...props
}, ref) {
  return (
    <GdsBox
      ref={ref}
      maxWidth={size}
      padding={padding}
      className={className}
      style={{ width: '100%', marginInline: center ? 'auto' : undefined, ...style }}
      {...props}
    />
  );
});
