import type { ReactNode } from 'react';
import { ActionIcon, Breadcrumbs, Group, Menu, Title, Text, Box, Stack } from '@mantine/core';
import { GdsIcons } from '@sovereignsquad/gds-core';

/** A single item in the {@link PageHeader} overflow ("More actions") menu. */
export interface PageHeaderOverflowAction {
  /** Menu item label. */
  label: ReactNode;
  /** Click handler; renders the item as a button. */
  onClick?: () => void;
  /** Link target; renders the item as an anchor instead of a button. */
  href?: string;
  /** Mantine color for the menu item. */
  color?: string;
  /** Disable the menu item. */
  disabled?: boolean;
}

/** Props for {@link PageHeader}. */
export interface PageHeaderProps {
  /** Page title (rendered as an `h1`). */
  title: string;
  /** Long-form description under the title. */
  description?: ReactNode;
  /** Short subtitle under the title. */
  subtitle?: ReactNode;
  /** Small eyebrow label above the title. */
  eyebrow?: string;
  /** Breadcrumb trail rendered above the header. */
  breadcrumbs?: ReactNode[];
  /** Status indicators shown under the title text. */
  status?: ReactNode;
  /** Primary action rendered on the trailing edge. */
  primaryAction?: ReactNode;
  /** Secondary actions rendered before the primary action. */
  secondaryActions?: ReactNode;
  /** Actions collapsed into an overflow ("More actions") menu. */
  overflowActions?: PageHeaderOverflowAction[];
}

/**
 * Governed page header: breadcrumbs, eyebrow, title, subtitle/description, and
 * status on the left, with secondary/primary actions and an overflow menu on
 * the trailing edge.
 */
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
        {/*
         * No explicit minWidth: the previous `minWidth: 0` overrode the flex
         * item's default `min-width: auto`, which let this box shrink to
         * near-nothing next to a wide action group instead of the row
         * wrapping — the title text then had no room to lay out even one word
         * and overflowed straight through the actions beside it. Leaving
         * min-width unset restores the platform default (an item won't
         * shrink past its own content's natural minimum), which is exactly
         * what forces the row to wrap once both can't fit — no magic number
         * needed. `overflowWrap` on the Title is a second line of defense for
         * any single word wider than the row itself.
         */}
        <Box style={{ flex: 1 }}>
          {eyebrow ? (
            <Text c="dimmed" size="sm" fw={700} mb={4}>
              {eyebrow}
            </Text>
          ) : null}
          <Title order={1} style={{ overflowWrap: 'break-word' }}>{title}</Title>
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
