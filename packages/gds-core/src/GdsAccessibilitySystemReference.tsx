import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import { auditGdsAccessibilityFloor, gdsAccessibilityFloorRules, type GdsFloorRule } from '@sovereignsquad/gds-theme';
import { SimpleDataTable } from './SimpleDataTable';

/**
 * Reference for the accessibility floor axis: every governed rule, and a live audit result
 * across all 25 presets x 2 schemes, read from auditGdsAccessibilityFloor() -- the same
 * function verify:a11y-floor runs. A page claiming an accessibility floor holds is itself a
 * claim this system can check, so it is computed here, not asserted in prose (Rule 14).
 */
export function GdsAccessibilitySystemReference() {
  const audit = auditGdsAccessibilityFloor();
  const holds = audit.violations.length === 0;

  return (
    <Stack gap="md" data-gds-accessibility-system-reference="">
      <Stack gap="2xs">
        <Group gap="xs" align="center">
          <Text fw={700}>Live audit — every preset, every scheme</Text>
          <Badge color={holds ? 'green' : 'red'} variant="light">
            {holds ? 'Holds' : `${audit.violations.length} violation(s)`}
          </Badge>
        </Group>
        <Text size="sm">
          {audit.rulesEvaluated} rule{audit.rulesEvaluated === 1 ? '' : 's'} checked across{' '}
          {audit.presetsChecked} preset/scheme combinations — the same function
          `npm run verify:a11y-floor` runs, called directly here rather than restated.
        </Text>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>The rules — minimums no theme may cross</Text>
        <Text size="sm">
          Every rule is checkable from resolved tokens alone, so it runs over all 25 presets in
          both schemes without a browser. Rules needing real rendered geometry belong to the
          runtime harness instead (forced-colors, focus-ring, touch-target-floor).
        </Text>
        <SimpleDataTable<GdsFloorRule & Record<string, unknown>>
          columns={[
            { key: 'id', header: 'Rule' },
            { key: 'axis', header: 'Axis' },
            { key: 'wcag', header: 'WCAG' },
            {
              key: 'rationale',
              header: 'Why',
              // A bare `Text` in a table cell gets squeezed to whatever width the other
              // columns leave it -- measured live at 52px, wrapping this sentence-length
              // rationale into a near-vertical string and ballooning the row to 452px tall.
              // A minimum width gives it a readable wrap instead.
              render: (row) => <Box miw={260} maw={360}><Text size="xs" c="dimmed">{row.rationale}</Text></Box>,
            },
          ]}
          rows={gdsAccessibilityFloorRules as (GdsFloorRule & Record<string, unknown>)[]}
          getRowKey={(row) => row.id}
        />
      </Stack>
    </Stack>
  );
}
