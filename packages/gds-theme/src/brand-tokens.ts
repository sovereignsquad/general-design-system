import { mergeThemeOverrides, type MantineColorsTuple, type MantineTheme, type MantineThemeOverride } from '@mantine/core';
import { createPublicBrandTheme } from './theme';
import { readableForeground } from './color-math';
import {
  validateGdsTokenGraph,
  type GdsTokenGraph,
  type GdsTokenNode,
  type GdsTokenValidationFinding,
} from './token-operations';

/**
 * Governed brand-theme entry point (gap B2 / issue #316).
 *
 * Consumers pass five brand color ramps and two font families and receive a
 * fully tokened Mantine theme, a brand-named semantic CSS-variable map, and a
 * validated token graph. Components read the emitted `--gds-*` variables instead
 * of hardcoding hex, keeping brand application inside GDS token governance.
 */

/** Five brand color ramps consumed by the legacy `createBrandTheme(options)` entry point. */
export interface BrandColorRamps {
  /** Primary brand color (e.g. navy). Drives `brand.primary` / `bg.inverse`. */
  navy: string;
  /** Accent brand color (e.g. terracotta). Drives `brand.accent` / `price`. */
  terracotta: string;
  /** Positive/validation accent (e.g. sage). Drives `state.success`. */
  sage: string;
  /** Page background (e.g. cream). Drives `bg.page`. */
  cream: string;
  /** Secondary text / inactive (e.g. slate). Drives `text.secondary`. */
  slate: string;
}

/** Display and body font families for a brand theme. */
export interface BrandFonts {
  /** Display font applied to headings (e.g. 'Bogart'). */
  display: string;
  /** Body font applied to body copy (e.g. 'Garet'). */
  body: string;
}

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

/** Options for `createBrandTheme('class-usa', ...)`; every field is optional and falls back to the built-in Class USA defaults. */
export interface CreateClassUsaBrandThemeOptions {
  /** Override any subset of the Class USA color ramps. */
  colorRamps?: Partial<ClassUsaColorRamps>;
  /** Override the display and/or body font. */
  fonts?: Partial<BrandFonts>;
  /** Flatten surfaces (no shadows); defaults to `true` for this brand. */
  flatSurfaces?: boolean;
  /** Discouraged escape hatch merged last; governed roles still win over collisions. */
  overrides?: MantineThemeOverride;
}

/** Ramp key of the built-in Gold Athlete brand palette. */
export type GoldAthleteColorRampName = 'gold' | 'charcoal' | 'crimson' | 'ivory' | 'slate';

/** The five Gold Athlete brand ramps keyed by name. */
export type GoldAthleteColorRamps = Record<GoldAthleteColorRampName, BrandColorRamp>;

/** Options for `createBrandTheme('gold-athlete', ...)`; every field is optional and falls back to the built-in Gold Athlete defaults. */
export interface CreateGoldAthleteBrandThemeOptions {
  /** Override any subset of the Gold Athlete color ramps. */
  colorRamps?: Partial<GoldAthleteColorRamps>;
  /** Override the display and/or body font. */
  fonts?: Partial<BrandFonts>;
  /** Flatten surfaces (no shadows); defaults to `true` for this brand. */
  flatSurfaces?: boolean;
  /** Discouraged escape hatch merged last; governed roles still win over collisions. */
  overrides?: MantineThemeOverride;
}

/** Options for the legacy `createBrandTheme(options)` entry point (five ramps plus two fonts). */
export interface CreateBrandThemeOptions {
  /** Five brand color ramps (required). */
  brandColors: BrandColorRamps;
  /** Display and body fonts (required). */
  fonts: BrandFonts;
  /** Flatten surfaces (no shadows). Preserved from `createPublicBrandTheme`. */
  flatSurfaces?: boolean;
  /** Discouraged escape hatch; governed roles always win over collisions. */
  overrides?: MantineThemeOverride;
}

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

/** Result of `createBrandTheme(...)`: the Mantine theme plus its governed token outputs. */
export interface BrandThemeResult {
  /** Fully composed Mantine theme, ready to pass to `GdsProvider`. */
  mantineTheme: MantineTheme;
  /** Brand-named semantic variables, light and dark, for injection at `:root`. */
  cssVariables: Record<string, string>;
  /** Validated token graph (themeId `brand`) for snapshotting and diffing. */
  tokenGraph: GdsTokenGraph;
}

