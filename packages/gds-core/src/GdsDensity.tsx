'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { resolveGdsCardContract, type GdsCardContractOptions, type GdsCardResolvedContract } from './CardContracts';
import type { GdsDensityMode as GdsThemeDensityMode } from '@sovereignsquad/gds-theme';

/**
 * Global density-mode theme primitive (previously only scattered per-component
 * props — `AdvancedDataTable`'s own `compact`/`comfortable` state,
 * `CardContracts`'s own `compact`/`comfortable`/`spacious` — with no shared
 * top-level axis a whole product could set once. See
 * DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md P1 item 5.
 *
 * This does NOT retroactively change `resolveGdsCardContract` or any existing
 * component's default (zero behavior change for current consumers) — it's a
 * new, additive context that components opt into reading via `useGdsDensity()`
 * or the provided `useGdsCardContract()` wrapper, documented in
 * COMPONENTS_AND_PATTERNS.md as the extension pattern for new call sites.
 */
// Issue 556. The theme owns this type now. It was `= GdsCardDensity`, an identical union
// declared independently in CardContracts — two definitions of one concept that happened to
// agree, which is the F1 pattern and would have diverged the first time either gained a
// fourth mode. gds-core depends on gds-theme, so the theme is the correct owner: the axis
// DECLARES a theme's density, this context OVERRIDES it for a subtree, and both now speak
// the same type.
export type { GdsDensityMode } from '@sovereignsquad/gds-theme';

const GdsDensityContext = createContext<GdsThemeDensityMode>('comfortable');

/** Props for {@link GdsDensityProvider}. */
export interface GdsDensityProviderProps {
  /** Ambient density mode applied to the subtree. */
  density: GdsThemeDensityMode;
  children: ReactNode;
}

/** Sets the ambient density mode read by `useGdsDensity()` for its descendants. */
export function GdsDensityProvider({ density, children }: GdsDensityProviderProps) {
  return <GdsDensityContext.Provider value={density}>{children}</GdsDensityContext.Provider>;
}

/** Reads the ambient density mode set by the nearest `GdsDensityProvider` (defaults to `'comfortable'` outside one). */
export function useGdsDensity(): GdsThemeDensityMode {
  return useContext(GdsDensityContext);
}

/**
 * Density-aware wrapper around `resolveGdsCardContract`: falls back to the
 * ambient `useGdsDensity()` value when `density` isn't explicitly passed,
 * instead of `resolveGdsCardContract`'s own hardcoded `'comfortable'` default.
 * Existing direct callers of `resolveGdsCardContract` are unaffected.
 */
export function useGdsCardContract(options: GdsCardContractOptions = {}): GdsCardResolvedContract {
  const ambientDensity = useGdsDensity();
  return resolveGdsCardContract({ density: ambientDensity, ...options });
}
