import type { GdsThemePresetId } from './theme-presets';
import { resolveGdsAxisTokens, type GdsThemeAxes } from './axes';
import { readableForeground } from './color-math';
import { emitChartCssVariables } from './chart-tokens';
import {
  emitSurfaceHierarchyCssVariables,
  deriveVibeSemanticCssVariables,
  getGdsVibeCardSurface,
  applyGdsGreyWhenText,
  type SemanticPair,
} from './semantic-token-source';
import { gdsThemePresetRegistry } from './presets';
import { neutralVibe } from './presets/default';

// Re-exported, not defined here. The public surface is unchanged; the definition moved so
// that every semantic-role value lives in one module.
export { deriveVibeSemanticCssVariables, getGdsVibeCardSurface };

/** Thrown when a hand-authored card role disagrees with the preset's opaque declared surface. */
export class GdsCardSurfaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GdsCardSurfaceError';
  }
}

// This file maintains its own hand-authored color values rather than deriving them from
// `theme-presets.ts`'s Mantine hue names: the two systems draw from different color sources
// by design (Mantine's functional color ramp vs. a bespoke, saturated "vibe" atmosphere
// palette), so deriving one from the other would be a visual-design decision, not a
// mechanical refactor. `vibe-themes.test.ts` guards the drift that is mechanical: every
// preset id in `theme-presets.ts`'s catalog must have a matching entry here and vice versa.

/**
 * Reserved sub-brand accent lane (issue 697). Declared only by a preset whose brand carries a
 * distinct AI/sub-brand identity; absence means the preset emits no `--gds-ai-*` tokens at
 * all — this is not part of the generic atmosphere palette every preset gets. `gradient` and
 * `panel` are CSS gradient strings; `accent` is a static color. Every dark value is a
 * deliberate decision derived from the light value, never a copy of it.
 */
export interface GdsAiAccentLane {
  gradient: SemanticPair;
  panel: SemanticPair;
  accent: SemanticPair;
}

/** The saturated "vibe" atmosphere palette for one preset: brand hues plus light/dark surface, text, and decorative effect colors. */
/** Atmosphere fields of a {@link GdsVibeTheme}; a preset definition declares these plus its id. */
export interface GdsVibeThemeFields {
  /** Human-readable theme name. */
  label: string;
  /** Primary brand color. */
  primary: string;
  /** Accent color. */
  accent: string;
  /** Translucent glow used for focus/hover atmosphere. */
  glow: string;
  /** Page canvas background, light mode. */
  canvasLight: string;
  /** Page canvas background, dark mode. */
  canvasDark: string;
  /** Shell/app-bar surface, light mode. */
  shellLight: string;
  /** Shell/app-bar surface, dark mode. */
  shellDark: string;
  /**
   * Card surface, light mode. When opaque (alpha 1) it is the card: it drives `--gds-bg-card`
   * and `--gds-bg-surface`, the pairs derived from them, and a flat card paint
   * (`--gds-vibe-card`). A translucent value keeps the white card role.
   */
  surfaceLight: string;
  /** Card surface, dark mode. Same opacity rule as `surfaceLight`; a translucent value keeps the canvas mix. */
  surfaceDark: string;
  /** Border color, light mode. */
  borderLight: string;
  /** Border color, dark mode. */
  borderDark: string;
  /** Body text color, light mode. */
  textLight: string;
  /** Body text color, dark mode. */
  textDark: string;
  /** Muted/meta text color, light mode. */
  mutedLight: string;
  /** Muted/meta text color, dark mode. */
  mutedDark: string;
  /** Decorative background gradient. */
  gradient: string;
  /** Hero/banner gradient. */
  hero: string;
  /**
   * True for a lane backed by a real `createBrandTheme(...)` brand (Class USA, Gold
   * Athlete), whose own definition sets `flatSurfaces: true` and never configures a
   * gradient, glow, or colored shadow. Consumers previewing this lane's atmosphere
   * (gradient/glow fields above) must skip those fields when true. Unset/false for the
   * generic vibe lanes, where the gradient/glow atmosphere is the lane's own identity.
   */
  /**
   * Non-colour design decisions: shape, density, typography, motion. Optional — a preset
   * that declares nothing gets the captured defaults, reproducing today's geometry exactly.
   */
  axes?: GdsThemeAxes;
  flatSurfaces?: boolean;
  /**
   * Reserved sub-brand accent lane (issue 697): see {@link GdsAiAccentLane}. Optional and
   * absent for every preset without a distinct AI/sub-brand identity.
   */
  ai?: GdsAiAccentLane;
}

