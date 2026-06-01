'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { MantineThemeOverride } from '@mantine/core';
import { ActionBar } from './ActionBar';
import { FormField } from './FormField';
import { ListingCard } from './ListingCard';
import { ReferenceSection } from './ReferenceSection';
import { StateBlock } from './StateBlock';
import { ThemeToggle } from './ThemeToggle';
import {
  GdsProvider,
  applyGdsFontLane,
  getGdsFontLanes,
  getGdsThemePresets,
  resolveGdsThemePreset,
  type GdsFontLaneId,
  type GdsThemePresetId,
} from '@doneisbetter/gds-theme';

export type ThemePresetId = GdsThemePresetId;
export type ThemeSchemeId = 'light' | 'dark' | 'auto';
export interface ThemeExplorerSelection {
  preset: ThemePresetId;
  colorScheme: ThemeSchemeId;
  theme: MantineThemeOverride;
  fontLane?: GdsFontLaneId;
}

function resolvePreviewColorScheme(presetId: ThemePresetId, requestedScheme: ThemeSchemeId): ThemeSchemeId {
  if (presetId === 'dark-public') {
    return 'dark';
  }

  return requestedScheme;
}

const presetCatalog = getGdsThemePresets();
const themePresetCatalog = Object.fromEntries(
  presetCatalog.map((preset) => [
    preset.id,
    {
      label: preset.label,
      bestFor: `Apps aligned with ${preset.label.toLowerCase()}.`,
      summary: preset.description,
      themeKey: preset.runtimeLane,
      supportedUse: `General product adoption with ${preset.label}.`,
      avoidFor: 'Avoid creating a local non-canonical theme authority.',
    },
  ]),
) as Record<ThemePresetId, { label: string; bestFor: string; summary: string; themeKey: string; supportedUse: string; avoidFor?: string }>;

