import { useMemo } from 'react';
import { Code, Group, Stack, Table, Text } from '@mantine/core';
import {
  GDS_ACCENT_SHADES, getGdsContrastRatio, getGdsVibeThemeCssVariables,
  resolveGdsAccentTokens, type GdsAccentName, type GdsThemePresetId,
  useGdsAmbientTheme,
} from '@sovereignsquad/gds-theme';
import { GdsBadge } from './GdsBadge';
import { GDS_PIN_HEAD_CENTER_OFFSET, GDS_PIN_ICON_SCALE, GDS_PIN_SELECTED_SCALE, GdsMapPinBadge } from './GdsMapPinBadge';

/** Props for {@link GdsPinSystemReference}. */
export interface GdsPinSystemReferenceProps {
  /** Preset the contrast figures are measured against. */
  preset?: GdsThemePresetId | string;
  /** Scheme the contrast figures are measured in. */
  colorScheme?: 'light' | 'dark';
  /** Accents shown in the matrix. Defaults to a representative four. */
  accents?: GdsAccentName[];
}

const DEFAULT_ACCENTS: GdsAccentName[] = ['ocean', 'teal', 'grape', 'forest'];

/**
 * The pin system explained: anatomy, composition modes, and a measured accent × shade matrix.
 *
 * Issue 571. The pin's design rationale — the solved centre, the icon-scale bound, why the
 * ring layer was removed, why shades only darken — existed **only as source comments**. A
 * consumer never encounters those, so they keep hand-composing pins incorrectly, which is the
 * exact failure the component was built to prevent.
 *
 * Every number here is **surfaced from the source or computed live**. Nothing is retyped: a
 * copied constant drifts the first time the source changes, which would reproduce that same
 * failure inside the documentation meant to cure it.
 */
