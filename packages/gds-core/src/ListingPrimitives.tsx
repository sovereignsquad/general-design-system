import type { ReactNode } from 'react';
import { Badge, Button, Group, Select, Stack, Text } from '@mantine/core';

export interface ListingFilterChip {
  id: string;
  label: string;
  onRemove?: () => void;
}

export interface ActiveFilterChipsProps {
  filters: ListingFilterChip[];
  emptyLabel?: ReactNode;
}

export interface ResultSummaryProps {
  resultCount: number;
  noun?: string;
  description?: ReactNode;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface SortMenuProps {
  value: string;
  options: SortOption[];
  onChange?: (value: string) => void;
  label?: string;
}

export interface BulkActionsBarProps {
  selectedCount: number;
  actions?: ReactNode;
  clearAction?: ReactNode;
}

export function ActiveFilterChips({
  filters,
  emptyLabel = 'No active filters.',
}: ActiveFilterChipsProps) {
  if (!filters.length) {
    return <Text size="sm" c="dimmed">{emptyLabel}</Text>;
  }

  return (
    <Group gap="xs">
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="light"
          rightSection={filter.onRemove ? '×' : undefined}
          style={filter.onRemove ? { cursor: 'pointer' } : undefined}
          onClick={filter.onRemove}
        >
          {filter.label}
        </Badge>
      ))}
    </Group>
  );
}

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

