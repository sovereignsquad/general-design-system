import { Badge, Code, Group, Stack, Text } from '@mantine/core';
import { GdsIcon, getGdsIconKeys, getGdsIconMetadata, gdsIconToneColor, type GdsIconCategory, type GdsIconTone } from './icons';

const CATEGORIES: GdsIconCategory[] = [
  'action', 'status', 'resource', 'navigation', 'media', 'feedback', 'system', 'content', 'commerce', 'security',
];
const TONES: GdsIconTone[] = ['default', 'primary', 'success', 'warning', 'danger', 'info', 'muted'];

/**
 * Issue 632/633 — the icon system, surfaced.
 *
 * `GdsIcons`/`getGdsIconKeys()`/`getGdsIconMetadata()` govern every icon a consumer may use —
 * a stroke-SVG dictionary, ten semantic categories, and the decorative-vs-informative
 * accessibility contract — with no reference page a reader could find until now. Consumers
 * "must use `GdsIcon` instead of importing tabler icons directly" (the component's own doc
 * comment); this page is where that rule becomes checkable.
 *
 * Rule 14 throughout: the dictionary is walked live via `getGdsIconKeys()`, every icon renders
 * through the real `GdsIcon` component (not a re-implementation), and tone colours read from
 * `gdsIconToneColor`. Nothing here is a hand-picked sample.
 */
export function GdsIconSystemReference() {
  const keys = getGdsIconKeys();
  const byCategory = CATEGORIES.map((category) => ({
    category,
    icons: keys.filter((key) => getGdsIconMetadata(key).category === category),
  }));

  return (
    <Stack gap="md" data-gds-icon-system-reference="">
      <Stack gap="2xs">
        <Text fw={700}>The icon dictionary — {keys.length} icons across {CATEGORIES.length} categories</Text>
        <Text size="sm">
          Every icon a consumer may use, governed through <Code>GdsIcon</Code> rather than a
          direct Tabler import — grouped by the same semantic category
          <Code>getGdsIconMetadata()</Code> assigns each key.
        </Text>
        {byCategory.map(({ category, icons }) => (
          <Stack key={category} gap={4}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={600}>{category}</Text>
              <Badge size="xs" variant="light">{icons.length}</Badge>
            </Group>
            <Group gap="md">
              {icons.map((key) => {
                const meta = getGdsIconMetadata(key);
                return (
                  <Stack key={key} gap={2} align="center" w={64}>
                    <GdsIcon icon={key} size="lg" label={meta.defaultLabel} />
                    <Text size="xs" c="dimmed" ta="center">{meta.defaultLabel}</Text>
                  </Stack>
                );
              })}
            </Group>
          </Stack>
        ))}
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Tones — semantic colour, never a raw hex</Text>
        <Text size="sm">
          Seven tones; <Code>default</Code> inherits the surrounding text colour, the rest read
          from <Code>gdsIconToneColor</Code>.
        </Text>
        <Group gap="lg">
          {TONES.map((tone) => (
            <Stack key={tone} gap={2} align="center">
              <GdsIcon icon="Star" size="lg" tone={tone} label={`${tone} tone`} />
              <Text size="xs" c="dimmed">{tone}</Text>
              <Text size="xs" c="dimmed">{gdsIconToneColor[tone] ?? 'inherited'}</Text>
            </Stack>
          ))}
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Decorative vs informative — the accessibility contract</Text>
        <Text size="sm">
          An icon with no <Code>label</Code> renders <Code>aria-hidden</Code> — decorative,
          because the text beside it already carries the meaning. Supplying <Code>label</Code>
          makes it informative: the icon itself gets the accessible name, for the rare case
          where nothing else on the page does.
        </Text>
        <Group gap="xl">
          <Group gap="xs">
            <GdsIcon icon="Info" size="md" />
            <Text size="sm">Decorative — no label, aria-hidden, text does the work</Text>
          </Group>
          <Group gap="xs">
            <GdsIcon icon="Info" size="md" label="More information" />
            <Text size="sm">Informative — labelled, the icon alone carries the name</Text>
          </Group>
        </Group>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Badge glyph mode is a separate axis</Text>
        <Text size="sm">
          Badges can additionally switch every glyph to emoji instead of a Tabler stroke icon
          (<Code>useGdsBadgeIconStyle</Code>/<Code>GdsIconStyleContext</Code>, issue 525) — a
          badge-specific mode, not part of this dictionary. See Badges under Systems for the
          live toggle.
        </Text>
      </Stack>
    </Stack>
  );
}
