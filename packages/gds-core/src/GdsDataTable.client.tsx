'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Button, Checkbox, Group, Pagination, ScrollArea, Stack, Table, Text, TextInput, VisuallyHidden } from '@mantine/core';
import { StateBlock } from './StateBlock';

export type GdsTableSortDirection = 'asc' | 'desc';
export type GdsTableStatus = 'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'filtered-empty' | 'error' | 'partial' | 'exporting';

export interface GdsTableColumn<T extends Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: number | string;
  interactive?: boolean;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number | boolean | null | undefined;
  mobilePriority?: number;
}

export interface GdsTableQuery {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortDirection: GdsTableSortDirection;
  filters: Record<string, string>;
}

export interface GdsTableLoadResult<T extends Record<string, unknown>> {
  rows: T[];
  total: number;
  partial?: boolean;
}

export interface GdsTableDataAdapter<T extends Record<string, unknown>> {
  mode: 'local' | 'remote';
  load: (query: GdsTableQuery, signal?: AbortSignal) => Promise<GdsTableLoadResult<T>>;
}

export interface GdsExportRequest<T extends Record<string, unknown>> {
  query: GdsTableQuery;
  selectedRowIds: string[];
  rows: T[];
}

export interface GdsTableEvent {
  type: 'load_started' | 'load_failed' | 'filter_changed' | 'sort_changed' | 'selection_changed' | 'export_requested';
  timestamp: number;
  privacy: 'metadata-only';
  message?: string;
}

export interface UseGdsDataTableConfig<T extends Record<string, unknown>> {
  columns: GdsTableColumn<T>[];
  rowId: (row: T, index: number) => string;
  adapter: GdsTableDataAdapter<T>;
  initialQuery?: Partial<GdsTableQuery>;
  onEvent?: (event: GdsTableEvent) => void;
  onExport?: (request: GdsExportRequest<T>) => Promise<void> | void;
  timeoutMs?: number;
  virtualizedRowLimit?: number;
}

