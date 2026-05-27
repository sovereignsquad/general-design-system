import type { ReactNode } from 'react';
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ActionBarProps } from './ActionBar';
import { ActionBar } from './ActionBar';
import { EmptyState } from './EmptyState';
import { StateBlock } from './StateBlock';
import type { SemanticActionId } from './vocabulary';

export type PublicFlowStageStatus = 'idle' | 'loading' | 'ready' | 'error' | 'complete';
export type PublicFlowActionPriority = 'primary' | 'secondary' | 'tertiary';

export type PublicFlowAction = {
  action: SemanticActionId;
  priority: PublicFlowActionPriority;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

export type PublicFlowStage = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status: PublicFlowStageStatus;
  body?: ReactNode;
  actions?: PublicFlowAction[];
  aside?: ReactNode;
  notice?: ReactNode;
};

export interface PublicFlowShellProps {
  stage: PublicFlowStage;
  eyebrow?: ReactNode;
  exitAction?: ReactNode;
  hardwareSurface?: ReactNode;
  emptyState?: ReactNode;
  errorState?: ReactNode;
}

const stageTone: Record<PublicFlowStageStatus, { label: string; color: string }> = {
  idle: { label: 'Idle', color: 'gray' },
  loading: { label: 'Loading', color: 'blue' },
  ready: { label: 'Ready', color: 'teal' },
  error: { label: 'Error', color: 'red' },
  complete: { label: 'Complete', color: 'teal' },
};

function toActionBar(actions: PublicFlowAction[] = []): ActionBarProps | undefined {
  if (!actions.length) {
    return undefined;
  }

  const ordered = [...actions].sort((left, right) => {
    const rank = { primary: 0, secondary: 1, tertiary: 2 };
    return rank[left.priority] - rank[right.priority];
  });

  const primary = ordered.find((action) => action.priority === 'primary');
  const secondary = ordered.filter((action) => action.priority === 'secondary');
  const tertiary = ordered.filter((action) => action.priority === 'tertiary');

  return {
    primary: primary
      ? {
          action: primary.action,
          disabled: primary.disabled,
          loading: primary.loading,
          onClick: primary.onClick,
        }
      : undefined,
    secondary: secondary.map((action) => ({
      action: action.action,
      disabled: action.disabled,
      loading: action.loading,
      onClick: action.onClick,
    })),
    tertiary: tertiary.map((action) => ({
      action: action.action,
      disabled: action.disabled,
      loading: action.loading,
      onClick: action.onClick,
    })),
  };
}

export function PublicFlowShell({
  stage,
  eyebrow,
  exitAction,
  hardwareSurface,
  emptyState,
  errorState,
}: PublicFlowShellProps) {
  const tone = stageTone[stage.status];
  const actionBar = toActionBar(stage.actions);

  let body = stage.body;
  if (stage.status === 'loading') {
    body = (
      <StateBlock
        variant="loading"
        title="Preparing flow"
        description={stage.description ?? 'The current public flow stage is still loading.'}
      />
    );
  } else if (stage.status === 'error') {
    body = errorState ?? (
      <StateBlock
        variant="error"
        title="Flow unavailable"
        description={stage.description ?? 'This public flow could not continue safely.'}
      />
    );
  } else if (!stage.body && !hardwareSurface) {
    body = emptyState ?? (
      <EmptyState
        title="No stage content available"
        description="Add the current flow stage body or a bounded hardware surface to render this contract."
      />
    );
  }

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={4}>
            {eyebrow ? (
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                {eyebrow}
              </Text>
            ) : null}
            <Group gap="sm" wrap="wrap">
              <Title order={2}>{stage.title}</Title>
              <Badge variant="light" color={tone.color}>
                {tone.label}
              </Badge>
            </Group>
            {stage.description ? (
              <Text size="sm" c="dimmed">
                {stage.description}
              </Text>
            ) : null}
          </Stack>
          {exitAction}
        </Group>

        {stage.notice ? (
          <Text size="sm" c="dimmed">
            {stage.notice}
          </Text>
        ) : null}

        {body}
        {hardwareSurface}
        {stage.aside}
        {actionBar ? <ActionBar {...actionBar} /> : null}
      </Stack>
    </Paper>
  );
}
