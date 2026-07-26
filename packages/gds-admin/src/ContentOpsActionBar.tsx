import type { ReactNode } from 'react';
import { Badge, Group, Paper, Text } from '@mantine/core';
import type { ActionBarProps } from '@sovereignsquad/gds-core';
import { ActionBar } from '@sovereignsquad/gds-core';

/** Props for {@link ContentOpsActionBar}. */
export interface ContentOpsActionBarProps {
  /** Whether there are unsaved changes; drives the status badge. */
  dirty?: boolean;
  /** Whether a save is in flight; drives the status badge. */
  saving?: boolean;
  /** Supporting status content shown beside the badge. */
  status?: ReactNode;
  /** GDS `ActionBar` props; when set, replaces the individual action slots. */
  actions?: ActionBarProps;
  /** Primary action element (used when `actions` is not supplied). */
  primaryAction?: ReactNode;
  /** Secondary action element (used when `actions` is not supplied). */
  secondaryAction?: ReactNode;
  /** Tertiary action element (used when `actions` is not supplied). */
  tertiaryAction?: ReactNode;
}

/**
 * Content-ops footer bar showing a Saving/Unsaved changes/Saved status badge
 * alongside either a GDS `ActionBar` or the supplied primary/secondary/tertiary
 * action elements.
 */
export function ContentOpsActionBar({
  dirty = false,
  saving = false,
  status,
  actions,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: ContentOpsActionBarProps) {
  return (
    <Paper withBorder radius="xl" p="md">
      <Group justify="space-between" align="center" gap="md" wrap="wrap">
        <Group gap="sm" wrap="wrap">
          <Badge color={saving ? 'violet' : dirty ? 'yellow' : 'teal'} variant="light">
            {saving ? 'Saving' : dirty ? 'Unsaved changes' : 'Saved'}
          </Badge>
          {status ? (
            typeof status === 'string' ? (
              <Text size="sm" c="dimmed">
                {status}
              </Text>
            ) : (
              status
            )
          ) : null}
        </Group>
        {actions ? (
          <ActionBar {...actions} />
        ) : (
          <Group gap="sm" wrap="wrap">
            {tertiaryAction}
            {secondaryAction}
            {primaryAction}
          </Group>
        )}
      </Group>
    </Paper>
  );
}
