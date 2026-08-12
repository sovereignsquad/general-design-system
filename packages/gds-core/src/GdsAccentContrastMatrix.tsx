import { useMemo } from 'react';
import { Group, Stack, Table, Text } from '@mantine/core';
import {
  GDS_ACCENT_MODES, GDS_ACCENT_MODE_ENFORCEMENT, GDS_ACCENT_NAMES, GDS_ACCENT_SHADES,
  evaluateGdsAccentContrast, getGdsVibeThemeCssVariables,
  type GdsAccentContrastResult, type GdsThemePresetId,
} from '@sovereignsquad/gds-theme';
import { GdsBadge } from './GdsBadge';
import { GdsIcon } from './icons';

/** Props for {@link GdsAccentContrastMatrix}. */
export interface GdsAccentContrastMatrixProps {
  /** Preset whose accents are measured. */
  preset: GdsThemePresetId;
  /** Colour scheme the measurement is taken in. */
  colorScheme: 'light' | 'dark';
  /** Optional heading; omit to render the matrix alone inside a section that already has one. */
  title?: string;
}

/** Cell state, carried by text and icon as well as colour (WCAG 1.4.1). */
function ResultCell({ result }: { result: GdsAccentContrastResult }) {
  const enforced = result.enforced;
  const failing = enforced && !result.passes;

  return (
    <Table.Td>
      <Group gap="4px" wrap="nowrap" align="center">
        {/*
          The state is never conveyed by colour alone. A red cell and a green cell are the
          same cell to a colourblind reader, and this matrix exists precisely to be trusted
          about contrast — a component reporting on accessibility that fails 1.4.1 itself
          would be worse than no component.
        */}
        <GdsIcon icon={failing ? 'Danger' : enforced ? 'Success' : 'Info'} size="xs" aria-hidden />
        <Text size="sm" fw={failing ? 600 : 400}>
          {/* Measured ratio AND its threshold — never a bare "fails", per issue 596. */}
          {result.ratio}:1
          <Text component="span" size="xs" c="dimmed"> / {result.required}</Text>
        </Text>
      </Group>
    </Table.Td>
  );
}

/**
 * Live contrast matrix for the accent axis (issue 596).
 *
 * Every accent x shade x mode combination for one preset and scheme, with its **measured
 * ratio and required threshold**. A theme author sees which combinations pass before shipping
 * rather than discovering it from a failed build.
 *
 * Values come from `evaluateGdsAccentContrast()` — the same function `verify:accent-contrast`
 * uses. A second computation could disagree with the gate, and a UI that contradicts the build
 * is worse than no UI.
 *
 * Modes the gate does not enforce are shown too, marked as measured-only with the reason. They
 * are real numbers a theme author wants; hiding them would make the matrix look like it covers
 * less than it does.
 */
export function GdsAccentContrastMatrix({ preset, colorScheme, title }: GdsAccentContrastMatrixProps) {
  const results = useMemo(() => {
    const light = getGdsVibeThemeCssVariables(preset, 'light');
    const dark = getGdsVibeThemeCssVariables(preset, 'dark');
    return evaluateGdsAccentContrast(undefined, { light: light['--gds-bg-page'], dark: dark['--gds-bg-page'] }, preset)
      .filter((r) => r.scheme === colorScheme);
  }, [preset, colorScheme]);

  const byKey = useMemo(() => {
    const map = new Map<string, GdsAccentContrastResult>();
    for (const r of results) map.set(`${r.accent}:${r.shade}:${r.mode}`, r);
    return map;
  }, [results]);

  const enforcedFailures = results.filter((r) => r.enforced && !r.passes).length;
  const caption = `Accent contrast for ${preset} in ${colorScheme} mode: `
    + `${results.filter((r) => r.enforced).length} enforced combinations, ${enforcedFailures} failing.`;

  return (
    <Stack gap="sm">
      {title ? <Text fw={600}>{title}</Text> : null}

      <Group gap="xs">
        <GdsBadge tone={enforcedFailures ? 'danger' : 'success'} icon={enforcedFailures ? 'Danger' : 'Success'}
          label={enforcedFailures ? `${enforcedFailures} enforced failing` : 'All enforced combinations pass'} />
        {GDS_ACCENT_MODES.filter((m) => !GDS_ACCENT_MODE_ENFORCEMENT[m].enforced).map((m) => (
          <GdsBadge key={m} tone="info" icon="Info" label={`${m}: measured, not enforced`} />
        ))}
      </Group>

      <Table.ScrollContainer minWidth={640}>
        <Table striped withTableBorder>
          {/* A caption rather than only a visual heading: a screen-reader user reaching this
              table needs to know what it measures before reading 120 numbers. */}
          <Table.Caption>{caption}</Table.Caption>
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col">Accent</Table.Th>
              {GDS_ACCENT_SHADES.flatMap((shade) =>
                GDS_ACCENT_MODES.map((mode) => (
                  <Table.Th key={`${shade}-${mode}`} scope="col">
                    <Text size="xs" fw={600}>{shade}</Text>
                    <Text size="xs" c="dimmed">{mode}{GDS_ACCENT_MODE_ENFORCEMENT[mode].enforced ? '' : ' *'}</Text>
                  </Table.Th>
                )))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {GDS_ACCENT_NAMES.map((accent) => (
              <Table.Tr key={accent}>
                <Table.Th scope="row">{accent}</Table.Th>
                {GDS_ACCENT_SHADES.flatMap((shade) =>
                  GDS_ACCENT_MODES.map((mode) => {
                    const result = byKey.get(`${accent}:${shade}:${mode}`);
                    return result
                      ? <ResultCell key={`${shade}-${mode}`} result={result} />
                      : <Table.Td key={`${shade}-${mode}`}>—</Table.Td>;
                  }))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Text size="xs" c="dimmed">
        * measured but not enforced.{' '}
        {GDS_ACCENT_MODES.filter((m) => !GDS_ACCENT_MODE_ENFORCEMENT[m].enforced)
          .map((m) => `${m}: ${GDS_ACCENT_MODE_ENFORCEMENT[m].reason}`)
          .join(' ')}
      </Text>
    </Stack>
  );
}
