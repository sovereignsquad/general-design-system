import type { ReactNode } from 'react';
import { Badge, Button, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { FormField } from './FormField';

export interface MediaFieldProps {
  label: ReactNode;
  description?: ReactNode;
  value?: string | null;
  preview?: ReactNode;
  uploadControl?: ReactNode;
  urlInput?: ReactNode;
  helpText?: ReactNode;
  policyText?: ReactNode;
  error?: ReactNode;
  onRemove?: () => void;
  onReset?: () => void;
  removeAction?: ReactNode;
  resetAction?: ReactNode;
  statusAction?: ReactNode;
  state?: 'empty' | 'selected' | 'saved' | 'invalid' | 'uploading';
}

const stateLabels: Record<NonNullable<MediaFieldProps['state']>, { label: string; color: string }> = {
  empty: { label: 'Empty', color: 'gray' },
  selected: { label: 'Selected', color: 'blue' },
  saved: { label: 'Saved', color: 'teal' },
  invalid: { label: 'Needs attention', color: 'red' },
  uploading: { label: 'Uploading', color: 'violet' },
};

export function MediaField({
  label,
  description,
  value,
  preview,
  uploadControl,
  urlInput,
  helpText,
  policyText,
  error,
  onRemove,
  onReset,
  removeAction,
  resetAction,
  statusAction,
  state = 'empty',
}: MediaFieldProps) {
  const stateBadge = stateLabels[state];
  const resolvedRemoveAction =
    removeAction ?? (onRemove ? <Button type="button" variant="light" color="red" onClick={onRemove}>Remove</Button> : null);
  const resolvedResetAction =
    resetAction ?? (onReset ? <Button type="button" variant="default" onClick={onReset}>Reset</Button> : null);

  return (
    <FormField
      label={label}
      description={description}
      error={error}
    >
      <Paper withBorder radius="xl" p="lg">
        <Stack gap="md">
          <Group justify="flex-end" align="center" gap="sm">
            <Group gap="xs" justify="flex-end">
              <Badge variant="light" color={stateBadge.color}>
                {stateBadge.label}
              </Badge>
              {statusAction}
            </Group>
          </Group>

          {preview ? preview : null}

          {(uploadControl || urlInput) ? (
            <>
              <Divider />
              <Stack gap="sm">
                {uploadControl}
                {urlInput}
              </Stack>
            </>
          ) : null}

          {value ? (
            <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>
              {value}
            </Text>
          ) : null}

          {helpText ? (
            <Text size="sm" c="dimmed">
              {helpText}
            </Text>
          ) : null}

          {policyText ? (
            <Text size="sm" c={error ? 'red.7' : 'dimmed'}>
              {policyText}
            </Text>
          ) : null}

          {typeof error !== 'string' && error ? error : null}

          {(resolvedRemoveAction || resolvedResetAction) ? (
            <Group gap="sm">
              {resolvedResetAction}
              {resolvedRemoveAction}
            </Group>
          ) : null}
        </Stack>
      </Paper>
    </FormField>
  );
}
