import { Code, Group, Stack, Table, Text } from '@mantine/core';
import {
  GDS_TEXT_STEPS, GDS_WEIGHT_NAMES, resolveGdsTypographyTokens,
} from '@sovereignsquad/gds-theme';

/**
 * Issue 632/633 — the typography axis, surfaced.
 *
 * `GDS_TEXT_STEPS`/`GDS_WEIGHT_NAMES` and `resolveGdsTypographyTokens()` have existed as a
 * real, validated axis since issue 555: nine text-size steps on a modular scale (base × ratio,
 * with Mantine-matching overrides for `xs`-`xl`), four weights that must ascend, and per-step
 * line-height/tracking/font-lane assignments — with zero live page. The type ratio itself is
 * validated at construction (1.0–2.0), and a weight scale that does not ascend is rejected
 * before it can render as broken text.
 *
 * Rule 14 throughout: every size, weight, and line height below reads from
 * `resolveGdsTypographyTokens()` at render time — the same resolver a theme calls — and each
 * specimen is rendered AT that resolved size, not merely labelled with it.
 */
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
