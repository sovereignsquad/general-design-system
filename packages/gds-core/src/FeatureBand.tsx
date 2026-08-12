import type { ReactNode } from 'react';
import { Box, Group, Paper, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { EmptyState } from './EmptyState';
import { GdsIcons } from './icons';

/** A single feature entry rendered as a card within a `FeatureBand`. */
export interface FeatureBandItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  /** Icon shown in a themed circle when no `media` is provided. */
  icon?: ReactNode;
  /** Custom media rendered in place of the icon. */
  media?: ReactNode;
  /** Step badge label used by the `process` variant; defaults to "Step {n}". */
  stepLabel?: ReactNode;
}

/** Props for `FeatureBand`. */
export interface FeatureBandProps {
  items: FeatureBandItem[];
  /** Number of columns at the largest breakpoint; defaults to 3. */
  columns?: 2 | 3 | 4;
  /** Draws a border around each card; defaults to true. */
  bordered?: boolean;
  /** Shows a skeleton placeholder grid while true. */
  loading?: boolean;
  /** Custom node shown when there are no items; falls back to a default empty state. */
  emptyState?: ReactNode;
  /** Card layout style; defaults to `default`. */
  variant?: 'default' | 'process' | 'compact';
}

function FeatureBandSkeleton({
  columns = 3,
  bordered = true,
  variant = 'default',
}: Pick<FeatureBandProps, 'columns' | 'bordered' | 'variant'>) {
  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg">
      {Array.from({ length: columns }).map((_, index) => (
        <Paper key={index} withBorder={bordered} radius="lg" p={variant === 'compact' ? 'md' : 'lg'}>
          <Stack gap="md">
            <Skeleton height={variant === 'process' ? 28 : 42} width={variant === 'process' ? 72 : 42} radius="xl" />
            <Stack gap="xs">
              <Skeleton height={20} width="75%" radius="md" />
              <Skeleton height={14} width="100%" radius="md" />
              <Skeleton height={14} width="82%" radius="md" />
            </Stack>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/** Responsive grid of supporting feature cards with loading skeletons and an empty state; supports default, process (numbered steps), and compact variants. */
export function FeatureBand({
  items,
  columns = 3,
  bordered = true,
  loading = false,
  emptyState,
  variant = 'default',
}: FeatureBandProps) {
  const { t } = useGdsTranslation();

  if (loading) {
    return <FeatureBandSkeleton columns={columns} bordered={bordered} variant={variant} />;
  }

  if (!items.length) {
    return emptyState ? (
      <>{emptyState}</>
    ) : (
      <EmptyState
        title={t('gds.featureBand.emptyTitle', 'No supporting details available')}
        description={t('gds.featureBand.emptyDescription', 'Add shared feature-band items when this public surface needs trust, service, or location context.')}
      />
    );
  }

  return (
    <Box component="section" aria-label={t('gds.featureBand.sectionLabel', 'Supporting features')}>
      <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg">
        {items.map((item, index) => (
          <Paper key={item.id} withBorder={bordered} radius="lg" p={variant === 'compact' ? 'md' : 'lg'}>
            <Stack gap="md">
              {variant === 'process' ? (
                <Group>
                  <Text
                    fw={800}
                    size="sm"
                    px="sm"
                    py={6}
                    style={{
                      borderRadius: 'var(--gds-radius-pill)',
                      background: 'var(--mantine-color-violet-light)',
                    }}
                  >
                    {item.stepLabel ?? `Step ${index + 1}`}
                  </Text>
                </Group>
              ) : item.media ? (
                item.media
              ) : item.icon ? (
                <Group>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="violet" aria-hidden>
                    {item.icon}
                  </ThemeIcon>
                </Group>
              ) : (
                <Group>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="gray" aria-hidden>
                    <GdsIcons.Info size="1.25rem" />
                  </ThemeIcon>
                </Group>
              )}
              <Stack gap="xs">
                <Title order={4}>{item.title}</Title>
                {item.description ? <Text c="dimmed">{item.description}</Text> : null}
                {item.meta ? (
                  <Text size="sm" c="dimmed">
                    {item.meta}
                  </Text>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Box>
  );
}
