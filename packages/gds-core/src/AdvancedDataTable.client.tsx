'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Checkbox, Group, ScrollArea, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { StateBlock } from './StateBlock';

export type AdvancedTableDensity = 'compact' | 'comfortable';
export type AdvancedSortDirection = 'asc' | 'desc';

export interface AdvancedTableColumn<T extends Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  render?: (row: T) => ReactNode;
  sortAccessor?: (row: T) => string | number;
}

export interface AdvancedDataTableProps<T extends Record<string, unknown>> {
  rows: T[];
  columns: AdvancedTableColumn<T>[];
  rowId: (row: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  density?: AdvancedTableDensity;
  stickyHeader?: boolean;
  stickyHeaderOffset?: number;
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  sortBy?: string;
  sortDirection?: AdvancedSortDirection;
  onSortChange?: (columnKey: string, direction: AdvancedSortDirection) => void;
  responsiveFallback?: 'stacked-cards' | 'none';
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function AdvancedDataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  rowId,
  loading = false,
  error = null,
  density: densityProp,
  stickyHeader = true,
  stickyHeaderOffset = 0,
  selectedRowIds,
  onSelectedRowIdsChange,
  sortBy: sortByProp,
  sortDirection: sortDirectionProp,
  onSortChange,
  responsiveFallback = 'stacked-cards',
}: AdvancedDataTableProps<T>) {
  const [densityState, setDensityState] = useState<AdvancedTableDensity>(densityProp ?? 'comfortable');
  const [sortState, setSortState] = useState<{ key: string | null; direction: AdvancedSortDirection }>({ key: sortByProp ?? null, direction: sortDirectionProp ?? 'asc' });
  const [selectionState, setSelectionState] = useState<string[]>([]);

  const density = densityProp ?? densityState;
  const sortBy = sortByProp ?? sortState.key;
  const sortDirection = sortDirectionProp ?? sortState.direction;
  const selection = selectedRowIds ?? selectionState;

  const sortedRows = useMemo(() => {
    if (!sortBy) {
      return rows;
    }
    const column = columns.find((item) => item.key === sortBy);
    if (!column) {
      return rows;
    }
    const next = [...rows].sort((left, right) => {
      const leftValue = column.sortAccessor ? column.sortAccessor(left) : String(left[column.key] ?? '');
      const rightValue = column.sortAccessor ? column.sortAccessor(right) : String(right[column.key] ?? '');
      const result = compareValues(leftValue, rightValue);
      return sortDirection === 'asc' ? result : -result;
    });
    return next;
  }, [rows, columns, sortBy, sortDirection]);

  const allIds = useMemo(() => sortedRows.map((row, index) => rowId(row, index)), [sortedRows, rowId]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selection.includes(id));

  if (error) {
    return <StateBlock variant="error" title="Unable to load table" description={error} compact />;
  }

  if (loading) {
    return <StateBlock variant="loading" title="Loading table" description="Preparing enterprise data grid." compact />;
  }

  if (!rows.length) {
    return (
      <StateBlock
        variant="empty"
        title="No rows available"
        description="Adjust filters or broaden scope to populate this table."
        compact
      />
    );
  }

  const horizontalSpacing = density === 'compact' ? 'xs' : 'md';
  const verticalSpacing = density === 'compact' ? 6 : 10;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={600}>{rows.length} rows</Text>
        <SegmentedControl
          size="xs"
          value={density}
          onChange={(value) => setDensityState(value as AdvancedTableDensity)}
          data={[
            { label: 'Compact', value: 'compact' },
            { label: 'Comfortable', value: 'comfortable' },
          ]}
        />
      </Group>

      <ScrollArea>
        <Table
          stickyHeader={stickyHeader}
          stickyHeaderOffset={stickyHeaderOffset}
          withTableBorder
          highlightOnHover
          striped
          horizontalSpacing={horizontalSpacing}
          verticalSpacing={verticalSpacing}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  aria-label="Select all rows"
                  checked={allSelected}
                  indeterminate={!allSelected && selection.length > 0}
                  onChange={(event) => {
                    const next = event.currentTarget.checked ? allIds : [];
                    if (onSelectedRowIdsChange) {
                      onSelectedRowIdsChange(next);
                    } else {
                      setSelectionState(next);
                    }
                  }}
                />
              </Table.Th>
              {columns.map((column) => (
                <Table.Th key={column.key} style={column.width ? { width: column.width } : undefined}>
                  {column.sortable ? (
                    <button
                      type="button"
                      aria-label={`Sort by ${column.label}`}
                      onClick={() => {
                        const nextDirection: AdvancedSortDirection = sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
                        if (onSortChange) {
                          onSortChange(column.key, nextDirection);
                        } else {
                          setSortState({ key: column.key, direction: nextDirection });
                        }
                      }}
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedRows.map((row, index) => {
              const id = rowId(row, index);
              const checked = selection.includes(id);
              return (
                <Table.Tr key={id}>
                  <Table.Td>
                    <Checkbox
                      aria-label={`Select row ${id}`}
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? selection.filter((item) => item !== id)
                          : [...selection, id];
                        if (onSelectedRowIdsChange) {
                          onSelectedRowIdsChange(next);
                        } else {
                          setSelectionState(next);
                        }
                      }}
                    />
                  </Table.Td>
                  {columns.map((column) => (
                    <Table.Td key={column.key}>
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </Table.Td>
                  ))}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {responsiveFallback === 'stacked-cards' ? (
        <Stack gap="xs">
          {sortedRows.slice(0, 3).map((row, index) => {
            const id = rowId(row, index);
            return (
              <StateBlock
                key={`card-${id}`}
                variant="info"
                compact
                title={String(row[columns[0]?.key] ?? id)}
                description={columns.slice(1, 3).map((column) => `${column.label}: ${String(row[column.key] ?? '')}`).join(' | ')}
              />
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
}

