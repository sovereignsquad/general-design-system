import type { ReactNode } from 'react';
import { Box, Stack, Text } from '@mantine/core';

export interface FormFieldProps {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

/**
 * Governed label/description/error wrapper for a single form control. Renders the
 * control (passed as `children`) inside a `<label>` with consistent GDS typography
 * for the label, an optional helper description, and inline error text. Use it to
 * give any input a uniform field anatomy instead of hand-assembling label/help/error
 * markup per form.
 */
export function FormField({ label, description, error, children }: FormFieldProps) {
  return (
    <Box component="label">
      <Stack gap={4}>
        {typeof label === 'string' ? (
          <Text size="xs" fw={600} c="dimmed">
            {label}
          </Text>
        ) : (
          label
        )}
        {description
          ? typeof description === 'string'
            ? (
              <Text size="xs" c="dimmed">
                {description}
              </Text>
              )
            : description
          : null}
        {children}
        {error
          ? typeof error === 'string'
            ? (
              <Text size="xs" c="red.7">
                {error}
              </Text>
              )
            : error
          : null}
      </Stack>
    </Box>
  );
}
