'use client';

import type { ReactNode } from 'react';
import { useEffect, useId } from 'react';
import { Badge, Box, Button, Card, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { gdsDevWarnOnce } from '@sovereignsquad/gds-theme';
import { AccessRecoveryPanel } from './AccessRecoveryPanel';
import { StateBlock } from './StateBlock';
import {
  createGdsAccessGateEvent,
  sortGdsAccessGateActions,
  validateGdsAccessGateContract,
  type GdsAccessGateAction,
  type GdsAccessGateActionKind,
  type GdsAccessGateContract,
  type GdsAccessGateEvent,
  type GdsAccessGateReason,
  type GdsAccessGateState,
} from './GdsAccessGateRuntime';

export * from './GdsAccessGateRuntime';

export interface GdsAccessGateProps extends GdsAccessGateContract {
  preview: ReactNode;
  protectedContent: ReactNode | (() => ReactNode);
  lockedPlaceholder?: ReactNode;
  metadata?: Record<string, unknown>;
  onAction?: (action: GdsAccessGateAction) => void | Promise<void>;
  onEvent?: (event: GdsAccessGateEvent) => void;
}

const defaultReasonByState: Partial<Record<GdsAccessGateState, GdsAccessGateReason>> = {
  locked: 'login-required',
  'permission-denied': 'role-required',
  expired: 'session-expired',
  error: 'unknown-error',
};

const defaultActionLabel: Record<GdsAccessGateActionKind, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  subscribe: 'Subscribe',
  'request-access': 'Request access',
  retry: 'Retry',
  back: 'Go back',
};

const semanticActionByGateAction: Record<GdsAccessGateActionKind, 'login' | 'register' | 'launch' | 'help' | 'refresh' | 'back'> = {
  'sign-in': 'login',
  'sign-up': 'register',
  subscribe: 'launch',
  'request-access': 'help',
  retry: 'refresh',
  back: 'back',
};

function recoveryStateForGate(state: GdsAccessGateState, reason?: GdsAccessGateReason) {
  if (reason === 'session-expired' || state === 'expired') {
    return 'expired-session' as const;
  }
  if (reason === 'network-timeout') {
    return 'timeout' as const;
  }
  if (state === 'permission-denied') {
    return 'forbidden' as const;
  }
  if (state === 'error') {
    return 'unavailable' as const;
  }
  return 'unauthenticated' as const;
}

function eventTypeForState(state: GdsAccessGateState, reason?: GdsAccessGateReason): GdsAccessGateEvent['type'] {
  if (state === 'unlocked') {
    return 'gds.access_gate.unlocked';
  }
  if (reason === 'network-timeout') {
    return 'gds.access_gate.timeout';
  }
  if (state === 'error') {
    return 'gds.access_gate.error';
  }
  if (state === 'permission-denied' || state === 'locked' || state === 'expired') {
    return 'gds.access_gate.denied';
  }
  return 'gds.access_gate.view';
}

function renderProtectedContent(content: ReactNode | (() => ReactNode)) {
  return typeof content === 'function' ? (content as () => ReactNode)() : content;
}

/**
 * Renders a public teaser/preview and gates the protected content behind an access
 * `state` (`locked`, `permission-denied`, `expired`, `unlocked`, …), showing
 * governed sign-in/subscribe/request-access/retry recovery actions and — per
 * `protectedContentPolicy` — never evaluating the protected subtree while locked.
 * Use it for paywalls, auth walls, and entitlement gates: drive `state`/`reason`
 * from your own auth/entitlement runtime and handle choices via `onAction`/`onEvent`.
 */
