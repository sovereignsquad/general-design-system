'use client';

import { useRef, useState } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { GdsIcons } from './icons';

export interface UploadDropzoneProps {
  title: string;
  description?: string;
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  actionLabel?: string;
  mode?: 'panel' | 'inline';
}

export function UploadDropzone({
  title,
  description,
  onFilesSelected,
  accept,
  multiple = true,
  actionLabel = 'Choose files',
  mode = 'panel',
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const UploadIcon = GdsIcons.Upload;

  const forwardFiles = (files: FileList | null) => {
    if (!files?.length || !onFilesSelected) {
      return;
    }
    onFilesSelected(Array.from(files));
  };

  return (
    <Box
      onDragOver={(event) => {
        event.preventDefault();
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
        border: `1px dashed var(${dragging ? '--mantine-color-violet-6' : '--mantine-color-default-border'})`,
        borderRadius: 'var(--mantine-radius-lg)',
        background: dragging ? 'var(--mantine-color-violet-light)' : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(event) => forwardFiles(event.currentTarget.files)}
      />
      <Stack align={mode === 'inline' ? 'flex-start' : 'center'} ta={mode === 'inline' ? 'left' : 'center'} gap="sm">
        <UploadIcon size="1.5rem" />
        <Text fw={600}>{title}</Text>
        {description ? (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}
        <Group>
          <Button variant="light" onClick={() => inputRef.current?.click()}>
            {actionLabel}
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}
