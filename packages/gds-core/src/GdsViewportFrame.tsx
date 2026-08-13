import { Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * Bounded viewport frame (issue 609).
 *
 * ## Why this exists
 *
 * Some surfaces position against the **viewport** rather than their parent, and some gate
 * themselves on a **viewport breakpoint**. `BottomTabBar` does both. Documenting one inside a
 * page was therefore impossible: at desktop widths it rendered nothing, and at mobile widths it
 * pinned itself to the window and read as the page's own navigation rather than as an example.
 *
 * That is not a documentation problem — it is a missing capability. Every consumer embedding
 * such a surface in a panel, a kiosk pane or a split view hits the same wall, and each one was
 * left to solve it locally.
 *
 * ## How it works
 *
 * Two mechanisms, because the two problems are different, and **both are CSS** so this stays
 * server-renderable:
 *
 * 1. **Positioning** — `contain: layout paint` makes this element a *containing block* for
 *    `position: fixed` descendants, so a fixed child pins to the frame instead of the window.
 *    `overflow: hidden` alone does not do this.
 * 2. **Breakpoint gating** — the frame publishes its width class as `data-gds-viewport-frame`,
 *    and the governed stylesheet resolves `data-gds-viewport-gated` against it. A media query
 *    cannot be made to consult an element, so the element states its width and the cascade does
 *    the rest.
 *
 * A React context was the first design and is deliberately **not** used: reading it would make
 * every gated component a client component, and `BottomTabBar` is exported from the server
 * entrypoint. A capability for embedding surfaces should not force its subjects out of the
 * server lane — `check-export-contract` caught exactly that and the design changed rather than
 * the boundary.
 *
 * Requires `@sovereignsquad/gds-theme/styles.css`, which every consumer already imports once at
 * entry (see INSTALLATION_GUIDE.md).
 */

/** Named width classes a frame can present, mirroring the responsive size-class vocabulary. */
export type GdsViewportFrameWidth = 'compact' | 'medium' | 'expanded';

/** Props for {@link GdsViewportFrame}. */
export interface GdsViewportFrameProps {
  /** Size class the frame presents. Defaults to `compact` — the case that needs a frame most. */
  width?: GdsViewportFrameWidth;
  /** Frame height. Accepts any CSS length. */
  height?: string;
  /** Caption naming what the frame shows, so a reader knows it is a bounded preview. */
  label?: string;
  children: ReactNode;
}

// Derived from the governed breakpoint scale rather than invented: `compact` sits below `sm`, so
// a breakpoint-gated mobile surface resolves as mobile inside it.
const FRAME_WIDTHS: Record<GdsViewportFrameWidth, string> = {
  compact: '22.5rem',
  medium: '48rem',
  expanded: '64rem',
};

/**
 * Renders `children` inside a bounded frame that acts as the viewport for anything within it.
 *
 * ```tsx
 * <GdsViewportFrame width="compact" label="Compact width">
 *   <BottomTabBar items={items} activeId={activeId} />
 * </GdsViewportFrame>
 * ```
 *
 * It is not a device mock: no chrome, notch or status bar, because it bounds layout rather than
 * illustrating a phone.
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
        data-gds-viewport-frame={width}
        style={{
          contain: 'layout paint',
          position: 'relative',
          overflow: 'hidden',
          width: FRAME_WIDTHS[width],
          maxWidth: '100%',
          height,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>{children}</div>
      </Paper>
      {label ? (
        <Text size="xs" c="dimmed">
          {label}
        </Text>
      ) : null}
    </Stack>
  );
}
