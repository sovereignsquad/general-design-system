import { Badge, Code, Group, Stack, Table, Text, UnstyledButton } from '@mantine/core';
import {
  gdsMotionDurations,
  gdsMotionEasings,
  gdsMotionPresets,
  GDS_DEFAULT_REACTION_AXIS,
  useGdsReducedMotion,
} from '@sovereignsquad/gds-theme';

/**
 * Motion system reference: six durations, five easings, seven presets, and the reaction axis
 * (hover/active/pressed + focus ring + transitioned-property scope).
 *
 * Values are read live from gdsMotionDurations/gdsMotionEasings/gdsMotionPresets/
 * GDS_DEFAULT_REACTION_AXIS, never retyped. Specimens use the same tokens withGdsMotion wires
 * into the theme.
 */
export function GdsMotionSystemReference() {
  const reducedMotion = useGdsReducedMotion();
  const axis = GDS_DEFAULT_REACTION_AXIS;

  return (
    <Stack gap="md" data-gds-motion-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>Durations and easings — the whole vocabulary</Text>
        <Text size="sm">
          Six durations and five easings; every transition in the system is composed from
          these. Nothing animates outside this table.
        </Text>
        <Group gap="xs">
          {Object.entries(gdsMotionDurations).map(([name, ms]) => (
            <Badge key={name} variant="light">{name} · {ms}ms</Badge>
          ))}
        </Group>
        <Group gap="xs">
          {Object.entries(gdsMotionEasings).map(([name, curve]) => (
            <Badge key={name} variant="outline">{name} · {curve}</Badge>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>The seven presets, live</Text>
        <Text size="sm">
          A preset names an intent — overlay, drawer, command, list, feedback, skeleton,
          state — and carries its transition, transforms, and its own reduced-motion form.
          Hover each specimen: the movement you see IS the preset&rsquo;s transition, read from
          the export, not re-authored for this page.
          {reducedMotion
            ? ' This visit has prefers-reduced-motion, so every specimen is showing its reduced form — that fallback being automatic is the feature.'
            : ''}
        </Text>
        <Group gap="sm" align="stretch">
          {Object.values(gdsMotionPresets).map((preset) => (
            <UnstyledButton
              key={preset.id}
              data-gds-motion
              data-gds-motion-specimen={preset.id}
              style={{
                padding: 'var(--gds-space-sm)',
                borderRadius: 'var(--gds-radius-panel)',
                border: '1px solid var(--gds-border-card)',
                background: 'var(--gds-bg-card)',
                transition: reducedMotion ? preset.reducedTransition : preset.transition,
                transform: reducedMotion ? preset.reducedTransform : preset.exitTransform,
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = reducedMotion ? (preset.reducedTransform ?? 'none') : preset.enterTransform;
                event.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = reducedMotion ? (preset.reducedTransform ?? 'none') : preset.exitTransform;
                event.currentTarget.style.opacity = '0.85';
              }}
            >
              <Stack gap={2}>
                <Text size="sm" fw={600}>{preset.id}</Text>
                <Text size="xs" c="dimmed">{preset.duration} · {preset.easing}</Text>
                <Text size="xs" c="dimmed">{preset.usage}</Text>
              </Stack>
            </UnstyledButton>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>The reaction axis — micro-feedback on every control</Text>
        <Text size="sm">
          Hover, active, and pressed treatments plus the focus ring are an AXIS a theme
          declares once, not per-component CSS: every governed control reacts consistently, and
          a theme can retune all of it in one place. The values below are the default
          axis&rsquo;s own.
        </Text>
        <Table withTableBorder>
          <Table.Tbody>
            <Table.Tr><Table.Td>hover</Table.Td><Table.Td><Code>{String(axis.hover)}</Code></Table.Td></Table.Tr>
            <Table.Tr><Table.Td>active</Table.Td><Table.Td><Code>{String(axis.active)}</Code></Table.Td></Table.Tr>
            <Table.Tr><Table.Td>pressed</Table.Td><Table.Td><Code>{String(axis.pressed)}</Code></Table.Td></Table.Tr>
            {axis.focusRing ? (
              <Table.Tr><Table.Td>focus ring</Table.Td><Table.Td><Code>{`${axis.focusRing.width} ${axis.focusRing.style}, offset ${axis.focusRing.offset}, role ${axis.focusRing.colorRole}`}</Code></Table.Td></Table.Tr>
            ) : null}
            <Table.Tr><Table.Td>transition scope</Table.Td><Table.Td><Code>{(axis.transitionScope ?? []).join(', ')}</Code></Table.Td></Table.Tr>
          </Table.Tbody>
        </Table>
        <Text size="sm" c="dimmed">
          Wire-up is one call: <Code>withGdsMotion(theme)</Code> — see docs/MOTION_SYSTEM.md.
          Reduced motion collapses every treatment to its documented safe form via the same
          tokens; nothing opts out element by element.
        </Text>
      </Stack>
    </Stack>
  );
}
