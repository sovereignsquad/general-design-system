import type { ReactNode } from 'react';
import { ScrollArea, Table } from '@mantine/core';
import { StateBlock } from './StateBlock';

export interface SimpleTableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
}

export interface SimpleDataTableProps<T extends Record<string, unknown>> {
  columns: SimpleTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowKey?: (row: T, index: number) => React.Key;
}

/**
 * Lightweight read-only table: renders `rows` against `columns` (`{ key, header,
 * render? }`) with governed loading, empty, and error states and no interactivity.
 * Use it for static tabular data (summaries, detail sub-tables); reach for
 * {@link GdsDataTable} when you need sorting, filtering, pagination, or selection.
 */
export function SimpleDataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  loading = false,
  error = null,
  emptyTitle = 'No data available',
  emptyDescription = 'There is no live data to show yet.',
  getRowKey,
}: SimpleDataTableProps<T>) {
  if (error) {
    return <StateBlock variant="error" title="Unable to load data" description={error} compact />;
  }

  if (loading) {
    return <StateBlock variant="loading" title="Loading data" description="Please wait while the shared dataset is prepared." compact />;
  }

  if (!rows.length) {
    return <StateBlock variant="empty" title={emptyTitle} description={emptyDescription} compact />;
  }

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={String(column.key)}>{column.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => (
            <Table.Tr key={getRowKey ? getRowKey(row, index) : index}>
              {columns.map((column) => (
                <Table.Td key={String(column.key)}>
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
