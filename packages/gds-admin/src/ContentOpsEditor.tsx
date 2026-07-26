import type { ReactNode } from 'react';
import { Stack } from '@mantine/core';
import { EditorScaffold } from './EditorScaffold';

/** Props for {@link ContentOpsEditor}. */
export interface ContentOpsEditorProps {
  /** Header block (e.g. a page header) rendered first. */
  header?: ReactNode;
  /** Context block shown above the form in the scaffold. */
  context?: ReactNode;
  /** Status block rendered under the header. */
  status?: ReactNode;
  /** Form sections; stacked as the scaffold's main form column. */
  sections: ReactNode;
  /** Action bar rendered as the scaffold's sticky footer. */
  actionBar?: ReactNode;
  /** Preview panel in the scaffold's side column. */
  preview?: ReactNode;
  /** Settings panel in the scaffold's side column. */
  settings?: ReactNode;
}

/**
 * Content-ops editor layout: composes an {@link EditorScaffold} with a sticky
 * footer, wiring the section stack into the form column and the action bar into
 * the footer.
 */
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