/** Error thrown when brand theme input, WCAG contrast, or token-graph validation fails; carries the collected findings. */
export class GdsBrandThemeError extends Error {
  readonly findings: GdsTokenValidationFinding[];
  constructor(message: string, findings: GdsTokenValidationFinding[] = []) {
    super(message);
    this.name = 'GdsBrandThemeError';
    this.findings = findings;
  }
}

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const REQUIRED_RAMPS: (keyof BrandColorRamps)[] = ['navy', 'terracotta', 'sage', 'cream', 'slate'];
// v2 re-base (issue 536): six role-named ramps replace the retired five
// (navy/terracotta/sage/cream/slate), against
// `brand-requests/class-usa/class-usa-v2-token-spec.md`. `action[2]` was a
// text placeholder in the handoff spec ("one step above is a placeholder and
// must be replaced before build") — the spec's own suggested value
// (`#e8a87c`) is used here. Every anchor step (navy[6], brand[5], action[6],
// action[7]/pressed, trust[6], cream[0], slate[6]) matches the spec's
// "Anchors" table exactly.
const classUsaDefaultColorRamps: ClassUsaColorRamps = {
  navy: ['#e9eef6', '#cdd8e6', '#a3b6cc', '#7691b0', '#4e6d92', '#2a4a70', '#0f2c4a', '#0c243d', '#0a1d31', '#071626'],
  brand: ['#fdeee6', '#fbd8c6', '#f9bb9c', '#f79c70', '#f68a55', '#f5793b', '#e0641f', '#c25317', '#9e4312', '#7a330d'],
  action: ['#fbe9df', '#f6cdb8', '#e8a87c', '#e08a52', '#d4691f', '#c85307', '#c24a0a', '#a33e07', '#843205', '#652604'],
  trust: ['#eef5f0', '#d8e7dd', '#b6d2c0', '#92bca2', '#71a586', '#5a9370', '#4f8a5b', '#3f6f4a', '#31573a', '#24402b'],
  cream: ['#faf7f1', '#f4eee2', '#ece3d1', '#e3d6bd', '#d9c9a8', '#cdba92', '#bfad80', '#a8946a', '#8a7a57', '#6b5e44'],
  slate: ['#f7f8fa', '#eceef2', '#d9dde4', '#c0c6d0', '#a2aab7', '#848d9c', '#5b6573', '#48505c', '#373d47', '#262b33'],
};

const classUsaDefaultFonts: BrandFonts = {
  display: '"Playfair Display",Georgia,serif',
  body: 'Inter,system-ui,ui-sans-serif',
};

const goldAthleteDefaultColorRamps: GoldAthleteColorRamps = {
  gold: ['#fbf3df', '#f6e4b8', '#efd189', '#e7bd5c', '#dca733', '#c08a12', '#8a5a00', '#6f4700', '#573700', '#3f2800'],
  charcoal: ['#eef0f2', '#d4d8dd', '#aab1ba', '#7e8894', '#586472', '#39424e', '#232a33', '#1a1f27', '#12161c', '#0a0d12'],
  crimson: ['#fdeceb', '#f9cfcc', '#f0a49e', '#e5776e', '#d64f44', '#b3261e', '#8f1c16', '#711511', '#54100c', '#3a0b08'],
  ivory: ['#fdfbf5', '#fbf7ee', '#f5eeda', '#ede1c2', '#e2d0a4', '#cdb47c', '#a98f57', '#856f42', '#5f4f2f', '#3c311d'],
  slate: ['#f5f6f8', '#e6e9ee', '#ccd2da', '#a9b3bf', '#7f8b9a', '#5a6675', '#414b57', '#323a44', '#232830', '#15181d'],
};

const goldAthleteDefaultFonts: BrandFonts = {
  display: '"Bogart","Archivo","Anton"',
  body: '"Garet","Inter",ui-sans-serif',
};

