// Issue 561 — one identity for a theme, covering every themed input.
//
// CSS custom properties update on a switch by themselves; that is the cascade working. The
// gap is everything OUTSIDE the cascade: values read with `getComputedStyle` at mount and put
// in state, values captured in a `useMemo` whose deps omit the theme, SVG and canvas painted
// once from resolved colours, and third-party surfaces initialised with a theme snapshot —
// which will include the map engine.
//
// Those cannot be fixed one at a time. They need a value that changes whenever ANY themed
// input changes, so a subtree can be keyed on it and re-created wholesale.
//
// The identity hashes the RESOLVED TOKENS, not the declaration. Two declarations that resolve
// identically produce the same identity and therefore no remount — a remount that repaints
// the world to arrive at the same pixels is a cost with no benefit. Conversely a theme that
// changes only, say, its radius scale still changes identity, because the shape axis is in
// the resolved set. Keying on preset id and scheme alone would miss exactly that, which is
// why this exists at all rather than `key={preset + scheme}`.

import { getGdsVibeThemeCssVariables } from './vibe-themes';
import type { GdsThemePresetId } from './theme-presets';

/** Stable, order-independent identity over every themed input. */
export type GdsThemeIdentity = string;

/**
 * How a theme change is applied.
 *
 * `cascade-only` is the pre-561 behaviour and is deprecated rather than removed: it is what a
 * consumer already relying on no-remount gets, and silently remounting their tree would be a
 * worse surprise than an unsafe default they can read about.
 */
export type GdsThemeApplicationMode = 'remount' | 'reload' | 'cascade-only';

/**
 * FNV-1a, 32-bit.
 *
 * Deliberately not a cryptographic hash: this is a cache key, not a security boundary, and
 * `crypto.subtle` is async and unavailable in every rendering context GDS supports (SSR,
 * workers, non-secure origins). A collision here causes a missed remount, so the input is the
 * full resolved token set rather than a summary — the cheap way to make collisions matter
 * less is to hash more, not to hash harder.
 */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Inputs that determine what a theme renders. */
export interface GdsThemeIdentityInput {
  preset: GdsThemePresetId | string;
  colorScheme: 'light' | 'dark';
  /** Extra themed values a consumer resolves outside the preset (e.g. a brand override). */
  extra?: Record<string, string | number | boolean | undefined>;
}

/**
 * Computes the identity for a theme selection.
 *
 * Sorted before hashing so key order cannot change the result — an identity that depends on
 * object iteration order would remount at random and, worse, occasionally fail to.
 */
export function computeGdsThemeIdentity({ preset, colorScheme, extra }: GdsThemeIdentityInput): GdsThemeIdentity {
  let resolved: Record<string, string> = {};
  try {
    resolved = getGdsVibeThemeCssVariables(preset as GdsThemePresetId, colorScheme);
  } catch {
    // An unknown preset must still produce a STABLE, DISTINCT identity rather than throwing
    // during render. Throwing here would turn a bad preset id into a blank page; a distinct
    // identity turns it into a wrong-but-visible theme, which is the failure a developer can
    // actually see and fix.
    resolved = { '--gds-identity-unresolved': String(preset) };
  }

  const parts = Object.keys(resolved).sort().map((key) => `${key}=${resolved[key]}`);
  if (extra) {
    for (const key of Object.keys(extra).sort()) {
      if (extra[key] !== undefined) parts.push(`x:${key}=${String(extra[key])}`);
    }
  }
  return `${preset}:${colorScheme}:${fnv1a(parts.join(';'))}`;
}

/**
 * True when two identities differ, i.e. a re-application is actually needed.
 *
 * A named helper rather than `!==` at call sites, so the meaning of "changed" lives in one
 * place if the identity ever gains structure.
 */
export function gdsThemeIdentityChanged(previous: GdsThemeIdentity | undefined, next: GdsThemeIdentity): boolean {
  return previous !== undefined && previous !== next;
}
