'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { resolveGdsCardContract, type GdsCardContractOptions, type GdsCardResolvedContract } from './CardContracts';
import type { GdsDensityMode as GdsThemeDensityMode } from '@sovereignsquad/gds-theme';

/**
 * Global density-mode context. Additive: does not change `resolveGdsCardContract`'s own
 * default; components opt in via `useGdsDensity()` or `useGdsCardContract()`.
 */
// Re-exported from gds-theme, the owning package.
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
