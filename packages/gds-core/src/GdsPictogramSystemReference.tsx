import { Badge, Code, Group, Stack, Table, Text } from '@mantine/core';
import {
  GdsPictogram, gdsActivityPictograms, getGdsActivityPictogramKeys, gdsPictogramUsageRules,
  GDS_PICTOGRAM_GRID, GDS_PICTOGRAM_BASE_STROKE, GDS_PICTOGRAM_SCALE_PX,
  GDS_PICTOGRAM_STROKE_BY_SCALE, GDS_PICTOGRAM_TREATMENT_SCALE, GDS_PICTOGRAM_HERO_LAYERS,
  GDS_PICTOGRAM_DISABLED_OPACITY,
  type GdsPictogramTreatment, type GdsPictogramScale, type GdsPictogramState,
} from './pictograms';

const STATES: GdsPictogramState[] = ['default', 'hover', 'selected', 'disabled'];

/**
 * Reference for the activity pictogram system: the shipped family, every contextual treatment
 * and scale and interaction state crossed with every pictogram, the numeric contract, and the
 * source guidelines' usage rules — every count and value below is read from the package
 * exports at render time, never retyped (Rule 14).
 */
export function GdsPictogramSystemReference() {
  const keys = getGdsActivityPictogramKeys();
  const treatments = Object.keys(GDS_PICTOGRAM_TREATMENT_SCALE) as GdsPictogramTreatment[];
  const scales = Object.keys(GDS_PICTOGRAM_SCALE_PX) as GdsPictogramScale[];

  return (
    <Stack gap="md" data-gds-pictogram-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>The activity family — {keys.length} pictograms</Text>
        <Text size="sm">
          One governed family (<Code>{gdsActivityPictograms.id}</Code>) on a{' '}
          {GDS_PICTOGRAM_GRID}×{GDS_PICTOGRAM_GRID} optical grid — they signal the activity,
          never a scene. Every path is the real, unmodified data of a published icon-library
          glyph, never hand-drawn or redrawn:{' '}
          {keys.length - Object.values(gdsActivityPictograms.pictograms).filter((p) => p.fillMode === 'fill').length}{' '}
          render as a line drawing at a base stroke of <Code>{GDS_PICTOGRAM_BASE_STROKE}</Code>,
          matching the source icon set's own line grammar; the remaining{' '}
          {Object.values(gdsActivityPictograms.pictograms).filter((p) => p.fillMode === 'fill').length}{' '}
          ship as a solid <Code>currentColor</Code> shape because that is the only real form the
          source glyph exists in.
        </Text>
        <Group gap="lg">
          {keys.map((key) => (
            <Stack key={key} gap={4} align="center" w={72}>
              <GdsPictogram pictogram={key} treatment="detail" label={gdsActivityPictograms.pictograms[key].label} />
              <Text size="xs" c="dimmed" ta="center">{gdsActivityPictograms.pictograms[key].label}</Text>
            </Stack>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Contextual treatments — {treatments.length} contexts, one drawing each</Text>
        <Text size="sm">
          <Code>list</Code>, <Code>detail</Code>, <Code>hero</Code>, and <Code>pin</Code> each
          resolve to their own default scale (<Code>GDS_PICTOGRAM_TREATMENT_SCALE</Code>) and
          stroke weight — the path data itself never changes across a row.
        </Text>
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Pictogram</Table.Th>
              {treatments.map((treatment) => (
                <Table.Th key={treatment}>{treatment} · {GDS_PICTOGRAM_TREATMENT_SCALE[treatment]} · {GDS_PICTOGRAM_SCALE_PX[GDS_PICTOGRAM_TREATMENT_SCALE[treatment]]}px</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {keys.map((key) => (
              <Table.Tr key={key}>
                <Table.Td>{gdsActivityPictograms.pictograms[key].label}</Table.Td>
                {treatments.map((treatment) => (
                  <Table.Td key={treatment}>
                    <GdsPictogram pictogram={key} treatment={treatment} label={gdsActivityPictograms.pictograms[key].label} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Scales — {scales.length} sizes, stroke tuned per size</Text>
        <Text size="sm">
          The same <Code>soccer</Code> drawing at each scale, with the grid-space stroke width
          (<Code>GDS_PICTOGRAM_STROKE_BY_SCALE</Code>) that keeps it legible at that rendered
          size — <Code>scale</Code> overrides a treatment&rsquo;s default here to isolate the axis.
        </Text>
        <Group gap="xl" align="flex-end">
          {scales.map((scale) => (
            <Stack key={scale} gap={4} align="center">
              <GdsPictogram pictogram="soccer" scale={scale} label={`Soccer at ${scale}`} />
              <Text size="xs" c="dimmed">{scale} · {GDS_PICTOGRAM_SCALE_PX[scale]}px · stroke {GDS_PICTOGRAM_STROKE_BY_SCALE[scale]}</Text>
            </Stack>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Interaction states — {STATES.length} states, token colour only</Text>
        <Text size="sm">
          Rendered at the <Code>detail</Code> treatment so <Code>selected</Code>&rsquo;s accent
          fill and <Code>disabled</Code>&rsquo;s reduced opacity read clearly. No state
          introduces a new hue: <Code>hover</Code> is a surface-level cue owned by the host, so
          the drawing itself is identical to <Code>default</Code>.
        </Text>
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Pictogram</Table.Th>
              {STATES.map((state) => (<Table.Th key={state}>{state}</Table.Th>))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {keys.map((key) => (
              <Table.Tr key={key}>
                <Table.Td>{gdsActivityPictograms.pictograms[key].label}</Table.Td>
                {STATES.map((state) => (
                  <Table.Td key={state}>
                    <GdsPictogram pictogram={key} treatment="detail" state={state} label={`${gdsActivityPictograms.pictograms[key].label} — ${state}`} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Hero layering — {GDS_PICTOGRAM_HERO_LAYERS.length} layers, scale/opacity only</Text>
        <Text size="sm">
          The bounded recipe behind the <Code>hero</Code> treatment: the real mark plus{' '}
          {GDS_PICTOGRAM_HERO_LAYERS.length - 1} larger, fainter, offset echoes of the identical
          path — depth from transform and opacity alone, never a second colour.
        </Text>
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Layer</Table.Th>
              <Table.Th>scale</Table.Th>
              <Table.Th>opacity</Table.Th>
              <Table.Th>offsetX</Table.Th>
              <Table.Th>offsetY</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {GDS_PICTOGRAM_HERO_LAYERS.map((layer, index) => (
              <Table.Tr key={`${layer.scale}-${layer.offsetX}-${layer.offsetY}`}>
                <Table.Td>{index}</Table.Td>
                <Table.Td><Code>{layer.scale}</Code></Table.Td>
                <Table.Td><Code>{layer.opacity}</Code></Table.Td>
                <Table.Td><Code>{layer.offsetX}</Code></Table.Td>
                <Table.Td><Code>{layer.offsetY}</Code></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Group gap="xl" align="center">
          <GdsPictogram pictogram="basketball" treatment="hero" label="Basketball, hero treatment" />
          <GdsPictogram pictogram="camps" treatment="hero" label="Camps, hero treatment" />
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Numeric contract — read from the exports, never retyped</Text>
        <Table withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>Optical grid</Table.Td>
              <Table.Td><Code>{GDS_PICTOGRAM_GRID}×{GDS_PICTOGRAM_GRID}</Code></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Base stroke</Table.Td>
              <Table.Td><Code>{GDS_PICTOGRAM_BASE_STROKE}</Code></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Disabled opacity</Table.Td>
              <Table.Td><Code>{GDS_PICTOGRAM_DISABLED_OPACITY}</Code></Table.Td>
            </Table.Tr>
            {scales.map((scale) => (
              <Table.Tr key={scale}>
                <Table.Td>Scale <Code>{scale}</Code></Table.Td>
                <Table.Td>{GDS_PICTOGRAM_SCALE_PX[scale]}px, stroke <Code>{GDS_PICTOGRAM_STROKE_BY_SCALE[scale]}</Code></Table.Td>
              </Table.Tr>
            ))}
            {treatments.map((treatment) => (
              <Table.Tr key={treatment}>
                <Table.Td>Treatment <Code>{treatment}</Code></Table.Td>
                <Table.Td>defaults to scale <Code>{GDS_PICTOGRAM_TREATMENT_SCALE[treatment]}</Code></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Usage rules — {gdsPictogramUsageRules.length} rules from the source guidelines</Text>
        <Text size="sm">
          Shipped as data (<Code>gdsPictogramUsageRules</Code>) rather than retyped prose, so
          this list can never drift from what the mechanism actually enforces or documents.
        </Text>
        <Stack gap={4}>
          {gdsPictogramUsageRules.map((rule) => (
            <Group key={rule.id} gap="xs" align="flex-start" wrap="nowrap">
              <Badge size="xs" variant="light" style={{ flexShrink: 0 }}>{rule.treatment}</Badge>
              <Text size="sm">{rule.rule}</Text>
            </Group>
          ))}
        </Stack>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Decorative vs informative — the accessibility contract</Text>
        <Text size="sm">
          Exact parity with <Code>GdsIcon</Code>: no <Code>label</Code> renders{' '}
          <Code>aria-hidden</Code>; supplying <Code>label</Code> renders <Code>role=&quot;img&quot;</Code>{' '}
          with an <Code>aria-label</Code>. Pictograms are never mirrored for RTL locales — they
          are direction-neutral drawings, not directional glyphs.
        </Text>
        <Group gap="xl">
          <Group gap="xs">
            <GdsPictogram pictogram="tennis" />
            <Text size="sm">Decorative — no label, aria-hidden, the card&rsquo;s own title carries the name</Text>
          </Group>
          <Group gap="xs">
            <GdsPictogram pictogram="tennis" label="Tennis" />
            <Text size="sm">Informative — labelled, the pictogram alone carries the name</Text>
          </Group>
        </Group>
      </Stack>
    </Stack>
  );
}
