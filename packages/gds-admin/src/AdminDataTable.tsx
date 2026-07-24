import type { Key, ReactNode } from 'react';
import { Box, Group, Paper, ScrollArea, Table, Text, UnstyledButton } from '@mantine/core';
import { StateBlock, type StateBlockProps } from '@sovereignsquad/gds-core';
import { GdsIcons } from '@sovereignsquad/gds-core';

export type AdminSortDirection = 'asc' | 'desc';
export type AdminColumnAlign = 'start' | 'center' | 'end';
export type AdminTableState = 'ready' | 'loading' | 'empty' | 'error' | 'permission-limited' | 'refreshing';

export interface AdminDataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  numeric?: boolean;
  align?: AdminColumnAlign;
  rowHeader?: boolean;
  width?: number | string;
}

export interface AdminDataTableSort {
  key: string;
  direction: AdminSortDirection;
}

export interface AdminDataTableProps<T> {
  rows: T[];
  columns: AdminDataTableColumn<T>[];
  caption?: ReactNode;
  state?: AdminTableState;
  error?: ReactNode;
  empty?: ReactNode;
  toolbar?: ReactNode;
  actions?: ReactNode;
  sort?: AdminDataTableSort;
  onSortChange?: (sort: AdminDataTableSort) => void;
  getRowKey: (row: T, index: number) => Key;
  renderMobileCard?: (row: T, index: number) => ReactNode;
}

function toTextAlign(align?: AdminColumnAlign, numeric?: boolean) {
  if (align === 'center') return 'center';
  if (align === 'end' || numeric) return 'right';
  return 'left';
}

function nextSort(column: AdminDataTableColumn<unknown>, current?: AdminDataTableSort): AdminDataTableSort {
  if (current?.key !== column.key) {
    return { key: column.key, direction: 'asc' };
  }
  return { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

function stateBlockFor(state: AdminTableState, error?: ReactNode, empty?: ReactNode): Pick<StateBlockProps, 'variant' | 'title' | 'description'> {
  if (state === 'loading') {
    return { variant: 'loading', title: 'Loading records', description: 'The table is synchronizing.' };
  }
  if (state === 'error') {
    return { variant: 'error', title: 'Unable to load records', description: error ?? 'The table could not be prepared.' };
  }
  if (state === 'permission-limited') {
    return { variant: 'permission', title: 'Limited access', description: error ?? 'You do not have access to every row in this table.' };
  }
  return { variant: 'empty', title: 'No records available', description: empty ?? 'No rows match the current table scope.' };
}

/**
 * Sortable admin table with governed ready/loading/empty/error/permission states,
 * accessible column headers, an optional toolbar/actions row, and a mobile card
 * fallback (`renderMobileCard`). Requires a `getRowKey`. Use it for admin list
 * views that need column sorting and state handling but not the full
 * search/filter/paginate machinery of `GdsDataTable`.
 */
export function AdminDataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  caption,
  state = rows.length ? 'ready' : 'empty',
  error,
  empty,
  toolbar,
  actions,
  sort,
  onSortChange,
  getRowKey,
  renderMobileCard,
}: AdminDataTableProps<T>) {
  const shouldRenderRows = rows.length > 0 && state !== 'error' && state !== 'permission-limited';
  const stateProps = stateBlockFor(state, error, empty);

  return (
    <Paper withBorder radius="lg" p={0} data-gds-admin-table-state={state}>
      {(toolbar || actions) ? (
        <Group justify="space-between" align="center" gap="md" p="md" wrap="wrap">
          {toolbar}
          {actions}
        </Group>
      ) : null}

      {caption ? (
        <Text size="sm" c="dimmed" px="md" pb="xs">
          {caption}
        </Text>
      ) : null}

      {!shouldRenderRows ? (
        <Box p="xl">
          <StateBlock {...stateProps} compact />
        </Box>
      ) : (
        <>
          {renderMobileCard ? (
            <Box hiddenFrom="sm" p="md">
              <Group gap="md" align="stretch">
                {rows.map((row, index) => (
                  <Box key={getRowKey(row, index)} w="100%">
                    {renderMobileCard(row, index)}
                  </Box>
                ))}
              </Group>
            </Box>
          ) : null}
          <ScrollArea type="auto" visibleFrom={renderMobileCard ? 'sm' : undefined}>
            <Table striped highlightOnHover withTableBorder={false}>
              {caption ? <Table.Caption>{caption}</Table.Caption> : null}
              <Table.Thead>
                <Table.Tr>
                  {columns.map((column) => {
                    const sorted = sort?.key === column.key;
                    const ariaSort = sorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                    return (
                      <Table.Th
                        key={column.key}
                        scope="col"
                        aria-sort={column.sortable ? ariaSort : undefined}
                        style={{ textAlign: toTextAlign(column.align, column.numeric), width: column.width }}
                      >
                        {column.sortable ? (
                          <UnstyledButton
                            type="button"
                            onClick={() => onSortChange?.(nextSort(column as AdminDataTableColumn<unknown>, sort))}
                            aria-label={`Sort by ${typeof column.header === 'string' ? column.header : column.key}`}
                          >
                            <Group gap={4} wrap="nowrap">
                              <span>{column.header}</span>
                              <GdsIcons.Sort size="0.9rem" aria-hidden />
                            </Group>
                          </UnstyledButton>
                        ) : column.header}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, rowIndex) => (
                  <Table.Tr key={getRowKey(row, rowIndex)}>
                    {columns.map((column) => {
                      const content = column.accessor ? column.accessor(row, rowIndex) : (row[column.key] as ReactNode);
                      const Cell = column.rowHeader ? Table.Th : Table.Td;
                      return (
                        <Cell
                          key={column.key}
                          scope={column.rowHeader ? 'row' : undefined}
                          style={{ textAlign: toTextAlign(column.align, column.numeric) }}
                        >
                          {content}
                        </Cell>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </>
      )}
    </Paper>
  );
}

export type AdminAnalyticsMetricTone = 'neutral' | 'positive' | 'negative' | 'warning';

export interface AdminAnalyticsTableProps<T extends Record<string, unknown>> extends Omit<AdminDataTableProps<T>, 'columns'> {
  columns: Array<AdminDataTableColumn<T> & { metricTone?: AdminAnalyticsMetricTone }>;
}

export function AdminAnalyticsTable<T extends Record<string, unknown>>(props: AdminAnalyticsTableProps<T>) {
  return <AdminDataTable {...props} caption={props.caption ?? 'Analytics metrics'} />;
}
