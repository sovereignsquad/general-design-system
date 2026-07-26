'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Checkbox, Group, ScrollArea, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { StateBlock } from './StateBlock';

/** Row spacing density for the advanced data table. */
export type AdvancedTableDensity = 'compact' | 'comfortable';
/** Sort direction for a table column. */
export type AdvancedSortDirection = 'asc' | 'desc';

/** Definition of a single advanced-table column. */
export interface AdvancedTableColumn<T extends Record<string, unknown>> {
  /** Row property key used to read the cell value and as the column identity. */
  key: string;
  label: string;
  /** Enables the sortable header button for this column. */
  sortable?: boolean;
  width?: number | string;
  /** Custom cell renderer; defaults to the stringified row value. */
  render?: (row: T) => ReactNode;
  /** Extracts the value used for sorting; defaults to the stringified row value. */
  sortAccessor?: (row: T) => string | number;
}

/** Props for the `AdvancedDataTable` component. Selection and sort are uncontrolled unless the matching value/change props are supplied. */
export interface AdvancedDataTableProps<T extends Record<string, unknown>> {
  rows: T[];
  columns: AdvancedTableColumn<T>[];
  /** Derives a stable id for each row. */
  rowId: (row: T, index: number) => string;
  loading?: boolean;
  /** Error message; when set, an error state block is shown instead of the table. */
  error?: string | null;
  /** Row density. Uncontrolled default is `comfortable`. */
  density?: AdvancedTableDensity;
  /** Keep the header visible while scrolling. Defaults to `true`. */
  stickyHeader?: boolean;
  /** Top offset for the sticky header, in pixels. Defaults to `0`. */
  stickyHeaderOffset?: number;
  /** Controlled selected row ids; provide with `onSelectedRowIdsChange`. */
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  /** Controlled sort column key; provide with `onSortChange`. */
  sortBy?: string;
  sortDirection?: AdvancedSortDirection;
  onSortChange?: (columnKey: string, direction: AdvancedSortDirection) => void;
  /** Small-screen fallback: render the first rows as stacked cards, or `none`. Defaults to `stacked-cards`. */
  responsiveFallback?: 'stacked-cards' | 'none';
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Governed enterprise data grid with sortable columns, row and select-all
 * selection, adjustable density, and a sticky header. Selection and sort work
 * uncontrolled, or become controlled when the matching value/change props are
 * passed. Renders error, loading, and empty state blocks in place of the table.
 */
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

