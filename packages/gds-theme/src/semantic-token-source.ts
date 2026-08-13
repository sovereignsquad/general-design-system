// Issue 554 — the single authoritative source for semantic-role token values.
//
// GDS's Core Principle 3 is "One Token Source" (FOUNDATION.md). That promise was false
// inside the theme package itself: `brand-tokens.ts` derived the Class USA and Gold
// Athlete semantic roles as `role -> { light, dark }` pairs, while `vibe-themes.ts`
// carried the SAME values a second time as flat `--gds-*` records, kept in step by human
// discipline alone. The cost was already paid once — the GdsProvider inline-style token
// bug fixed in 5.0.1/5.0.2 existed because the two paths resolve differently.
//
// This module owns those values now. Both consumers import from here, so there is no
// second table to drift from; `verify:token-single-source` fails if one reappears.
//
// It deliberately depends on NOTHING but `color-math`. `vibe-themes.ts` cannot import
// `brand-tokens.ts` directly — that path runs brand-tokens -> token-operations ->
// vibe-themes and closes a cycle. The dependency-free extraction is what makes
// single-sourcing reachable at all, not merely tidier.

import { ensureContrast, mixCssColors, parseCssColor, readableForeground } from './color-math';
import { resolveGdsAxisTokens } from './axes';
// Type-only, so this is erased at compile time and creates no runtime cycle. The generic
// lanes derive their roles FROM the atmosphere palette, so the shape has to be visible
// here; the values still live in vibe-themes.ts.
import type { GdsVibeTheme } from './vibe-themes';

/** A 10-step Mantine-style color ramp (index 0 lightest to 9 darkest). */
export type BrandColorRamp = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/** Ramp key of the built-in Class USA brand palette (v2 re-base, issue 536). */
export type ClassUsaColorRampName = 'navy' | 'brand' | 'action' | 'trust' | 'cream' | 'slate';

/** The six Class USA brand ramps keyed by name. */
export type ClassUsaColorRamps = Record<ClassUsaColorRampName, BrandColorRamp>;

/** Ramp key of the built-in Gold Athlete brand palette. */
export type GoldAthleteColorRampName = 'gold' | 'charcoal' | 'crimson' | 'ivory' | 'slate';

/** The five Gold Athlete brand ramps keyed by name. */
export type GoldAthleteColorRamps = Record<GoldAthleteColorRampName, BrandColorRamp>;

/** A governed brand semantic role name; each resolves to a light + dark color pair. */
export type BrandSemanticRole =
  | 'brand.primary'
  | 'brand.primaryPressed'
  | 'brand.accent'
  | 'accent'
  | 'support'
  | 'bg.canvas'
  | 'bg.card'
  | 'bg.page'
  | 'bg.surface'
  | 'bg.inverse'
  | 'border.card'
  | 'text.body'
  | 'text.meta'
  | 'text.primary'
  | 'text.secondary'
  | 'text.onInverse'
  | 'nav.inactiveOnInverse'
  | 'price'
  | 'star'
  | 'state.success'
  | 'state.warning'
  | 'state.danger'
  | 'state.info'
  | 'badge.attention'
  | 'badge.validation'
  | 'badge.info'
  | 'badge.urgencyBg'
  | 'focus.ring'
  | 'control.disabledBg'
  | 'control.disabledText';

