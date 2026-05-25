import type { ReactNode } from 'react';
import { Box, Stack, Text } from '@mantine/core';

export interface FormFieldProps {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

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
