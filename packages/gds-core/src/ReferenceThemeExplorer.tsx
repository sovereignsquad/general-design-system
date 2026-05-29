'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Code,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { ActionBar } from './ActionBar';
import { FormField } from './FormField';
import { ListingCard } from './ListingCard';
import { ReferenceSection } from './ReferenceSection';
import { StateBlock } from './StateBlock';
import { ThemeToggle } from './ThemeToggle';
import {
  GdsProvider,
  createPublicBrandTheme,
  gdsDarkPublicTheme,
  gdsEditorialPublicTheme,
  gdsFlatSurfaceTheme,
  gdsTheme,
} from '@doneisbetter/gds-theme';

export type ThemePresetId = 'default' | 'dark-public' | 'flat-surface' | 'editorial' | 'brand';
export type ThemeSchemeId = 'light' | 'dark' | 'auto';

function resolvePreviewColorScheme(presetId: ThemePresetId, requestedScheme: ThemeSchemeId): ThemeSchemeId {
  if (presetId === 'dark-public') {
    return 'dark';
  }

  return requestedScheme;
}

const themePresetCatalog: Record<
  ThemePresetId,
  { label: string; bestFor: string; summary: string; themeKey: string }
> = {
  default: {
    label: 'Default runtime theme',
    bestFor: 'Balanced multi-surface products that need the baseline GDS system.',
    summary: 'The default shared runtime lane for most adopters.',
    themeKey: 'gdsTheme',
  },
  'dark-public': {
    label: 'Dark public theme',
    bestFor: 'Dark-first public experiences and campaign-style landing surfaces.',
    summary: 'A darker public presentation lane with the shipped runtime rhythm intact.',
    themeKey: 'gdsDarkPublicTheme',
  },
  'flat-surface': {
    label: 'Flat surface theme',
    bestFor: 'Operational products that prefer quieter elevation and flatter surface contrast.',
    summary: 'Removes some visual weight without creating a second token authority.',
    themeKey: 'gdsFlatSurfaceTheme',
  },
  editorial: {
    label: 'Editorial serif theme',
    bestFor: 'Documentation, editorial, and content-led experiences.',
    summary: 'Adds a more expressive public reading tone while staying inside GDS contracts.',
    themeKey: 'gdsEditorialPublicTheme',
  },
  brand: {
    label: 'Brand theme generator',
    bestFor: 'Consumer teams that need controlled brand expression without forking the system.',
    summary: 'Composes the shipped helpers into a governed product-authored theme lane.',
    themeKey: 'createPublicBrandTheme(...)',
  },
};