// v2 re-base (issue 536): six role-named ramps replace the retired five
// (navy/terracotta/sage/cream/slate), against
// `brand-requests/class-usa/class-usa-v2-token-spec.md`. `action[2]` was a
// text placeholder in the handoff spec ("one step above is a placeholder and
// must be replaced before build") — the spec's own suggested value
// (`#e8a87c`) is used here. Every anchor step (navy[6], brand[5], action[6],
// action[7]/pressed, trust[6], cream[0], slate[6]) matches the spec's
// "Anchors" table exactly.
export const classUsaDefaultColorRamps: ClassUsaColorRamps = {
  navy: ['#e9eef6', '#cdd8e6', '#a3b6cc', '#7691b0', '#4e6d92', '#2a4a70', '#0f2c4a', '#0c243d', '#0a1d31', '#071626'],
  brand: ['#fdeee6', '#fbd8c6', '#f9bb9c', '#f79c70', '#f68a55', '#f5793b', '#e0641f', '#c25317', '#9e4312', '#7a330d'],
  action: ['#fbe9df', '#f6cdb8', '#e8a87c', '#e08a52', '#d4691f', '#c85307', '#c24a0a', '#a33e07', '#843205', '#652604'],
  trust: ['#eef5f0', '#d8e7dd', '#b6d2c0', '#92bca2', '#71a586', '#5a9370', '#4f8a5b', '#3f6f4a', '#31573a', '#24402b'],
  cream: ['#faf7f1', '#f4eee2', '#ece3d1', '#e3d6bd', '#d9c9a8', '#cdba92', '#bfad80', '#a8946a', '#8a7a57', '#6b5e44'],
  slate: ['#f7f8fa', '#eceef2', '#d9dde4', '#c0c6d0', '#a2aab7', '#848d9c', '#5b6573', '#48505c', '#373d47', '#262b33'],
};

export const goldAthleteDefaultColorRamps: GoldAthleteColorRamps = {
  gold: ['#fbf3df', '#f6e4b8', '#efd189', '#e7bd5c', '#dca733', '#c08a12', '#8a5a00', '#6f4700', '#573700', '#3f2800'],
  charcoal: ['#eef0f2', '#d4d8dd', '#aab1ba', '#7e8894', '#586472', '#39424e', '#232a33', '#1a1f27', '#12161c', '#0a0d12'],
  crimson: ['#fdeceb', '#f9cfcc', '#f0a49e', '#e5776e', '#d64f44', '#b3261e', '#8f1c16', '#711511', '#54100c', '#3a0b08'],
  ivory: ['#fdfbf5', '#fbf7ee', '#f5eeda', '#ede1c2', '#e2d0a4', '#cdb47c', '#a98f57', '#856f42', '#5f4f2f', '#3c311d'],
  slate: ['#f5f6f8', '#e6e9ee', '#ccd2da', '#a9b3bf', '#7f8b9a', '#5a6675', '#414b57', '#323a44', '#232830', '#15181d'],
};

export interface SemanticPair {
  light: string;
  dark: string;
}

// v2 re-base (issue 536), values pasted from `class-usa-v2-token-spec.md`'s
// "Semantic tokens" table. The light/dark split on `brand.accent`/`accent` is
// the point of the whole re-base: `action[6]` (#c24a0a) carries text on warm
// white/cream, `brand[5]` (#f5793b) carries it on the dark-mode charcoal
// canvas — computed contrast in the spec's "Contrast, computed" table shows
// neither clears WCAG AA in the other scheme, so this is NOT a
// light-value-reused-in-dark shortcut (the exact failure mode behind issues
// #533/#534) — every value below was independently authored per scheme.
export function deriveClassUsaSemanticTokens(ramps: ClassUsaColorRamps): Record<BrandSemanticRole, SemanticPair> {
  const navy = ramps.navy[6];
  const navyPressed = ramps.navy[9];
  const actionLight = ramps.action[6];
  const brandDark = ramps.brand[5];
  const trustLight = ramps.trust[6];
  const cream = ramps.cream[0];
  const slate = ramps.slate[6];
  const white = '#ffffff';
  const textBody = '#1f3a5c';
  const darkCanvas = '#14171c';
  const darkSurface = '#1c2027';

  return {
    'brand.primary': { light: navy, dark: '#f2ede4' },
    'brand.primaryPressed': { light: navyPressed, dark: navyPressed },
    'brand.accent': { light: actionLight, dark: brandDark },
    accent: { light: actionLight, dark: brandDark },
    support: { light: trustLight, dark: '#8fc2a0' },
    'bg.canvas': { light: cream, dark: darkCanvas },
    'bg.card': { light: white, dark: darkSurface },
    'bg.page': { light: cream, dark: darkCanvas },
    'bg.surface': { light: white, dark: darkSurface },
    'bg.inverse': { light: navy, dark: navy },
    'border.card': { light: '#e6e1d8', dark: '#2c323b' },
    'text.body': { light: textBody, dark: '#f2ede4' },
    'text.meta': { light: slate, dark: '#b8bfc9' },
    'text.primary': { light: textBody, dark: '#f2ede4' },
    'text.secondary': { light: slate, dark: '#b8bfc9' },
    'text.onInverse': { light: cream, dark: cream },
    'nav.inactiveOnInverse': { light: 'rgba(250,247,241,0.72)', dark: 'rgba(250,247,241,0.72)' },
    price: { light: '#c78a2c', dark: '#e0a23c' },
    star: { light: actionLight, dark: brandDark },
    'state.success': { light: trustLight, dark: '#8fc2a0' },
    'state.warning': { light: '#c78a2c', dark: '#e0a23c' },
    'state.danger': { light: '#b3261e', dark: '#f2786f' },
    'state.info': { light: '#1d6fa5', dark: '#6fb6e8' },
    'badge.attention': { light: actionLight, dark: brandDark },
    'badge.validation': { light: trustLight, dark: '#8fc2a0' },
    'badge.info': { light: '#f6f1ea', dark: '#232830' },
    'badge.urgencyBg': { light: '#fdede3', dark: '#4a2410' },
    'focus.ring': { light: actionLight, dark: brandDark },
    'control.disabledBg': { light: '#f1efea', dark: '#2c323b' },
    'control.disabledText': { light: '#7a7f88', dark: '#8a919c' },
  };
}