const colorSchemeProof = [
  {
    id: 'light',
    label: 'Light',
    description: 'Validates readable default surfaces, controls, badges, and focus states against light backgrounds.',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Validates contrast for public, operational, and feedback surfaces when dark mode is active.',
  },
  {
    id: 'auto',
    label: 'Auto',
    description: 'Documents the adopter path for OS-controlled schemes while keeping the provider contract unchanged.',
  },
] as const;

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
            <Text size="sm">
              <strong>Accessibility proof:</strong> status uses text, badge label, and placement, not color alone.
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
              { id: 'focus', label: 'A11y proof', value: 'Keyboard + readable states' },
            ]}
            primaryAction={<Button size="sm">Inspect route</Button>}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export function ReferenceThemeExplorer({
  onSelectionChange,
}: {
  onSelectionChange?: (selection: ThemeExplorerSelection) => void;
}) {
  const [preset, setPreset] = useState<ThemePresetId>('default');
  const [colorScheme, setColorScheme] = useState<ThemeSchemeId>('light');
  const [brandPrimary, setBrandPrimary] = useState('blue');
  const [brandFlatSurfaces, setBrandFlatSurfaces] = useState(true);
  const [brandEditorialSerif, setBrandEditorialSerif] = useState(false);
  const [fontLane, setFontLane] = useState<GdsFontLaneId>('inter');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonPreset, setComparisonPreset] = useState<ThemePresetId>('editorial');
  const availableComparisonPresets = presetCatalog.filter((item) => item.id !== preset).map((item) => item.id);

  const resolveTheme = (presetId: ThemePresetId) =>
    applyGdsFontLane(resolveGdsThemePreset(presetId, {
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    }), fontLane);

  const selectionSummary = themePresetCatalog[preset];
  const comparisonSummary = themePresetCatalog[comparisonPreset];
  const selectedTheme = useMemo(() => resolveTheme(preset), [preset, brandPrimary, brandFlatSurfaces, brandEditorialSerif, fontLane]);
  const comparedTheme = useMemo(() => resolveTheme(comparisonPreset), [comparisonPreset, brandPrimary, brandFlatSurfaces, brandEditorialSerif, fontLane]);
  const effectiveColorScheme = resolvePreviewColorScheme(preset, colorScheme);
  const effectiveComparisonScheme = resolvePreviewColorScheme(comparisonPreset, colorScheme);

  const previewKey = `${preset}-${effectiveColorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;
  const comparisonPreviewKey = `${comparisonPreset}-${effectiveComparisonScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;

  useEffect(() => {
    onSelectionChange?.({
      preset,
      colorScheme: effectiveColorScheme,
      theme: selectedTheme,
      fontLane,
    });
  }, [onSelectionChange, preset, effectiveColorScheme, selectedTheme, fontLane]);

  useEffect(() => {
    if (comparisonPreset !== preset) {
      return;
    }

    setComparisonPreset(availableComparisonPresets[0] ?? 'editorial');
  }, [comparisonPreset, preset, availableComparisonPresets]);

  const reset = () => {
    setPreset('default');
    setColorScheme('light');
    setBrandPrimary('blue');
    setBrandFlatSurfaces(true);
    setBrandEditorialSerif(false);
    setComparisonEnabled(false);
    setComparisonPreset('editorial');
    setFontLane('inter');
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
              <FormField label="Webfont lane">
                <NativeSelect
                  aria-label="Webfont lane"
                  value={fontLane}
                  onChange={(event) => setFontLane((event.currentTarget.value as GdsFontLaneId) || 'inter')}
                  data={getGdsFontLanes().map((lane) => ({ value: lane.id, label: lane.label }))}
                />
              </FormField>
              <Button variant="default" size="sm" onClick={reset}>
                Reset theme lab
              </Button>
              <Text size="sm" c="dimmed">
                Theme changes apply to the official site shell so visitors can validate real whole-page runtime behavior.
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
            <Stack gap="md" role="status" aria-live="polite">
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
                  data={availableComparisonPresets.map((value) => ({ value, label: themePresetCatalog[value].label }))}
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
                <Text size="xs">
                  <strong>Best for:</strong> {lane.supportedUse}
                </Text>
                <Code block fz="10px">
                  {lane.themeKey}
                </Code>
                <Text size="xs" c="dimmed">
                  <strong>Avoid for:</strong> {lane.avoidFor ?? 'No special exclusion noted for this lane.'}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title="Light, dark, and auto proof"
        description="Every official lane must remain usable across explicit light, explicit dark, and OS-controlled auto modes. The dark-public lane is intentionally forced to dark in preview to preserve its contrast contract."
      >
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {colorSchemeProof.map((item) => (
            <Paper key={item.id} withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Badge variant="light" color={item.id === 'dark' ? 'violet' : item.id === 'auto' ? 'teal' : 'blue'} w="fit-content">
                  {item.label}
                </Badge>
                <Text size="sm">{item.description}</Text>
                <Text size="xs" c="dimmed">
                  Required proof: semantic text, visible focus, and contrast-safe state treatment.
                </Text>
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
        title="Unsupported lane boundary"
        description="Unsupported local theme lanes are blocked by policy and compliance because they create parallel design-system authority."
        tone="supporting"
      >
        <Stack gap="md">
          <StateBlock
            variant="permission"
            title="Do not create local branding-layer helpers"
            description="If a consumer needs brand expression, use createPublicBrandTheme(...). If a lane is missing, request it for GDS instead of building extendGdsTheme(...), createTheme(...), or mergeMantineTheme(...) ownership locally."
            compact
          />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  Approved remediation
                </Text>
                <Code block>createPublicBrandTheme({`{ flatSurfaces: true, overrides: { primaryColor: 'blue' } }`})</Code>
              </Stack>
            </Paper>
            <Paper withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  Prohibited ownership
                </Text>
                <Code block>extendGdsTheme(...) / createTheme(...) / mergeMantineTheme(...)</Code>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </ReferenceSection>
    </Stack>
  );
}