/** CSS atmosphere of a theme preset. */
export interface GdsVibeTheme extends GdsVibeThemeFields {
  /** Preset id this vibe belongs to. */
  id: GdsThemePresetId;
}

const vibeThemes = Object.fromEntries(gdsThemePresetRegistry.map((preset) => [preset.id, preset.vibe])) as Record<GdsThemePresetId, GdsVibeTheme>;

/** Returns every vibe theme. */
export function getGdsVibeThemes() {
  return Object.values(vibeThemes);
}

/** Resolves the vibe theme for a preset id, falling back to the neutral default. */
export function resolveGdsVibeTheme(id: GdsThemePresetId) {
  return vibeThemes[id] ?? neutralVibe;
}

/**
 * The reserved sub-brand accent lane a preset declares (issue 697), or `undefined` when the
 * preset has none. Reads the same vibe catalog {@link getGdsVibeThemeCssVariables} emits from,
 * so a gate or test can read the lane's values without parsing CSS.
 */
export function getGdsAiAccentLane(id: GdsThemePresetId): GdsAiAccentLane | undefined {
  return resolveGdsVibeTheme(id).ai;
}

/**
 * Emits the `--gds-ai-*` variable pair for a preset's reserved sub-brand accent lane
 * (issue 697), or nothing when the preset declares none. The caller merges this into the
 * semantic variable set BEFORE the dark-collapse loop in {@link getGdsVibeThemeCssVariables},
 * so its `-dark` values collapse onto their base names in dark mode exactly like every other
 * `--gds-*` role, rather than needing a second collapse path.
 */
function emitAiAccentCssVariables(vibe: GdsVibeTheme): Record<string, string> {
  if (!vibe.ai) return {};
  return {
    '--gds-ai-gradient': vibe.ai.gradient.light,
    '--gds-ai-gradient-dark': vibe.ai.gradient.dark,
    '--gds-ai-panel': vibe.ai.panel.light,
    '--gds-ai-panel-dark': vibe.ai.panel.dark,
    '--gds-ai-accent': vibe.ai.accent.light,
    '--gds-ai-accent-dark': vibe.ai.accent.dark,
  };
}

// A preset's `semanticOverrides` are generated from `semantic-token-source.ts`, the same
// table `createBrandTheme` emits from, so the two paths cannot disagree.
// `verify:token-single-source` enforces this mechanically.
const brandSemanticCssVariablesByPreset: Partial<Record<GdsThemePresetId, Record<string, string>>> = Object.fromEntries(
  gdsThemePresetRegistry.flatMap((preset) => (preset.semanticOverrides ? [[preset.id, preset.semanticOverrides]] : [])),
);

const derivedSemanticCssVariablesCache = new Map<GdsThemePresetId, Record<string, string>>();

/**
 * An opaque declared surface is the card; a hand-authored table may repeat it but never
 * contradict it, so two sources for one role never resolve silently.
 */
export function assertGdsHandAuthoredCardMatchesSurface(id: string, vibe: Pick<GdsVibeTheme, 'surfaceLight' | 'surfaceDark'>, handAuthored: Record<string, string>): void {
  for (const scheme of ['light', 'dark'] as const) {
    const surface = getGdsVibeCardSurface(vibe, scheme);
    if (!surface) continue;
    const suffix = scheme === 'dark' ? '-dark' : '';
    for (const role of ['--gds-bg-card', '--gds-bg-surface']) {
      const authored = handAuthored[`${role}${suffix}`];
      if (authored !== undefined && authored.toLowerCase() !== surface.toLowerCase()) {
        throw new GdsCardSurfaceError(`${id}: ${role}${suffix} is ${authored} in the hand-authored table, but the preset's opaque ${scheme} surface is ${surface}.`);
      }
    }
  }
}

