'use client';

import React from 'react';
import { Badge, Group, SegmentedControl, SimpleGrid, Stack } from '@mantine/core';
import { useMediaQuery, useUncontrolled } from '@mantine/hooks';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsRemovableTag, StateBlock } from '@sovereignsquad/gds-core';
import { DataTable, type DataTableColumn } from './DataTable';

/** An active-filter chip shown above a {@link ResponsiveDataView}. */
export interface ResponsiveDataViewFilterChip {
  /** Chip label. */
  label: string;
  /** Remove handler; when set, the chip shows a clear affordance. */
  onRemove?: () => void;
}

/** Layout of a {@link ResponsiveDataView} on wide viewports. */
export type ResponsiveDataViewMode = 'table' | 'grid';

/** Props for {@link ResponsiveDataView}. */
export interface ResponsiveDataViewProps<T extends Record<string, unknown>> {
  /** Row records to render. */
  data: T[];
  /** Column definitions for the desktop table. */
  columns: DataTableColumn<T>[];
  /** Renders a card for each record in the mobile layout. */
  renderCard: (item: T, index: number) => React.ReactNode;
  /** Show loading state. */
  loading?: boolean;
  /** Error message; when set, an error state replaces the data. */
  error?: string;
  /** Action element shown in the error state. */
  errorAction?: React.ReactNode;
  /** Empty-state heading; defaults to "No results yet". */
  emptyTitle?: string;
  /** Empty-state description. */
  emptyDescription?: string;
  /** Action element shown in the empty state. */
  emptyAction?: React.ReactNode;
  /** Active filter chips shown above the data. */
  activeFilters?: ResponsiveDataViewFilterChip[];
  /** Toolbar content rendered above the data. */
  toolbar?: React.ReactNode;
  /** Filter drawer shown on mobile viewports. */
  filterDrawer?: React.ReactNode;
  /** Inline filter controls shown on mobile viewports. */
  mobileFilters?: React.ReactNode;
  /** Stable React key for each row/card; defaults to the index. */
  getRowKey?: (item: T, index: number) => React.Key;
  /** Wide-viewport layout (controlled). Narrow viewports always show cards. */
  view?: ResponsiveDataViewMode;
  /** Initial wide-viewport layout when uncontrolled; defaults to `'table'`. */
  defaultView?: ResponsiveDataViewMode;
  onViewChange?: (view: ResponsiveDataViewMode) => void;
  /** Render a labelled table/grid toggle above the data on wide viewports; defaults to `false`. */
  showViewToggle?: boolean;
}

/**
 * Data surface that renders a table on wide viewports and a card list (via
 * `renderCard`) on narrow ones, sharing the same `data`/`columns` and carrying
 * governed loading, empty, and error states plus optional toolbar/filter slots.
 * `showViewToggle` lets the user switch wide viewports between the table and a card grid
 * (`view`/`onViewChange` to control it); narrow viewports always show cards.
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
  view: viewProp,
  defaultView = 'table',
  onViewChange,
  showViewToggle = false,
}: ResponsiveDataViewProps<T>) {
  const { t } = useGdsTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [view, setView] = useUncontrolled<ResponsiveDataViewMode>({ value: viewProp, defaultValue: defaultView, finalValue: 'table', onChange: onViewChange });
  const showCards = isMobile || view === 'grid';
  const cards = (
    <SimpleGrid cols={isMobile ? { base: 1, sm: 2 } : { base: 1, sm: 2, lg: 3 }} spacing="md">
      {data.map((item, index) => (
        <React.Fragment key={getRowKey ? getRowKey(item, index) : index}>
          {renderCard(item, index)}
        </React.Fragment>
      ))}
    </SimpleGrid>
  );

  return (
    <Stack gap="md">
      {toolbar}
      {showViewToggle && !isMobile ? (
        <SegmentedControl
          aria-label={t('gds.dataView.toggleLabel', 'Layout')}
          value={view}
          onChange={(value) => setView(value as ResponsiveDataViewMode)}
          data={[
            { value: 'table', label: t('gds.dataView.table', 'Table') },
            { value: 'grid', label: t('gds.dataView.grid', 'Grid') },
          ]}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      {activeFilters.length ? (
        <Group gap="xs" wrap="wrap">
          {activeFilters.map((filter, index) =>
            filter.onRemove ? (
              <GdsRemovableTag
                key={`${filter.label}-${index}`}
                label={filter.label}
                onRemove={filter.onRemove}
                removeLabel={`Remove ${filter.label} filter`}
                tone="info"
              />
            ) : (
              <Badge key={`${filter.label}-${index}`} variant="light" color="violet">
                {filter.label}
              </Badge>
            ),
          )}
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

      {!error && showCards && data.length > 0 ? cards : null}

      {!error && !showCards ? (
        <DataTable data={data} columns={columns} loading={loading} getRowKey={getRowKey} />
      ) : null}
    </Stack>
  );
}
