'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Badge, Box, Button, Group, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';

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

export interface UploadDropzoneProps {
  title: string;
  description?: string;
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  acceptedTypesLabel?: string;
  maxSizeLabel?: string;
  multiple?: boolean;
  actionLabel?: string;
  mode?: 'panel' | 'inline';
  state?: UploadDropzoneState;
  selectedFiles?: string[];
  error?: string;
  policyText?: string;
  retryAction?: ReactNode;
  removeAction?: ReactNode;
  readonly?: boolean;
}

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
  retryAction,
  removeAction,
  readonly = false,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const UploadIcon = GdsIcons.Upload;
  const effectiveState = readonly ? 'readonly' : dragging ? 'drag-active' : state;
  const isDisabled = readonly || effectiveState === 'upload-pending';
  const isError = ['upload-failed', 'unsupported-type', 'too-large'].includes(effectiveState);

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
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
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
