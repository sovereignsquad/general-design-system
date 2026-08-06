import type { ReactNode } from 'react';
import { Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { GdsRemovableTag } from './GdsRemovableTag';
import { DataToolbar, type DataToolbarProps } from './DataToolbar';
import { StateBlock } from './StateBlock';

/** An active-filter chip shown on a browse surface, with an optional remove handler. */
export interface BrowseSurfaceFilterChip {
  id: string;
  label: ReactNode;
  onRemove?: () => void;
}

/** A selectable scope option (e.g. a saved view or segment) shown above the results. */
export interface BrowseSurfaceScopeOption {
  id: string;
  label: ReactNode;
  active?: boolean;
  onSelect?: () => void;
}

/** Props for {@link BrowseSurface}. */
export interface BrowseSurfaceProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  resultCount?: number;
  resultLabel?: ReactNode;
  activeFilters?: BrowseSurfaceFilterChip[];
  scopeOptions?: BrowseSurfaceScopeOption[];
  scopeLabel?: ReactNode;
  locationControls?: ReactNode;
  primaryControls?: ReactNode;
  /** DataToolbar props (minus `activeFilters`, which the surface derives), plus a `fallbackActiveFilters` used when no `activeFilters` are set. */
  toolbar?: Omit<DataToolbarProps, 'activeFilters'> & {
    fallbackActiveFilters?: DataToolbarProps['activeFilters'];
  };
  sortControl?: ReactNode;
  mobileFilters?: ReactNode;
  filterDrawer?: ReactNode;
  /** Main results region, rendered when not in the loading, error, or empty state. */
  content: ReactNode;
  loading?: boolean;
  loadingTitle?: string;
  loadingDescription?: ReactNode;
  error?: ReactNode;
  errorTitle?: string;
  errorAction?: ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
}

/**
 * Governed browse/search results scaffold: a header with eyebrow, title, result
 * count, scope options, location and filter controls, and active-filter chips,
 * above a results region that swaps to a governed loading, error, or empty
 * {@link StateBlock} based on the `loading`/`error`/`empty` flags.
 */
export function BrowseSurface({
  eyebrow,
  title,
  description,
  resultCount,
  resultLabel = 'results',
  activeFilters = [],
  scopeOptions = [],
  scopeLabel = 'Scope',
  locationControls,
  primaryControls,
  toolbar,
  sortControl,
  mobileFilters,
  filterDrawer,
  content,
  loading = false,
  loadingTitle = 'Loading results',
  loadingDescription = 'The browse surface is still synchronizing.',
  error,
  errorTitle = 'Unable to load results',
  errorAction,
  empty = false,
  emptyTitle = 'No matching results',
  emptyDescription = 'Try adjusting your filters or broadening the current scope.',
  emptyAction,
}: BrowseSurfaceProps) {
  const toolbarFilters = activeFilters.map((filter) => ({
    label: typeof filter.label === 'string' ? filter.label : `Filter ${filter.id}`,
    onRemove: filter.onRemove,
  }));

  let body = content;

  if (loading) {
    body = <StateBlock variant="loading" title={loadingTitle} description={loadingDescription} compact />;
  } else if (error) {
    body = <StateBlock variant="error" title={errorTitle} description={error} action={errorAction ?? emptyAction} compact />;
  } else if (empty) {
    body = <StateBlock variant="empty" title={emptyTitle} description={emptyDescription} action={emptyAction} compact />;
  }

  return (
    <Stack gap="lg">
      <Paper withBorder radius="xl" p="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" gap="md">
            <Stack gap="xs" maw={760}>
              {eyebrow ? (
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.18em' }}>
                  {eyebrow}
                </Text>
              ) : null}
              <Title order={1}>{title}</Title>
              {description ? (
                <Text size="lg" c="dimmed">
                  {description}
                </Text>
              ) : null}
            </Stack>
            <Stack align="flex-end" gap="xs">
              {typeof resultCount === 'number' ? (
                <Badge size="lg" radius="xl" variant="light" color="violet">
                  {resultCount} {resultLabel}
                </Badge>
              ) : null}
              {primaryControls}
            </Stack>
          </Group>

          {scopeOptions.length ? (
            <Stack gap="xs">
              <Text size="sm" fw={600} c="dimmed">
                {scopeLabel}
              </Text>
              <Group gap="xs" wrap="wrap">
                {scopeOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={option.active ? 'filled' : 'default'}
                    color={option.active ? 'violet' : 'gray'}
                    radius="xl"
                    size="sm"
                    onClick={option.onSelect}
                  >
                    {option.label}
                  </Button>
                ))}
              </Group>
            </Stack>
          ) : null}

          {locationControls ? (
            <Stack gap="xs">
              <Text size="sm" fw={600} c="dimmed">
                Location
              </Text>
              {locationControls}
            </Stack>
          ) : null}

          {toolbar || sortControl ? (
            <SimpleGrid cols={{ base: 1, lg: sortControl ? 2 : 1 }} spacing="md">
              {toolbar ? (
                <DataToolbar
                  {...toolbar}
                  activeFilters={toolbarFilters.length ? toolbarFilters : toolbar.fallbackActiveFilters}
                />
              ) : (
                <Box />
              )}
              {sortControl ? (
                <Stack gap="xs" align="stretch">
                  <Text size="sm" fw={600} c="dimmed">
                    Sort
                  </Text>
                  {sortControl}
                </Stack>
              ) : null}
            </SimpleGrid>
          ) : null}

          {mobileFilters ? (
            <Stack hiddenFrom="lg" gap="xs">
              <Text size="sm" fw={600} c="dimmed">
                Filters
              </Text>
              {mobileFilters}
            </Stack>
          ) : null}

          {filterDrawer ? <Box hiddenFrom="lg">{filterDrawer}</Box> : null}

          {activeFilters.length ? (
            <Group gap="xs" wrap="wrap">
              {activeFilters.map((filter) =>
                filter.onRemove ? (
                  <GdsRemovableTag
                    key={filter.id}
                    label={filter.label}
                    onRemove={filter.onRemove}
                    removeLabel={`Remove ${filter.label} filter`}
                    tone="info"
                  />
                ) : (
                  <Badge key={filter.id} variant="light" color="violet">
                    {filter.label}
                  </Badge>
                ),
              )}
            </Group>
          ) : null}
        </Stack>
      </Paper>

      {body}
    </Stack>
  );
}