function assertColorRamp(name: string, ramp: readonly string[] | undefined): GdsTokenValidationFinding[] {
  if (!ramp) {
    return [{ severity: 'error', rule: 'token.invalid-color', tokenId: `colorRamps.${name}`, message: `Missing color ramp "${name}".` }];
  }
  if (ramp.length !== 10) {
    return [{ severity: 'error', rule: 'token.invalid-color', tokenId: `colorRamps.${name}`, message: `Color ramp "${name}" must contain exactly 10 color steps.` }];
  }
  return ramp.flatMap((value, index) => HEX_PATTERN.test(value)
    ? []
    : [{ severity: 'error' as const, rule: 'token.invalid-color' as const, tokenId: `colorRamps.${name}.${index}`, message: `Color ramp "${name}" step ${index} must be a 3- or 6-digit hex color, received "${value}".` }]);
}

function mergeClassUsaColorRamps(overrides: Partial<ClassUsaColorRamps> = {}): ClassUsaColorRamps {
  return {
    navy: overrides.navy ?? classUsaDefaultColorRamps.navy,
    brand: overrides.brand ?? classUsaDefaultColorRamps.brand,
    action: overrides.action ?? classUsaDefaultColorRamps.action,
    trust: overrides.trust ?? classUsaDefaultColorRamps.trust,
    cream: overrides.cream ?? classUsaDefaultColorRamps.cream,
    slate: overrides.slate ?? classUsaDefaultColorRamps.slate,
  };
}

function mergeGoldAthleteColorRamps(overrides: Partial<GoldAthleteColorRamps> = {}): GoldAthleteColorRamps {
  return {
    gold: overrides.gold ?? goldAthleteDefaultColorRamps.gold,
    charcoal: overrides.charcoal ?? goldAthleteDefaultColorRamps.charcoal,
    crimson: overrides.crimson ?? goldAthleteDefaultColorRamps.crimson,
    ivory: overrides.ivory ?? goldAthleteDefaultColorRamps.ivory,
    slate: overrides.slate ?? goldAthleteDefaultColorRamps.slate,
  };
}

