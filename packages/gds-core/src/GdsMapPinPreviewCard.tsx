import type { ReactNode } from 'react';
import { Box, CloseButton, Group, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { GdsGeneratedThumbnail } from './GdsGeneratedThumbnail';
import type { GdsGeneratedThumbnailCategory } from './GdsGeneratedThumbnail';
import { GdsSavedIndicator } from './GdsSavedIndicator';
import { MeaningBadge } from './MeaningBadge';
import type { MeaningVariant } from './MeaningBadge';
import { GdsBadge } from './GdsBadge';

/**
 * Governed pin preview card. Composes GdsGeneratedThumbnail (badges="none"), GdsSavedIndicator,
 * and MeaningBadge; radius/shadow use the `sheet` elevation role.
 *
 * Absent-field behavior: no thumbnail categories -> no media region; no trust -> row omitted;
 * no price and no lastChecked -> estimate block omitted; loading -> skeleton with same regions.
 *
 * Labels (closeLabel, save/unsave labels) are consumer-supplied; no default English ships.
 */

/** Props for {@link GdsMapPinPreviewCard}. */
export interface GdsMapPinPreviewCardProps {
  /** Listing title. */
  title: ReactNode;
  /** First half of the meta line — the activity name. Rendered as `activity · neighbourhood`. */
  activity?: ReactNode;
  /** Second half of the meta line — the neighbourhood. Either half renders alone. */
  neighbourhood?: ReactNode;
  /** One-sentence written summary. */
  summary?: ReactNode;
  /** Age-range chip content (e.g. "6–12"). */
  ageRange?: ReactNode;
  /** Trust badge. Omitted entirely when absent. */
  trust?: { variant: MeaningVariant; label: ReactNode };
  /** Price estimate line. */
  priceEstimate?: ReactNode;
  /** Last-checked line accompanying the estimate. */
  lastChecked?: ReactNode;
  /** Stable id seeding the generated thumbnail. No categories → no media region. */
  thumbnailSeed?: string;
  /** Ranked categories for the generated thumbnail. */
  categories?: GdsGeneratedThumbnailCategory[];
  /** Primary action, full width (e.g. a "View provider" button the consumer labels). */
  primaryAction?: ReactNode;
  /** Whether the listing is saved — passed through to {@link GdsSavedIndicator}. */
  saved?: boolean;
  /** Accessible name for the save action, naming the item (see `GdsSavedIndicator.saveLabel`). */
  saveLabel?: string;
  /** Accessible name for the unsave action, naming the item. */
  unsaveLabel?: string;
  /** Called with the next saved state when the save control is activated. */
  onSaveChange?: (saved: boolean) => void;
  /** Called when the close disc is activated. Renders only together with `closeLabel`. */
  onClose?: () => void;
  /** Accessible name for the close disc — a close control with no name is unusable. */
  closeLabel?: string;
  /** Skeleton state while the listing loads. */
  loading?: boolean;
}

const SURFACE_SHADOW = 'var(--gds-elevation-sheet, var(--mantine-shadow-lg))';

function PreviewSkeleton() {
  return (
    <Stack gap="sm">
      <Skeleton height={140} radius="md" />
      <Skeleton height={24} width="70%" radius="md" />
      <Skeleton height={14} width="45%" radius="md" />
      <Skeleton height={14} width="100%" radius="md" />
      <Skeleton height={44} radius="md" />
    </Stack>
  );
}

/**
 * Preview card for a selected map pin — see the module docs for the composition contract and
 * `docs/MAP_SYSTEM.md` §9 for its place in the map system.
 */
export function GdsMapPinPreviewCard({
  title, activity, neighbourhood, summary, ageRange, trust, priceEstimate, lastChecked,
  thumbnailSeed, categories, primaryAction,
  saved, saveLabel, unsaveLabel, onSaveChange,
  onClose, closeLabel, loading = false,
}: GdsMapPinPreviewCardProps) {
  const hasMedia = Boolean(thumbnailSeed && categories && categories.length > 0);
  const hasEstimate = Boolean(priceEstimate || lastChecked);
  const hasSave = Boolean(saveLabel && unsaveLabel);
  const meta = [activity, neighbourhood].filter((part) => part !== undefined && part !== null);

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      data-gds-map-pin-preview-card
      style={{ boxShadow: SURFACE_SHADOW, maxWidth: 360 }}
    >
      {loading ? <PreviewSkeleton /> : (
        <Stack gap="sm">
          {hasMedia ? (
            <Box style={{ position: 'relative' }}>
              <GdsGeneratedThumbnail
                seed={thumbnailSeed as string}
                categories={categories as GdsGeneratedThumbnailCategory[]}
                aspectRatio="16:9"
                badges="none"
              />
              {onClose && closeLabel ? (
                <CloseButton
                  aria-label={closeLabel}
                  onClick={onClose}
                  radius="xl"
                  size="lg"
                  variant="filled"
                  style={{ position: 'absolute', top: 'var(--mantine-spacing-xs)', right: 'var(--mantine-spacing-xs)' }}
                />
              ) : null}
            </Box>
          ) : onClose && closeLabel ? (
            <Group justify="flex-end">
              <CloseButton aria-label={closeLabel} onClick={onClose} radius="xl" size="lg" />
            </Group>
          ) : null}

          <Stack gap={4}>
            <Title order={3} size="h4">{title}</Title>
            {meta.length > 0 ? (
              <Text size="sm" c="dimmed" data-gds-map-pin-preview-meta>
                {meta.map((part, index) => (
                  <span key={index}>{index > 0 ? ' · ' : ''}{part}</span>
                ))}
              </Text>
            ) : null}
          </Stack>

          {summary ? <Text size="sm">{summary}</Text> : null}

          {(ageRange || trust) ? (
            <Group gap="xs">
              {ageRange ? <GdsBadge tone="neutral" label={ageRange} /> : null}
              {trust ? <MeaningBadge variant={trust.variant} label={trust.label} /> : null}
            </Group>
          ) : null}

          {hasEstimate ? (
            <Paper withBorder radius="md" p="sm" data-gds-map-pin-preview-estimate>
              <Stack gap={2}>
                {priceEstimate ? <Text size="sm" fw={600}>{priceEstimate}</Text> : null}
                {lastChecked ? <Text size="xs" c="dimmed">{lastChecked}</Text> : null}
              </Stack>
            </Paper>
          ) : null}

          {(primaryAction || hasSave) ? (
            <Group gap="xs" wrap="nowrap" align="stretch">
              {primaryAction ? <Box style={{ flex: 1 }}>{primaryAction}</Box> : null}
              {hasSave ? (
                <GdsSavedIndicator
                  saved={Boolean(saved)}
                  saveLabel={saveLabel as string}
                  unsaveLabel={unsaveLabel as string}
                  onSaveChange={onSaveChange}
                />
              ) : null}
            </Group>
          ) : null}
        </Stack>
      )}
    </Paper>
  );
}
