// Issue 583 — the declarative factor model for render-coverage (DEEP_AUDIT_PLAN §3/§3.1).
//
// Every factor's LEVELS are derived from the system at load — presets from the theme package,
// routes from the app's declarations, viewports from the theme's own breakpoints, locales from
// the shipped phrase packs. A hand-listed level set is a level set that silently drifts.
//
// WEIGHTS are §3.1.1's measured defect incidences over the repository's 34 bug-labelled
// issues — not a generic prior. w(level) = max(0.5, incidence / mean_incidence); the 0.5 floor
// is load-bearing: a zero weight is how a blind spot becomes permanent.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { patternRoutes } from '../lib/pattern-routes.mjs';

const ROOT = new URL('../..', import.meta.url).pathname;
const theme = await import(join(ROOT, 'packages/gds-theme/dist/index.js'));

const presetIds = theme.getGdsThemePresets().map((preset) => preset.id);
const localeIds = ['en', ...readdirSync(join(ROOT, 'apps/playground/src/generated-site-phrases'))
  .filter((name) => /^[a-z]{2}\.ts$/.test(name)).map((name) => name.replace('.ts', '')).sort()];

// The theme's own breakpoints (em → px at 16px root), per the issue's constraint: viewports are
// what the theme DEFINES, never an invented set. xs / md / xl span phone, mid, and wide.
const bp = theme.gdsTheme.breakpoints;
const em = (value) => Math.round(parseFloat(value) * 16);
const viewports = [em(bp.xs), em(bp.md), em(bp.xl)];

/**
 * §3.1.1 incidences (defects per dimension over 34 bug-labelled issues). Mean of the measured
 * rows ≈ 17.9; weights below are incidence/mean floored at 0.5.
 */
const W = (incidence) => Math.max(0.5, incidence / 17.9);

export const FACTORS = [
  { name: 'route', levels: patternRoutes(), weight: () => 0.5 },
  { name: 'theme', levels: presetIds, weight: (level) => (level === 'class-usa' || level === 'gold-athlete' ? W(12) : 0.5) },
  { name: 'scheme', levels: ['light', 'dark'], weight: (level) => (level === 'dark' ? W(12) : 0.5) },
  { name: 'viewport', levels: viewports, weight: () => W(18) },
  { name: 'locale', levels: localeIds, weight: (level) => (level === 'en' ? 0.5 : W(15)) },
  { name: 'reducedMotion', levels: ['no-preference', 'reduce'], weight: () => 0.5 },
  { name: 'forcedColors', levels: ['none', 'active'], weight: (level) => (level === 'active' ? W(15) : 0.5) },
  { name: 'state', levels: ['base', 'focus-visible'], weight: (level) => (level === 'focus-visible' ? W(9) : 0.5) },
];

/** The accessibility-critical group carries 3-way strength (§3.1.4 step 2). */
export const A11Y_CRITICAL_GROUP = ['scheme', 'viewport', 'forcedColors', 'reducedMotion'];

/**
 * §3.1.3 transition costs, measured on the existing harness. Under the execution mechanism
 * (theme/scheme/locale apply at load), any change to route, locale, theme or scheme is a page
 * load; viewport and media emulation are pre-navigation CDP calls; state is an input dispatch.
 */
export const TRANSITION_COSTS = { load: 50, viewport: 10, state: 1, media: 2 };
export const PAGE_FACTORS = ['route', 'locale', 'theme', 'scheme'];

/**
 * What the EXISTING runtime gates already cover, in factor terms (§3.1.4 step 1 — WGA
 * augments, never rebuilds). Transcribed from each gate's own case list; unlisted factors run
 * at those gates' fixed values (desktop viewport, en, base state, no forced media) and are
 * recorded as such rather than credited.
 */
export const EXISTING_SUITE = [
  // scripts/verify-forced-colors-runtime.mjs — its routes × presets under forced-colors:active.
  ...['/patterns', '/patterns/foundations', '/patterns/public', '/patterns/operations', '/themes', '/live-proofs', '/live-proofs/surfaces']
    .flatMap((route) => ['default', 'high-contrast', 'colorblind-safe', 'dark-public', 'flat-surface', 'editorial', 'brand', 'class-usa']
      .map((preset) => ({ route, theme: preset, scheme: 'dark', viewport: 1408, locale: 'en', reducedMotion: 'no-preference', forcedColors: 'active', state: 'base' }))),
  // scripts/verify-theme-trust-runtime.mjs — routes × its three preset/scheme cases.
  ...['/patterns/foundations', '/patterns/public', '/themes']
    .flatMap((route) => [['default', 'light'], ['dark-public', 'dark'], ['cosmic', 'dark']]
      .map(([preset, scheme]) => ({ route, theme: preset, scheme, viewport: 1408, locale: 'en', reducedMotion: 'no-preference', forcedColors: 'none', state: 'base' }))),
  // scripts/verify-input-zoom-guard-runtime.mjs — one route, three presets, phone width.
  ...[['default', 'light'], ['dark-public', 'dark'], ['cosmic', 'dark']]
    .map(([preset, scheme]) => ({ route: '/patterns/operations', theme: preset, scheme, viewport: 576, locale: 'en', reducedMotion: 'no-preference', forcedColors: 'none', state: 'base' })),
];