export interface GdsDataTableController<T extends Record<string, unknown>> {
  query: GdsTableQuery;
  status: GdsTableStatus;
  rows: T[];
  visibleRows: T[];
  total: number;
  error?: string;
  selectedRowIds: string[];
  setSearch: (value: string) => void;
  setSort: (columnKey: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilter: (columnKey: string, value: string) => void;
  toggleRow: (id: string) => void;
  toggleAllVisible: () => void;
  clearSelection: () => void;
  retry: () => void;
  exportRows: () => Promise<void>;
}

export interface GdsDataTableProps<T extends Record<string, unknown>> extends UseGdsDataTableConfig<T> {
  caption?: string;
  summary?: ReactNode;
  exportLabel?: string;
  retryLabel?: string;
  mobileCards?: boolean;
}

function emitTableEvent(onEvent: UseGdsDataTableConfig<any>['onEvent'], type: GdsTableEvent['type'], message?: string) {
  onEvent?.({ type, message, timestamp: Date.now(), privacy: 'metadata-only' });
}

function createDefaultQuery(initial: Partial<GdsTableQuery> = {}): GdsTableQuery {
  return {
    page: initial.page ?? 1,
    pageSize: initial.pageSize ?? 25,
    search: initial.search ?? '',
    sortBy: initial.sortBy,
    sortDirection: initial.sortDirection ?? 'asc',
    filters: initial.filters ?? {},
  };
}

function getCellValue<T extends Record<string, unknown>>(row: T, column: GdsTableColumn<T>) {
  return column.accessor ? column.accessor(row) : row[column.key];
}

function compareTableValues(left: unknown, right: unknown) {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

function applyLocalQuery<T extends Record<string, unknown>>(rows: T[], columns: GdsTableColumn<T>[], query: GdsTableQuery) {
  const searchableColumns = columns.filter((column) => !column.hidden && column.filterable !== false);
  const filtered = rows.filter((row) => {
    const matchesSearch = !query.search || searchableColumns.some((column) => String(getCellValue(row, column) ?? '').toLowerCase().includes(query.search.toLowerCase()));
    const matchesFilters = Object.entries(query.filters).every(([key, value]) => !value || String(row[key] ?? '').toLowerCase().includes(value.toLowerCase()));
    return matchesSearch && matchesFilters;
  });
  const sorted = query.sortBy
    ? [...filtered].sort((left, right) => {
      const column = columns.find((item) => item.key === query.sortBy);
      const result = column ? compareTableValues(getCellValue(left, column), getCellValue(right, column)) : 0;
      return query.sortDirection === 'asc' ? result : -result;
    })
    : filtered;
  const start = (query.page - 1) * query.pageSize;
  return { rows: sorted.slice(start, start + query.pageSize), total: sorted.length };
}

export function createGdsTableAdapter<T extends Record<string, unknown>>(rows: T[], columns: GdsTableColumn<T>[]): GdsTableDataAdapter<T> {
  return {
    mode: 'local',
    load: async (query) => applyLocalQuery(rows, columns, query),
  };
}

export function serializeGdsTableQuery(query: GdsTableQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  params.set('sortDirection', query.sortDirection);
  for (const [key, value] of Object.entries(query.filters).sort(([left], [right]) => left.localeCompare(right))) {
    if (value) params.set(`filter.${key}`, value);
  }
  return params.toString();
}

export function useGdsDataTable<T extends Record<string, unknown>>({
  rowId,
  adapter,
  initialQuery,
  onEvent,
  onExport,
  timeoutMs = 8000,
  virtualizedRowLimit,
}: UseGdsDataTableConfig<T>): GdsDataTableController<T> {
  const [query, setQuery] = useState(() => createDefaultQuery(initialQuery));
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<GdsTableStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    setStatus((current) => (current === 'ready' || current === 'partial' ? 'refreshing' : 'loading'));
    emitTableEvent(onEvent, 'load_started');
    adapter.load(query, controller.signal)
      .then((result) => {
        const visibleIds = new Set(result.rows.map((row, index) => rowId(row, index)));
        setSelectedRowIds((ids) => ids.filter((id) => visibleIds.has(id)));
        setRows(result.rows);
        setTotal(result.total);
        setError(undefined);
        if (result.partial) setStatus('partial');
        else if (result.total === 0 && (query.search || Object.values(query.filters).some(Boolean))) setStatus('filtered-empty');
        else if (result.total === 0) setStatus('empty');
        else setStatus('ready');
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load table data.');
        setStatus('error');
        emitTableEvent(onEvent, 'load_failed', reason instanceof Error ? reason.message : undefined);
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [adapter, onEvent, query, reloadKey, rowId, timeoutMs]);

  const setSearch = useCallback((value: string) => {
    setQuery((current) => ({ ...current, search: value, page: 1 }));
    setSelectedRowIds([]);
    emitTableEvent(onEvent, 'filter_changed');
  }, [onEvent]);

  const setSort = useCallback((columnKey: string) => {
    setQuery((current) => ({
      ...current,
      sortBy: columnKey,
      sortDirection: current.sortBy === columnKey && current.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
    setSelectedRowIds([]);
    emitTableEvent(onEvent, 'sort_changed');
  }, [onEvent]);

  const setPage = useCallback((page: number) => setQuery((current) => ({ ...current, page: Math.max(1, Math.floor(page)) })), []);
  const setPageSize = useCallback((pageSize: number) => setQuery((current) => ({ ...current, page: 1, pageSize: Math.max(1, Math.floor(pageSize)) })), []);
  const setFilter = useCallback((columnKey: string, value: string) => {
    setQuery((current) => ({ ...current, filters: { ...current.filters, [columnKey]: value }, page: 1 }));
    setSelectedRowIds([]);
    emitTableEvent(onEvent, 'filter_changed');
  }, [onEvent]);

  const visibleRows = useMemo(() => rows.slice(0, virtualizedRowLimit ?? rows.length), [rows, virtualizedRowLimit]);
  const visibleIds = useMemo(() => visibleRows.map((row, index) => rowId(row, index)), [rowId, visibleRows]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRowIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      emitTableEvent(onEvent, 'selection_changed');
      return next;
    });
  }, [onEvent]);

  const toggleAllVisible = useCallback(() => {
    setSelectedRowIds((current) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.includes(id));
      const next = allSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])];
      emitTableEvent(onEvent, 'selection_changed');
      return next;
    });
  }, [onEvent, visibleIds]);

  const exportRows = useCallback(async () => {
    setStatus('exporting');
    emitTableEvent(onEvent, 'export_requested');
    await onExport?.({ query, rows, selectedRowIds, });
    setStatus(rows.length ? 'ready' : 'empty');
  }, [onEvent, onExport, query, rows, selectedRowIds]);

  return {
    query,
    status,
    rows,
    visibleRows,
    total,
    error,
    selectedRowIds,
    setSearch,
    setSort,
    setPage,
    setPageSize,
    setFilter,
    toggleRow,
    toggleAllVisible,
    clearSelection: () => setSelectedRowIds([]),
    retry: () => setReloadKey((value) => value + 1),
    exportRows,
  };
}

interface GdsTableFocusedCell {
  rowIndex: number;
  columnIndex: number;
}

const interactiveCellSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getInteractiveCellElements(cell: HTMLElement) {
  return Array.from(cell.querySelectorAll<HTMLElement>(interactiveCellSelector))
    .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
}

