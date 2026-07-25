/**
 * GDS breakpoint alias keys (`xs`–`xl`). A GDS-owned type mirroring Mantine's
 * breakpoint aliases without leaking a vendor type into the public surface.
 */
export type GdsBreakpointAlias = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Canonical GDS breakpoint alias → min-width map (em units) — the single source
 * of truth for the responsive width rules GDS layout components apply via
 * `useMediaQuery`. It mirrors the named size-class vocabulary documented in
 * `docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md` (`compact` `< sm`, `medium` = `sm`,
 * `expanded` = `md`, `large` = `lg`, `xlarge` = `xl`).
 *
 * Consumers building custom responsive chrome should resolve widths from this
 * map instead of hard-coding pixel breakpoints, so their layout switches on the
 * same boundaries GDS does. Used internally by `KanbanBoard`
 * (`useGdsKanbanOrientation`) and `DiscoveryShell`.
 */
export const gdsBreakpointByAlias: Record<GdsBreakpointAlias, string> = {
  xs: '36em',
  sm: '48em',
  md: '62em',
  lg: '75em',
  xl: '88em',
};
