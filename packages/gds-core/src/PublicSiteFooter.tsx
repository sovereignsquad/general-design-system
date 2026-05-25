import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';

export interface PublicSiteFooterProps {
  children?: ReactNode;
  meta?: ReactNode;
}

export function PublicSiteFooter({ children, meta }: PublicSiteFooterProps) {
  return (
    <Stack component="footer" gap="xs">
      {children ? <Text size="sm">{children}</Text> : null}
      {meta ? (
        <Group gap="sm">
          <Text size="xs" c="dimmed">
            {meta}
          </Text>
        </Group>
      ) : null}
    </Stack>
  );
}
