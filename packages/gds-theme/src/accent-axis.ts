// The accent axis: theme-supplied category ramps with a computed contrast guarantee,
// replacing a previous frozen 10-accent x 4-shade sRGB table.
//
// The default ramp's shade values cannot be reproduced by a single derivation formula: a
// uniform lightness delta ranges from -4.71 (teal) to -10.59 (terracotta), and a uniform RGB
// factor misses by up to 14/255 on some shades. The default ramp ships explicit per-accent
// shade values; derivation governs only accents a theme declares itself.

import { contrastRatio, parseCssColor } from './color-math';
import type { GdsThemePresetId } from './theme-presets';

/** The ten category accent slots. Closed set; slot count is a separate design decision. */
export type GdsAccentName =
  | 'plum' | 'indigo' | 'ocean' | 'teal' | 'forest'
  | 'bronze' | 'terracotta' | 'magenta' | 'slate' | 'grape';

/** Within-accent differentiation steps, lightest first. */
export type GdsAccentShade = 'base' | 'deep' | 'deeper' | 'deepest';

/** How an accent is presented; each has a different contrast obligation. */
export type GdsAccentMode = 'outline' | 'filled' | 'emoji';

/** One accent's definition. A theme declares `base`; the rest may be derived. */
export interface GdsAccentRamp {
  /** Base colour in the light scheme. */
  base: string;
  /** Distinct base for the dark scheme. Defaults to `base`. */
  baseDark?: string;
  /**
   * Multipliers producing deep/deeper/deepest from the base, in that order.
   *
   * Darker-only: lightening breaks the filled-mode white-on-accent guarantee (`teal` fails
   * at +4 lightness). A theme wanting lighter categories declares a lighter base instead.
   */
  shadeFactors?: [number, number, number];
  /**
   * Explicit shade values, overriding derivation.
   *
   * Not used by the default ramp: a hand-written value does not recompute when the base
   * changes, so it can drift. Available when derivation cannot express a brand mandate; the
   * contrast gate holds an override to the same threshold as a derived value.
   */
  shades?: Partial<Record<GdsAccentShade, string>>;
  /** Foreground used in filled mode. Defaults to white. */
  on?: string;
}

/** A theme's accent declarations. Any slot left undeclared inherits the default ramp. */
export interface GdsAccentAxis {
  ramps?: Partial<Record<GdsAccentName, GdsAccentRamp>>;
}

/** One measured contrast result. */
export interface GdsAccentContrastResult {
  accent: GdsAccentName;
  shade: GdsAccentShade;
  mode: GdsAccentMode;
  scheme: 'light' | 'dark';
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  passes: boolean;
  /**
   * Whether a failure here fails the build.
   *
   * Measured-but-not-enforced combinations are still reported, for the Theme Lab matrix and
   * theme authors. See {@link GDS_ACCENT_MODE_ENFORCEMENT}.
   */
  enforced: boolean;
}

/** The ten accent slots, in palette order. Closed set; slot count is a separate decision. */
export const GDS_ACCENT_NAMES: GdsAccentName[] = [
  'plum', 'indigo', 'ocean', 'teal', 'forest', 'bronze', 'terracotta', 'magenta', 'slate', 'grape',
];
/** Every shade step, lightest first. Derivation is darker-only, so this order is the ramp. */
export const GDS_ACCENT_SHADES: GdsAccentShade[] = ['base', 'deep', 'deeper', 'deepest'];
/** Every presentation mode an accent can take; each carries a different contrast obligation. */
export const GDS_ACCENT_MODES: GdsAccentMode[] = ['outline', 'filled', 'emoji'];

/**
 * Default shade factors: the means of the shipped per-accent factors (0.753-0.822,
 * 0.511-0.667, 0.270-0.467). Starting point for a theme declaring a new accent; does not
 * reproduce the hand-tuned defaults.
 */
export const GDS_DEFAULT_SHADE_FACTORS: [number, number, number] = [0.78, 0.57, 0.35];

/**
 * The fixed dark neutral behind an emoji.
 *
 * Not themeable: emoji are OS-rendered in their own colours, so legibility must not depend
 * on the active accent. The gate verifies contrast against this value.
 */
export const GDS_ACCENT_EMOJI_DISC = '#1f2937';

