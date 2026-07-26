'use client';

import { useEffect, useState } from 'react';
import { getGdsMotionPreset } from './motion';
import type { GdsMotionPresetId, GdsReducedMotionPolicy, GdsResolvedMotionPreset } from './motion';

/** Return value of `useGdsReducedMotion`: the live reduced-motion state and a preset resolver bound to it. */
export interface UseGdsReducedMotionResult {
  /** `true` when the OS reports `prefers-reduced-motion: reduce`. */
  prefersReducedMotion: boolean;
  /** The effective policy after reconciling the requested policy with the OS preference. */
  policy: GdsReducedMotionPolicy;
  /** Resolves a motion preset under the effective policy. */
  getPreset: (id: GdsMotionPresetId) => GdsResolvedMotionPreset;
}

/**
 * Tracks the OS `prefers-reduced-motion` media query and returns the live state
 * plus a `getPreset` resolver bound to the effective policy. Under the `'system'`
 * policy the OS preference upgrades the policy to `'reduce'`; pass `'reduce'` or
 * `'no-motion'` to force it regardless of the OS setting.
 */
export function useGdsReducedMotion(policy: GdsReducedMotionPolicy = 'system'): UseGdsReducedMotionResult {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const resolvedPolicy: GdsReducedMotionPolicy = policy === 'system' && prefersReducedMotion ? 'reduce' : policy;

  return {
    prefersReducedMotion,
    policy: resolvedPolicy,
    getPreset: (id) => getGdsMotionPreset(id, resolvedPolicy),
  };
}
