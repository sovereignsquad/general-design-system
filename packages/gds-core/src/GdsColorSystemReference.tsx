import { Box, Group, Stack, Text } from '@mantine/core';
import {
  ACCENT_ROLES, DOMINANT_ROLES, SECONDARY_ROLES,
  GDS_ACCENT_MODES, GDS_ACCENT_MODE_ENFORCEMENT, GDS_ACCENT_NAMES,
  getGdsVibeThemeCssVariables,
  type BrandSemanticRole,
} from '@sovereignsquad/gds-theme';
import { GdsAccentContrastMatrix } from './GdsAccentContrastMatrix';

// The lookup key for a role's resolved value under one scheme, e.g. 'bg.canvas' -> '--gds-bg-canvas'.
// getGdsVibeThemeCssVariables() resolves the scheme INTO the value at this base key -- confirmed
// against vibe-themes.test.ts, which asserts both classUsaLight['--gds-bg-canvas'] and
// classUsaDark['--gds-bg-canvas'] against the same base key, never a '-dark'-suffixed one.
const roleVarName = (role: BrandSemanticRole) => `--gds-${role.replace('.', '-')}`;

function RoleGroup({ title, description, roles, vars }: {
  title: string;
  description: string;
  roles: BrandSemanticRole[];
  vars: Record<string, string>;
}) {
  return (
    <Stack gap="2xs">
      <Text fw={700}>{title}</Text>
      <Text size="sm">{description}</Text>
      <Group gap="sm" wrap="wrap">
        {roles.map((role) => {
          const value = vars[roleVarName(role)];
          return (
            <Stack key={role} gap={4} align="center" miw={96}>
              <Box
                style={{
                  width: 40,
                  height: 40,
                  background: value,
                  border: '1px solid var(--gds-border-card, var(--mantine-color-gray-3))',
                  borderRadius: 'var(--gds-radius-sm)',
                }}
              />
              <Text size="xs" fw={600}>{role}</Text>
              <Text size="xs" c="dimmed" ff="monospace">{value ?? 'unset'}</Text>
            </Stack>
          );
        })}
      </Group>
    </Stack>
  );
}

/**
 * Reference for the colour and theming axis: every BrandSemanticRole grouped by its 60-30-10
 * proportion classification, the governed accent axis (names, shades, modes, and which modes
 * verify:accent-contrast enforces), and the live contrast matrix for the default preset --
 * embedding GdsAccentContrastMatrix rather than re-deriving contrast, so this page can never
 * disagree with the gate that checks it.
 */
export function GdsColorSystemReference() {
  const light = getGdsVibeThemeCssVariables('default', 'light');

  return (
    <Stack gap="md" data-gds-color-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>Semantic roles — the 60-30-10 classification</Text>
        <Text size="sm">
          Every BrandSemanticRole belongs to exactly one class, enforced at module load so a
          role added without a classification fails loudly rather than under-counting
          silently. Swatches shown for the default preset, light scheme.
        </Text>
      </Stack>

      <RoleGroup
        title="Dominant (~60%)"
        description="Large-surface roles: backgrounds, body text, disabled states. Low-saturation by design so a 60% share reads calm, not loud."
        roles={DOMINANT_ROLES}
        vars={light}
      />
      <RoleGroup
        title="Secondary (~30%)"
        description="Brand-chrome roles: moderate-frequency, identity-carrying. Appears often but never as the majority page fill."
        roles={SECONDARY_ROLES}
        vars={light}
      />
      <RoleGroup
        title="Accent (~10%)"
        description="Scarce-signal roles: CTAs, status, badges, focus rings. Rare and attention-carrying, never a background fill for a large surface."
        roles={ACCENT_ROLES}
        vars={light}
      />

      <Stack gap="2xs">
        <Text fw={700}>The accent axis — governed names, shades, and modes</Text>
        <Text size="sm">
          A theme supplies one ramp per accent name; every shade and mode below is derived from
          it, never hand-picked per combination.
        </Text>
        {/*
          A 2-row key/value table forced "Accent names"/"Modes" into a narrow label column and
          squeezed the real content into the rest -- measured live at a 561px cell height for
          three wrapped mode-reason sentences. This isn't tabular data (two heterogeneous rows),
          so a plain Stack of labeled rows sidesteps the column-width problem entirely.
        */}
        <Stack gap="xs">
          <Text size="sm"><Text component="span" fw={600}>Accent names</Text>: {GDS_ACCENT_NAMES.join(', ')}</Text>
          <Stack gap={4}>
            {GDS_ACCENT_MODES.map((mode) => (
              <Text key={mode} size="sm">
                <Text component="span" fw={600}>{mode}</Text> — {GDS_ACCENT_MODE_ENFORCEMENT[mode].enforced ? 'enforced' : 'measured only'}: {GDS_ACCENT_MODE_ENFORCEMENT[mode].reason}
              </Text>
            ))}
          </Stack>
        </Stack>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Live contrast matrix — default preset, light scheme</Text>
        <Text size="sm">
          Every accent x shade x mode combination, with its measured ratio and required
          threshold. Computed by evaluateGdsAccentContrast() — the same function
          verify:accent-contrast runs.
        </Text>
        <GdsAccentContrastMatrix preset="default" colorScheme="light" />
      </Stack>
    </Stack>
  );
}