function useGdsTableKeyNav(rowCount: number, columnCount: number) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [focusedCell, setFocusedCell] = useState<GdsTableFocusedCell | null>(rowCount > 0 && columnCount > 0 ? { rowIndex: 0, columnIndex: 0 } : null);

  const focusCell = useCallback((rowIndex: number, columnIndex: number) => {
    const rows = tbodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-gds-row]') ?? [];
    const nextRowIndex = Math.max(0, Math.min(rowIndex, rows.length - 1));
    const cells = rows[nextRowIndex]?.querySelectorAll<HTMLElement>('[data-gds-cell]') ?? [];
    if (cells.length === 0) return;
    const nextColumnIndex = Math.max(0, Math.min(columnIndex, cells.length - 1));
    setFocusedCell({ rowIndex: nextRowIndex, columnIndex: nextColumnIndex });
    cells[nextColumnIndex]?.focus();
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTableSectionElement>) => {
    const rows = tbodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-gds-row]') ?? [];
    if (rows.length === 0 || columnCount === 0) return;

    const target = event.target instanceof HTMLElement ? event.target : null;
    const activeCell = target?.closest<HTMLElement>('[data-gds-cell]');
    const isCellTarget = Boolean(activeCell && target === activeCell);

    if (activeCell && !isCellTarget) {
      if (event.key === 'Escape') {
        event.preventDefault();
        activeCell.focus();
      }
      return;
    }

    if (activeCell && (event.key === 'Enter' || event.key === 'F2')) {
      const [firstInteractive] = getInteractiveCellElements(activeCell);
      if (firstInteractive) {
        event.preventDefault();
        firstInteractive.focus();
        return;
      }
    }

    const current = focusedCell ?? { rowIndex: 0, columnIndex: 0 };
    const lastRow = rows.length - 1;
    const lastColumn = columnCount - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusCell(current.rowIndex + 1, current.columnIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusCell(current.rowIndex - 1, current.columnIndex);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusCell(current.rowIndex, current.columnIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusCell(current.rowIndex, current.columnIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusCell(event.ctrlKey || event.metaKey ? 0 : current.rowIndex, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusCell(event.ctrlKey || event.metaKey ? lastRow : current.rowIndex, lastColumn);
    }
  }, [columnCount, focusCell, focusedCell]);

  useEffect(() => {
    setFocusedCell(rowCount > 0 && columnCount > 0 ? { rowIndex: 0, columnIndex: 0 } : null);
  }, [columnCount, rowCount]);

  return { tbodyRef, handleKeyDown, focusedCell, setFocusedCell };
}

/**
 * Full-featured governed data table: search, sort, filter, paginate, select, and
 * export over a `GdsTableDataAdapter` (local or remote), with an accessible table
 * structure, a mobile card fallback, and loading/empty/error states. Use it for
 * rich interactive grids; use {@link SimpleDataTable} for a static read-only
 * table, or `AdminDataTable` for a lighter sortable admin table.
 */
