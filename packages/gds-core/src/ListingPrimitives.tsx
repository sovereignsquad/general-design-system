import type { ReactNode } from 'react';
import { Badge, Button, Group, Select, Stack, Text } from '@mantine/core';
import { GdsRemovableTag } from './GdsRemovableTag';

/** A single removable filter chip shown in a listing's active-filter bar. */
export interface ListingFilterChip {
  id: string;
  label: string;
  /** When provided, renders a clickable "×" that removes this filter. */
  onRemove?: () => void;
}

/** Props for `ActiveFilterChips`. */
export interface ActiveFilterChipsProps {
  filters: ListingFilterChip[];
  /** Text shown when there are no active filters; defaults to "No active filters." */
  emptyLabel?: ReactNode;
}

/** Props for `ResultSummary`. */
export interface ResultSummaryProps {
  resultCount: number;
  /** Noun for the count line; defaults to "results". */
  noun?: string;
  description?: ReactNode;
}

/** A selectable option in the sort menu. */
export interface SortOption {
  value: string;
  label: string;
}

/** Props for `SortMenu`. */
export interface SortMenuProps {
  value: string;
  options: SortOption[];
  onChange?: (value: string) => void;
  /** Field label and accessible name; defaults to "Sort". */
  label?: string;
}

/** Props for `BulkActionsBar`. */
export interface BulkActionsBarProps {
  selectedCount: number;
  /** Action controls shown when a selection exists. */
  actions?: ReactNode;
  /** Clear-selection control; defaults to a subtle "Clear selection" button. */
  clearAction?: ReactNode;
}

/** Renders active filter chips (each optionally removable), or a dimmed empty label when there are none. */
export function ActiveFilterChips({
  filters,
  emptyLabel = 'No active filters.',
}: ActiveFilterChipsProps) {
  if (!filters.length) {
    return <Text size="sm" c="dimmed">{emptyLabel}</Text>;
  }

  return (
    <Group gap="xs">
      {filters.map((filter) =>
        filter.onRemove ? (
          <GdsRemovableTag
            key={filter.id}
            label={filter.label}
            onRemove={filter.onRemove}
            removeLabel={`Remove ${filter.label} filter`}
          />
        ) : (
          <Badge key={filter.id} variant="light">
            {filter.label}
          </Badge>
        ),
      )}
    </Group>
  );
}

/** Compact "N results" summary line with an optional secondary description. */
export function ResultSummary({
  resultCount,
  noun = 'results',
  description,
}: ResultSummaryProps) {
  return (
    <Stack gap={2}>
      <Text size="sm" fw={600}>{resultCount} {noun}</Text>
      {description ? <Text size="xs" c="dimmed">{description}</Text> : null}
    </Stack>
  );
}

/** Labeled select for choosing among sort options. */
export function SortMenu({
  value,
  options,
  onChange,
  label = 'Sort',
}: SortMenuProps) {
  return (
    <Select
      aria-label={label}
      label={label}
      value={value}
      data={options}
      onChange={(next) => {
        if (next) {
          onChange?.(next);
        }
      }}
      w={220}
    />
  );
}

/** Selection toolbar showing the selected count plus bulk actions; renders nothing when nothing is selected. */
export function BulkActionsBar({
  selectedCount,
  actions,
  clearAction,
}: BulkActionsBarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <Group justify="space-between" align="center">
      <Text size="sm" fw={600}>
        {selectedCount} selected
      </Text>
      <Group gap="xs">
        {actions}
        {clearAction ?? <Button variant="subtle" size="xs">Clear selection</Button>}
      </Group>
    </Group>
  );
}

