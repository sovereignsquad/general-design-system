import { Button, Card, Chip, Code, Group, Paper, SimpleGrid, Stack, Table, Text, TextInput } from '@mantine/core';
import {
  GDS_RADIUS_STEPS, GDS_RADIUS_ROLES, resolveGdsShapeTokens,
  GDS_SHAPE_PROFILE_NAMES, GDS_SHAPE_PROFILES,
  GDS_ELEVATION_STEPS, GDS_ELEVATION_ROLES, resolveGdsElevationTokens,
} from '@sovereignsquad/gds-theme';
import { GdsShapeScope } from './GdsShapeScope';

/** Reference for the shape and elevation axes: every step/role read from resolveGdsShapeTokens()/resolveGdsElevationTokens(). */
export function GdsShapeElevationSystemReference() {
  const shapeTokens = resolveGdsShapeTokens();
  const elevationTokens = resolveGdsElevationTokens();

  return (
    <Stack gap="md" data-gds-shape-elevation-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>Radius steps — the whole scale</Text>
        <Text size="sm">
          Seven steps, none to pill; every rounded corner in the system is one of these.
        </Text>
        <Group gap="sm" align="flex-end">
          {GDS_RADIUS_STEPS.map((step) => (
            <Stack key={step} gap={4} align="center">
              <Paper
                withBorder
                p="md"
                style={{ borderRadius: shapeTokens[`--gds-radius-${step}`], background: 'var(--gds-bg-card)' }}
              >
                <Text size="xs" fw={600}>{step}</Text>
              </Paper>
              <Text size="xs" c="dimmed"><Code>{shapeTokens[`--gds-radius-${step}`]}</Code></Text>
            </Stack>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Radius roles — named surfaces, not raw steps</Text>
        <Text size="sm">
          Component source asks for a role, never a step directly — every role below resolves
          through the same axis <Code>resolveGdsShapeTokens()</Code> emits, falling back to the
          axis&rsquo;s default step when a theme leaves a role undeclared.
        </Text>
        <Table withTableBorder>
          <Table.Tbody>
            {GDS_RADIUS_ROLES.map((role) => (
              <Table.Tr key={role}>
                <Table.Td>{role}</Table.Td>
                <Table.Td><Code>{shapeTokens[`--gds-radius-${role}`]}</Code></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {(() => {
          const values = GDS_RADIUS_ROLES.map((role) => shapeTokens[`--gds-radius-${role}`]);
          const distinctCount = new Set(values).size;
          return (
            <Text size="sm" c="dimmed">
              {distinctCount === 1
                ? `All ${GDS_RADIUS_ROLES.length} roles above resolve to the same value here: this axis declares no per-role overrides, so every role falls back to the default step.`
                : `${distinctCount} distinct value(s) across ${GDS_RADIUS_ROLES.length} roles.`}
              {' '}Card, Paper, Button, TextInput, Badge, Chip, Modal and Drawer take their radius
              from these roles, so a theme or a <Code>GdsShapeScope</Code> that changes a role
              changes those components.
            </Text>
          );
        })()}
      </Stack>

      <Stack gap="2xs" data-gds-shape-profiles="">
        <Text fw={700}>Shape profiles — the same components, three role maps</Text>
        <Text size="sm">
          Each column wraps the same Card, Paper, TextInput, Button and Chip in a{' '}
          <Code>GdsShapeScope</Code>. A scope sets only its profile&rsquo;s own roles, from{' '}
          <Code>GDS_SHAPE_PROFILES</Code>, pointing at the active theme&rsquo;s own steps; every other role, and every role under <Code>default</Code>, stays the theme&rsquo;s.
        </Text>
        <SimpleGrid cols={{ base: 1, md: GDS_SHAPE_PROFILE_NAMES.length }} spacing="md">
          {GDS_SHAPE_PROFILE_NAMES.map((profile) => {
            const roles: Partial<Record<string, string>> = profile === 'default' ? {} : GDS_SHAPE_PROFILES[profile];
            return (
              <GdsShapeScope key={profile} profile={profile}>
                <Stack gap="sm">
                  <Text fw={600}>{profile}</Text>
                  <Card>
                    <Stack gap="xs">
                      <Text size="sm" fw={600}>Card</Text>
                      <TextInput label="Input" placeholder="Search" />
                      <Group gap="xs">
                        <Button size="xs">Button</Button>
                        <Chip size="xs" checked readOnly>Chip</Chip>
                      </Group>
                    </Stack>
                  </Card>
                  <Paper p="xs">
                    <Table>
                      <Table.Tbody>
                        {(['card', 'panel', 'input', 'button', 'chip', 'modal', 'sheet'] as const).map((role) => (
                          <Table.Tr key={role}>
                            <Table.Td>{role}</Table.Td>
                            <Table.Td><Code>{roles[role] ?? 'theme'}</Code></Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Stack>
              </GdsShapeScope>
            );
          })}
        </SimpleGrid>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Elevation steps — flat to raised</Text>
        <Text size="sm">
          Five steps, none to a deep shadow. The axis itself refuses a step that comes back
          down after a raised one — a modal flatter than the card behind it is treated as a
          rendering bug, not a theme choice.
        </Text>
        <Group gap="sm" align="flex-end">
          {GDS_ELEVATION_STEPS.map((step) => (
            <Stack key={step} gap={4} align="center">
              <Paper
                p="md"
                style={{ boxShadow: elevationTokens[`--gds-elevation-${step}`], background: 'var(--gds-bg-card)' }}
              >
                <Text size="xs" fw={600}>{step}</Text>
              </Paper>
            </Stack>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Elevation roles — named surfaces, not raw steps</Text>
        <Text size="sm">
          Same role-over-step discipline as shape: a card and a tooltip never share a
          hand-tuned shadow, they share a role that resolves through <Code>resolveGdsElevationTokens()</Code>.
        </Text>
        <Table withTableBorder>
          <Table.Tbody>
            {GDS_ELEVATION_ROLES.map((role) => (
              <Table.Tr key={role}>
                <Table.Td>{role}</Table.Td>
                <Table.Td>
                  <Paper
                    p="xs"
                    style={{ boxShadow: elevationTokens[`--gds-elevation-${role}`], background: 'var(--gds-bg-card)', display: 'inline-block' }}
                  >
                    <Text size="xs" c="dimmed">{role}</Text>
                  </Paper>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
