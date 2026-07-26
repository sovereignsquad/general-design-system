import type { ReactNode } from 'react';
import { Grid, Paper, Stack } from '@mantine/core';

/** Props for {@link EditorScaffold}. */
export interface EditorScaffoldProps {
  /** Header block rendered above the grid. */
  header?: ReactNode;
  /** Context block rendered above the grid, under the header. */
  context?: ReactNode;
  /** Main form column content. */
  form: ReactNode;
  /** Preview panel in the side column; widens the form column when absent. */
  preview?: ReactNode;
  /** Settings panel in the side column. */
  settings?: ReactNode;
  /** Footer content rendered below the grid. */
  footer?: ReactNode;
  /** Render the footer in a sticky bottom-anchored paper. */
  stickyFooter?: boolean;
}

/**
 * Two-column editor layout: a main form column beside an optional
 * preview/settings side column, with an optional (optionally sticky) footer.
 * The form column widens when no preview is supplied.
 */
export function EditorScaffold({
  header,
  context,
  form,
  preview,
  settings,
  footer,
  stickyFooter = false,
}: EditorScaffoldProps) {
  return (
    <Stack gap="lg">
      {header}
      {context}
      <Grid style={{ gap: 'var(--mantine-spacing-lg)', alignItems: 'start' }}>
        <Grid.Col span={{ base: 12, md: preview ? 7 : 8 }}>
          {form}
        </Grid.Col>
        {(preview || settings) ? (
          <Grid.Col span={{ base: 12, md: preview ? 5 : 4 }}>
            <Stack gap="lg">
              {preview}
              {settings}
            </Stack>
          </Grid.Col>
        ) : null}
      </Grid>
      {footer ? (
        stickyFooter ? (
          <Paper
            withBorder
            radius="xl"
            p="md"
            style={{
              position: 'sticky',
              bottom: '1rem',
              zIndex: 10,
            }}
          >
            {footer}
          </Paper>
        ) : (
          footer
        )
      ) : null}
    </Stack>
  );
}
