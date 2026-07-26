'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { resolveGdsCardContract, type GdsCardContractOptions, type GdsCardDensity, type GdsCardResolvedContract } from './CardContracts';

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
export type GdsDensityMode = GdsCardDensity;

const GdsDensityContext = createContext<GdsDensityMode>('comfortable');

/** Props for {@link GdsDensityProvider}. */
export interface GdsDensityProviderProps {
  /** Ambient density mode applied to the subtree. */
  density: GdsDensityMode;
  children: ReactNode;
}

/** Sets the ambient density mode read by `useGdsDensity()` for its descendants. */
export function GdsDensityProvider({ density, children }: GdsDensityProviderProps) {
  return <GdsDensityContext.Provider value={density}>{children}</GdsDensityContext.Provider>;
}

/** Reads the ambient density mode set by the nearest `GdsDensityProvider` (defaults to `'comfortable'` outside one). */
export function useGdsDensity(): GdsDensityMode {
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
