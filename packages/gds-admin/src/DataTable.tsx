import type { Key, ReactNode } from 'react';
import { Table, Paper, LoadingOverlay } from '@mantine/core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { StateBlock } from '@doneisbetter/gds-core';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  getRowKey?: (item: T, index: number) => Key;
}

/**
 * Standardized Data Table
 */
export function DataTable<T extends Record<string, unknown>>({ data, columns, loading = false, getRowKey }: DataTableProps<T>) {
  const { t } = useGdsTranslation();

  if (!data.length && !loading) {
    return (
      <Paper p="xl" withBorder>
        <StateBlock
          variant="empty"
          title={t('gds.state.emptyDataTitle', 'No data available')}
          description={t('gds.state.emptyData', 'No data available.')}
          compact
        />
      </Paper>
    );
  }

  return (
    <Paper withBorder pos="relative" style={{ overflow: 'hidden' }}>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th key={col.key}>{col.label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item, rowIndex) => (
            <Table.Tr key={getRowKey ? getRowKey(item, rowIndex) : rowIndex}>
              {columns.map((col) => (
                <Table.Td key={col.key}>
                  {col.render ? col.render(item) : (item[col.key] as ReactNode)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
