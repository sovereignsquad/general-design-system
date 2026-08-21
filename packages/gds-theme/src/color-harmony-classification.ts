import { hueAngleDistance, parseCssColor, rgbToHsl } from './color-math';
import type { GdsColorHarmony } from './axes';
import { resolveGdsVibeTheme } from './vibe-themes';
import type { GdsThemePresetId } from './theme-presets';

/** Below this saturation a color reads as gray -- no meaningful hue to relate (issue #646). */
const NEUTRAL_SATURATION_THRESHOLD = 10;

/** How close to a textbook angle still counts as that harmony (issue #646). */
const TOLERANCE_DEGREES = 15;

const HARMONY_ANGLES: Array<{ harmony: GdsColorHarmony; angle: number }> = [
  { harmony: 'monochromatic', angle: 0 },
  { harmony: 'analogous', angle: 30 },
  { harmony: 'triadic', angle: 120 },
  { harmony: 'split-complementary', angle: 150 },
  { harmony: 'complementary', angle: 180 },
];

/**
 * Classifies the hue relationship between two CSS colors (issue #646). Either color
 * reading as near-gray (saturation below {@link NEUTRAL_SATURATION_THRESHOLD}), or the
 * hue distance falling outside every named angle's {@link TOLERANCE_DEGREES} band,
 * resolves to `'custom'`. On a tie between two equally-close named angles, the earlier
 * entry in `HARMONY_ANGLES` above wins (`Array.reduce`'s `<` keeps the first candidate).
 */
function classifyHueRelationship(primaryHex: string, accentHex: string): GdsColorHarmony | null {
  const primaryRgb = parseCssColor(primaryHex);
  const accentRgb = parseCssColor(accentHex);
  if (!primaryRgb || !accentRgb) {
    return null;
  }

  const primaryHsl = rgbToHsl(primaryRgb);
  const accentHsl = rgbToHsl(accentRgb);

  if (primaryHsl.s < NEUTRAL_SATURATION_THRESHOLD || accentHsl.s < NEUTRAL_SATURATION_THRESHOLD) {
    return 'custom';
  }

  const distance = hueAngleDistance(primaryHsl.h, accentHsl.h);
  const nearest = HARMONY_ANGLES.reduce((best, candidate) => (
    Math.abs(distance - candidate.angle) < Math.abs(distance - best.angle) ? candidate : best
  ));
  return Math.abs(distance - nearest.angle) <= TOLERANCE_DEGREES ? nearest.harmony : 'custom';
}

/**
 * Classifies a preset's primary/accent hue relationship (issue #646). Computed from the
 * preset's real `vibe-themes.ts` hex values -- never hand-assigned.
 *
 * Primary/accent only -- not a full-palette harmony analysis (state/support colors are
 * out of scope; see issue #646).
 */
export function resolveGdsColorHarmonyProfile(presetId: GdsThemePresetId): GdsColorHarmony {
  const vibe = resolveGdsVibeTheme(presetId);
  const harmony = classifyHueRelationship(vibe.primary, vibe.accent);
  if (!harmony) {
    throw new Error(
      `Cannot classify color harmony for preset "${presetId}": primary "${vibe.primary}" or ` +
      `accent "${vibe.accent}" is not a valid #hex or rgb()/rgba() value.`,
    );
  }
  return harmony;
}

/** Exposed for testing against synthetic hue pairs (issue #646) -- not part of the public API. */
export const __internal = { classifyHueRelationship };
