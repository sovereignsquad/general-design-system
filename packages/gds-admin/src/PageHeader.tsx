import type { ReactNode } from 'react';
import { ActionIcon, Breadcrumbs, Group, Menu, Title, Text, Box, Stack } from '@mantine/core';
import { GdsIcons } from '@doneisbetter/gds-core';

export interface PageHeaderOverflowAction {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
  color?: string;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  breadcrumbs?: ReactNode[];
  status?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  overflowActions?: PageHeaderOverflowAction[];
}

export function PageHeader({
  title,
  description,
  subtitle,
  eyebrow,
  breadcrumbs,
  status,
  primaryAction,
  secondaryActions,
  overflowActions = [],
}: PageHeaderProps) {
  return (
    <Stack gap="sm" mb="xl">
      {breadcrumbs?.length ? <Breadcrumbs>{breadcrumbs}</Breadcrumbs> : null}
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Box style={{ minWidth: 0, flex: 1 }}>
          {eyebrow ? (
            <Text c="dimmed" size="sm" fw={700} mb={4}>
              {eyebrow}
            </Text>
          ) : null}
          <Title order={1}>{title}</Title>
          {subtitle ? (
            <Text c="dimmed" mt="xs" size="sm">
              {subtitle}
            </Text>
          ) : null}
          {description && (
            <Text c="dimmed" mt="xs" size="lg">
              {description}
            </Text>
          )}
          {status ? <Group mt="sm" gap="sm">{status}</Group> : null}
        </Box>
        {(secondaryActions || primaryAction || overflowActions.length) && (
          <Group wrap="wrap" justify="flex-end">
            {secondaryActions}
            {primaryAction}
            {overflowActions.length ? (
              <Menu shadow="md" width={220} withinPortal>
                <Menu.Target>
                  <ActionIcon variant="default" size="lg" aria-label="More actions">
                    <GdsIcons.Menu size="1rem" />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {overflowActions.map((action, index) => (
                    <Menu.Item
                      key={`${String(action.label)}-${index}`}
                      component={action.href ? 'a' : 'button'}
                      href={action.href}
                      onClick={action.onClick}
                      color={action.color}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            ) : null}
          </Group>
        )}
      </Group>
    </Stack>
  );
}
