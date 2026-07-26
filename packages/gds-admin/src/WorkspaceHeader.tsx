import type { ReactNode } from 'react';
import { Breadcrumbs, Group, Stack, Text, Title } from '@mantine/core';

/** Props for {@link WorkspaceHeader}. */
export interface WorkspaceHeaderProps {
  /** Breadcrumb trail rendered above the header. */
  breadcrumbs?: ReactNode[];
  /** Uppercased eyebrow label above the title. */
  eyebrow?: string;
  /** Workspace title (rendered as an `h1`). */
  title: string;
  /** Supporting description under the title. */
  description?: string;
  /** Primary action rendered on the trailing edge. */
  primaryAction?: ReactNode;
  /** Secondary actions rendered before the primary action. */
  secondaryActions?: ReactNode;
}

/**
 * Governed workspace header: an optional breadcrumb trail and eyebrow above the
 * title/description, with secondary and primary actions on the trailing edge.
 */
export function WorkspaceHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
}: WorkspaceHeaderProps) {
  return (
    <Stack gap="sm" mb="xl">
      {breadcrumbs?.length ? <Breadcrumbs>{breadcrumbs}</Breadcrumbs> : null}
      {eyebrow ? (
        <Text size="sm" fw={700} c="dimmed" tt="uppercase">
          {eyebrow}
        </Text>
      ) : null}
      <Group justify="space-between" align="flex-start" gap="md">
        <Stack gap={6}>
          <Title order={1}>{title}</Title>
          {description ? (
            <Text c="dimmed" maw={640}>
              {description}
            </Text>
          ) : null}
        </Stack>
        <Group gap="sm">
          {secondaryActions}
          {primaryAction}
        </Group>
      </Group>
    </Stack>
  );
}
