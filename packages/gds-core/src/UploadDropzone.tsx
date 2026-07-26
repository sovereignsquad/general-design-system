'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Badge, Box, Button, Group, Progress, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';

/** Visual/interaction state of an `UploadDropzone`. */
export type UploadDropzoneState =
  | 'idle'
  | 'drag-active'
  | 'selected'
  | 'upload-pending'
  | 'upload-failed'
  | 'unsupported-type'
  | 'too-large'
  | 'removed'
  | 'readonly';

/** Props for `UploadDropzone`. */
export interface UploadDropzoneProps {
  title: string;
  description?: string;
  /** Called with the chosen files on drop or file-picker selection. */
  onFilesSelected?: (files: File[]) => void;
  /** `accept` attribute forwarded to the underlying file input. */
  accept?: string;
  /** Badge summarizing the accepted file types. */
  acceptedTypesLabel?: string;
  /** Badge summarizing the maximum file size. */
  maxSizeLabel?: string;
  /** Allows selecting multiple files; defaults to true. */
  multiple?: boolean;
  /** Label for the choose-files button; defaults to "Choose files". */
  actionLabel?: string;
  /** Layout density; `panel` (default) or condensed `inline`. */
  mode?: 'panel' | 'inline';
  /** Controlled dropzone state; defaults to `idle`. */
  state?: UploadDropzoneState;
  /** Names of already-selected files, listed below the prompt. */
  selectedFiles?: string[];
  /** Error message shown in the alert region. */
  error?: string;
  /** Policy or help text shown near the actions. */
  policyText?: string;
  /** Upload progress (0–100), shown while in the `upload-pending` state. */
  progressValue?: number;
  /** `id` applied to the file input. */
  inputId?: string;
  /** `aria-describedby` applied to the file input. */
  describedBy?: string;
  /** Forces the invalid/error styling regardless of `state`. */
  invalid?: boolean;
  /** Marks the file input as required. */
  required?: boolean;
  /** Retry control shown alongside the choose-files button. */
  retryAction?: ReactNode;
  /** Remove control shown alongside the choose-files button. */
  removeAction?: ReactNode;
  /** Renders a non-interactive, disabled dropzone; defaults to false. */
  readonly?: boolean;
}

/**
 * Accessible drag-and-drop upload zone with governed states (idle, drag-active,
 * selected, upload-pending with a progress bar, and error variants), an
 * accepted-types / max-size summary, and optional retry/remove actions. Forwards
 * selected files via `onFilesSelected`; file transport is owned by the caller.
 */
export function UploadDropzone({
  title,
  description,
  onFilesSelected,
  accept,
  acceptedTypesLabel,
  maxSizeLabel,
  multiple = true,
  actionLabel = 'Choose files',
  mode = 'panel',
  state = 'idle',
  selectedFiles = [],
  error,
  policyText,
  progressValue,
  inputId,
  describedBy,
  invalid,
  required,
  retryAction,
  removeAction,
  readonly = false,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const UploadIcon = GdsIcons.Upload;
  const effectiveState = readonly ? 'readonly' : dragging ? 'drag-active' : state;
  const isDisabled = readonly || effectiveState === 'upload-pending';
  const isError = invalid || ['upload-failed', 'unsupported-type', 'too-large'].includes(effectiveState);
  const normalizedProgress = typeof progressValue === 'number' ? Math.max(0, Math.min(100, progressValue)) : undefined;

  const forwardFiles = (files: FileList | null) => {
    if (isDisabled || !files?.length || !onFilesSelected) {
      return;
    }
    onFilesSelected(Array.from(files));
  };

  return (
    <Box
      onDragOver={(event) => {
        event.preventDefault();
        if (isDisabled) {
          return;
        }
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        forwardFiles(event.dataTransfer.files);
      }}
      p={mode === 'inline' ? 'md' : 'xl'}
      style={{
        border: `1px dashed var(${effectiveState === 'drag-active' ? '--mantine-color-violet-6' : isError ? '--mantine-color-red-6' : '--mantine-color-default-border'})`,
        borderRadius: 'var(--mantine-radius-lg)',
        background: effectiveState === 'drag-active' ? 'var(--mantine-color-violet-light)' : 'transparent',
      }}
      aria-invalid={isError || undefined}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        required={required}
        aria-label={title}
        aria-describedby={describedBy}
        aria-invalid={isError || undefined}
        disabled={isDisabled}
        onChange={(event) => forwardFiles(event.currentTarget.files)}
      />
      <Stack align={mode === 'inline' ? 'flex-start' : 'center'} ta={mode === 'inline' ? 'left' : 'center'} gap="sm">
        <UploadIcon size="1.5rem" />
        <Badge variant="light" color={isError ? 'red' : effectiveState === 'selected' ? 'blue' : effectiveState === 'upload-pending' ? 'violet' : 'gray'}>
          {effectiveState.replace('-', ' ')}
        </Badge>
        <Text fw={600}>{title}</Text>
        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}
        {(acceptedTypesLabel || maxSizeLabel) ? (
          <Group gap="xs" justify={mode === 'inline' ? 'flex-start' : 'center'}>
            {acceptedTypesLabel ? <Badge variant="outline" color="gray">{acceptedTypesLabel}</Badge> : null}
            {maxSizeLabel ? <Badge variant="outline" color="gray">{maxSizeLabel}</Badge> : null}
          </Group>
        ) : null}
        {selectedFiles.length ? (
          <Text size="sm">
            Selected: {selectedFiles.join(', ')}
          </Text>
        ) : null}
        {effectiveState === 'upload-pending' && normalizedProgress !== undefined ? (
          <Box w="100%" maw={360}>
            <Progress value={normalizedProgress} aria-label={`${title} upload progress`} />
            <Text size="xs" c="dimmed" mt={4}>
              {Math.round(normalizedProgress)}% uploaded
            </Text>
          </Box>
        ) : null}
        {policyText ? (
          <Text size="sm" c={isError ? 'red.7' : 'dimmed'}>
            {policyText}
          </Text>
        ) : null}
        {error ? (
          <Text size="sm" c="red.7" role="alert">
            {error}
          </Text>
        ) : null}
        <Group>
          <Button variant="light" onClick={() => inputRef.current?.click()} disabled={isDisabled}>
            {actionLabel}
          </Button>
          {retryAction}
          {removeAction}
        </Group>
      </Stack>
    </Box>
  );
}