/**
 * The default accent ramp: ten base colours. Everything below `base` is computed — a theme
 * declares base colours, the system derives the shade ramp, and the gate verifies white text
 * stays legible on every accent and shade. The default ramp goes through the same derivation
 * as any other theme; it is not a hand-written exception.
 */
export const GDS_DEFAULT_ACCENT_AXIS: GdsAccentAxis = {
  ramps: {
    plum: { base: '#7c3a6e' },
    indigo: { base: '#3f4d9e' },
    ocean: { base: '#1f6e8c' },
    teal: { base: '#0f766e' },
    forest: { base: '#2f6b3a' },
    bronze: { base: '#8a5a00' },
    terracotta: { base: '#b04a2f' },
    magenta: { base: '#a52a6c' },
    slate: { base: '#52606d' },
    grape: { base: '#5b3374' },
  },
};

/** Thrown when an accent declaration cannot be accepted. */
export class GdsAccentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GdsAccentError';
  }
}

const toHex = (rgb: { r: number; g: number; b: number }) =>
  `#${[rgb.r, rgb.g, rgb.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

/** Perceptual distance floor between neighbouring shades, in mean channel units. */
const MIN_SHADE_SEPARATION = 6;

/**
 * Derives the four shades for one accent.
 *
 * Explicit `shades` win where present — that is how the default ramp keeps its hand-tuned
 * values. Anything absent is derived by multiplying the base, which is darker-only.
 */
export function deriveGdsAccentShades(ramp: GdsAccentRamp, scheme: 'light' | 'dark', accentName = 'accent'): Record<GdsAccentShade, string> {
  const baseValue = (scheme === 'dark' ? ramp.baseDark ?? ramp.base : ramp.base);
  const parsed = parseCssColor(baseValue);
  if (!parsed) throw new GdsAccentError(`${accentName}: base "${baseValue}" is not a resolvable colour.`);

  const factors = ramp.shadeFactors ?? GDS_DEFAULT_SHADE_FACTORS;
  factors.forEach((f, i) => {
    if (!(f > 0 && f < 1)) {
      throw new GdsAccentError(
        `${accentName}: shade factor ${i + 1} is ${f}. Factors must be between 0 and 1 — lightening is not representable, `
        + 'because it breaks the filled-mode white-on-accent guarantee. Declare a lighter base instead.',
      );
    }
    if (i > 0 && f >= factors[i - 1]) {
      throw new GdsAccentError(`${accentName}: shade factors must strictly decrease; ${f} does not follow ${factors[i - 1]}.`);
    }
  });

  const derived: Record<GdsAccentShade, string> = {
    base: ramp.shades?.base ?? baseValue,
    deep: ramp.shades?.deep ?? toHex({ r: parsed.r * factors[0], g: parsed.g * factors[0], b: parsed.b * factors[0] }),
    deeper: ramp.shades?.deeper ?? toHex({ r: parsed.r * factors[1], g: parsed.g * factors[1], b: parsed.b * factors[1] }),
    deepest: ramp.shades?.deepest ?? toHex({ r: parsed.r * factors[2], g: parsed.g * factors[2], b: parsed.b * factors[2] }),
  };

  // Neighbouring shades must be perceptibly apart, or the ramp conveys nothing. Checked on
  // the resolved values, so an override that collapses onto its neighbour is caught too.
  for (let i = 1; i < GDS_ACCENT_SHADES.length; i += 1) {
    const a = parseCssColor(derived[GDS_ACCENT_SHADES[i - 1]]);
    const b = parseCssColor(derived[GDS_ACCENT_SHADES[i]]);
    if (!a || !b) continue;
    const delta = (Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b)) / 3;
    if (delta < MIN_SHADE_SEPARATION) {
      throw new GdsAccentError(
        `${accentName}: shades "${GDS_ACCENT_SHADES[i - 1]}" and "${GDS_ACCENT_SHADES[i]}" differ by ${delta.toFixed(1)}, `
        + `below the ${MIN_SHADE_SEPARATION} floor. Steps a reader cannot tell apart convey nothing.`,
      );
    }
  }
  return derived;
}

/** Merges a theme's accent declarations over the default ramp. */
function mergeAccentAxis(axis: GdsAccentAxis | undefined): Required<GdsAccentAxis>['ramps'] {
  const out: Required<GdsAccentAxis>['ramps'] = {};
  for (const name of GDS_ACCENT_NAMES) {
    const declared = axis?.ramps?.[name];
    const fallback = GDS_DEFAULT_ACCENT_AXIS.ramps![name]!;
    // A declared ramp replaces the default rather than merging into it — merging would let
    // a new base silently keep the default's shades, which belong to a different colour.
    out[name] = declared ?? fallback;
  }
  return out;
}

/** Resolves accent tokens for a preset and scheme: `--gds-accent-<name>-<shade>`. */
export function resolveGdsAccentTokens(axis: GdsAccentAxis | undefined, scheme: 'light' | 'dark', themeId: GdsThemePresetId | string = 'theme'): Record<string, string> {
  const ramps = mergeAccentAxis(axis);
  const tokens: Record<string, string> = {};
  for (const name of GDS_ACCENT_NAMES) {
    const shades = deriveGdsAccentShades(ramps[name]!, scheme, `${themeId}.${name}`);
    for (const shade of GDS_ACCENT_SHADES) tokens[`--gds-accent-${name}-${shade}`] = shades[shade];
    tokens[`--gds-accent-${name}-on`] = ramps[name]!.on ?? '#ffffff';
  }
  return tokens;
}

/**
 * Contrast obligations per mode.
 *
 * `filled` and `outline` carry text, so they owe 4.5:1. `emoji` is a coloured disc behind an
 * OS-rendered glyph — a non-text boundary, owing 3:1 under WCAG 1.4.11.
 */
const MODE_REQUIREMENT: Record<GdsAccentMode, number> = { outline: 4.5, filled: 4.5, emoji: 3 };

/**
 * Which modes a failure actually blocks the build on.
 *
 *   `filled`  — enforced. `GdsBadge` renders white text on the accent fill.
 *   `outline` — not enforced. No component renders an accent as text on the page.
 *   `emoji`   — not enforced. The disc is `aria-hidden` decoration; the label carries the
 *               meaning. WCAG 1.4.11 does not cover it, and the pair that would matter
 *               (glyph vs disc) is uncomputable for OS-rendered emoji.
 */
export const GDS_ACCENT_MODE_ENFORCEMENT: Record<GdsAccentMode, { enforced: boolean; reason: string }> = {
  filled: { enforced: true, reason: 'GdsBadge renders white text on the accent; this is the guarantee the frozen palette bought.' },
  outline: { enforced: false, reason: 'No component renders an accent as text on the page today. Measured so a future outline mode starts with data rather than a surprise.' },
  emoji: { enforced: false, reason: 'The disc is aria-hidden decoration and the label carries the meaning; WCAG 1.4.11 does not cover it. The pair that would matter (glyph vs disc) is uncomputable for OS-rendered emoji.' },
};

/**
 * Measures every accent x shade x mode x scheme combination.
 *
 * `outline` is scored against the page surface the accent sits on, supplied by the caller:
 * the same accent can pass on a light page and fail on a dark one.
 */
export function evaluateGdsAccentContrast(
  axis: GdsAccentAxis | undefined,
  surfaces: { light: string; dark: string },
  themeId: GdsThemePresetId | string = 'theme',
): GdsAccentContrastResult[] {
  const results: GdsAccentContrastResult[] = [];
  for (const scheme of ['light', 'dark'] as const) {
    const tokens = resolveGdsAccentTokens(axis, scheme, themeId);
    const surface = surfaces[scheme];
    for (const accent of GDS_ACCENT_NAMES) {
      const on = tokens[`--gds-accent-${accent}-on`];
      for (const shade of GDS_ACCENT_SHADES) {
        const value = tokens[`--gds-accent-${accent}-${shade}`];
        for (const mode of GDS_ACCENT_MODES) {
          const [foreground, background] = mode === 'filled'
            ? [on, value]                       // text on the accent
            : mode === 'outline'
              ? [value, surface]                // accent text on the page
              : [value, GDS_ACCENT_EMOJI_DISC]; // accent disc against the fixed neutral
          const ratio = contrastRatio(foreground, background, surface) ?? 0;
          const required = MODE_REQUIREMENT[mode];
          results.push({
            accent, shade, mode, scheme, foreground, background,
            ratio: Number(ratio.toFixed(2)), required, passes: ratio >= required,
            enforced: GDS_ACCENT_MODE_ENFORCEMENT[mode].enforced,
          });
        }
      }
    }
  }
  return results;
}