export function GdsPinSystemReference({
  preset, colorScheme, accents = DEFAULT_ACCENTS,
}: GdsPinSystemReferenceProps) {
  // Issue 621: the reference's measured tables follow the ACTIVE theme by default, so the page
  // documents what the visitor is looking at; explicit props remain for per-preset composition.
  const ambient = useGdsAmbientTheme();
  const activePreset = preset ?? ambient.preset;
  const activeScheme = colorScheme ?? ambient.colorScheme;
  const rows = useMemo(() => {
    const tokens = resolveGdsAccentTokens(undefined, activeScheme, activePreset);
    const surface = getGdsVibeThemeCssVariables(activePreset as GdsThemePresetId, activeScheme)['--gds-bg-card'];
    return accents.flatMap((accent) => GDS_ACCENT_SHADES.map((shade) => {
      const value = tokens[`--gds-accent-${accent}-${shade}`];
      // Filled mode is the guarantee that matters: white icon on the accent. Measured live
      // against the same resolver the release gate uses, so this table cannot disagree with
      // the build.
      const filled = getGdsContrastRatio('#ffffff', value);
      const outline = getGdsContrastRatio(value, surface);
      return { accent, shade, value, filled, outline };
    }));
  }, [accents, activeScheme, activePreset]);

  return (
    <Stack gap="md">
      <Stack gap="2xs">
        <Text fw={700}>Anatomy — exactly two layers</Text>
        <Text size="sm">
          A pin is the shape and the icon. Nothing else. An earlier revision added a ring capsule and it
          was removed; the component keeps two layers so a consumer cannot end up compositing a third.
        </Text>
        <Group gap="lg" align="center">
          <GdsMapPinBadge accent="ocean" icon="Location" label="Outline mode" size={56} />
          <GdsMapPinBadge accent="ocean" icon="Location" label="Filled mode" size={56} filled />
          <GdsMapPinBadge accent="ocean" icon="Location" label="Emoji mode" size={56} emoji="🏊" />
        </Group>
        <Text size="sm" c="dimmed">
          Outline: pin and icon share the accent. Filled: solid accent with an inverse icon that never
          reuses the accent. Emoji: a fixed dark-neutral disc with an accent ring — OS-rendered glyphs
          have colours GDS cannot control, so their legibility must not depend on the active accent.
        </Text>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>States — silhouette and scale, never the hue</Text>
        <Text size="sm">
          The governing rule (issue 545): the fill belongs to the activity, so state is carried by
          silhouette and scale. Hover darkens the <em>stroke</em> one step down the same accent&rsquo;s
          own ladder at weight 2.25; selection scales the whole marker by {GDS_PIN_SELECTED_SCALE}{' '}
          around the tail tip, so the anchored map point does not move; approximate location swaps the
          solid accent stroke for a dashed neutral one while the icon keeps the accent. No state ever
          repaints the category&rsquo;s own colour — a test enforces it.
        </Text>
        <Group gap="lg" align="flex-end">
          <GdsMapPinBadge accent="forest" icon="Location" label="Idle" size={56} filled />
          <GdsMapPinBadge accent="forest" icon="Location" label="Hovered" size={56} filled state="hovered" />
          <GdsMapPinBadge accent="forest" icon="Location" label="Selected" size={56} filled state="selected" />
          <GdsMapPinBadge accent="forest" icon="Location" label="Approximate location" size={56} state="approximate" />
        </Group>
        <Text size="sm" c="dimmed">
          Saved is not a state: it is a user action with its own governed control, composed as{' '}
          <Code>{'<GdsSavedIndicator mode="corner" anchor={<GdsMapPinBadge …/>} />'}</Code> — a pin can
          be saved while hovered or selected.
        </Text>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>The centre is solved, not eyeballed</Text>
        <Text size="sm">
          The icon is centred on the pin&rsquo;s own circle, whose centre sits one unit above the box
          centre in the 24-unit path space — so the offset is exactly <Code>-1/24</Code>:
        </Text>
        {/* Surfaced from the source. Retyping it is what this page exists to prevent. */}
        <Code block>{`transform: ${GDS_PIN_HEAD_CENTER_OFFSET} scale(${GDS_PIN_ICON_SCALE})`}</Code>
        <Text size="sm" c="dimmed">
          The rule is &ldquo;centre on the pin&rsquo;s circle&rdquo;, not a number tuned until it looked
          right. The visible dome&rsquo;s midpoint is a <em>different</em> point — centring on the dome
          would be a distinct deliberate choice, not a correction to this one. The icon scale is bounded
          at {GDS_PIN_ICON_SCALE}: the widest shipped glyphs render past the circle above roughly 0.48.
        </Text>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Accent × shade, measured live</Text>
        <Text size="sm">
          Shades darken only. Lightening breaks the filled-mode white-on-accent guarantee — <Code>teal</Code>{' '}
          fails at only +4 lightness — so a theme wanting lighter categories declares a lighter{' '}
          <em>base</em>, which the contrast gate then verifies.
        </Text>
        <Table.ScrollContainer minWidth={520}>
          <Table striped withTableBorder>
            <Table.Caption>
              Contrast for {activePreset} in {activeScheme} mode, computed from resolved tokens — not written down.
            </Table.Caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th scope="col">Accent</Table.Th>
                <Table.Th scope="col">Shade</Table.Th>
                <Table.Th scope="col">Pin</Table.Th>
                <Table.Th scope="col">Filled (icon on accent)</Table.Th>
                <Table.Th scope="col">Outline (accent on card)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={`${row.accent}-${row.shade}`}>
                  <Table.Th scope="row">{row.accent}</Table.Th>
                  <Table.Td>{row.shade}</Table.Td>
                  <Table.Td><GdsMapPinBadge accent={row.accent} shade={row.shade} icon="Location" label={`${row.accent} ${row.shade}`} filled /></Table.Td>
                  {/* Ratio AND threshold, with a text verdict — never colour alone. */}
                  <Table.Td>
                    <GdsBadge
                      tone={(row.filled ?? 0) >= 4.5 ? 'success' : 'danger'}
                      icon={(row.filled ?? 0) >= 4.5 ? 'Success' : 'Danger'}
                      label={`${row.filled?.toFixed(2) ?? '—'}:1 / 4.5`}
                    />
                  </Table.Td>
                  <Table.Td><Text size="sm">{row.outline?.toFixed(2) ?? '—'}:1</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed">
          Outline figures are reported, not enforced: no component renders an accent as text on a page,
          so gating that mode would fail the build for a combination nothing draws.
        </Text>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Do not hand-compose a pin</Text>
        <Text size="sm">
          The centring offset, icon scale and contrast guarantee are all solved together. A hand-built
          pin gets one of them wrong silently — the icon drifts off the circle, or the glyph clips, or
          the accent stops carrying its white icon. <Code>label</Code> is always consumer-supplied and
          never derived from an icon library&rsquo;s display name: Tabler&rsquo;s{' '}
          <Code>IconBallFootball</Code> reads as &ldquo;BallFootball&rdquo;, which is not a category.
        </Text>
      </Stack>
    </Stack>
  );
}
