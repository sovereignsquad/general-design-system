import { Code, Group, Stack, Table, Text } from '@mantine/core';
import {
  GDS_TEXT_STEPS, GDS_WEIGHT_NAMES, resolveGdsTypographyTokens,
} from '@sovereignsquad/gds-theme';

/** Reference for the typography axis: sizes, weights, and font lanes read from resolveGdsTypographyTokens(). */
export function GdsTypographySystemReference() {
  const tokens = resolveGdsTypographyTokens();

  return (
    <Stack gap="md" data-gds-typography-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>Text-size steps — the whole scale</Text>
        <Text size="sm">
          Nine steps on a modular scale (base × ratio); <Code>xs</Code>–<Code>xl</Code> are
          overridden to match Mantine&rsquo;s own non-uniform ramp exactly, the rest are
          computed from the ratio. Each line below renders at its own resolved size.
        </Text>
        <Stack gap="xs">
          {GDS_TEXT_STEPS.map((step) => (
            <Group key={step} gap="sm" align="baseline">
              <Text
                span
                style={{
                  fontSize: tokens[`--gds-font-size-${step}`],
                  lineHeight: tokens[`--gds-line-height-${step}`] ?? undefined,
                }}
              >
                {step}
              </Text>
              <Text size="xs" c="dimmed"><Code>{tokens[`--gds-font-size-${step}`]}</Code></Text>
            </Group>
          ))}
        </Stack>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Weights — four steps, always ascending</Text>
        <Text size="sm">
          The axis rejects a weight scale that does not ascend at construction time, before it
          can render as broken text.
        </Text>
        <Group gap="lg">
          {GDS_WEIGHT_NAMES.map((name) => (
            <Text key={name} fw={Number(tokens[`--gds-weight-${name}`])} size="lg">
              {name} · {tokens[`--gds-weight-${name}`]}
            </Text>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Font lanes — display, body, mono</Text>
        <Text size="sm">
          Three roles a theme assigns a registered lane id to; component source asks for a
          role, never a font family directly.
        </Text>
        <Table withTableBorder>
          <Table.Tbody>
            {(['display', 'body', 'mono'] as const).map((role) => (
              <Table.Tr key={role}>
                <Table.Td>{role}</Table.Td>
                <Table.Td><Code>{tokens[`--gds-font-lane-${role}`]}</Code></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
