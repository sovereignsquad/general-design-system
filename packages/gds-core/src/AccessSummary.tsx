import type { ReactNode } from 'react';
import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';

/** Props for {@link AccessSummary}. */
export interface AccessSummaryProps {
  title: string;
  roles: string[];
  scope?: string;
  /** Convenience flag that resolves to the `blocked` state when no explicit `state` is given. */
  blocked?: boolean;
  /** Explicit access state; takes precedence over `blocked`. */
  state?: 'allowed' | 'blocked' | 'forbidden' | 'expired' | 'permission-limited';
  owner?: ReactNode;
  /** Guidance on regaining access; styled as an error hint when access is not allowed. */
  recoveryHint?: ReactNode;
  description?: ReactNode;
}

const accessStateMeta: Record<NonNullable<AccessSummaryProps['state']>, { label: string; color: string }> = {
  allowed: { label: 'Allowed', color: 'teal' },
  blocked: { label: 'Blocked', color: 'red' },
  forbidden: { label: 'Forbidden', color: 'red' },
  expired: { label: 'Expired', color: 'orange' },
  'permission-limited': { label: 'Permission limited', color: 'grape' },
};

/** Card summarizing a resource's access state, roles, scope, owner, and recovery hint, with a state-colored status badge. */
export function AccessSummary({ title, roles, scope, blocked = false, state, owner, recoveryHint, description }: AccessSummaryProps) {
  const resolvedState = state ?? (blocked ? 'blocked' : 'allowed');
  const meta = accessStateMeta[resolvedState];

  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={4}>{title}</Title>
          <Badge color={meta.color} variant="light">
            {meta.label}
          </Badge>
        </Group>
        <Group gap="xs">
          {roles.map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </Group>
        {scope ? (
          <Text size="sm" c="dimmed">
            Scope: {scope}
          </Text>
        ) : null}
        {owner ? (
          <Text size="sm" c="dimmed">
            Owner: {owner}
          </Text>
        ) : null}
        {recoveryHint ? (
          <Text size="sm" c={resolvedState === 'allowed' ? 'dimmed' : 'red.7'}>
            {recoveryHint}
          </Text>
        ) : null}
        {description ? <Text size="sm">{description}</Text> : null}
      </Stack>
    </Card>
  );
}
