'use client';

import React from 'react';
import { Badge, Group, SimpleGrid, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { StateBlock } from '@sovereignsquad/gds-core';
import { DataTable, type DataTableColumn } from './DataTable';

export interface ResponsiveDataViewFilterChip {
  label: string;
  onRemove?: () => void;
}

export interface ResponsiveDataViewProps<T extends Record<string, unknown>> {
  data: T[];
  columns: DataTableColumn<T>[];
  renderCard: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  error?: string;
  errorAction?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  activeFilters?: ResponsiveDataViewFilterChip[];
  toolbar?: React.ReactNode;
  filterDrawer?: React.ReactNode;
  mobileFilters?: React.ReactNode;
  getRowKey?: (item: T, index: number) => React.Key;
}

/**
 * Data surface that renders a table on wide viewports and a card list (via
 * `renderCard`) on narrow ones, sharing the same `data`/`columns` and carrying
 * governed loading, empty, and error states plus optional toolbar/filter slots.
 * Use it when a list must stay usable on both desktop and mobile without you
 * writing two separate layouts.
 */
export function ResponsiveDataView<T extends Record<string, unknown>>({
  data,
  columns,
  renderCard,
  loading = false,
  error,
  errorAction,
  emptyTitle = 'No results yet',
  emptyDescription = 'Try changing filters or create a new record.',
  emptyAction,
  activeFilters = [],
  toolbar,
  filterDrawer,
  mobileFilters,
  getRowKey,
}: ResponsiveDataViewProps<T>) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Stack gap="md">
      {toolbar}
      {activeFilters.length ? (
        <Group gap="xs" wrap="wrap">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.label}-${index}`}
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
      {mobileFilters && isMobile ? <Stack gap="xs">{mobileFilters}</Stack> : null}
      {filterDrawer && isMobile ? filterDrawer : null}
      {error ? (
        <StateBlock variant="error" title="Unable to load data" description={error} action={errorAction} compact />
      ) : null}

      {!error && loading ? (
        <StateBlock variant="loading" title="Loading records" description="The shared registry surface is synchronizing." compact />
      ) : null}

      {!error && !loading && data.length === 0 ? (
        <StateBlock variant="empty" title={emptyTitle} description={emptyDescription} action={emptyAction} compact />
      ) : null}

      {!error && isMobile && data.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {data.map((item, index) => (
            <React.Fragment key={getRowKey ? getRowKey(item, index) : index}>
              {renderCard(item, index)}
            </React.Fragment>
          ))}
        </SimpleGrid>
      ) : null}

      {!error && !isMobile ? (
        <DataTable data={data} columns={columns} loading={loading} getRowKey={getRowKey} />
      ) : null}
    </Stack>
  );
}
