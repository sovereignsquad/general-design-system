import { GDS_DEFAULT_TYPOGRAPHY_AXIS } from './axes';
import type { GdsDesignRuleProfile, GdsTypeScaleRatio, GdsTypographyAxis } from './axes';
import type { GdsThemePresetId } from './theme-presets';

const NAMED_RATIOS: GdsTypeScaleRatio[] = [1.125, 1.2, 1.25, 1.333, 1.5, 1.618];

/**
 * Names of the six modular-scale ratios `GdsTypeScaleRatio` supports, for display
 * (issue 645). Musical-interval-derived: Minor Second through the Golden Ratio.
 */
export const NAMED_TYPE_SCALE_RATIO_LABELS: Record<GdsTypeScaleRatio, string> = {
  1.125: 'Major Second',
  1.2: 'Minor Third',
  1.25: 'Major Third',
  1.333: 'Perfect Fourth',
  1.5: 'Perfect Fifth',
  1.618: 'Golden Ratio',
};

/** Throws if a ratio isn't one of the six named, cited modular-scale ratios. */
function assertTypeScaleRatioIsNamed(ratio: number, presetId: string): asserts ratio is GdsTypeScaleRatio {
  if (!NAMED_RATIOS.includes(ratio as GdsTypeScaleRatio)) {
    throw new Error(
      `Preset "${presetId}"'s typography scale ratio ${ratio} is not one of the six named ` +
      `modular-scale ratios (${NAMED_RATIOS.join(', ')}). Either the axis needs correcting, ` +
      `or GdsTypeScaleRatio (axes.ts, issue #643) needs a new named value added deliberately.`,
    );
  }
}

/**
 * Returns the named type-scale ratio for a preset's effective typography axis (issue
 * #645). Reads `GDS_DEFAULT_TYPOGRAPHY_AXIS.scale.ratio` (or an explicit override, for a
 * future preset that customizes typography -- none exist today) -- never restates the
 * number as a separate literal, so it cannot drift from the source of truth.
 *
 * The returned ratio governs only the text steps with no Mantine equivalent (`2xs`,
 * `2xl`, `3xl`, `4xl`) -- `xs` through `xl` are Mantine's own non-uniform overrides,
 * documented on `GDS_DEFAULT_TYPOGRAPHY_AXIS` itself. This function names the ratio; it
 * does not claim the full nine-step scale is uniformly on it.
 */
export function resolveGdsTypeScaleProfile(
  presetId: GdsThemePresetId,
  axisOverride?: GdsTypographyAxis,
): GdsDesignRuleProfile['typeScale'] {
  const axis = axisOverride ?? GDS_DEFAULT_TYPOGRAPHY_AXIS;
  const ratio = axis.scale.ratio;
  assertTypeScaleRatioIsNamed(ratio, presetId);
  return { ratio };
}
