'use client';

import React from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { StateBlock } from '@gds/core';
import { DataTable, type DataTableColumn } from './DataTable';

export interface ResponsiveDataViewProps<T extends Record<string, unknown>> {
  data: T[];
  columns: DataTableColumn<T>[];
  renderCard: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
  getRowKey?: (item: T, index: number) => React.Key;
}

export function ResponsiveDataView<T extends Record<string, unknown>>({
  data,
  columns,
  renderCard,
  loading = false,
  error,
  emptyTitle = 'No results yet',
  emptyDescription = 'Try changing filters or create a new record.',
  toolbar,
  getRowKey,
}: ResponsiveDataViewProps<T>) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Stack gap="md">
      {toolbar}
      {error ? (
        <StateBlock variant="error" title="Unable to load data" description={error} compact />
      ) : null}

      {!error && !loading && data.length === 0 ? (
        <StateBlock variant="empty" title={emptyTitle} description={emptyDescription} compact />
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
