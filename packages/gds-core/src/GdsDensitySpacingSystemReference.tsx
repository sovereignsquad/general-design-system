import { Box, Code, Group, Stack, Table, Text } from '@mantine/core';
import {
  GDS_SPACE_STEPS, GDS_CONTROL_SIZES, GDS_MIN_TARGET_PX, GDS_CONTROL_HEIGHT_EXCEPTIONS,
  resolveGdsDensityTokens,
} from '@sovereignsquad/gds-theme';

/** Reference for the density/spacing axis: spacing steps and control heights read from resolveGdsDensityTokens(). */
export function GdsDensitySpacingSystemReference() {
  const tokens = resolveGdsDensityTokens();

  return (
    <Stack gap="md" data-gds-density-spacing-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>Spacing steps — the whole scale</Text>
        <Text size="sm">
          Ten steps, none to 3xl; every margin, gap, and padding in the system is one of these.
          Shown at the default comfortable density (factor 1).
        </Text>
        <Group gap="sm" align="flex-end">
          {GDS_SPACE_STEPS.map((step) => (
            <Stack key={step} gap={4} align="center">
              <Box
                style={{
                  width: tokens[`--gds-space-${step}`],
                  height: tokens[`--gds-space-${step}`],
                  minWidth: 2,
                  minHeight: 2,
                  background: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
                  borderRadius: 'var(--gds-radius-xs)',
                }}
              />
              <Text size="xs" fw={600}>{step}</Text>
              <Text size="xs" c="dimmed"><Code>{tokens[`--gds-space-${step}`]}</Code></Text>
            </Stack>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Control heights — the accessibility floor holds</Text>
        <Text size="sm">
          Five control sizes. GDS holds a {GDS_MIN_TARGET_PX}px floor (stricter than WCAG
          2.5.8&rsquo;s 24px — the AAA figure Apple and Google both publish). A compact or
          spacious density mode scales spacing freely, but a control height only shrinks below
          the floor when the size carries a recorded exception below.
        </Text>
        <Table withTableBorder>
          <Table.Tbody>
            {GDS_CONTROL_SIZES.map((size) => (
              <Table.Tr key={size}>
                <Table.Td>{size}</Table.Td>
                <Table.Td><Code>{tokens[`--gds-control-height-${size}`]}</Code></Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {GDS_CONTROL_HEIGHT_EXCEPTIONS[size] ?? 'holds the floor'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
