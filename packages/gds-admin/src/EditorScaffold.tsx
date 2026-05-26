import type { ReactNode } from 'react';
import { Grid, Paper, Stack } from '@mantine/core';

export interface EditorScaffoldProps {
  header?: ReactNode;
  context?: ReactNode;
  form: ReactNode;
  preview?: ReactNode;
  settings?: ReactNode;
  footer?: ReactNode;
  stickyFooter?: boolean;
}

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
      <Grid gutter="lg" align="start">
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
