import type { ReactNode } from 'react';
import { Badge, Group, Stack } from '@mantine/core';

/** A removable active-filter chip shown in the toolbar's filter summary row. */
export interface DataToolbarFilterChip {
  label: string;
  /** When provided, the chip renders a remove affordance that calls this. */
  onRemove?: () => void;
}

/** Props for {@link DataToolbar}; each `*Slot`/`*Action` is a caller-supplied control placed into the toolbar layout. */
export interface DataToolbarProps {
  /** Search control, left-aligned. */
  searchSlot?: ReactNode;
  /** Filter control, left-aligned after search. */
  filterSlot?: ReactNode;
  /** Sort control, left-aligned after filters. */
  sortSlot?: ReactNode;
  /** Reset control, right-aligned. */
  resetAction?: ReactNode;
  /** Primary create control, right-aligned. */
  createAction?: ReactNode;
  /** Active filters rendered as removable chips below the controls. */
  activeFilters?: DataToolbarFilterChip[];
}

/**
 * Governed data-table toolbar: arranges search/filter/sort controls and
 * reset/create actions on one row, with an optional row of removable active-filter
 * chips beneath. Controls themselves are passed in as slots.
 */
export function DataToolbar({
  searchSlot,
  filterSlot,
  sortSlot,
  resetAction,
  createAction,
  activeFilters = [],
}: DataToolbarProps) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start" gap="sm">
        <Group flex={1} align="flex-start" gap="sm">
          {searchSlot}
          {filterSlot}
          {sortSlot}
        </Group>
        <Group gap="sm">
          {resetAction}
          {createAction}
        </Group>
      </Group>

      {activeFilters.length ? (
        <Group gap="xs">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant="light"
              rightSection={filter.onRemove ? <span aria-hidden="true">×</span> : undefined}
              style={filter.onRemove ? { cursor: 'pointer' } : undefined}
              {...(filter.onRemove
                ? { component: 'button', type: 'button', onClick: filter.onRemove, 'aria-label': `Remove ${filter.label} filter` }
                : {})}
            >
              {filter.label}
            </Badge>
          ))}
        </Group>
      ) : null}
    </Stack>
  );
}
