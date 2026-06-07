'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
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
import { referenceThemeExplorerCopy, referenceThemeExplorerCopyOverrides } from './ReferenceThemeExplorer.copy';
import {
  GdsProvider,
  applyGdsFontLane,
  getGdsFontLanes,
  getGdsThemePresets,
  getGdsVibeThemes,
  resolveGdsThemePreset,
  useGdsTranslation,
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
  runtimeKey?: string;
  brandPrimary?: string;
  brandFlatSurfaces?: boolean;
  brandEditorialSerif?: boolean;
}

function resolvePreviewColorScheme(presetId: ThemePresetId, requestedScheme: ThemeSchemeId): ThemeSchemeId {
  if (presetId === 'dark-public' || presetId === 'neon-night' || presetId === 'cosmic') {
    return 'dark';
  }

  return requestedScheme;
}

const presetCatalog = getGdsThemePresets();
const vibeCatalog = getGdsVibeThemes();
const vibeCatalogById = Object.fromEntries(vibeCatalog.map((vibe) => [vibe.id, vibe]));
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


type ExplorerCopy = Omit<typeof referenceThemeExplorerCopy.en, 'presetLabels' | 'presetSummaries'> & {
  presetLabels: Partial<Record<ThemePresetId, string>>;
  presetSummaries: Partial<Record<ThemePresetId, string>>;
};
const fallbackExplorerCopy: ExplorerCopy = referenceThemeExplorerCopy.en;

function hasCompleteCopyValue(referenceValue: unknown, candidateValue: unknown): boolean {
  if (Array.isArray(referenceValue)) {
    return Array.isArray(candidateValue) && referenceValue.every((_, index) => candidateValue[index] !== undefined);
  }

  if (referenceValue && typeof referenceValue === 'object') {
    if (!candidateValue || typeof candidateValue !== 'object' || Array.isArray(candidateValue)) {
      return false;
    }

    return Object.keys(referenceValue).every((key) =>
      hasCompleteCopyValue(
        (referenceValue as Record<string, unknown>)[key],
        (candidateValue as Record<string, unknown>)[key]
      )
    );
  }

  return candidateValue !== undefined;
}

function hasCompleteExplorerCopy(copy: Partial<ExplorerCopy>): copy is ExplorerCopy {
  return hasCompleteCopyValue(fallbackExplorerCopy, copy);
}

function resolveExplorerCopy(locale: string): ExplorerCopy {
  const localeBaseCopy = (referenceThemeExplorerCopy[locale as keyof typeof referenceThemeExplorerCopy] ?? {}) as Partial<ExplorerCopy>;
  const localeOverrideCopy = (referenceThemeExplorerCopyOverrides as Record<string, Partial<ExplorerCopy>>)[locale] ?? {};
  const mergedCopy = {
    ...localeBaseCopy,
    ...localeOverrideCopy,
    schemes: {
      ...localeBaseCopy.schemes,
      ...localeOverrideCopy.schemes,
    },
    schemeDescriptions: {
      ...localeBaseCopy.schemeDescriptions,
      ...localeOverrideCopy.schemeDescriptions,
    },
    presetLabels: {
      ...localeBaseCopy.presetLabels,
      ...localeOverrideCopy.presetLabels,
    },
    presetSummaries: {
      ...localeBaseCopy.presetSummaries,
      ...localeOverrideCopy.presetSummaries,
    },
  } as Partial<ExplorerCopy>;

  if (!hasCompleteExplorerCopy(mergedCopy)) {
    return fallbackExplorerCopy;
  }

  return mergedCopy;
}