function expandHex(hex: string): [number, number, number] {
  const trimmed = hex.trim();
  if (!HEX_PATTERN.test(trimmed)) {
    throw new Error(`brandContrastRatio expects a "#"-prefixed 3- or 6-digit hex color, received "${hex}".`);
  }
  let value = trimmed.slice(1);
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const int = parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function relativeLuminance(hex: string): number {
  const channels = expandHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two opaque `#`-prefixed 3- or 6-digit hex colors; throws on any other input (e.g. a CSS variable reference) instead of silently scoring against black. */
export function brandContrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

interface SemanticPair {
  light: string;
  dark: string;
}

/**
 * Deterministically derive the full brand semantic role set (light + dark) from
 * the five brand ramps. Dark values are anchored to navy so the palette holds
 * together in dark mode.
 */
export function deriveBrandSemanticTokens(colors: BrandColorRamps): Record<BrandSemanticRole, SemanticPair> {
  const { navy, terracotta, sage, cream, slate } = colors;
  const white = '#ffffff';
  const darkSurface = '#13243d';
  const darkPage = '#0b1a30';

  return {
    'brand.primary': { light: navy, dark: cream },
    'brand.primaryPressed': { light: '#07182c', dark: '#07182c' },
    'brand.accent': { light: terracotta, dark: terracotta },
    accent: { light: terracotta, dark: '#e1a892' },
    support: { light: sage, dark: '#a9b89c' },
    'bg.canvas': { light: cream, dark: darkPage },
    'bg.card': { light: white, dark: darkSurface },
    'bg.page': { light: cream, dark: darkPage },
    'bg.surface': { light: white, dark: darkSurface },
    'bg.inverse': { light: navy, dark: navy },
    'border.card': { light: '#eee7dd', dark: '#2d3b50' },
    'text.body': { light: navy, dark: cream },
    'text.meta': { light: slate, dark: '#aeb6c2' },
    'text.primary': { light: navy, dark: cream },
    'text.secondary': { light: slate, dark: '#aeb6c2' },
    'text.onInverse': { light: cream, dark: cream },
    'nav.inactiveOnInverse': { light: 'rgba(250,247,241,0.72)', dark: 'rgba(250,247,241,0.72)' },
    price: { light: terracotta, dark: '#e0a892' },
    star: { light: terracotta, dark: '#e0a892' },
    'state.success': { light: sage, dark: sage },
    'state.warning': { light: '#b9770f', dark: '#e0a23c' },
    'state.danger': { light: '#b3261e', dark: '#f2786f' },
    'state.info': { light: navy, dark: '#9db4d6' },
    'badge.attention': { light: terracotta, dark: '#e1a892' },
    'badge.validation': { light: sage, dark: '#a9b89c' },
    'badge.info': { light: '#f1ece4', dark: '#2b3427' },
    'badge.urgencyBg': { light: '#f5ddd5', dark: '#5d2f22' },
    'focus.ring': { light: terracotta, dark: '#ffd7c8' },
    'control.disabledBg': { light: '#e6e2da', dark: '#2d3440' },
    'control.disabledText': { light: '#7a7280', dark: '#8d97a6' },
  };
}

// v2 re-base (issue 536), values pasted from `class-usa-v2-token-spec.md`'s
// "Semantic tokens" table. The light/dark split on `brand.accent`/`accent` is
// the point of the whole re-base: `action[6]` (#c24a0a) carries text on warm
// white/cream, `brand[5]` (#f5793b) carries it on the dark-mode charcoal
// canvas — computed contrast in the spec's "Contrast, computed" table shows
// neither clears WCAG AA in the other scheme, so this is NOT a
// light-value-reused-in-dark shortcut (the exact failure mode behind issues
// #533/#534) — every value below was independently authored per scheme.
function deriveClassUsaSemanticTokens(ramps: ClassUsaColorRamps): Record<BrandSemanticRole, SemanticPair> {
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

function deriveGoldAthleteSemanticTokens(ramps: GoldAthleteColorRamps): Record<BrandSemanticRole, SemanticPair> {
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

function cssVarName(role: BrandSemanticRole, mode: 'light' | 'dark'): string {
  const base = `--gds-${role.replace('.', '-')}`;
  return mode === 'light' ? base : `${base}-dark`;
}

function emitCssVariables(tokens: Record<BrandSemanticRole, SemanticPair>): Record<string, string> {
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
  vars['--gds-state-success'] = tokens['state.success'].light;
  vars['--gds-state-success-dark'] = tokens['state.success'].dark;
  return vars;
}

function buildTokenGraph(colors: BrandColorRamps, tokens: Record<BrandSemanticRole, SemanticPair>, themeId: 'brand' | 'class-usa' | 'gold-athlete' = 'brand'): GdsTokenGraph {
  const node = (
    id: string,
    role: GdsTokenNode['role'],
    value: string,
    mode: GdsTokenNode['mode'],
  ): GdsTokenNode => ({ id: `${themeId}.${id}`, themeId, role, value, category: 'color', mode });

  const nodes: GdsTokenNode[] = [
    node('primary', 'primary', colors.navy, 'shared'),
    node('accent', 'accent', colors.terracotta, 'shared'),
    node('canvas-light', 'canvas-light', tokens['bg.canvas'].light, 'light'),
    node('canvas-dark', 'canvas-dark', tokens['bg.canvas'].dark, 'dark'),
    node('shell-light', 'shell-light', tokens['bg.inverse'].light, 'light'),
    node('shell-dark', 'shell-dark', tokens['bg.inverse'].dark, 'dark'),
    node('surface-light', 'surface-light', tokens['bg.card'].light, 'light'),
    node('surface-dark', 'surface-dark', tokens['bg.card'].dark, 'dark'),
    node('border-light', 'border-light', tokens['border.card'].light, 'light'),
    node('border-dark', 'border-dark', tokens['border.card'].dark, 'dark'),
    node('text-light', 'text-light', tokens['text.body'].light, 'light'),
    node('text-dark', 'text-dark', tokens['text.body'].dark, 'dark'),
    node('muted-light', 'muted-light', tokens['text.meta'].light, 'light'),
    node('muted-dark', 'muted-dark', tokens['text.meta'].dark, 'dark'),
  ];

  return {
    generatedAt: new Date(0).toISOString(),
    themeCount: 1,
    tokenCount: nodes.length,
    themes: [themeId],
    nodes,
  };
}

function validateBrandInput(opts: CreateBrandThemeOptions): GdsTokenValidationFinding[] {
  const findings: GdsTokenValidationFinding[] = [];
  const colors = opts.brandColors;
  if (!colors) {
    findings.push({ severity: 'error', rule: 'token.invalid-color', tokenId: 'brandColors', message: 'brandColors is required.' });
    return findings;
  }
  for (const key of REQUIRED_RAMPS) {
    const value = colors[key];
    if (!value) {
      findings.push({ severity: 'error', rule: 'token.invalid-color', tokenId: `brandColors.${key}`, message: `Missing brand ramp "${key}".` });
    } else if (!HEX_PATTERN.test(value.trim())) {
      findings.push({ severity: 'error', rule: 'token.invalid-color', tokenId: `brandColors.${key}`, message: `Brand ramp "${key}" must be a 3- or 6-digit hex color, received "${value}".` });
    }
  }
  if (!opts.fonts?.display) {
    findings.push({ severity: 'error', rule: 'token.unknown-role', tokenId: 'fonts.display', message: 'fonts.display is required.' });
  }
  if (!opts.fonts?.body) {
    findings.push({ severity: 'error', rule: 'token.unknown-role', tokenId: 'fonts.body', message: 'fonts.body is required.' });
  }
  return findings;
}

function validateClassUsaInput(opts: CreateClassUsaBrandThemeOptions): GdsTokenValidationFinding[] {
  const ramps = mergeClassUsaColorRamps(opts.colorRamps);
  const findings = (Object.keys(ramps) as ClassUsaColorRampName[]).flatMap((name) => assertColorRamp(name, ramps[name]));

  if (opts.fonts?.display === '') {
    findings.push({ severity: 'error', rule: 'token.unknown-role', tokenId: 'fonts.display', message: 'fonts.display cannot be empty.' });
  }
  if (opts.fonts?.body === '') {
    findings.push({ severity: 'error', rule: 'token.unknown-role', tokenId: 'fonts.body', message: 'fonts.body cannot be empty.' });
  }

  return findings;
}

function validateGoldAthleteInput(opts: CreateGoldAthleteBrandThemeOptions): GdsTokenValidationFinding[] {
  const ramps = mergeGoldAthleteColorRamps(opts.colorRamps);
  const findings = (Object.keys(ramps) as GoldAthleteColorRampName[]).flatMap((name) => assertColorRamp(name, ramps[name]));

  if (opts.fonts?.display === '') {
    findings.push({ severity: 'error', rule: 'token.unknown-role', tokenId: 'fonts.display', message: 'fonts.display cannot be empty.' });
  }
  if (opts.fonts?.body === '') {
    findings.push({ severity: 'error', rule: 'token.unknown-role', tokenId: 'fonts.body', message: 'fonts.body cannot be empty.' });
  }

  return findings;
}

interface ContrastRequirement {
  foreground: string;
  background: string;
  min: number;
  label: string;
}

function assertContrast(tokens: Record<BrandSemanticRole, SemanticPair>): GdsTokenValidationFinding[] {
  const requirements: ContrastRequirement[] = [
    { foreground: tokens['text.primary'].light, background: tokens['bg.page'].light, min: 4.5, label: 'text.primary on bg.page' },
    { foreground: tokens['text.primary'].light, background: tokens['bg.surface'].light, min: 4.5, label: 'text.primary on bg.surface' },
    { foreground: tokens['text.onInverse'].light, background: tokens['bg.inverse'].light, min: 4.5, label: 'text.onInverse on bg.inverse' },
    { foreground: tokens['text.secondary'].light, background: tokens['bg.page'].light, min: 4.5, label: 'text.secondary on bg.page' },
    // issue #537: gate the pairing that RENDERS, in both schemes. The absence of this
    // requirement is why a 1.89:1 selected chip shipped while every existing contrast
    // gate stayed green - they all checked designed pairings, and this pairing was
    // never designed at all.
    { foreground: readableForeground(tokens['support'].light, 4.5, tokens['bg.page'].light), background: tokens['support'].light, min: 4.5, label: 'text.onSupport on support (light)' },
    { foreground: readableForeground(tokens['support'].dark, 4.5, tokens['bg.page'].dark), background: tokens['support'].dark, min: 4.5, label: 'text.onSupport on support (dark)' },
  ];
  const findings: GdsTokenValidationFinding[] = [];
  for (const req of requirements) {
    const ratio = brandContrastRatio(req.foreground, req.background);
    if (ratio < req.min) {
      findings.push({
        severity: 'error',
        rule: 'token.invalid-color',
        tokenId: req.label,
        message: `${req.label} contrast is ${ratio}:1; expected at least ${req.min}:1.`,
      });
    }
  }
  return findings;
}

/**
 * Builds a governed brand theme and returns its Mantine theme, semantic
 * CSS-variable map, and validated token graph. Throws `GdsBrandThemeError` when
 * input, WCAG contrast, or token-graph validation fails.
 *
 * Overload: the built-in `'class-usa'` brand, optionally customized.
 */
export function createBrandTheme(id: 'class-usa', options?: CreateClassUsaBrandThemeOptions): BrandThemeResult;
/** Overload: the built-in `'gold-athlete'` brand, optionally customized. */
export function createBrandTheme(id: 'gold-athlete', options?: CreateGoldAthleteBrandThemeOptions): BrandThemeResult;
/** Overload: a custom brand derived from five color ramps and two fonts. */
export function createBrandTheme(options: CreateBrandThemeOptions): BrandThemeResult;
/** Implementation dispatching to the `createBrandTheme` overloads above. */
export function createBrandTheme(
  idOrOptions: 'class-usa' | 'gold-athlete' | CreateBrandThemeOptions,
  maybeOptions: CreateClassUsaBrandThemeOptions | CreateGoldAthleteBrandThemeOptions = {},
): BrandThemeResult {
  if (idOrOptions === 'class-usa') {
    return createClassUsaBrandTheme(maybeOptions);
  }
  if (idOrOptions === 'gold-athlete') {
    return createGoldAthleteBrandTheme(maybeOptions);
  }
  return createLegacyBrandTheme(idOrOptions);
}

function createLegacyBrandTheme(opts: CreateBrandThemeOptions): BrandThemeResult {
  const inputFindings = validateBrandInput(opts);
  if (inputFindings.length > 0) {
    throw new GdsBrandThemeError('Invalid brand theme input.', inputFindings);
  }

  const tokens = deriveBrandSemanticTokens(opts.brandColors);

  const contrastFindings = assertContrast(tokens);
  if (contrastFindings.length > 0) {
    throw new GdsBrandThemeError('Brand theme failed WCAG AA contrast requirements.', contrastFindings);
  }

  const tokenGraph = buildTokenGraph(opts.brandColors, tokens);
  const graphReport = validateGdsTokenGraph(tokenGraph);
  if (!graphReport.ok) {
    throw new GdsBrandThemeError('Brand token graph failed validation.', graphReport.findings);
  }

  const cssVariables = emitCssVariables(tokens);

  const brandOverrides: MantineThemeOverride = {
    fontFamily: `${opts.fonts.body}, system-ui, sans-serif`,
    headings: { fontFamily: `${opts.fonts.display}, Georgia, serif` },
    primaryColor: 'brand',
    colors: {
      brand: [
        tokens['bg.page'].light,
        '#e9d9cd',
        '#dcc0ac',
        '#cfa68b',
        opts.brandColors.terracotta,
        opts.brandColors.terracotta,
        '#b56e57',
        opts.brandColors.navy,
        opts.brandColors.navy,
        '#06182f',
      ] as unknown as MantineColorsTuple,
    },
    other: {
      gdsBrandThemeId: 'brand',
      gdsCssVariables: cssVariables,
    },
  };

  const mantineTheme = createPublicBrandTheme({
    flatSurfaces: opts.flatSurfaces,
    overrides: mergeThemeOverrides(brandOverrides, opts.overrides ?? {}),
  });

  return { mantineTheme, cssVariables, tokenGraph };
}

function createClassUsaBrandTheme(options: CreateClassUsaBrandThemeOptions = {}): BrandThemeResult {
  const inputFindings = validateClassUsaInput(options);
  if (inputFindings.length > 0) {
    throw new GdsBrandThemeError('Invalid Class USA brand theme input.', inputFindings);
  }

  const ramps = mergeClassUsaColorRamps(options.colorRamps);
  const fonts: BrandFonts = {
    display: options.fonts?.display ?? classUsaDefaultFonts.display,
    body: options.fonts?.body ?? classUsaDefaultFonts.body,
  };
  const tokens = deriveClassUsaSemanticTokens(ramps);
  const contrastFindings = assertContrast(tokens);
  // `Button.defaultProps.color` is `classUsaAction` (v2 re-base, issue 536),
  // so the primary-button contrast gate must check white against the accent
  // (action) color the button actually renders, not `brand.primary` (navy,
  // now used for chrome only) — matches the spec's own "primary-button gate"
  // contrast entry: white on `action[6]` (#c24a0a) = 4.9:1.
  if (brandContrastRatio('#ffffff', tokens['brand.accent'].light) < 4.5) {
    contrastFindings.push({
      severity: 'error',
      rule: 'token.invalid-color',
      tokenId: 'class-usa.primary-button',
      message: 'Class USA primary button text contrast must stay at least 4.5:1.',
    });
  }
  if (contrastFindings.length > 0) {
    throw new GdsBrandThemeError('Class USA brand theme failed WCAG contrast requirements.', contrastFindings);
  }

  const colors: BrandColorRamps = {
    navy: tokens['brand.primary'].light,
    terracotta: tokens.accent.light,
    sage: tokens.support.light,
    cream: tokens['bg.canvas'].light,
    slate: tokens['text.meta'].light,
  };
  const tokenGraph = buildTokenGraph(colors, tokens, 'class-usa');
  const graphReport = validateGdsTokenGraph(tokenGraph);
  if (!graphReport.ok) {
    throw new GdsBrandThemeError('Class USA token graph failed validation.', graphReport.findings);
  }

  const cssVariables = emitCssVariables(tokens);
  cssVariables['--gds-brand-accent-action'] = ramps.action[6];
  cssVariables['--gds-brand-accent-action-dark'] = ramps.brand[5];
  const brandOverrides: MantineThemeOverride = {
    fontFamily: `${fonts.body}, system-ui, sans-serif`,
    headings: {
      fontFamily: `${fonts.display}, Georgia, serif`,
      sizes: {
        h1: { fontSize: '2.375rem', fontWeight: '800', lineHeight: '1.12' },
        h2: { fontSize: '1.75rem', fontWeight: '700', lineHeight: '1.2' },
        h3: { fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.25' },
      },
    },
    // v2 re-base (issue 536): `primaryColor` stays navy for chrome (nav,
    // headings, inverse surfaces); `Button.defaultProps.color` below points
    // at the action ramp instead, so CTAs read orange without changing what
    // "primary" means for the rest of the theme.
    primaryColor: 'classUsaNavy',
    colors: {
      classUsaNavy: ramps.navy as unknown as MantineColorsTuple,
      classUsaBrand: ramps.brand as unknown as MantineColorsTuple,
      classUsaAction: ramps.action as unknown as MantineColorsTuple,
      classUsaTrust: ramps.trust as unknown as MantineColorsTuple,
      classUsaCream: ramps.cream as unknown as MantineColorsTuple,
      classUsaSlate: ramps.slate as unknown as MantineColorsTuple,
    },
    defaultRadius: 'lg',
    black: tokens['brand.primaryPressed'].light,
    white: tokens['bg.card'].light,
    components: {
      Button: {
        defaultProps: {
          color: 'classUsaAction',
          radius: '0.75rem',
          fw: 700,
        },
        styles: {
          root: {
            minHeight: 38,
          },
        },
      },
      Card: {
        defaultProps: {
          radius: 'lg',
          withBorder: true,
          shadow: 'sm',
        },
        styles: {
          root: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
            borderColor: 'var(--gds-border-card)',
          },
        },
      },
      Paper: {
        defaultProps: {
          radius: 'lg',
          withBorder: true,
        },
        styles: {
          root: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
            borderColor: 'var(--gds-border-card)',
          },
        },
      },
      Badge: {
        defaultProps: {
          radius: 'xl',
        },
        styles: {
          root: {
            fontWeight: 700,
            letterSpacing: '0.04em',
          },
        },
      },
      Modal: {
        styles: {
          content: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
          header: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
        },
      },
      Drawer: {
        styles: {
          content: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
          header: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
        },
      },
    },
    other: {
      gdsBrandThemeId: 'class-usa',
      gdsCssVariables: cssVariables,
      gdsBrandRamps: ramps,
      gdsBrandSemanticTokens: tokens,
    },
  };

  const mantineTheme = createPublicBrandTheme({
    flatSurfaces: options.flatSurfaces ?? true,
    overrides: mergeThemeOverrides(brandOverrides, options.overrides ?? {}),
  });

  return { mantineTheme, cssVariables, tokenGraph };
}

function createGoldAthleteBrandTheme(options: CreateGoldAthleteBrandThemeOptions = {}): BrandThemeResult {
  const inputFindings = validateGoldAthleteInput(options);
  if (inputFindings.length > 0) {
    throw new GdsBrandThemeError('Invalid Gold Athlete brand theme input.', inputFindings);
  }

  const ramps = mergeGoldAthleteColorRamps(options.colorRamps);
  const fonts: BrandFonts = {
    display: options.fonts?.display ?? goldAthleteDefaultFonts.display,
    body: options.fonts?.body ?? goldAthleteDefaultFonts.body,
  };
  const tokens = deriveGoldAthleteSemanticTokens(ramps);
  const contrastFindings = assertContrast(tokens);
  if (brandContrastRatio('#ffffff', tokens['brand.primary'].light) < 4.5) {
    contrastFindings.push({
      severity: 'error',
      rule: 'token.invalid-color',
      tokenId: 'gold-athlete.primary-button',
      message: 'Gold Athlete primary button text contrast must stay at least 4.5:1.',
    });
  }
  if (contrastFindings.length > 0) {
    throw new GdsBrandThemeError('Gold Athlete brand theme failed WCAG contrast requirements.', contrastFindings);
  }

  const colors: BrandColorRamps = {
    navy: tokens['brand.primary'].light,
    terracotta: tokens.accent.light,
    sage: tokens.support.light,
    cream: tokens['bg.canvas'].light,
    slate: tokens['text.meta'].light,
  };
  const tokenGraph = buildTokenGraph(colors, tokens, 'gold-athlete');
  const graphReport = validateGdsTokenGraph(tokenGraph);
  if (!graphReport.ok) {
    throw new GdsBrandThemeError('Gold Athlete token graph failed validation.', graphReport.findings);
  }

  const cssVariables = emitCssVariables(tokens);
  cssVariables['--gds-brand-accent-action'] = ramps.gold[6];
  cssVariables['--gds-brand-accent-action-dark'] = ramps.gold[3];
  const brandOverrides: MantineThemeOverride = {
    fontFamily: `${fonts.body}, system-ui, sans-serif`,
    headings: {
      fontFamily: `${fonts.display}, Georgia, serif`,
      sizes: {
        h1: { fontSize: '2.375rem', fontWeight: '800', lineHeight: '1.12' },
        h2: { fontSize: '1.75rem', fontWeight: '700', lineHeight: '1.2' },
        h3: { fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.25' },
      },
    },
    primaryColor: 'goldAthleteCharcoal',
    colors: {
      goldAthleteGold: ramps.gold as unknown as MantineColorsTuple,
      goldAthleteCharcoal: ramps.charcoal as unknown as MantineColorsTuple,
      goldAthleteCrimson: ramps.crimson as unknown as MantineColorsTuple,
      goldAthleteIvory: ramps.ivory as unknown as MantineColorsTuple,
      goldAthleteSlate: ramps.slate as unknown as MantineColorsTuple,
    },
    defaultRadius: 'lg',
    black: tokens['brand.primaryPressed'].light,
    white: tokens['bg.card'].light,
    components: {
      Button: {
        defaultProps: {
          radius: 'xl',
          fw: 700,
        },
        styles: {
          root: {
            minHeight: 38,
          },
        },
      },
      Card: {
        defaultProps: {
          radius: 'lg',
          withBorder: true,
          shadow: 'sm',
        },
        styles: {
          root: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
            borderColor: 'var(--gds-border-card)',
          },
        },
      },
      Paper: {
        defaultProps: {
          radius: 'lg',
          withBorder: true,
        },
        styles: {
          root: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
            borderColor: 'var(--gds-border-card)',
          },
        },
      },
      Badge: {
        defaultProps: {
          radius: 'xl',
        },
        styles: {
          root: {
            fontWeight: 700,
            letterSpacing: '0.04em',
          },
        },
      },
      Modal: {
        styles: {
          content: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
          header: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
        },
      },
      Drawer: {
        styles: {
          content: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
          header: {
            color: 'var(--gds-text-body)',
            background: 'var(--gds-bg-card)',
          },
        },
      },
    },
    other: {
      gdsBrandThemeId: 'gold-athlete',
      gdsCssVariables: cssVariables,
      gdsBrandRamps: ramps,
      gdsBrandSemanticTokens: tokens,
    },
  };

  const mantineTheme = createPublicBrandTheme({
    flatSurfaces: options.flatSurfaces ?? true,
    overrides: mergeThemeOverrides(brandOverrides, options.overrides ?? {}),
  });

  return { mantineTheme, cssVariables, tokenGraph };
}