function resolveVibeSemanticCssVariables(id: GdsThemePresetId, vibe: GdsVibeTheme): Record<string, string> {
  const handAuthored = brandSemanticCssVariablesByPreset[id];
  if (handAuthored) {
    // The hand-authored table overrides derivation; it does not replace it. Returning it
    // wholesale would mean any role it doesn't list simply vanishes for the brand lanes,
    // while every generic lane has one.
    //
    // Deriving first and layering the hand-authored values on top preserves every
    // deliberate brand decision while making an omission fall back to a contrast-derived
    // default rather than to nothing, and means a future role cannot silently disappear
    // from these two lanes.
    assertGdsHandAuthoredCardMatchesSurface(id, vibe, handAuthored);
    const merged = { ...deriveVibeSemanticCssVariables(vibe), ...handAuthored };

    // Roles derived from another role must be recomputed after the override layer is
    // applied, or the pair is mismatched: the derived foreground was computed against the
    // derived `support`, while the hand-authored `support` is what actually wins.
    merged['--gds-text-on-support'] = readableForeground(merged['--gds-support'], 4.5, merged['--gds-bg-page'] ?? vibe.canvasLight);
    merged['--gds-text-on-support-dark'] = readableForeground(merged['--gds-support-dark'], 4.5, merged['--gds-bg-page-dark'] ?? vibe.canvasDark);
    // A hand-authored brand primary or state info equal to the body text colour takes the
    // readable grey, as in the derived presets. Chart roles are measured against the card and
    // seeded from the accent, both of which the hand-authored layer may replace.
    const greyed = applyGdsGreyWhenText(merged);
    return { ...greyed, ...emitChartCssVariables(greyed), ...emitSurfaceHierarchyCssVariables(greyed, { light: vibe.shellLight, dark: vibe.shellDark }) };
  }

  const cached = derivedSemanticCssVariablesCache.get(id);
  if (cached) {
    return cached;
  }

  const derived = deriveVibeSemanticCssVariables(vibe);
  derivedSemanticCssVariablesCache.set(id, derived);
  return derived;
}

/**
 * The semantic roles for lanes without the preset runtime (`gdsTheme`, `gdsDarkPublicTheme`,
 * `createPublicBrandTheme`): the `default` preset's roles, with `-dark` keys for the dark scheme.
 * The styles.css badge, brand and chart default blocks are generated from it.
 */
export function getGdsDefaultLaneCssVariables(): Record<string, string> {
  return { ...resolveVibeSemanticCssVariables('default', resolveGdsVibeTheme('default')) };
}

/**
 * Builds the `--gds-vibe-*` CSS variables for a preset and color scheme (mode is
 * resolved to the light or dark value of each token), plus the full `--gds-*`
 * semantic role set (hand-authored for `class-usa`/`gold-athlete`,
 * {@link deriveVibeSemanticCssVariables} for every other preset), with `-dark`
 * values collapsed onto their base names in dark mode.
 *
 * Return type is explicitly `Record<string, string>`, not the narrower object-literal
 * shape TS would otherwise infer: the semantic role set is merged in via
 * `...semanticVariables` below and is real at runtime, but a plain object-literal return
 * type would not carry that merge across a package's compiled `.d.ts` boundary.
 */
