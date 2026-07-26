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
import { createGdsOwnedContrastTokens, getGdsOwnedContrastProps } from './OwnedContrastSurface';
import { getGdsMessages } from './locales';
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
} from '@sovereignsquad/gds-theme';

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
  void presetId;
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
const fallbackExplorerLocale = Object.keys(referenceThemeExplorerCopy)[0] ?? 'en';

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

  if (locale !== fallbackExplorerLocale && Object.keys(mergedCopy).length > 0) {
    return mergedCopy as ExplorerCopy;
  }

  if (!hasCompleteExplorerCopy(mergedCopy)) {
    return fallbackExplorerCopy;
  }

  return mergedCopy;
}


function ThemePreviewSurface({
  preset,
  colorScheme,
  copy,
}: {
  preset: { label: string; summary: string; bestFor: string; themeKey: string };
  colorScheme: ThemeSchemeId;
  copy: ExplorerCopy;
}) {
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
                <TextInput aria-label={copy.referenceInput} placeholder={copy.referenceInputPlaceholder} />
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

function AthleteGoldReferenceSurface({ copy }: { copy: ExplorerCopy }) {
  const athleteGold = vibeCatalogById['athlete-gold'];
  const navItems = [
    { id: 'home', label: 'Home', marker: '⌂', active: true },
    { id: 'check-in', label: 'Check-in', marker: '◇' },
    { id: 'live-session', label: 'Live Session', marker: '▶' },
    { id: 'daily-to-do', label: 'Daily To-Do', marker: '☑' },
    { id: 'learning-hub', label: 'Learning Hub', marker: '□' },
    { id: 'recovery', label: 'Recovery', marker: '♡', section: 'TWO PILLARS' },
    { id: 'fuel', label: 'Fuel', marker: '○' },
    { id: 'mental', label: 'Mental', marker: '◎' },
    { id: 'reflection', label: 'Reflection', marker: '✎' },
    { id: 'habits', label: 'Habits', marker: '✓' },
  ];

  const surfaceProps = getGdsOwnedContrastProps({
    role: 'athlete-gold-reference',
    tokens: createGdsOwnedContrastTokens(athleteGold, {
      background: athleteGold.gradient,
      radius: 'var(--mantine-radius-xl)',
      backgroundColor: athleteGold.canvasDark,
      borderColor: athleteGold.borderDark,
      text: athleteGold.textDark,
      muted: athleteGold.mutedDark,
    }),
  });

  return (
    <Paper
      withBorder
      radius="xl"
      p="lg"
      aria-label={copy.athleteGoldReferenceTitle ?? 'Athlete Gold reference surface'}
      {...surfaceProps}
    >
      <Stack gap="xl">
        <Group gap="md" align="center">
          <Box
            aria-hidden="true"
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              color: athleteGold.canvasDark,
              background: `linear-gradient(135deg, ${athleteGold.accent}, ${athleteGold.primary})`,
              boxShadow: `0 18px 38px ${athleteGold.glow}`,
              fontFamily: 'Georgia, serif',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            IQ
          </Box>
          <Stack gap={0}>
            <Title order={3} style={{ color: athleteGold.textDark }}>
              Athlete IQ
            </Title>
            <Text size="sm" fw={700} tt="uppercase" style={{ color: athleteGold.accent, letterSpacing: 0 }}>
              Performance OS
            </Text>
          </Stack>
        </Group>

        <Stack gap="sm">
          <Text size="xs" tt="uppercase" style={{ color: athleteGold.mutedDark, letterSpacing: 0 }}>
            Today
          </Text>
          {navItems.map((item) => (
            <Stack key={item.id} gap="xs">
              {item.section ? (
                <Text size="xs" tt="uppercase" style={{ color: athleteGold.mutedDark, letterSpacing: 0, marginTop: 12 }}>
                  {item.section}
                </Text>
              ) : null}
              <Group
                justify="space-between"
                wrap="nowrap"
                px="md"
                py="sm"
                style={{
                  minHeight: 54,
                  borderRadius: 18,
                  color: item.active ? athleteGold.accent : athleteGold.textDark,
                  background: item.active
                    ? `linear-gradient(90deg, rgba(228, 166, 35, 0.18), rgba(255, 215, 106, 0.06))`
                    : 'transparent',
                  border: item.active ? `1px solid ${athleteGold.borderDark}` : '1px solid transparent',
                  boxShadow: item.active ? `0 18px 38px rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(255, 215, 106, 0.08)` : undefined,
                }}
              >
                <Group gap="md" wrap="nowrap">
                  <Text aria-hidden="true" fw={700} style={{ width: 20, color: item.active ? athleteGold.accent : athleteGold.mutedDark }}>
                    {item.marker}
                  </Text>
                  <Text fw={item.active ? 700 : 500}>
                    {item.label}
                  </Text>
                </Group>
                {item.active ? (
                  <Box
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: athleteGold.accent,
                      boxShadow: `0 0 22px ${athleteGold.glow}`,
                    }}
                  />
                ) : null}
              </Group>
            </Stack>
          ))}
        </Stack>
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
  const previewMessages = useMemo(() => getGdsMessages(locale), [locale]);
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
  const previewRootId = `gds-theme-preview-${previewKey}`;
  const comparisonPreviewRootId = `gds-theme-preview-${comparisonPreviewKey}`;
  // The Theme Lab control/result cards are deliberately NOT wrapped in an
  // owned-contrast surface. When a preset is active the whole page (and every
  // `.gds-paper`/`.gds-card`) re-themes globally via
  // `html[data-gds-theme-preset] .gds-paper` in styles.css, so these cards
  // re-theme their own background AND text exactly like any built-in theme —
  // readable in light and dark across every preset. A local owned-contrast
  // override here (issue #461) forced a `surfaceDark` gradient onto the cards,
  // painting dark boxes on a light page ("ruins the page"). Owned contrast
  // stays reserved for the intentional vibe *swatch* surfaces below (the
  // gallery, the VibeTheme contract, and the Athlete Gold reference), whose job
  // is to preview a specific vibe atmosphere rather than match the page.
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
          <Paper
            withBorder
            radius="xl"
            p="lg"
          >
            <Stack gap="md">
              <Title order={4}>{copy.themePresetTitle}</Title>
              <Badge variant="light" w="fit-content" maw="100%" data-gds-theme-lab-active>
                {copy.selected}: {selectionSummary.label}
              </Badge>
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

          <Paper
            withBorder
            radius="xl"
            p="lg"
          >
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

          <Paper
            withBorder
            radius="xl"
            p="lg"
          >
            <Stack gap="md" role="status" aria-live="polite">
              <Title order={4}>{copy.currentSelectionTitle}</Title>
              <Badge variant="light" w="fit-content" maw="100%" data-gds-theme-lab-active>
                {copy.selected}: {selectionSummary.label}
              </Badge>
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
            const laneCardProps = getGdsOwnedContrastProps({
              role: 'vibe-gallery-card',
              tokens: createGdsOwnedContrastTokens(vibe, {
                background: `linear-gradient(135deg, ${vibe.surfaceLight}, color-mix(in srgb, ${vibe.primary} 12%, ${vibe.surfaceLight})), ${vibe.gradient}`,
                radius: 'var(--mantine-radius-lg)',
                backgroundColor: vibe.surfaceLight,
                borderColor: isSelected ? vibe.primary : vibe.borderLight,
                boxShadow: isSelected ? `0 0 0 2px ${vibe.primary}, 0 18px 46px ${vibe.glow}` : undefined,
              }),
            });

            return (
            <Paper
              key={lane.themeKey}
              withBorder
              radius="lg"
              p="md"
              role="group"
              aria-label={`${lane.label} ${copy.cssVibeTheme}`}
              {...laneCardProps}
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
        <Paper
          withBorder
          radius="xl"
          p="lg"
          {...(selectedVibe ? getGdsOwnedContrastProps({
            role: 'vibe-contract',
            tokens: createGdsOwnedContrastTokens(selectedVibe, {
              background: selectedVibe.hero,
              radius: 'var(--mantine-radius-xl)',
              backgroundColor: selectedVibe.surfaceLight,
            }),
          }) : undefined)}
        >
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
        title={copy.athleteGoldReferenceTitle ?? fallbackExplorerCopy.athleteGoldReferenceTitle}
        description={copy.athleteGoldReferenceDescription ?? fallbackExplorerCopy.athleteGoldReferenceDescription}
      >
        <AthleteGoldReferenceSurface copy={copy} />
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
          <Box id={previewRootId} data-gds-preview-root>
            <GdsProvider
              key={previewKey}
              locale={locale}
              messages={previewMessages}
              theme={selectedTheme}
              defaultColorScheme={effectiveColorScheme}
              colorSchemeRootElement={() => document.getElementById(previewRootId) ?? undefined}
              cssVariablesSelector={`#${previewRootId}`}
              applyDocumentColorScheme={false}
            >
              <ThemePreviewSurface
                preset={selectionSummary}
                colorScheme={effectiveColorScheme}
                copy={copy}
              />
            </GdsProvider>
          </Box>
          {comparisonEnabled ? (
            <Box id={comparisonPreviewRootId} data-gds-preview-root>
              <GdsProvider
                key={comparisonPreviewKey}
                locale={locale}
                messages={previewMessages}
                theme={comparedTheme}
                defaultColorScheme={effectiveComparisonScheme}
                colorSchemeRootElement={() => document.getElementById(comparisonPreviewRootId) ?? undefined}
                cssVariablesSelector={`#${comparisonPreviewRootId}`}
                applyDocumentColorScheme={false}
              >
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
                      copy={copy}
                    />
                  </Stack>
                </Paper>
              </GdsProvider>
            </Box>
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
