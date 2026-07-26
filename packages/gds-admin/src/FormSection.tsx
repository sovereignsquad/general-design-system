import type { ReactNode } from 'react';
import { Box, Title, Text, Stack, Divider } from '@mantine/core';

/** Props for {@link FormSection}. */
export interface FormSectionProps {
  /** Section heading (rendered as an `h4`). */
  title: string;
  /** Supporting description under the heading. */
  description?: string;
  /** Section content, stacked with consistent spacing. */
  children: ReactNode;
  /** Render a trailing divider below the section; defaults to `true`. */
  withDivider?: boolean;
}

/** Titled form section: a heading, optional description, a stacked field group, and an optional trailing divider. */
export function FormSection({ title, description, children, withDivider = true }: FormSectionProps) {
  return (
    <Box mb="xl">
      <Box mb="md">
        <Title order={4}>{title}</Title>
        {description && <Text c="dimmed" size="sm">{description}</Text>}
      </Box>
      <Stack gap="md">
        {children}
      </Stack>
      {withDivider && <Divider my="xl" />}
    </Box>
  );
}
