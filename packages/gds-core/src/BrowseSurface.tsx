import type { ReactNode } from 'react';
import { Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DataToolbar, type DataToolbarProps } from './DataToolbar';
import { StateBlock } from './StateBlock';

export interface BrowseSurfaceFilterChip {
  id: string;
  label: ReactNode;
  onRemove?: () => void;
}

export interface BrowseSurfaceScopeOption {
  id: string;
  label: ReactNode;
  active?: boolean;
  onSelect?: () => void;
}

export interface BrowseSurfaceProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  resultCount?: number;
  resultLabel?: ReactNode;
  activeFilters?: BrowseSurfaceFilterChip[];
  scopeOptions?: BrowseSurfaceScopeOption[];
  scopeLabel?: ReactNode;
  primaryControls?: ReactNode;
  toolbar?: Omit<DataToolbarProps, 'activeFilters'> & {
    fallbackActiveFilters?: DataToolbarProps['activeFilters'];
  };
  sortControl?: ReactNode;
  mobileFilters?: ReactNode;
  content: ReactNode;
  loading?: boolean;
  loadingTitle?: string;
  loadingDescription?: ReactNode;
  error?: ReactNode;
  errorTitle?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
}

export function BrowseSurface({
  eyebrow,
  title,
  description,
  resultCount,
  resultLabel = 'results',
  activeFilters = [],
  scopeOptions = [],
  scopeLabel = 'Scope',
  primaryControls,
  toolbar,
  sortControl,
  mobileFilters,
  content,
  loading = false,
  loadingTitle = 'Loading results',
  loadingDescription = 'The browse surface is still synchronizing.',
  error,
  errorTitle = 'Unable to load results',
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
    body = <StateBlock variant="error" title={errorTitle} description={error} action={emptyAction} compact />;
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

          {activeFilters.length ? (
            <Group gap="xs" wrap="wrap">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="light"
                  color="violet"
                  rightSection={filter.onRemove ? '×' : undefined}
                  style={filter.onRemove ? { cursor: 'pointer' } : undefined}
                  onClick={filter.onRemove}
                >
                  {filter.label}
                </Badge>
              ))}
            </Group>
          ) : null}
        </Stack>
      </Paper>

      {body}
    </Stack>
  );
}
