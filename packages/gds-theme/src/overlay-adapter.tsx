'use client';

import React, { createContext, useContext } from 'react';

/**
 * Overlay adapter seam (issue #349).
 *
 * Overlays (menus, selects, popovers, hovercards, tooltips) are GDS's
 * highest-risk, most vendor-coupled primitive. This seam isolates the overlay
 * *engine* behind a GDS-owned interface so it can be swapped — Mantine today,
 * something else tomorrow — without changing a single consumer call site or the
 * public component API.
 *
 * The default `mantineOverlayAdapter` preserves current behavior. A future
 * adapter (Base UI / Ark / hand-rolled) provides different config + surface
 * props; GDS overlay components consume the adapter and never the engine
 * directly. All types here are GDS-owned (no vendor types) so the seam itself
 * does not widen the vendor boundary.
 */

/** Anchored placement of an overlay relative to its trigger. */
export type GdsOverlayPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

/** ARIA role an overlay surface presents as. */
export type GdsOverlayRole = 'menu' | 'listbox' | 'dialog' | 'tooltip';

/** Why an overlay was dismissed. */
export type GdsOverlayDismissReason = 'escape' | 'outside' | 'select' | 'programmatic';

/** GDS-owned default configuration for overlays, independent of the underlying engine. */
export interface GdsOverlayConfig {
  /** Default anchored placement for GDS overlays. */
  placement: GdsOverlayPlacement;
  /** Whether overlays render in a portal at the document root by default. */
  withinPortal: boolean;
  /** Trap focus within dialog-like overlays. */
  trapFocus: boolean;
  /** Transition duration (ms); respect reduced-motion at the call site. */
  transitionDurationMs: number;
}

/**
 * The adapter is the single overlay-engine touchpoint. `surfaceProps` are the
 * DOM props a GDS overlay component spreads onto its dropdown/surface element —
 * notably `data-gds-overlay-surface`, which the GDS stylesheet paints opaque
 * (issue #342). Swapping the adapter changes overlay behavior engine-wide with
 * no consumer change.
 */
export interface OverlayAdapter {
  /** Stable adapter identifier (e.g. `'mantine'`). */
  readonly id: string;
  /** Default overlay configuration this adapter provides. */
  readonly config: GdsOverlayConfig;
  /** Props/attributes to spread onto an overlay surface for a given role. */
  surfaceProps(role: GdsOverlayRole): Record<string, unknown>;
}

/** The default overlay configuration: bottom-start placement, portalled, focus-trapped, 140ms transition. */
export const defaultGdsOverlayConfig: GdsOverlayConfig = {
  placement: 'bottom-start',
  withinPortal: true,
  trapFocus: true,
  transitionDurationMs: 140,
};

/**
 * Default adapter: current (Mantine-backed) behavior. It is engine-agnostic in
 * type — it only emits GDS-owned surface props and config — so it lives in the
 * theme package without leaking vendor types into the public surface.
 */
export const mantineOverlayAdapter: OverlayAdapter = {
  id: 'mantine',
  config: defaultGdsOverlayConfig,
  surfaceProps: (role) => ({
    'data-gds-overlay-surface': '',
    'data-gds-overlay-role': role,
  }),
};

const OverlayAdapterContext = createContext<OverlayAdapter>(mantineOverlayAdapter);

/** Provides an overlay adapter to descendant GDS overlay components via context. */
export function OverlayAdapterProvider({
  adapter,
  children,
}: {
  adapter: OverlayAdapter;
  children: React.ReactNode;
}) {
  return <OverlayAdapterContext.Provider value={adapter}>{children}</OverlayAdapterContext.Provider>;
}

/**
 * Read the active overlay adapter. GDS overlay components call this and spread
 * `surfaceProps(role)` onto their surface instead of hard-wiring the engine.
 */
export function useOverlayAdapter(): OverlayAdapter {
  return useContext(OverlayAdapterContext);
}
