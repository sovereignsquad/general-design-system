import { Group, Stack, Text } from '@mantine/core';
import {
  resolveGdsColorProportionProfile, resolveGdsTypeScaleProfile, resolveGdsColorHarmonyProfile,
  NAMED_TYPE_SCALE_RATIO_LABELS, type GdsThemePresetId,
} from '@sovereignsquad/gds-theme';
import { GdsChart, type GdsChartDatum } from './GdsChart';
import { GdsBadge } from './GdsBadge';
import { designRuleCoverageByPreset } from './generated-design-rule-coverage';

/** Props for {@link GdsDesignRuleProfilePanel}. */
export interface GdsDesignRuleProfilePanelProps {
  /** Preset whose design-rule profile is displayed. */
  preset: GdsThemePresetId;
}

/**
 * Displays a preset's design-rule profile (issue #651): the declared color-proportion
 * classification (issue #644, token-role counts) side by side with the measured rendered
 * reality (issues #649/#650, real pixel-area percentages from the reference site), plus
 * its named type-scale ratio (issue #645) and color-harmony classification (issue #646).
 *
 * Every number is read live from the real resolvers/generated artifact at render time --
 * never a hand-typed literal. Declared and measured are two different metrics (role count
 * vs. rendered area) that can legitimately diverge; this panel presents both without
 * implying either one is "correct."
 */
export function GdsDesignRuleProfilePanel({ preset }: GdsDesignRuleProfilePanelProps) {
  const colorProportion = resolveGdsColorProportionProfile(preset);
  const typeScale = resolveGdsTypeScaleProfile(preset);
  const harmony = resolveGdsColorHarmonyProfile(preset);
  const measured = designRuleCoverageByPreset[preset];

  const declaredData: GdsChartDatum[] = colorProportion.rule === '60-30-10'
    ? [
      { label: 'Dominant', value: colorProportion.classification.dominant.length },
      { label: 'Secondary', value: colorProportion.classification.secondary.length },
      { label: 'Accent', value: colorProportion.classification.accent.length },
    ]
    : [];

  const measuredData: GdsChartDatum[] = measured
    ? [
      { label: 'Dominant', value: measured.dominant },
      { label: 'Secondary', value: measured.secondary },
      { label: 'Accent', value: measured.accent },
      { label: 'Unclassified', value: measured.unclassified },
    ]
    : [];

  const declaredSummary = colorProportion.rule === '60-30-10'
    ? `Declared/intended token-role classification (issue #644) -- ${colorProportion.classification.dominant.length} dominant, ${colorProportion.classification.secondary.length} secondary, and ${colorProportion.classification.accent.length} accent roles for "${preset}". Counts intended usage roles, not measured pixels.`
    : `Declared/intended token-role classification (issue #644) -- "${preset}" declares no color-proportion rule.`;

  const measuredSummary = measured
    ? `Measured/rendered pixel-area coverage on the GDS reference site (issue #649) -- ${measured.dominant}% dominant, ${measured.secondary}% secondary, ${measured.accent}% accent, ${measured.unclassified}% unclassified for "${preset}". Reference site only, not a consumer's own app.`
    : `Measured/rendered pixel-area coverage on the GDS reference site (issue #649) -- no measurement recorded yet for "${preset}".`;

  return (
    <Stack gap="md" data-gds-design-rule-profile-panel="">
      <Text size="sm" c="dimmed">
        Declared intent (issue #644) and measured rendered reality (issue #649/#650) are two
        different metrics -- token-role count versus real rendered pixel area -- and can
        legitimately diverge. Neither is presented as more "correct" than the other.
      </Text>
      <Group grow align="flex-start">
        <GdsChart
          type="donut"
          title={`${preset}: declared role classification`}
          summary={declaredSummary}
          data={declaredData}
        />
        <GdsChart
          type="donut"
          title={`${preset}: measured rendered proportion`}
          summary={measuredSummary}
          data={measuredData}
        />
      </Group>
      <Group gap="sm">
        <GdsBadge tone="neutral" label={`Type scale: ${typeScale.ratio} (${NAMED_TYPE_SCALE_RATIO_LABELS[typeScale.ratio]})`} />
        <GdsBadge tone="neutral" label={`Color harmony: ${harmony}`} />
      </Group>
    </Stack>
  );
}