export function GdsAccessGate({
  id,
  state,
  reason = defaultReasonByState[state],
  title,
  description,
  actions = [],
  entitlementLabel,
  teaserLabel = 'Preview',
  protectedContentPolicy = state === 'unlocked' ? undefined : 'never-render-while-locked',
  preview,
  protectedContent,
  lockedPlaceholder,
  metadata,
  onAction,
  onEvent,
}: GdsAccessGateProps) {
  const headingId = useId();
  const sortedActions = sortGdsAccessGateActions(actions);
  const unlocked = state === 'unlocked';
  const softGate = protectedContentPolicy === 'render-degraded-while-locked';
  const loading = state === 'loading-auth' || state === 'unlocking';
  const validation = validateGdsAccessGateContract({
    id,
    state,
    reason,
    title,
    description,
    actions,
    entitlementLabel,
    teaserLabel,
    protectedContentPolicy,
  });

  // Surface contract violations to developers even when no `onEvent` handler is
  // wired — otherwise an invalid state/reason/action combination renders silently
  // wrong with no console signal at all. This is *in addition to* the onEvent
  // path below, not a replacement for it.
  if (validation.length > 0) {
    gdsDevWarnOnce(
      `GdsAccessGate:contract:${validation.join('|')}`,
      `GdsAccessGate received an invalid contract: ${validation.join('; ')} Fix the state/reason/action combination — the gate may render an inconsistent state.`,
    );
  }

  const emit = (event: GdsAccessGateEvent) => onEvent?.(event);

  useEffect(() => {
    if (validation.length > 0) {
      onEvent?.(createGdsAccessGateEvent('gds.access_gate.error', { id, state: 'error', reason: 'unknown-error' }, { validationFailures: validation.length }));
      return;
    }

    onEvent?.(createGdsAccessGateEvent(eventTypeForState(state, reason), { id, state, reason }, metadata));
  }, [id, metadata, onEvent, reason, state, validation.length]);

  const handleAction = (action: GdsAccessGateAction) => {
    emit(createGdsAccessGateEvent('gds.access_gate.action', { id, state, reason }, metadata, action.kind));
    void action.onClick?.();
    void onAction?.(action);
  };

  return (
    <Card
      component="section"
      aria-labelledby={headingId}
      withBorder
      radius="xl"
      p="lg"
      data-gds-access-gate={id}
      data-gds-access-state={state}
    >
      <Stack gap="lg">
        <Group justify="space-between" gap="md" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Badge variant="light">{teaserLabel}</Badge>
            <Title id={headingId} order={3}>{title}</Title>
            <Text c="dimmed">{description}</Text>
          </Stack>
          {entitlementLabel ? <Badge variant={unlocked ? 'filled' : 'outline'}>{entitlementLabel}</Badge> : null}
        </Group>

        <Box data-gds-access-preview>
          {preview}
        </Box>

        {loading ? (
          <StateBlock
            variant="loading"
            title={state === 'unlocking' ? 'Unlocking content' : 'Checking access'}
            description="Protected content is not rendered until the access check resolves."
            compact
          />
        ) : null}

        {unlocked ? (
          <Box data-gds-access-protected>
            {renderProtectedContent(protectedContent)}
          </Box>
        ) : null}

        {!unlocked && softGate && !loading ? (
          <Box data-gds-access-degraded aria-hidden={!unlocked} inert={!unlocked || undefined}>
            {renderProtectedContent(protectedContent)}
          </Box>
        ) : null}

        {!unlocked && !loading ? (
          <Stack gap="md" data-gds-access-locked>
            <Box aria-hidden="true">
              {lockedPlaceholder ?? <Skeleton height={96} radius="lg" />}
            </Box>
            <AccessRecoveryPanel
              state={recoveryStateForGate(state, reason)}
              title={title}
              description={description}
              compact
              primaryAction={sortedActions[0] ? {
                action: semanticActionByGateAction[sortedActions[0].kind],
                onClick: () => handleAction(sortedActions[0]),
                loading: sortedActions[0].loading,
                disabled: sortedActions[0].disabled,
              } : null}
              secondaryAction={sortedActions[1] ? {
                action: semanticActionByGateAction[sortedActions[1].kind],
                onClick: () => handleAction(sortedActions[1]),
                loading: sortedActions[1].loading,
                disabled: sortedActions[1].disabled,
                variant: 'default',
              } : null}
              tertiaryAction={sortedActions[2] ? {
                action: semanticActionByGateAction[sortedActions[2].kind],
                onClick: () => handleAction(sortedActions[2]),
                loading: sortedActions[2].loading,
                disabled: sortedActions[2].disabled,
                variant: 'subtle',
              } : null}
            />
            {sortedActions.some((action) => action.label) ? (
              <Group gap="xs" wrap="wrap">
                {sortedActions.filter((action) => action.label).map((action) => (
                  <Button
                    key={`${id}-${action.kind}-${action.label}`}
                    variant="subtle"
                    size="xs"
                    disabled={action.disabled}
                    loading={action.loading}
                    onClick={() => handleAction(action)}
                  >
                    {action.label ?? defaultActionLabel[action.kind]}
                  </Button>
                ))}
              </Group>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