export function deriveGoldAthleteSemanticTokens(ramps: GoldAthleteColorRamps): Record<BrandSemanticRole, SemanticPair> {
  const charcoal = ramps.charcoal[8];
  const charcoalPressed = ramps.charcoal[9];
  const gold = ramps.gold[5];
  const goldSoft = ramps.gold[3];
  const crimson = ramps.crimson[5];
  const crimsonSoft = ramps.crimson[3];
  const ivory = ramps.ivory[1];
  const slate = ramps.slate[6];
  const white = '#ffffff';
  const darkPage = ramps.charcoal[9];
  const darkSurface = '#16191f';

  return {
    'brand.primary': { light: charcoal, dark: ivory },
    'brand.primaryPressed': { light: charcoalPressed, dark: charcoalPressed },
    'brand.accent': { light: gold, dark: goldSoft },
    accent: { light: gold, dark: goldSoft },
    support: { light: crimson, dark: crimsonSoft },
    'bg.canvas': { light: ivory, dark: darkPage },
    'bg.card': { light: white, dark: darkSurface },
    'bg.page': { light: ivory, dark: darkPage },
    'bg.surface': { light: white, dark: darkSurface },
    'bg.inverse': { light: charcoal, dark: charcoal },
    'border.card': { light: '#ede2c6', dark: '#2b303a' },
    'text.body': { light: charcoal, dark: ivory },
    'text.meta': { light: slate, dark: '#d6c8a6' },
    'text.primary': { light: charcoal, dark: ivory },
    'text.secondary': { light: slate, dark: '#d6c8a6' },
    'text.onInverse': { light: ivory, dark: ivory },
    'nav.inactiveOnInverse': { light: 'rgba(251,247,238,0.72)', dark: 'rgba(251,247,238,0.72)' },
    price: { light: ramps.gold[6], dark: goldSoft },
    star: { light: ramps.gold[6], dark: goldSoft },
    'state.success': { light: '#3f6f2a', dark: '#8fc271' },
    'state.warning': { light: '#8a5a00', dark: '#e0a23c' },
    'state.danger': { light: '#b3261e', dark: '#f2786f' },
    'state.info': { light: charcoal, dark: '#aab1ba' },
    'badge.attention': { light: gold, dark: goldSoft },
    'badge.validation': { light: '#3f6f2a', dark: '#8fc271' },
    'badge.info': { light: '#f5eeda', dark: '#232830' },
    'badge.urgencyBg': { light: '#f9cfcc', dark: '#54100c' },
    'focus.ring': { light: ramps.gold[6], dark: '#efd189' },
    'control.disabledBg': { light: '#e7e2d5', dark: '#2b303a' },
    'control.disabledText': { light: '#77746c', dark: '#8a8f99' },
  };
}

