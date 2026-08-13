'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { Box, Paper, Stack, Text } from '@mantine/core';

/**
 * Bounded viewport frame (issue 609).
 *
 * ## Why this exists
 *
 * Some surfaces position against the **viewport** rather than their parent, and some gate
 * themselves on a **viewport breakpoint**. `BottomTabBar` does both: `position: fixed` plus
 * `hiddenFrom="sm"`. Documenting one on a page was therefore impossible — at desktop widths it
 * rendered nothing, and at mobile widths it pinned itself to the bottom of the window and read
 * as the site's own navigation rather than as an example.
 *
 * That is not a documentation problem. It is a **missing capability**: GDS had `BoundedPreviewSurface`,
 * which bounds height, and nothing that bounds the notion of "viewport" itself. Every consumer
 * embedding such a surface in a panel, a kiosk pane or a split view hits the same wall.
 *
 * ## How it works, and why not CSS alone
 *
 * Two mechanisms, because the two problems are different:
 *
 * 1. **Positioning** — `contain: layout paint` makes this element a *containing block* for
 *    `position: fixed` descendants, so a fixed child pins to the frame instead of the window.
 *    This is CSS doing exactly what it is specified to do, not a hack.
 * 2. **Breakpoint gating** — a media query cannot be made to resolve against an element, so no
 *    CSS trick makes `hiddenFrom="sm"` consult the frame. The frame therefore publishes its
 *    width class through context, and a gated component reads it. `useGdsViewportFrame()`
 *    returns `null` outside a frame, so components keep their viewport behaviour by default and
 *    nothing changes for existing consumers.
 *
 * Container queries were the other candidate. They solve (2) cleanly but would require every
 * gated component to be rewritten against `@container`, changing behaviour for consumers who
 * are not inside a frame — a much larger blast radius for the same result.
 */

/** Named width classes a frame can present, mirroring the responsive size-class vocabulary. */
export type GdsViewportFrameWidth = 'compact' | 'medium' | 'expanded';

/** Value published by {@link GdsViewportFrame} to descendants that gate on viewport width. */
export interface GdsViewportFrameContextValue {
  /** Size class this frame presents to its children. */
  width: GdsViewportFrameWidth;
}

const GdsViewportFrameContext = createContext<GdsViewportFrameContextValue | null>(null);

/**
 * Reads the enclosing {@link GdsViewportFrame}, or `null` when there is none.
 *
 * A component that gates on viewport width should prefer this when present and fall back to its
 * normal viewport behaviour otherwise — so wrapping something in a frame is opt-in and cannot
 * change how it renders anywhere else.
 */
export function useGdsViewportFrame(): GdsViewportFrameContextValue | null {
  return useContext(GdsViewportFrameContext);
}

/** Props for {@link GdsViewportFrame}. */
export interface GdsViewportFrameProps {
  /** Size class the frame presents. Defaults to `compact` — the case that needs a frame most. */
  width?: GdsViewportFrameWidth;
  /** Frame height. Accepts any CSS length; defaults to a phone-like aspect. */
  height?: string;
  /** Caption naming what the frame is showing, so a reader knows it is a bounded preview. */
  label?: string;
  children: ReactNode;
}

// Widths are the governed breakpoint scale, not invented numbers: `compact` sits below the `sm`
// breakpoint so breakpoint-gated mobile surfaces resolve as mobile inside it.
const FRAME_WIDTHS: Record<GdsViewportFrameWidth, string> = {
  compact: '22.5rem',
  medium: '48rem',
  expanded: '64rem',
};

/**
 * Renders `children` inside a bounded frame that acts as the viewport for anything within it.
 *
 * ```tsx
 * <GdsViewportFrame width="compact" label="Mobile, 360px">
 *   <BottomTabBar items={items} activeId={activeId} />
 * </GdsViewportFrame>
 * ```
 */
export function GdsViewportFrame({
  width = 'compact',
  height = '26rem',
  label,
  children,
}: GdsViewportFrameProps) {
  return (
    <Stack gap="xs" align="flex-start">
      <Paper
        withBorder
        radius="md"
        style={{
          // `contain: layout paint` is what makes this a containing block for `position: fixed`
          // descendants. `overflow: hidden` alone does not — a fixed child would still escape to
          // the window, which is the whole defect this frame exists to remove.
          contain: 'layout paint',
          position: 'relative',
          overflow: 'hidden',
          width: FRAME_WIDTHS[width],
          maxWidth: '100%',
          height,
        }}
      >
        <GdsViewportFrameContext.Provider value={{ width }}>
          <Box style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
            {children}
          </Box>
        </GdsViewportFrameContext.Provider>
      </Paper>
      {label ? (
        <Text size="xs" c="dimmed">
          {label}
        </Text>
      ) : null}
    </Stack>
  );
}