function ThemePreviewSurface({
  preset,
  colorScheme,
  requestedColorScheme,
  copy,
}: {
  preset: { label: string; summary: string; bestFor: string; themeKey: string };
  colorScheme: ThemeSchemeId;
  requestedColorScheme?: ThemeSchemeId;
  copy: ExplorerCopy;
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
              <strong>{copy.previewBestFor}</strong> {preset.bestFor}
            </Text>
            <Text size="sm">
              <strong>{copy.previewColorScheme}</strong> {colorScheme} ({copy.schemes[colorScheme]})
            </Text>
            <Text size="sm">
              <strong>{copy.previewA11yProof}</strong> {copy.previewA11yDescription}
            </Text>
            {forcedScheme ? (
              <Text size="sm" c="dimmed">
                {copy.forcedDarkPreview}
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
                {copy.tokenControls}
              </Text>
              <FormField label={copy.referenceInput} description={copy.referenceInputDescription}>
                <TextInput placeholder={copy.referenceInputPlaceholder} />
              </FormField>
              <Group gap="xs" wrap="wrap">
                <Badge color="teal" variant="light">
                  {copy.success}
                </Badge>
                <Badge color="orange" variant="light">
                  {copy.warning}
                </Badge>
                <Badge color="red" variant="light">
                  {copy.critical}
                </Badge>
              </Group>
            </Stack>
          </Paper>
          <ListingCard
            title={copy.proofSurfaceTitle}
            description={copy.proofSurfaceDescription}
            metadata={[
              { id: 'runtime', label: copy.metadataRuntimeLane, value: preset.themeKey },
              { id: 'scheme', label: copy.metadataColorScheme, value: copy.schemes[colorScheme] },
              { id: 'focus', label: copy.metadataA11yProof, value: copy.metadataA11yValue },
            ]}
            primaryAction={<Button size="sm">{copy.inspectRoute}</Button>}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export function ReferenceThemeExplorer({
  initialSelection,
  onSelectionChange,
}: {
  initialSelection?: ThemeExplorerSelection;
  onSelectionChange?: (selection: ThemeExplorerSelection) => void;
}) {
  const { locale } = useGdsTranslation();
  const copy = resolveExplorerCopy(locale);
  const [preset, setPreset] = useState<ThemePresetId>(initialSelection?.preset ?? 'default');
  const [colorScheme, setColorScheme] = useState<ThemeSchemeId>(initialSelection?.colorScheme ?? 'light');
  const [brandPrimary, setBrandPrimary] = useState(initialSelection?.brandPrimary ?? 'blue');
  const [brandFlatSurfaces, setBrandFlatSurfaces] = useState(initialSelection?.brandFlatSurfaces ?? true);
  const [brandEditorialSerif, setBrandEditorialSerif] = useState(initialSelection?.brandEditorialSerif ?? false);
  const [fontLane, setFontLane] = useState<GdsFontLaneId>(initialSelection?.fontLane ?? 'inter');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonPreset, setComparisonPreset] = useState<ThemePresetId>('editorial');
  const availableComparisonPresets = presetCatalog.filter((item) => item.id !== preset).map((item) => item.id);

  const resolveTheme = (presetId: ThemePresetId) =>
    applyGdsFontLane(resolveGdsThemePreset(presetId, {
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    }), fontLane);

  const localizedThemeCatalog = useMemo(() => {
    const presetLabels = copy.presetLabels as Partial<Record<ThemePresetId, string>>;
    const presetSummaries = copy.presetSummaries as Partial<Record<ThemePresetId, string>>;

    return Object.fromEntries(Object.entries(themePresetCatalog).map(([id, item]) => {
      const presetId = id as ThemePresetId;
      const label = presetLabels[presetId] ?? item.label;
      const summary = presetSummaries[presetId] ?? item.summary;

      return [presetId, {
        ...item,
        label,
        summary,
        bestFor: `${copy.appsAlignedWith} ${label}.`,
        supportedUse: `${copy.generalAdoptionWith} ${label}.`,
        avoidFor: copy.avoidLocalTheme,
      }];
    })) as Record<ThemePresetId, { label: string; bestFor: string; summary: string; themeKey: string; supportedUse: string; avoidFor?: string }>;
  }, [copy]);
  const selectionSummary = localizedThemeCatalog[preset];
  const comparisonSummary = localizedThemeCatalog[comparisonPreset];
  const selectedTheme = useMemo(() => resolveTheme(preset), [preset, brandPrimary, brandFlatSurfaces, brandEditorialSerif, fontLane]);
  const comparedTheme = useMemo(() => resolveTheme(comparisonPreset), [comparisonPreset, brandPrimary, brandFlatSurfaces, brandEditorialSerif, fontLane]);
  const effectiveColorScheme = resolvePreviewColorScheme(preset, colorScheme);
  const effectiveComparisonScheme = resolvePreviewColorScheme(comparisonPreset, colorScheme);

  const previewKey = `${preset}-${effectiveColorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;
  const comparisonPreviewKey = `${comparisonPreset}-${effectiveComparisonScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;
  const selectedVibe = vibeCatalogById[preset];

  useEffect(() => {
    onSelectionChange?.({
      preset,
      colorScheme: effectiveColorScheme,
      theme: selectedTheme,
      fontLane,
      runtimeKey: previewKey,
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    });
  }, [onSelectionChange, preset, effectiveColorScheme, selectedTheme, fontLane, previewKey, brandPrimary, brandFlatSurfaces, brandEditorialSerif]);

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
        title={copy.themeLabTitle}
        description={copy.themeLabDescription}
      >
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>{copy.themePresetTitle}</Title>
              <FormField label={copy.presetLabel}>
                <NativeSelect
                  aria-label={copy.presetLabel}
                  value={preset}
                  onChange={(event) => setPreset((event.currentTarget.value as ThemePresetId) || 'default')}
                  data={Object.entries(localizedThemeCatalog).map(([value, item]) => ({ value, label: item.label }))}
                />
              </FormField>
              <FormField label={copy.previewColorSchemeLabel}>
                <NativeSelect
                  aria-label={copy.previewColorSchemeLabel}
                  value={colorScheme}
                  onChange={(event) => setColorScheme((event.currentTarget.value as ThemeSchemeId) || 'light')}
                  data={[
                    { value: 'light', label: copy.schemes.light },
                    { value: 'dark', label: copy.schemes.dark },
                    { value: 'auto', label: copy.schemes.auto },
                  ]}
                />
              </FormField>
              <FormField label={copy.webfontLaneLabel}>
                <NativeSelect
                  aria-label={copy.webfontLaneLabel}
                  value={fontLane}
                  onChange={(event) => setFontLane((event.currentTarget.value as GdsFontLaneId) || 'inter')}
                  data={getGdsFontLanes().map((lane) => ({ value: lane.id, label: lane.label }))}
                />
              </FormField>
              <Button variant="default" size="sm" onClick={reset}>
                {copy.resetThemeLab}
              </Button>
              <Text size="sm" c="dimmed">
                {copy.shellBehavior}
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md">
              <Title order={4}>{copy.brandOptionsTitle}</Title>
              <FormField label={copy.brandPrimaryColorLabel}>
                <NativeSelect
                  aria-label={copy.brandPrimaryColorLabel}
                  value={brandPrimary}
                  onChange={(event) => setBrandPrimary(event.currentTarget.value || 'blue')}
                  data={['blue', 'violet', 'teal', 'grape', 'indigo', 'orange']}
                  disabled={preset !== 'brand'}
                />
              </FormField>
              <Checkbox
                label={copy.useFlatSurfaces}
                checked={brandFlatSurfaces}
                onChange={(event) => setBrandFlatSurfaces(event.currentTarget.checked)}
                disabled={preset !== 'brand'}
              />
              <Checkbox
                label={copy.useEditorialSerif}
                checked={brandEditorialSerif}
                onChange={(event) => setBrandEditorialSerif(event.currentTarget.checked)}
                disabled={preset !== 'brand'}
              />
              <Text size="sm" c="dimmed">
                {copy.generatorDescription}
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder radius="xl" p="lg">
            <Stack gap="md" role="status" aria-live="polite">
              <Title order={4}>{copy.currentSelectionTitle}</Title>
              <Stack gap={6}>
                <Text fw={700}>{selectionSummary.label}</Text>
                <Text size="sm" c="dimmed">
                  {selectionSummary.summary}
                </Text>
                <Text size="sm">
                  <strong>{copy.bestFor}</strong> {selectionSummary.bestFor}
                </Text>
                <Text size="sm">
                  <strong>{copy.runtimeLane}</strong> <Code>{selectionSummary.themeKey}</Code>
                </Text>
                <Text size="sm">
                  <strong>{copy.colorScheme}</strong> {colorScheme} ({copy.schemes[colorScheme]})
                </Text>
                {(preset === 'dark-public' || preset === 'neon-night' || preset === 'cosmic') && colorScheme !== effectiveColorScheme ? (
                  <Text size="sm" c="dimmed">
                    {copy.darkForwardNotice}
                  </Text>
                ) : null}
              </Stack>
              <Checkbox
                aria-label={copy.compareToggle}
                label={copy.compareToggle}
                checked={comparisonEnabled}
                onChange={(event) => setComparisonEnabled(event.currentTarget.checked)}
              />
              <FormField label={copy.comparisonPresetLabel}>
                <NativeSelect
                  aria-label={copy.comparisonPresetLabel}
                  value={comparisonPreset}
                  onChange={(event) => setComparisonPreset((event.currentTarget.value as ThemePresetId) || 'editorial')}
                  disabled={!comparisonEnabled}
                  data={availableComparisonPresets.map((value) => ({ value, label: localizedThemeCatalog[value].label }))}
                />
              </FormField>
            </Stack>
          </Paper>
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.shippedLanesTitle}
        description={copy.shippedLanesDescription}
      >
        <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="md">
          {vibeCatalog.map((vibe) => {
            const lane = localizedThemeCatalog[vibe.id];
            const isSelected = vibe.id === preset;

            return (
            <Paper
              key={lane.themeKey}
              withBorder
              radius="lg"
              p="md"
              role="group"
              aria-label={`${lane.label} ${copy.cssVibeTheme}`}
              style={{
                background: `linear-gradient(135deg, ${vibe.surfaceLight}, color-mix(in srgb, ${vibe.primary} 12%, ${vibe.surfaceLight})), ${vibe.gradient}`,
                borderColor: isSelected ? vibe.primary : vibe.borderLight,
                boxShadow: isSelected ? `0 0 0 2px ${vibe.primary}, 0 18px 46px ${vibe.glow}` : undefined,
              }}
            >
              <Stack gap={6}>
                <Group gap="xs" justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Box
                      aria-hidden="true"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${vibe.primary}, ${vibe.accent})`,
                        boxShadow: `0 10px 28px ${vibe.glow}`,
                        border: `1px solid ${vibe.borderLight}`,
                      }}
                    />
                    <Text fw={700} size="sm">
                      {lane.label}
                    </Text>
                  </Group>
                  {isSelected ? (
                    <Badge variant="light">{copy.selected}</Badge>
                  ) : null}
                </Group>
                <Box
                  aria-hidden="true"
                  style={{
                    height: 56,
                    borderRadius: 16,
                    background: vibe.hero,
                    border: `1px solid ${vibe.borderLight}`,
                  }}
                />
                <Text fw={700} size="sm">
                  {copy.cssVibeTheme}
                </Text>
                <Text size="sm" c="dimmed">
                  {lane.summary}
                </Text>
                <Text size="xs">
                  <strong>{copy.bestFor}</strong> {lane.supportedUse}
                </Text>
                <Code block fz="10px">
                  {lane.themeKey}
                </Code>
                <Button
                  size="xs"
                  variant={isSelected ? 'filled' : 'default'}
                  onClick={() => setPreset(vibe.id)}
                >
                  {copy.previewVibe}
                </Button>
                <Text size="xs" c="dimmed">
                  <strong>{copy.avoidFor}</strong> {lane.avoidFor ?? copy.noSpecialExclusion}
                </Text>
              </Stack>
            </Paper>
            );
          })}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.vibeContractTitle}
        description={copy.vibeContractDescription}
      >
        <Paper withBorder radius="xl" p="lg" style={{ background: selectedVibe?.hero }}>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {selectedVibe ? [
              [copy.tokenLabels[0], selectedVibe.primary],
              [copy.tokenLabels[1], selectedVibe.accent],
              [copy.tokenLabels[2], selectedVibe.canvasLight],
              [copy.tokenLabels[3], selectedVibe.canvasDark],
              [copy.tokenLabels[4], selectedVibe.surfaceLight],
              [copy.tokenLabels[5], selectedVibe.surfaceDark],
            ].map(([label, value]) => (
              <Paper key={label} withBorder radius="lg" p="md">
                <Stack gap={8}>
                  <Box
                    aria-hidden="true"
                    style={{
                      height: 38,
                      borderRadius: 12,
                      background: value,
                      border: `1px solid ${selectedVibe.borderLight}`,
                    }}
                  />
                  <Text fw={700} size="sm">{label}</Text>
                  <Code fz="11px">{value}</Code>
                </Stack>
              </Paper>
            )) : null}
          </SimpleGrid>
        </Paper>
      </ReferenceSection>

      <ReferenceSection
        title={copy.proofTitle}
        description={copy.proofDescription}
      >
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {colorSchemeProof.map((item) => (
            <Paper key={item.id} withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Badge variant="light" color={item.id === 'dark' ? 'violet' : item.id === 'auto' ? 'teal' : 'blue'} w="fit-content">
                  {copy.schemes[item.id]}
                </Badge>
                <Text size="sm">{copy.schemeDescriptions[item.id]}</Text>
                <Text size="xs" c="dimmed">
                  {copy.requiredProof}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.livePreviewTitle}
        description={copy.livePreviewDescription}
      >
        <SimpleGrid cols={{ base: 1, xl: comparisonEnabled ? 2 : 1 }} spacing="lg">
          <GdsProvider key={previewKey} theme={selectedTheme} defaultColorScheme={effectiveColorScheme}>
            <ThemePreviewSurface
              preset={selectionSummary}
              colorScheme={effectiveColorScheme}
              requestedColorScheme={colorScheme}
              copy={copy}
            />
          </GdsProvider>
          {comparisonEnabled ? (
            <GdsProvider key={comparisonPreviewKey} theme={comparedTheme} defaultColorScheme={effectiveComparisonScheme}>
              <Paper withBorder radius="xl" p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={4}>
                      <Text fw={700}>{copy.comparisonPreviewTitle}</Text>
                      <Text size="sm" c="dimmed">
                        {copy.comparisonPreviewDescription}
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
                    copy={copy}
                  />
                </Stack>
              </Paper>
            </GdsProvider>
          ) : null}
        </SimpleGrid>
      </ReferenceSection>

      <ReferenceSection
        title={copy.unsupportedTitle}
        description={copy.unsupportedDescription}
        tone="supporting"
      >
        <Stack gap="md">
          <StateBlock
            variant="permission"
            title={copy.doNotCreateTitle}
            description={copy.doNotCreateDescription}
            compact
          />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  {copy.approvedRemediation}
                </Text>
                <Code block>createPublicBrandTheme({`{ flatSurfaces: true, overrides: { primaryColor: 'blue' } }`})</Code>
              </Stack>
            </Paper>
            <Paper withBorder radius="lg" p="md">
              <Stack gap={6}>
                <Text fw={700} size="sm">
                  {copy.prohibitedOwnership}
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