export function cssVarName(role: BrandSemanticRole, mode: 'light' | 'dark'): string {
  const base = `--gds-${role.replace('.', '-')}`;
  return mode === 'light' ? base : `${base}-dark`;
}

export function emitCssVariables(tokens: Record<BrandSemanticRole, SemanticPair>): Record<string, string> {
  const vars: Record<string, string> = {};
  (Object.keys(tokens) as BrandSemanticRole[]).forEach((role) => {
    vars[cssVarName(role, 'light')] = tokens[role].light;
    vars[cssVarName(role, 'dark')] = tokens[role].dark;
  });
  vars['--gds-brand-primary-pressed'] = tokens['brand.primaryPressed'].light;
  vars['--gds-brand-primary-pressed-dark'] = tokens['brand.primaryPressed'].dark;
  vars['--gds-text-on-inverse'] = tokens['text.onInverse'].light;
  vars['--gds-text-on-inverse-dark'] = tokens['text.onInverse'].dark;
  // issue #537: DERIVED, never hand-authored. These two lanes bypassed the vibe lanes'
  // ensureContrast derivation, so `support` had no foreground role designed to sit on
  // it and ChoiceChip reached for `text.onInverse` instead - 1.89:1 in class-usa dark
  // against a 4.5:1 requirement. Deriving it here means a new brand lane cannot
  // reintroduce the defect by forgetting to pick a value.
  vars['--gds-text-on-support'] = readableForeground(tokens['support'].light, 4.5, tokens['bg.page'].light);
  vars['--gds-text-on-support-dark'] = readableForeground(tokens['support'].dark, 4.5, tokens['bg.page'].dark);
  vars['--gds-brand-accent-action'] = tokens['brand.accent'].light;
  vars['--gds-brand-accent-action-dark'] = tokens['brand.accent'].dark;
  vars['--gds-brand-accent-tint'] = tokens['badge.urgencyBg'].light;
  vars['--gds-brand-accent-tint-dark'] = tokens['badge.urgencyBg'].dark;
  vars['--gds-bg-info-tag'] = tokens['badge.info'].light;
  vars['--gds-bg-info-tag-dark'] = tokens['badge.info'].dark;
  vars['--gds-bg-surface'] = tokens['bg.surface'].light;
  vars['--gds-bg-surface-dark'] = tokens['bg.surface'].dark;
  vars['--gds-text-primary'] = tokens['text.primary'].light;
  vars['--gds-text-primary-dark'] = tokens['text.primary'].dark;
  vars['--gds-text-secondary'] = tokens['text.secondary'].light;
  vars['--gds-text-secondary-dark'] = tokens['text.secondary'].dark;
  // Issue 586. `cssVarName` derives a name by replacing the dot in a role id, which leaves
  // the camelCase segment intact — so `brand.primaryPressed` and `text.onInverse` were
  // emitted BOTH as `--gds-brand-primaryPressed` and as the explicit kebab aliases below.
  // The kebab spellings are what consumers read (`--gds-text-on-inverse` in 13 files, and
  // brand-tokens.test.ts asserts exactly those); the camelCase twins were referenced by
  // nothing and counted as unreachable tokens under F13.
  //
  // Deleted rather than left in place: a declared token with no rendering path still shows
  // up in the docs and the published graph, telling a consumer it is available when nothing
  // renders it. Only these two go — `--gds-control-disabledBg`/`-disabledText` are also
  // camelCase but ARE consumed (SemanticButton.tsx), so the naming is not uniformly dead
  // and a blanket kebab-casing would break them.
  delete vars['--gds-brand-primaryPressed'];
  delete vars['--gds-brand-primaryPressed-dark'];
  delete vars['--gds-text-onInverse'];
  delete vars['--gds-text-onInverse-dark'];
  vars['--gds-state-success'] = tokens['state.success'].light;
  vars['--gds-state-success-dark'] = tokens['state.success'].dark;
  // Issue 595: badge tone pairs are derived from the state colours above, so they cannot
  // disagree with them and no lane can forget to emit them.
  Object.assign(vars, emitBadgeToneCssVariables(vars));
  return vars;
}

