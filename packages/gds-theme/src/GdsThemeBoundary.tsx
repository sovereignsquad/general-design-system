'use client';

import type { ReactNode } from 'react';
import { computeGdsThemeIdentity } from './theme-identity';
import type { GdsThemePresetId } from './theme-presets';

/** Props for {@link GdsThemeBoundary}. */
export interface GdsThemeBoundaryProps {
  /** Preset the enclosed subtree is themed by. */
  preset: GdsThemePresetId | string;
  /** Colour scheme the enclosed subtree is themed by. */
  colorScheme: 'light' | 'dark';
  /** Extra themed inputs a consumer resolves outside the preset. */
  extra?: Record<string, string | number | boolean | undefined>;
  children: ReactNode;
}

/**
 * Re-creates its subtree whenever the theme identity changes (issue 561).
 *
 * **Why this is a boundary rather than provider-wide behaviour.** Keying everything under
 * `GdsProvider` was tried and measured: it destroys the state of any theme control living
 * inside the provider — the normal arrangement — and broke three of the playground's own
 * runtime tests by resetting the very picker used to change the theme. A default that resets
 * the control you just used is a defect, not a guarantee.
 *
 * So the consumer places the boundary around the subtrees that actually hold theme-derived
 * state outside the CSS cascade: a value read with `getComputedStyle` at mount, a `useMemo`
 * whose deps omit the theme, SVG or canvas painted once from resolved colours, or a
 * third-party surface initialised with a theme snapshot. Everything reachable by `var()`
 * needs no boundary at all — the cascade already handles it.
 *
 * State inside the boundary does not survive a switch. That is the entire point, and it is
 * why the boundary is placed deliberately rather than wrapped around the app.
 */
export function GdsThemeBoundary({ preset, colorScheme, extra, children }: GdsThemeBoundaryProps) {
  const identity = computeGdsThemeIdentity({ preset, colorScheme, extra });
  return <div data-gds-theme-boundary={identity} key={identity} style={{ display: 'contents' }}>{children}</div>;
}
