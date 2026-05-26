import type { ReactNode } from 'react';
import { Stack } from '@mantine/core';
import { EditorScaffold } from './EditorScaffold';

export interface ContentOpsEditorProps {
  header?: ReactNode;
  context?: ReactNode;
  status?: ReactNode;
  sections: ReactNode;
  actionBar?: ReactNode;
  preview?: ReactNode;
  settings?: ReactNode;
}

export function ContentOpsEditor({
  header,
  context,
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
        context={context}
        form={<Stack gap="lg">{sections}</Stack>}
        preview={preview}
        settings={settings}
        footer={actionBar}
        stickyFooter
      />
    </Stack>
  );
}