// Issue 554. `createBrandTheme` applied these two overrides AFTER calling the emitter,
// per lane, in its own function body — a THIRD copy of semantic-role data beyond the two
// the issue described. It is why `--gds-brand-accent-action` resolved to gold[6] through
// the provider path and to the vibe-derived value through the document path: the same
// role, two answers, depending on which path painted it.
//
// The lane emitters below are the whole definition of a lane's CSS variables. A caller
// cannot forget the overrides because there is nothing left to remember.

/** Complete `--gds-*` variable set for the Class USA lane. */
export function emitClassUsaCssVariables(ramps: ClassUsaColorRamps): Record<string, string> {
  // Issue 555: axis tokens are part of a lane's complete variable set. Emitting them only on
  // the document path would leave the two consumption paths with different key sets — the
  // exact divergence verify:token-single-source was built to catch.
  const vars = { ...resolveGdsAxisTokens(undefined, 'class-usa'), ...emitCssVariables(deriveClassUsaSemanticTokens(ramps)) };
  vars['--gds-brand-accent-action'] = ramps.action[6];
  vars['--gds-brand-accent-action-dark'] = ramps.brand[5];
  // Issue 597. These overrides land AFTER `emitCssVariables` has already derived the badge
  // foregrounds, so a foreground computed against the pre-override fill is a STALE PAIR — the
  // same "one role, two answers depending on the path" shape as #554 above. Measured: gold
  // athlete light emitted #000000 for a #8a5a00 fill (3.54:1) when white would have given
  // 5.93:1. Re-deriving is idempotent, and it cannot fall out of step with an override again.
  Object.assign(vars, emitBadgeToneCssVariables(vars));
  return vars;
}

/** Complete `--gds-*` variable set for the Gold Athlete lane. */
export function emitGoldAthleteCssVariables(ramps: GoldAthleteColorRamps): Record<string, string> {
  const vars = { ...resolveGdsAxisTokens(undefined, 'gold-athlete'), ...emitCssVariables(deriveGoldAthleteSemanticTokens(ramps)) };
  vars['--gds-brand-accent-action'] = ramps.gold[6];
  vars['--gds-brand-accent-action-dark'] = ramps.gold[3];
  // Issue 597. These overrides land AFTER `emitCssVariables` has already derived the badge
  // foregrounds, so a foreground computed against the pre-override fill is a STALE PAIR — the
  // same "one role, two answers depending on the path" shape as #554 above. Measured: gold
  // athlete light emitted #000000 for a #8a5a00 fill (3.54:1) when white would have given
  // 5.93:1. Re-deriving is idempotent, and it cannot fall out of step with an override again.
  Object.assign(vars, emitBadgeToneCssVariables(vars));
  return vars;
}


// Fixed, non-preset-tinted anchors for the three "alarm" state colors. Verified
// against the two hand-authored presets: `state-danger`/`state-danger-dark` and
// `state-warning-dark` are byte-identical between `class-usa` and `gold-athlete`
// (`#b3261e`/`#f2786f` and `#e0a23c` respectively) — i.e. those roles were never
// preset-tinted to begin with, so the derivation below doesn't tint them either.
const UNIVERSAL_SUCCESS = '#1f8a4c';
const UNIVERSAL_WARNING = '#b45309';
const UNIVERSAL_WARNING_DARK = '#e0a23c';
const UNIVERSAL_DANGER = '#b3261e';
const UNIVERSAL_DANGER_DARK = '#f2786f';

