import type { ReactNode } from 'react';
import { Badge, Button, Divider, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { FormField } from './FormField';

/** Lifecycle / validation state of a media field, driving its status badge. */
export type MediaFieldState =
  | 'empty'
  | 'drag-active'
  | 'selected'
  | 'preview-loading'
  | 'uploading'
  | 'upload-failed'
  | 'unsupported-type'
  | 'too-large'
  | 'removed'
  | 'saved'
  | 'invalid'
  | 'readonly';

/** Props for {@link MediaField}. */
export interface MediaFieldProps {
  label: ReactNode;
  description?: ReactNode;
  /** Current media reference (e.g. a URL), shown as truncated text. */
  value?: string | null;
  /** Preview element for the selected media. */
  preview?: ReactNode;
  /** Upload control slot (e.g. a file input/dropzone), hidden in readonly mode. */
  uploadControl?: ReactNode;
  /** URL input slot for referencing remote media, hidden in readonly mode. */
  urlInput?: ReactNode;
  helpText?: ReactNode;
  /** Policy/constraints copy, shown in red when `error` is set. */
  policyText?: ReactNode;
  error?: ReactNode;
  /** Retry action shown in the actions row (e.g. after an upload failure). */
  retryAction?: ReactNode;
  /** Action to replace the current media. */
  replaceAction?: ReactNode;
  /** Called by the default Remove button; ignored in readonly mode. */
  onRemove?: () => void;
  /** Called by the default Reset button; ignored in readonly mode. */
  onReset?: () => void;
  /** Custom remove action, overriding the default button built from `onRemove`. */
  removeAction?: ReactNode;
  /** Custom reset action, overriding the default button built from `onReset`. */
  resetAction?: ReactNode;
  /** Extra action rendered next to the status badge. */
  statusAction?: ReactNode;
  /** Explicit field state. Defaults to "empty"; forced to "readonly" when `readonly`. */
  state?: MediaFieldState;
  /** Accepted file types, shown as an outline badge. */
  acceptedTypes?: ReactNode;
  /** Maximum size hint, shown as an outline badge. */
  maxSize?: ReactNode;
  /** Upload progress percentage (0–100); renders a progress bar when provided. */
  progress?: number;
  /** Read-only mode: hides upload/URL controls and the default remove/reset buttons. */
  readonly?: boolean;
  /** Layout for the upload/URL controls. Defaults to "stacked". */
  mode?: 'stacked' | 'split';
}

const stateLabels: Record<NonNullable<MediaFieldProps['state']>, { label: string; color: string }> = {
  empty: { label: 'Empty', color: 'gray' },
  'drag-active': { label: 'Drop to select', color: 'violet' },
  selected: { label: 'Selected', color: 'blue' },
  'preview-loading': { label: 'Preview loading', color: 'violet' },
  saved: { label: 'Saved', color: 'teal' },
  invalid: { label: 'Needs attention', color: 'red' },
  uploading: { label: 'Uploading', color: 'violet' },
  'upload-failed': { label: 'Upload failed', color: 'red' },
  'unsupported-type': { label: 'Unsupported type', color: 'red' },
  'too-large': { label: 'Too large', color: 'red' },
  removed: { label: 'Removed', color: 'gray' },
  readonly: { label: 'Read only', color: 'gray' },
};

/**
 * Governed media upload/preview form field: wraps {@link FormField} and shows the
 * current state badge, preview, upload progress, upload/URL controls, accepted-type
 * and size hints, help/policy copy, and replace/remove/reset/retry actions.
 */
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
  retryAction,
  replaceAction,
  onRemove,
  onReset,
  removeAction,
  resetAction,
  statusAction,
  acceptedTypes,
  maxSize,
  progress,
  readonly = false,
  state = 'empty',
  mode = 'stacked',
}: MediaFieldProps) {
  const resolvedState = readonly ? 'readonly' : state;
  const stateBadge = stateLabels[resolvedState];
  const resolvedRemoveAction =
    removeAction ?? (!readonly && onRemove ? <Button type="button" variant="light" color="red" onClick={onRemove}>Remove</Button> : null);
  const resolvedResetAction =
    resetAction ?? (!readonly && onReset ? <Button type="button" variant="default" onClick={onReset}>Reset</Button> : null);
  const boundedProgress = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : undefined;

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

          {typeof boundedProgress === 'number' ? (
            <Stack gap={4}>
              <Progress value={boundedProgress} aria-label="Upload progress" />
              <Text size="xs" c="dimmed">
                {boundedProgress}% complete
              </Text>
            </Stack>
          ) : null}

          {(uploadControl || urlInput) && !readonly ? (
            <>
              <Divider />
              <Stack gap="sm" style={mode === 'split' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' } : undefined}>
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

          {(acceptedTypes || maxSize) ? (
            <Group gap="xs" wrap="wrap">
              {acceptedTypes ? <Badge variant="outline" color="gray">{acceptedTypes}</Badge> : null}
              {maxSize ? <Badge variant="outline" color="gray">{maxSize}</Badge> : null}
            </Group>
          ) : null}

          {policyText ? (
            <Text size="sm" c={error ? 'red.7' : 'dimmed'}>
              {policyText}
            </Text>
          ) : null}

          {typeof error !== 'string' && error ? error : null}

          {(replaceAction || resolvedRemoveAction || resolvedResetAction || retryAction) ? (
            <Group gap="sm">
              {replaceAction}
              {resolvedResetAction}
              {retryAction}
              {resolvedRemoveAction}
            </Group>
          ) : null}
        </Stack>
      </Paper>
    </FormField>
  );
}
