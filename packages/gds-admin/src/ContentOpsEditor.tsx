import type { ReactNode } from 'react';
import { Stack } from '@mantine/core';
import { EditorScaffold } from './EditorScaffold';

export interface ContentOpsEditorProps {
  header?: ReactNode;
  status?: ReactNode;
  sections: ReactNode;
  actionBar?: ReactNode;
  preview?: ReactNode;
  settings?: ReactNode;
}

export function ContentOpsEditor({
  header,
  status,
  sections,
  actionBar,
  preview,
  settings,
}: ContentOpsEditorProps) {
  return (
    <Stack gap="lg">
      {header}
      {status}
      <EditorScaffold
        form={<Stack gap="lg">{sections}{actionBar}</Stack>}
        preview={preview}
        settings={settings}
      />
    </Stack>
  );
}