/** Nudges `candidate` toward black/white (in sRGB, matching the runtime `color-mix(in srgb, ...)`) until it clears `minRatio` against `background`, or gives up after 16 steps. */
function toRgba(hexOrRgb: string, alpha: number): string {
  const parsed = parseCssColor(hexOrRgb);
  if (!parsed) {
    return hexOrRgb;
  }
  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${alpha})`;
}

/**
 * Derives the full `--gds-*` semantic role variable set (the same 33-role schema
 * hand-authored for `class-usa`/`gold-athlete` — see `classUsaSemanticCssVariables`)
 * for any vibe theme that doesn't define one of its own, so badges and other
 * semantic-role consumers get a real per-preset color everywhere instead of
 * falling through to the 12 generic `--gds-vibe-*` variables. Several roles reuse
 * an already-WCAG-safe vibe field directly (e.g. `brand-primary` = `textLight`,
 * confirmed identical to that role in both hand-authored presets); the rest are
 * mixed from the preset's own hue and pushed toward black/white with
 * {@link ensureContrast} until they clear WCAG AA/non-text-AA against their
 * background, rather than being hand-picked per preset.
 */
export function deriveVibeSemanticCssVariables(vibe: GdsVibeTheme): Record<string, string> {
  const accentLight = ensureContrast(vibe.accent, vibe.canvasLight, 3, false, vibe.canvasLight);
  const accentDark = ensureContrast(mixCssColors(vibe.accent, '#ffffff', 0.75, vibe.canvasDark), vibe.canvasDark, 3, true, vibe.canvasDark);
  const accentAction = ensureContrast(mixCssColors(vibe.accent, '#000000', 0.75, vibe.canvasLight), vibe.canvasLight, 4.5, false, vibe.canvasLight);

  const successLight = ensureContrast(mixCssColors(UNIVERSAL_SUCCESS, vibe.primary, 0.75, vibe.canvasLight), vibe.canvasLight, 3, false, vibe.canvasLight);
  const successDark = ensureContrast(mixCssColors(UNIVERSAL_SUCCESS, '#ffffff', 0.55, vibe.canvasDark), vibe.canvasDark, 3, true, vibe.canvasDark);
  const warningLight = ensureContrast(mixCssColors(UNIVERSAL_WARNING, vibe.primary, 0.75, vibe.canvasLight), vibe.canvasLight, 3, false, vibe.canvasLight);
  const infoDark = ensureContrast(mixCssColors(vibe.mutedDark, '#ffffff', 0.3, vibe.canvasDark), vibe.canvasDark, 3, true, vibe.canvasDark);

  const bgCardDark = mixCssColors(vibe.canvasDark, '#ffffff', 0.88, vibe.canvasDark);
  const navInactiveOnInverse = toRgba(vibe.textDark, 0.72);

  const badgeInfoLight = mixCssColors(vibe.canvasLight, vibe.textLight, 0.92, vibe.canvasLight);
  const badgeInfoDark = mixCssColors(vibe.canvasDark, vibe.textDark, 0.85, vibe.canvasDark);
  const badgeUrgencyBgLight = mixCssColors('#ffffff', UNIVERSAL_DANGER, 0.85, vibe.canvasLight);
  const badgeUrgencyBgDark = mixCssColors(vibe.canvasDark, UNIVERSAL_DANGER, 0.75, vibe.canvasDark);

  const controlDisabledBgLight = mixCssColors(vibe.canvasLight, vibe.mutedLight, 0.85, vibe.canvasLight);
  const controlDisabledBgDark = mixCssColors(vibe.canvasDark, vibe.mutedDark, 0.75, vibe.canvasDark);

  const supportLight = mixCssColors(vibe.mutedLight, accentLight, 0.6, vibe.canvasLight);
  const supportDark = mixCssColors(vibe.mutedDark, accentDark, 0.6, vibe.canvasDark);
  // issue #537: `support` is a background the theme picks freely, so neither a light
  // nor a dark foreground can be assumed across 25 presets x 2 schemes. Derive it.
  // ChoiceChip previously paired `text.onInverse` with `support` - two roles never
  // designed to meet - which passed here only because these lanes run through
  // ensureContrast at all, and failed outright in the hand-authored brand lanes.
  const textOnSupportLight = readableForeground(supportLight, 4.5, vibe.canvasLight);
  const textOnSupportDark = readableForeground(supportDark, 4.5, vibe.canvasDark);

  const derived: Record<string, string> = {
    '--gds-brand-primary': vibe.textLight,
    '--gds-brand-primary-dark': vibe.textDark,
    '--gds-brand-primary-pressed': vibe.canvasDark,
    '--gds-brand-primary-pressed-dark': vibe.canvasDark,
    '--gds-brand-accent': accentLight,
    '--gds-brand-accent-dark': accentDark,
    '--gds-brand-accent-action': accentAction,
    '--gds-brand-accent-action-dark': accentAction,
    '--gds-accent': accentLight,
    '--gds-accent-dark': accentDark,
    '--gds-support': supportLight,
    '--gds-support-dark': supportDark,
    '--gds-text-on-support': textOnSupportLight,
    '--gds-text-on-support-dark': textOnSupportDark,
    '--gds-bg-canvas': vibe.canvasLight,
    '--gds-bg-canvas-dark': vibe.canvasDark,
    '--gds-bg-card': '#ffffff',
    '--gds-bg-card-dark': bgCardDark,
    '--gds-bg-page': vibe.canvasLight,
    '--gds-bg-page-dark': vibe.canvasDark,
    '--gds-bg-surface': '#ffffff',
    '--gds-bg-surface-dark': bgCardDark,
    '--gds-bg-inverse': vibe.textLight,
    '--gds-bg-inverse-dark': vibe.textLight,
    '--gds-border-card': vibe.borderLight,
    '--gds-border-card-dark': vibe.borderDark,
    '--gds-text-body': vibe.textLight,
    '--gds-text-body-dark': vibe.textDark,
    '--gds-text-meta': vibe.mutedLight,
    '--gds-text-meta-dark': vibe.mutedDark,
    '--gds-text-primary': vibe.textLight,
    '--gds-text-primary-dark': vibe.textDark,
    '--gds-text-secondary': vibe.mutedLight,
    '--gds-text-secondary-dark': vibe.mutedDark,
    '--gds-text-on-inverse': vibe.textDark,
    '--gds-text-on-inverse-dark': vibe.textDark,
    '--gds-nav-inactiveOnInverse': navInactiveOnInverse,
    '--gds-nav-inactiveOnInverse-dark': navInactiveOnInverse,
    '--gds-price': accentLight,
    '--gds-price-dark': accentDark,
    '--gds-star': accentLight,
    '--gds-star-dark': accentDark,
    '--gds-state-success': successLight,
    '--gds-state-success-dark': successDark,
    '--gds-state-warning': warningLight,
    '--gds-state-warning-dark': UNIVERSAL_WARNING_DARK,
    '--gds-state-danger': UNIVERSAL_DANGER,
    '--gds-state-danger-dark': UNIVERSAL_DANGER_DARK,
    '--gds-state-info': vibe.textLight,
    '--gds-state-info-dark': infoDark,
    '--gds-badge-attention': accentLight,
    '--gds-badge-attention-dark': accentDark,
    '--gds-badge-validation': successLight,
    '--gds-badge-validation-dark': successDark,
    '--gds-badge-info': badgeInfoLight,
    '--gds-badge-info-dark': badgeInfoDark,
    '--gds-badge-urgencyBg': badgeUrgencyBgLight,
    '--gds-badge-urgencyBg-dark': badgeUrgencyBgDark,
    '--gds-bg-info-tag': badgeInfoLight,
    '--gds-bg-info-tag-dark': badgeInfoDark,
    '--gds-brand-accent-tint': badgeUrgencyBgLight,
    '--gds-brand-accent-tint-dark': badgeUrgencyBgDark,
    '--gds-focus-ring': accentAction,
    '--gds-focus-ring-dark': accentDark,
    '--gds-control-disabledBg': controlDisabledBgLight,
    '--gds-control-disabledBg-dark': controlDisabledBgDark,
    '--gds-control-disabledText': vibe.mutedLight,
    '--gds-control-disabledText-dark': vibe.mutedDark,
  };
  // Issue 595: badge tone pairs are derived from the state colours above, so they cannot
  // disagree with them and no lane can forget to emit them.
  Object.assign(derived, emitBadgeToneCssVariables(derived));
  return derived;
}


/**
 * Badge tone pairs with COMPUTED foregrounds (issue 595, resolving #534).
 *
 * Two distinct defects, both measured before this was written:
 *
 * 1. #534 — `StatusBadge` renders Mantine's `variant="light"`: pastel text on a low-alpha
 *    tint of the same hue. Swept in dark mode it measures 1.81:1 and 2.55:1, well under any
 *    threshold. GDS never controlled that pair, because it came from Mantine's variant rather
 *    than from a GDS token.
 *
 * 2. Found while verifying the first — `toneColors.success` reads `--gds-state-success` while
 *    the other three tones read their `-dark` variants. With a fixed white foreground it
 *    fails 4.5:1 in 9 of 25 presets in LIGHT mode (class-usa 4.10, sunset 4.40). That is a
 *    shipped defect, not a theoretical one, and the inconsistency is why it survived: three
 *    tones were pinned dark and one was not.
 *
 * The fix for both is the same and it is the pattern issue 537 established for `support`:
 * never pair a fixed foreground with a variable background. The foreground is DERIVED against
 * the background it actually lands on, per preset, per scheme.
 */
const BADGE_TONES = ['success', 'warning', 'danger', 'info'] as const;

export function emitBadgeToneCssVariables(base: Record<string, string>): Record<string, string> {
  const vars: Record<string, string> = {};
  const page = base['--gds-bg-page'] ?? '#ffffff';
  const card = base['--gds-bg-card'] ?? page;
  const pageDark = base['--gds-bg-page-dark'] ?? '#000000';
  const cardDark = base['--gds-bg-card-dark'] ?? pageDark;

  for (const tone of BADGE_TONES) {
    for (const [suffix, surface] of [['', card], ['-dark', cardDark]] as const) {
      const solid = base[`--gds-state-${tone}${suffix}`];
      if (!solid) continue;

      // SOLID lane: the badge is filled with the state colour.
      vars[`--gds-badge-solid-${tone}${suffix}`] = solid;
      vars[`--gds-badge-solid-${tone}-fg${suffix}`] = readableForeground(solid, 4.5, surface);

      // SOFT lane: a tint of the state colour over the card surface, which is what
      // `variant="light"` was approximating without any contrast guarantee. Mixing against a
      // real surface rather than using alpha means the result is an opaque colour whose
      // contrast can actually be computed — an rgba tint cannot be, which is precisely how
      // 1.81:1 shipped unnoticed.
      const tint = mixCssColors(solid, surface, 0.16, surface);
      vars[`--gds-badge-soft-${tone}${suffix}`] = tint;
      vars[`--gds-badge-soft-${tone}-fg${suffix}`] = readableForeground(tint, 4.5, surface);
    }
  }

  // BRAND FILLS used as badge backgrounds get a derived foreground too. `FitScoreChip` paired
  // `--gds-brand-accent` with `--gds-text-on-inverse` — a near-white meant for the INVERSE
  // surface, not for a brand colour the theme picks freely. It measured 3.44:1. A fixed
  // foreground on a themeable fill is the same defect wherever it appears, so the fix is the
  // same: derive it against the fill.
  for (const fill of ['--gds-brand-primary', '--gds-brand-accent', '--gds-brand-accent-action', '--gds-bg-info-tag', '--gds-brand-accent-tint']) {
    for (const [suffix, surface] of [['', card], ['-dark', cardDark]]) {
      const value = base[`${fill}${suffix}`] ?? base[fill];
      if (!value) continue;
      vars[`${fill}-fg${suffix}`] = readableForeground(value, 4.5, surface);
    }
  }

  // NEUTRAL is not a state colour; it is the card surface itself with a governed border.
  for (const [suffix, surface] of [['', card], ['-dark', cardDark]] as const) {
    vars[`--gds-badge-soft-neutral${suffix}`] = surface;
    vars[`--gds-badge-soft-neutral-fg${suffix}`] = readableForeground(surface, 4.5, surface);
    // SOLID neutral is a real neutral FILL, not the card surface: its consumer is the count
    // badge, a pill that has to read as an object sitting on the card rather than a hole in
    // it. Its foreground is derived like every other tone — `GdsCountBadge` previously paired
    // white with `--gds-state-info-dark`, assuming the name meant a dark colour. It resolves
    // to rgb(239, 242, 246). That badge shipped at 1.07:1.
    const neutralFill = base[`--gds-text-meta${suffix}`] ?? base['--gds-text-meta'] ?? surface;
    vars[`--gds-badge-solid-neutral${suffix}`] = neutralFill;
    vars[`--gds-badge-solid-neutral-fg${suffix}`] = readableForeground(neutralFill, 4.5, surface);
  }
  return vars;
}
