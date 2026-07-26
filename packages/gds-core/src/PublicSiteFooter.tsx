import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';

/** Props for {@link PublicSiteFooter}. */
export interface PublicSiteFooterProps {
  children?: ReactNode;
  /** Secondary meta line (e.g. copyright), shown dimmed below the main content. */
  meta?: ReactNode;
}

/** Minimal public `<footer>` with a primary content line and an optional dimmed meta line. */
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