function ThemePreviewSurface({
  preset,
  colorScheme,
  requestedColorScheme,
}: {
  preset: { label: string; summary: string; bestFor: string; themeKey: string };
  colorScheme: ThemeSchemeId;
  requestedColorScheme?: ThemeSchemeId;
}) {
  const forcedScheme = requestedColorScheme && requestedColorScheme !== colorScheme;

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Text fw={700}>{preset.label}</Text>
            <Text size="sm" c="dimmed">
              {preset.summary}
            </Text>
            <Text size="sm">
              <strong>Best for:</strong> {preset.bestFor}
            </Text>
            <Text size="sm">
              <strong>Color scheme:</strong> {colorScheme}
            </Text>
            {forcedScheme ? (
              <Text size="sm" c="dimmed">
                This lane always previews in dark mode so the runtime stays inside its sanctioned contrast contract.
              </Text>
            ) : null}
          </Stack>
          <ThemeToggle />
        </Group>

        <ActionBar
          primary={{ action: 'save', size: 'sm' }}
          secondary={[{ action: 'cancel', size: 'sm' }]}
          tertiary={[{ action: 'preview', size: 'sm' }]}
        />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper withBorder radius="lg" p="md">
            <Stack gap="sm">
              <Text fw={700} size="sm">
                Token-backed controls
              </Text>
              <FormField label="Reference input" description="Inputs stay inside the theme lane instead of drifting into route-local styling.">
                <TextInput placeholder="Search or type a route name" />
              </FormField>
              <Group gap="xs" wrap="wrap">
                <Badge color="teal" variant="light">
                  Success
                </Badge>
                <Badge color="orange" variant="light">
                  Warning
                </Badge>
                <Badge color="red" variant="light">
                  Critical
                </Badge>
              </Group>
            </Stack>
          </Paper>
          <ListingCard
            title="Reference site proof surface"
            description="This preview uses the real shipped design-system runtime rather than a docs-only styling lane."
            metadata={[
              { id: 'runtime', label: 'Runtime lane', value: preset.themeKey },
              { id: 'scheme', label: 'Color scheme', value: colorScheme },
            ]}
            primaryAction={<Button size="sm">Inspect route</Button>}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export function ReferenceThemeExplorer() {
  const [preset, setPreset] = useState<ThemePresetId>('default');
  const [colorScheme, setColorScheme] = useState<ThemeSchemeId>('light');
  const [brandPrimary, setBrandPrimary] = useState('blue');
  const [brandFlatSurfaces, setBrandFlatSurfaces] = useState(true);
  const [brandEditorialSerif, setBrandEditorialSerif] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonPreset, setComparisonPreset] = useState<ThemePresetId>('editorial');

  const resolveTheme = (presetId: ThemePresetId) => {
    switch (presetId) {
      case 'dark-public':
        return gdsDarkPublicTheme;
      case 'flat-surface':
        return gdsFlatSurfaceTheme;
      case 'editorial':
        return gdsEditorialPublicTheme;
      case 'brand':
        return createPublicBrandTheme({
          flatSurfaces: brandFlatSurfaces,
          editorialSerif: brandEditorialSerif,
          overrides: { primaryColor: brandPrimary },
        });
      default:
        return gdsTheme;
    }
  };

  const selectionSummary = themePresetCatalog[preset];
  const comparisonSummary = themePresetCatalog[comparisonPreset];
  const selectedTheme = useMemo(() => resolveTheme(preset), [preset, brandPrimary, brandFlatSurfaces, brandEditorialSerif]);
  const comparedTheme = useMemo(() => resolveTheme(comparisonPreset), [comparisonPreset, brandPrimary, brandFlatSurfaces, brandEditorialSerif]);
  const effectiveColorScheme = resolvePreviewColorScheme(preset, colorScheme);
  const effectiveComparisonScheme = resolvePreviewColorScheme(comparisonPreset, colorScheme);

  const previewKey = `${preset}-${effectiveColorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}`;
  const comparisonPreviewKey = `${comparisonPreset}-${effectiveComparisonScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}`;

  const reset = () => {
    setPreset('default');
    setColorScheme('light');
    setBrandPrimary('blue');
    setBrandFlatSurfaces(true);
    setBrandEditorialSerif(false);
    setComparisonEnabled(false);
    setComparisonPreset('editorial');
  };

  return (
    <Stack gap="xl">
      <ReferenceSection
        title="Theme Lab"
        description="Test the actual shipped GDS theme presets, color-scheme behavior, and the governed brand-theme generator. This page is part of the live demo, not a separate styling experiment."
      >
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>Theme preset</Title>
              <FormField label="Preset">
                <NativeSelect
                  aria-label="Preset"
                  value={preset}
                  onChange={(event) => setPreset((event.currentTarget.value as ThemePresetId) || 'default')}
                  data={Object.entries(themePresetCatalog).map(([value, item]) => ({ value, label: item.label }))}
                />
              </FormField>
              <FormField label="Preview color scheme">
                <NativeSelect
                  aria-label="Preview color scheme"
                  value={colorScheme}
                  onChange={(event) => setColorScheme((event.currentTarget.value as ThemeSchemeId) || 'light')}
                  data={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'auto', label: 'Auto' },
                  ]}
                />
              </FormField>
              <Button variant="default" size="sm" onClick={reset}>
                Reset theme lab
              </Button>
              <Text size="sm" c="dimmed">
                The reference site remounts an isolated provider here so visitors can test shipped presets without changing the whole docs shell.
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>Brand builder options</Title>
              <FormField label="Brand primary color">
                <NativeSelect
                  aria-label="Brand primary color"
                  value={brandPrimary}
                  onChange={(event) => setBrandPrimary(event.currentTarget.value || 'blue')}
                  data={['blue', 'violet', 'teal', 'grape', 'indigo', 'orange']}
                  disabled={preset !== 'brand'}
                />
              </FormField>
              <Checkbox
                label="Use flat surfaces"
                checked={brandFlatSurfaces}
                onChange={(event) => setBrandFlatSurfaces(event.currentTarget.checked)}
                disabled={preset !== 'brand'}
              />
              <Checkbox
                label="Use editorial serif headings"
                checked={brandEditorialSerif}
                onChange={(event) => setBrandEditorialSerif(event.currentTarget.checked)}
                disabled={preset !== 'brand'}
              />
              <Text size="sm" c="dimmed">
                The generator composes shipped helpers instead of creating a second theme authority inside the website.
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>Current selection summary</Title>
              <Stack gap={6}>
                <Text fw={700}>{selectionSummary.label}</Text>
                <Text size="sm" c="dimmed">
                  {selectionSummary.summary}
                </Text>
                <Text size="sm">
                  <strong>Best for:</strong> {selectionSummary.bestFor}
                </Text>
                <Text size="sm">
                  <strong>Runtime lane:</strong> <Code>{selectionSummary.themeKey}</Code>
                </Text>
                <Text size="sm">
                  <strong>Color scheme:</strong> {colorScheme}
                </Text>
                {preset === 'dark-public' && colorScheme !== effectiveColorScheme ? (
                  <Text size="sm" c="dimmed">
                    gdsDarkPublicTheme always renders in dark mode inside the live preview.
                  </Text>
                ) : null}
              </Stack>
              <Checkbox
                aria-label="Compare against a second shipped preset"
                label="Compare against a second shipped preset"
                checked={comparisonEnabled}
                onChange={(event) => setComparisonEnabled(event.currentTarget.checked)}
              />
              <FormField label="Comparison preset">
                <NativeSelect
                  aria-label="Comparison preset"
                  value={comparisonPreset}
                  onChange={(event) => setComparisonPreset((event.currentTarget.value as ThemePresetId) || 'editorial')}
                  disabled={!comparisonEnabled}
                  data={Object.entries(themePresetCatalog)
                    .filter(([value]) => value !== preset)
                    .map(([value, item]) => ({ value, label: item.label }))}
                />
              </FormField>
            </Stack>
          </Paper>
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title="Shipped theme lanes"
        description="Every lane below is part of the supported system. The website uses these exact helpers as its live runtime proof."
      >
        <SimpleGrid cols={{ base: 1, md: 2, xl: 5 }} spacing="md">
          {Object.values(themePresetCatalog).map((lane) => (
            <Paper key={lane.themeKey} withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  {lane.label}
                </Text>
                <Text size="sm" c="dimmed">
                  {lane.summary}
                </Text>
                <Code block fz="10px">
                  {lane.themeKey}
                </Code>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title="Live Theme Preview"
        description="Visitors can test the shipped presets, compare lanes, and inspect actual GDS surfaces under each theme."
      >
        <SimpleGrid cols={{ base: 1, xl: comparisonEnabled ? 2 : 1 }} spacing="lg">
          <GdsProvider key={previewKey} theme={selectedTheme} defaultColorScheme={effectiveColorScheme}>
            <ThemePreviewSurface
              preset={selectionSummary}
              colorScheme={effectiveColorScheme}
              requestedColorScheme={colorScheme}
            />
          </GdsProvider>
          {comparisonEnabled ? (
            <GdsProvider key={comparisonPreviewKey} theme={comparedTheme} defaultColorScheme={effectiveComparisonScheme}>
              <Paper withBorder radius="xl" p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={4}>
                      <Text fw={700}>Comparison Preview Surface</Text>
                      <Text size="sm" c="dimmed">
                        Compare another shipped theme against the current selection before adopting it downstream.
                      </Text>
                    </Stack>
                    <Badge color="violet" variant="light">
                      {comparisonSummary.label}
                    </Badge>
                  </Group>
                  <ThemePreviewSurface
                    preset={comparisonSummary}
                    colorScheme={effectiveComparisonScheme}
                    requestedColorScheme={colorScheme}
                  />
                </Stack>
              </Paper>
            </GdsProvider>
          ) : null}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title="Creator-Authored Experience Boundary"
        description="Creator-authored expression is allowed only through the sanctioned theme helpers and narrow exception process."
        tone="supporting"
      >
        <StateBlock
          variant="info"
          title="Shipped first, custom second"
          description="The official site uses shipped presets and the public brand generator first. Product-authored overrides must stay reviewable, testable, and scoped."
          compact
        />
      </ReferenceSection>
    </Stack>
  );
}
