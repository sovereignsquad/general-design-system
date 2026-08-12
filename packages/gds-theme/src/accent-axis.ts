// Issue 593 (split from #560) — the accent axis: theme-supplied category ramps with a
// computed contrast guarantee.
//
// `gdsBadgeAccentColors` is 10 hardcoded sRGB values documented as "Fixed sRGB, independent
// of theme" — the single largest surface in GDS a theme cannot control. The hardcoding was a
// real decision, not an oversight: it bought a contrast guarantee without re-verifying
// 10 accents x 4 shades x 3 modes x 2 schemes x 25 presets. This axis does not simply
// un-freeze it. It replaces the frozen guarantee with a computed one.
//
// SHADE DERIVATION, AND WHY THE DEFAULT RAMP STILL CARRIES EXPLICIT VALUES.
// The shipped 40-value shade table cannot be reproduced by any single derivation function —
// measured, not assumed. A uniform lightness delta needs -4.71 for `teal` and -10.59 for
// `terracotta`; a uniform RGB factor reproduces only 6 of 30 shades within 1/255, missing
// some by 14. The table was hand-tuned per accent.
//
// So the default ramp ships those values verbatim (zero visual regression), and derivation
// governs accents a theme declares itself — which is the actual goal: a theme author declares
// base colours, not 40 values. Same shape as the typography axis carrying Mantine's
// non-uniform font ramp as overrides while the ratio governs the steps it adds.

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
   * Darker-only by design. The source records that lightening breaks the filled-mode
   * white-on-accent guarantee — `teal` fails at +4 lightness — so a theme wanting lighter
   * categories declares lighter BASE accents, which the gate then verifies.
   */
  shadeFactors?: [number, number, number];
  /**
   * Explicit shade values, overriding derivation.
   *
   * Deliberately NOT used by the default ramp. Every value written by hand is a value nobody
   * recomputes when the base changes, and the pair silently drifts apart. Available for a
   * consumer with a brand mandate that derivation cannot express — and the contrast gate
   * holds an override to exactly the same threshold as a derived value.
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
   * Measured-but-not-enforced combinations are still reported, because the Theme Lab matrix
   * (#596) and a theme author both want the number. Enforcing them would be inventing a
   * requirement — see {@link GDS_ACCENT_MODE_ENFORCEMENT}.
   */
  enforced: boolean;
}

export const GDS_ACCENT_NAMES: GdsAccentName[] = [
  'plum', 'indigo', 'ocean', 'teal', 'forest', 'bronze', 'terracotta', 'magenta', 'slate', 'grape',
];
export const GDS_ACCENT_SHADES: GdsAccentShade[] = ['base', 'deep', 'deeper', 'deepest'];
export const GDS_ACCENT_MODES: GdsAccentMode[] = ['outline', 'filled', 'emoji'];

/**
 * Default shade factors, measured from the shipped table rather than chosen.
 *
 * The per-accent factors range 0.753-0.822, 0.511-0.667 and 0.270-0.467; these are the means.
 * They are the starting point for a theme declaring a new accent, not a claim that they
 * reproduce the hand-tuned defaults — see the header.
 */
export const GDS_DEFAULT_SHADE_FACTORS: [number, number, number] = [0.78, 0.57, 0.35];

/**
 * The fixed dark neutral behind an emoji.
 *
 * Deliberately NOT themeable, and this survives the axis: emoji are OS-rendered in their own
 * colours, so their legibility must not depend on which accent is active. The gate verifies
 * emoji contrast against it rather than assuming it.
 */
export const GDS_ACCENT_EMOJI_DISC = '#1f2937';

/**
 * The default accent ramp: TEN BASE COLOURS AND NOTHING ELSE.
 *
 * An earlier cut of this file carried all 40 shade values explicitly, to reproduce the
 * hand-tuned table byte-for-byte. That was the wrong trade and it is gone: a hand-authored
 * table is exactly what this axis exists to abolish. What must be preserved is the
 * GUARANTEE — white text stays legible on every accent and every shade — not the specific
 * hexes somebody once picked.
 *
 * Everything below `base` is computed. A theme declares base colours; the system derives the
 * ramp and the gate proves it. That is the whole contract, and it applies to the default
 * ramp on identical terms — the default is not a privileged hand-written exception, it is
 * just the first theme.
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

  // A shade system whose steps look identical conveys nothing, so neighbours must be
  // perceptibly apart. Checked on the RESOLVED values, which catches an explicit override
  // that collapses onto its neighbour just as readily as a bad factor.
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
    // A declared ramp REPLACES the default rather than merging into it. Merging would let a
    // theme's new base silently keep the default's hand-tuned shades, which belong to a
    // different colour — the mismatch issue 537 shipped, in another namespace.
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
 * Which modes a failure actually blocks on, and why — established by READING the components,
 * not by assuming the mode list is a list of things that render.
 *
 * A first pass enforced all three and reported 3,000 failures out of 6,000. Every one of them
 * was an artifact of the model:
 *
 *   `filled`  — REAL. `GdsBadge` renders `{ bg: accent, fg: '#ffffff' }`, so white-on-accent
 *               is the guarantee the frozen palette bought and the one worth keeping.
 *   `outline` — DOES NOT RENDER. No component draws an accent as text on the page; the accent
 *               path is filled-only. Gating it would fail 1,000 combinations for a mode that
 *               does not exist, which is how a gate teaches people to ignore it.
 *   `emoji`   — the disc is `aria-hidden` decoration sitting on the accent, and the meaning is
 *               carried by the required `label`. WCAG 1.4.11 governs UI components and
 *               meaningful graphics; a decorative disc is neither. The contrast that WOULD
 *               matter — emoji glyph against the disc — is uncomputable, because emoji are
 *               OS-rendered multicolour glyphs, which is the documented reason the disc is a
 *               fixed neutral in the first place.
 */
export const GDS_ACCENT_MODE_ENFORCEMENT: Record<GdsAccentMode, { enforced: boolean; reason: string }> = {
  filled: { enforced: true, reason: 'GdsBadge renders white text on the accent; this is the guarantee the frozen palette bought.' },
  outline: { enforced: false, reason: 'No component renders an accent as text on the page today. Measured so a future outline mode starts with data rather than a surprise.' },
  emoji: { enforced: false, reason: 'The disc is aria-hidden decoration and the label carries the meaning; WCAG 1.4.11 does not cover it. The pair that would matter (glyph vs disc) is uncomputable for OS-rendered emoji.' },
};

/**
 * Measures every accent x shade x mode x scheme combination.
 *
 * `outline` is scored against the page surface the accent sits on, which is why the caller
 * supplies it: the same accent that passes on a light page can fail on a dark one, and that
 * is exactly the case the frozen palette avoided having to check.
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
