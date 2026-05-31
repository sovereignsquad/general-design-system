import type { ReactNode } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { FormField } from './FormField';

export interface PeriodSelectorOption {
  value: string;
  label: string;
  description?: string;
}

export interface PeriodSelectorProps {
  label: ReactNode;
  description?: ReactNode;
  value: string;
  options: PeriodSelectorOption[];
  onChange?: (value: string) => void;
  timezone?: string;
  scope?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  stale?: boolean;
  filtered?: boolean;
  disabled?: boolean;
}

export function PeriodSelector({
  label,
  description,
  value,
  options,
  onChange,
  timezone,
  scope,
  helperText,
  error,
  stale = false,
  filtered = false,
  disabled = false,
}: PeriodSelectorProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <FormField label={label} description={description} error={error}>
      <Stack gap="sm">
        <select
          aria-label={typeof label === 'string' ? label : 'Reporting period'}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.currentTarget.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Group gap="xs" wrap="wrap">
          {timezone ? <Badge variant="outline" color="gray">Timezone: {timezone}</Badge> : null}
          {filtered ? <Badge variant="light" color="blue">Filtered</Badge> : null}
          {stale ? <Badge variant="light" color="orange">Stale data</Badge> : null}
          {scope ? <Badge variant="outline" color="gray">{scope}</Badge> : null}
        </Group>

        {selectedOption?.description ? (
          <Text size="sm" c="dimmed">
            {selectedOption.description}
          </Text>
        ) : null}

        {helperText ? (
          <Text size="sm" c="dimmed">
            {helperText}
          </Text>
        ) : null}
      </Stack>
    </FormField>
  );
}