export function getGdsVibeThemeCssVariables(id: GdsThemePresetId, colorScheme: 'light' | 'dark'): Record<string, string> {
  const vibe = resolveGdsVibeTheme(id);
  const dark = colorScheme === 'dark';

  // A flatSurfaces lane (Class USA, Gold Athlete) is backed by a real `createBrandTheme(...)`
  // that never configures a gradient, glow, or colored shadow. Every CSS rule below reads
  // `--gds-vibe-glow`/`--gds-vibe-gradient` to paint atmospheric effects across the whole
  // site when that lane is active, so neutralizing them here, once, at the source keeps
  // every consumer from fabricating an atmosphere the real brand doesn't have.
  const glow = vibe.flatSurfaces ? 'transparent' : vibe.glow;
  const gradient = vibe.flatSurfaces ? 'none' : vibe.gradient;

  const variables = {
    '--gds-vibe-primary': vibe.primary,
    '--gds-vibe-accent': vibe.accent,
    '--gds-vibe-glow': glow,
    '--gds-vibe-canvas': dark ? vibe.canvasDark : vibe.canvasLight,
    '--gds-vibe-shell': dark ? vibe.shellDark : vibe.shellLight,
    '--gds-vibe-surface': dark ? vibe.surfaceDark : vibe.surfaceLight,
    '--gds-vibe-border': dark ? vibe.borderDark : vibe.borderLight,
    '--gds-vibe-text': dark ? vibe.textDark : vibe.textLight,
    '--gds-vibe-muted': dark ? vibe.mutedDark : vibe.mutedLight,
    '--gds-vibe-focus': dark ? vibe.textDark : vibe.textLight,
    '--gds-vibe-gradient': gradient,
    '--gds-vibe-hero': vibe.hero,
    // The preset's atmosphere at small-surface scale.
    //
    // `--gds-vibe-hero` is composed for a full-width band; reused as a 40px fill, its 135°
    // ramp becomes a hard diagonal instead of a wash. Scale-independent by construction: a
    // radial from the centre reads the same at 40px and 400px. Derived from the same
    // `primary`/`accent` the rest of the vibe is built from, mixed against the scheme's own
    // surface, so it cannot drift from the preset.
    //
    // A `flatSurfaces` brand lane has no atmosphere by definition, so it gets an honest flat
    // tint rather than an invented gradient — the same reasoning as `glow`/`gradient` above.
    '--gds-vibe-swatch': vibe.flatSurfaces
      ? `color-mix(in srgb, ${vibe.primary} 18%, ${dark ? vibe.surfaceDark : vibe.surfaceLight})`
      : `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${vibe.accent} 34%, ${dark ? vibe.surfaceDark : vibe.surfaceLight}) 0%, color-mix(in srgb, ${vibe.primary} 22%, ${dark ? vibe.surfaceDark : vibe.surfaceLight}) 100%)`,
    '--gds-vibe-atmosphere': vibe.flatSurfaces ? '0' : '1',
  };

  const brandSemanticCssVariables = resolveVibeSemanticCssVariables(id, vibe);
  // Axis tokens are scheme-independent — a corner radius does not change between light and
  // dark — so they are merged in once rather than resolved per scheme.
  const axisVariables = resolveGdsAxisTokens(vibe.axes, id, colorScheme);

  // The reserved ai lane (issue 697) merges in here, before the dark-collapse loop below, so
  // its `-dark` values collapse onto their base names in dark mode exactly like every other
  // `--gds-*` role rather than needing a second collapse path.
  const semanticSource: Record<string, string> = { ...brandSemanticCssVariables, ...emitAiAccentCssVariables(vibe) };

  const semanticVariables: Record<string, string> = { ...semanticSource };
  if (dark) {
    Object.entries(semanticSource).forEach(([property, value]) => {
      if (property.endsWith('-dark')) {
        semanticVariables[property.replace(/-dark$/, '')] = value;
      }
    });
  }

  // An opaque declared surface paints the card flat (`--gds-vibe-card`), for that scheme only.
  const cardSurface = getGdsVibeCardSurface(vibe, colorScheme);
  return { ...variables, ...(cardSurface ? { '--gds-vibe-card': cardSurface } : {}), ...axisVariables, ...semanticVariables };
}
