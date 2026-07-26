import type { ReactNode } from 'react';
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ActionBarProps } from './ActionBar';
import { ActionBar } from './ActionBar';
import { EmptyState } from './EmptyState';
import { StateBlock } from './StateBlock';
import type { SemanticActionId } from './vocabulary';

/** Status of a public flow stage, driving its badge tone and body fallbacks. */
export type PublicFlowStageStatus = 'idle' | 'loading' | 'ready' | 'error' | 'complete';
/** Priority slot an action occupies in the flow's action bar. */
export type PublicFlowActionPriority = 'primary' | 'secondary' | 'tertiary';

/** A semantic action rendered in the flow's action bar. */
export type PublicFlowAction = {
  /** Semantic action id resolving to a governed label/icon. */
  action: SemanticActionId;
  /** Action-bar slot for this action. */
  priority: PublicFlowActionPriority;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

/** Describes the current public flow stage: identity, status, body, actions, and notices. */
export type PublicFlowStage = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status: PublicFlowStageStatus;
  /** Main stage content; replaced by loading/error/empty fallbacks based on `status`. */
  body?: ReactNode;
  actions?: PublicFlowAction[];
  /** Supplementary content rendered after the body and hardware surface. */
  aside?: ReactNode;
  /** Optional inline notice text shown above the body. */
  notice?: ReactNode;
};

/** Props for {@link PublicFlowShell}. */
export interface PublicFlowShellProps {
  stage: PublicFlowStage;
  /** Small uppercase label rendered above the stage title. */
  eyebrow?: ReactNode;
  /** Optional exit control rendered in the header. */
  exitAction?: ReactNode;
  /** Bounded hardware surface (e.g. camera view) rendered after the body. */
  hardwareSurface?: ReactNode;
  /** Custom empty-state content when the stage has neither a body nor a hardware surface. */
  emptyState?: ReactNode;
  /** Custom error-state content shown when `status` is `error`. */
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

/**
 * Governed shell for a single public flow stage: renders the stage header and
 * status badge, the body with loading/error/empty fallbacks, an optional bounded
 * hardware surface, and a priority-ordered action bar.
 */
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