export function GdsDataTable<T extends Record<string, unknown>>({
  columns,
  rowId,
  adapter,
  initialQuery,
  onEvent,
  onExport,
  timeoutMs,
  virtualizedRowLimit,
  caption = 'Data table',
  summary,
  exportLabel = 'Export',
  retryLabel = 'Retry',
  mobileCards = true,
}: GdsDataTableProps<T>) {
  const table = useGdsDataTable({ columns, rowId, adapter, initialQuery, onEvent, onExport, timeoutMs, virtualizedRowLimit });
  const visibleColumns = columns.filter((column) => !column.hidden);
  const pageCount = Math.max(1, Math.ceil(table.total / table.query.pageSize));
  const gridColumnCount = visibleColumns.length + 1;
  const { tbodyRef, handleKeyDown, focusedCell, setFocusedCell } = useGdsTableKeyNav(table.visibleRows.length, gridColumnCount);
  const focusedColumnLabel = focusedCell
    ? focusedCell.columnIndex === 0 ? 'Selection' : visibleColumns[focusedCell.columnIndex - 1]?.label
    : undefined;

  if (table.status === 'loading') return <StateBlock variant="loading" title="Loading table" description="Preparing governed data rows." compact />;
  if (table.status === 'error') return <StateBlock variant="error" title="Unable to load table" description={table.error ?? 'The data adapter failed.'} action={<Button onClick={table.retry}>{retryLabel}</Button>} compact />;
  if (table.status === 'empty') return <StateBlock variant="empty" title="No rows available" description="There is no data for this table yet." compact />;
  if (table.status === 'filtered-empty') return <StateBlock variant="empty" title="No matching rows" description="Adjust search or filters to broaden the result set." compact />;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="end">
        <Stack gap={2}>
          <Text size="sm" fw={700}>{caption}</Text>
          {summary ? <Text size="xs" c="dimmed">{summary}</Text> : null}
          <Text size="xs" c="dimmed">{table.total} rows{table.status === 'partial' ? ' (partial data)' : ''}</Text>
        </Stack>
        <Group gap="xs">
          <TextInput aria-label="Search rows" placeholder="Search rows" value={table.query.search} onChange={(event) => table.setSearch(event.currentTarget.value)} />
          <Button variant="light" onClick={() => { void table.exportRows(); }} loading={table.status === 'exporting'}>{exportLabel}</Button>
        </Group>
      </Group>
      <ScrollArea>
        <Table withTableBorder striped highlightOnHover role="grid" aria-label={caption} aria-rowcount={table.total}>
          <caption>{caption}</caption>
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col">
                <Checkbox aria-label="Select all visible rows" checked={visibleColumns.length > 0 && table.visibleRows.length > 0 && table.visibleRows.every((row, index) => table.selectedRowIds.includes(rowId(row, index)))} onChange={table.toggleAllVisible} />
              </Table.Th>
              {visibleColumns.map((column) => (
                <Table.Th key={column.key} scope="col" aria-sort={table.query.sortBy === column.key ? (table.query.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} style={column.width ? { width: column.width } : undefined}>
                  {column.sortable ? <button type="button" onClick={() => table.setSort(column.key)}>{column.label}</button> : column.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody
            ref={tbodyRef}
            onKeyDown={handleKeyDown}
          >
            {table.visibleRows.map((row, rowIndex) => {
              const id = rowId(row, rowIndex);
              return (
                <Table.Tr
                  key={id}
                  data-gds-row
                  aria-selected={table.selectedRowIds.includes(id)}
                  aria-rowindex={(table.query.page - 1) * table.query.pageSize + rowIndex + 2}
                >
                  <Table.Td
                    role="gridcell"
                    data-gds-cell
                    data-gds-row-index={rowIndex}
                    data-gds-column-index={0}
                    tabIndex={focusedCell?.rowIndex === rowIndex && focusedCell.columnIndex === 0 ? 0 : -1}
                    aria-colindex={1}
                    onFocus={() => setFocusedCell({ rowIndex, columnIndex: 0 })}
                    style={focusedCell?.rowIndex === rowIndex && focusedCell.columnIndex === 0 ? { outline: '2px solid var(--mantine-color-blue-5)', outlineOffset: '-2px' } : undefined}
                  >
                    <Checkbox aria-label={`Select row ${id}`} checked={table.selectedRowIds.includes(id)} onChange={() => table.toggleRow(id)} tabIndex={-1} />
                  </Table.Td>
                  {visibleColumns.map((column, columnIndex) => {
                    const gridColumnIndex = columnIndex + 1;
                    const isCellFocused = focusedCell?.rowIndex === rowIndex && focusedCell.columnIndex === gridColumnIndex;
                    return (
                      <Table.Td
                        key={column.key}
                        role="gridcell"
                        data-gds-cell
                        data-gds-actionable-cell={column.interactive || undefined}
                        data-gds-row-index={rowIndex}
                        data-gds-column-index={gridColumnIndex}
                        aria-keyshortcuts={column.interactive ? 'Enter F2 Escape' : undefined}
                        tabIndex={isCellFocused ? 0 : -1}
                        aria-colindex={gridColumnIndex + 1}
                        onFocus={() => setFocusedCell({ rowIndex, columnIndex: gridColumnIndex })}
                        style={isCellFocused ? { outline: '2px solid var(--mantine-color-blue-5)', outlineOffset: '-2px' } : undefined}
                      >
                        {column.render ? column.render(row) : String(getCellValue(row, column) ?? '')}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {focusedCell ? `Row ${focusedCell.rowIndex + 1} of ${table.visibleRows.length}, ${focusedColumnLabel ?? `column ${focusedCell.columnIndex + 1}`} column` : ''}
      </VisuallyHidden>
      {virtualizedRowLimit && table.rows.length > table.visibleRows.length ? <Text size="xs" c="dimmed">{table.visibleRows.length} of {table.rows.length} rows rendered in the virtualized window.</Text> : null}
      <Group justify="space-between">
        <Text size="xs" c="dimmed">{table.selectedRowIds.length} selected</Text>
        <Pagination total={pageCount} value={table.query.page} onChange={table.setPage} size="sm" />
      </Group>
      {mobileCards ? (
        <Stack gap="xs" aria-label="Mobile row cards">
          {table.visibleRows.slice(0, 6).map((row, index) => {
            const ordered = [...visibleColumns].sort((left, right) => (left.mobilePriority ?? 99) - (right.mobilePriority ?? 99));
            const id = rowId(row, index);
            return (
              <StateBlock
                key={`mobile-${id}`}
                variant="info"
                title={String(getCellValue(row, ordered[0] ?? visibleColumns[0]!) ?? id)}
                description={ordered.slice(1, 4).map((column) => `${column.label}: ${String(getCellValue(row, column) ?? '')}`).join(' | ')}
                compact
              />
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
}
