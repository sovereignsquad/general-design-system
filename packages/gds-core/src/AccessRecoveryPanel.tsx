'use client';

import type { ReactNode } from 'react';
import { Group } from '@mantine/core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { SemanticButton } from './SemanticButton';
import { StateBlock } from './StateBlock';
import type { SemanticAction } from './vocabulary';

export type AccessRecoveryState =
  | 'unauthenticated'
  | 'expired-session'
  | 'timeout'
  | 'forbidden'
  | 'missing'
  | 'unavailable';

export interface AccessRecoveryAction {
  action: SemanticAction;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'default';
}

export interface AccessRecoveryPanelProps {
  state: AccessRecoveryState;
  title?: string;
  description?: ReactNode;
  primaryAction?: AccessRecoveryAction | null;
  secondaryAction?: AccessRecoveryAction | null;
  tertiaryAction?: AccessRecoveryAction | null;
  onRetry?: () => void;
  onSignIn?: () => void;
  onBack?: () => void;
  supportAction?: AccessRecoveryAction | null;
  compact?: boolean;
}

type AccessRecoveryCopy = {
  title: string;
  description: string;
};

const stateBlockVariantByState: Record<AccessRecoveryState, 'permission' | 'error' | 'info'> = {
  unauthenticated: 'permission',
  'expired-session': 'info',
  timeout: 'error',
  forbidden: 'permission',
  missing: 'error',
  unavailable: 'error',
};

const defaultCopyByState: Record<AccessRecoveryState, AccessRecoveryCopy> = {
  unauthenticated: {
    title: 'Sign in required',
    description: 'Please sign in to continue to this content.',
  },
  'expired-session': {
    title: 'Session expired',
    description: 'Sign in again or retry to continue where you left off.',
  },
  timeout: {
    title: 'Request timed out',
    description: 'The recovery action took too long. Retry or choose a safe destination.',
  },
  forbidden: {
    title: 'You do not have access',
    description: 'This content is outside your current permissions or scope.',
  },
  missing: {
    title: 'Content not found',
    description: 'The resource may have moved, been deleted, or never existed in this scope.',
  },
  unavailable: {
    title: 'Content is temporarily unavailable',
    description: 'Try again in a moment or return to a safe destination.',
  },
};

function defaultActionsForState(
  state: AccessRecoveryState,
  {
    onRetry,
    onSignIn,
    onBack,
    supportAction,
  }: Pick<AccessRecoveryPanelProps, 'onRetry' | 'onSignIn' | 'onBack' | 'supportAction'>,
) {
  const signInAction = onSignIn ? { action: 'login' as const, onClick: onSignIn } : null;
  const retryAction = onRetry
    ? { action: 'refresh' as const, onClick: onRetry, variant: 'light' as const }
    : null;
  const backAction = onBack
    ? { action: 'back' as const, onClick: onBack, variant: 'default' as const }
    : null;

  switch (state) {
    case 'unauthenticated':
      return { primary: signInAction, secondary: backAction, tertiary: supportAction ?? null };
    case 'expired-session':
      return {
        primary: signInAction ?? retryAction,
        secondary: retryAction && signInAction ? retryAction : backAction,
        tertiary: supportAction ?? null,
      };
    case 'timeout':
      return {
        primary: retryAction ?? backAction,
        secondary: retryAction && backAction ? backAction : supportAction ?? null,
        tertiary: retryAction && backAction ? supportAction ?? null : null,
      };
    case 'forbidden':
      return { primary: backAction, secondary: supportAction ?? null, tertiary: null };
    case 'missing':
      return { primary: backAction, secondary: supportAction ?? null, tertiary: null };
    case 'unavailable':
      return {
        primary: retryAction ?? backAction,
        secondary: retryAction && backAction ? backAction : supportAction ?? null,
        tertiary: retryAction && backAction ? supportAction ?? null : null,
      };
  }
}

function ActionGroup({
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: {
  primaryAction: AccessRecoveryAction | null;
  secondaryAction: AccessRecoveryAction | null;
  tertiaryAction: AccessRecoveryAction | null;
}) {
  const actions = [primaryAction, secondaryAction, tertiaryAction].filter(Boolean) as AccessRecoveryAction[];
  if (actions.length === 0) {
    return null;
  }

  return (
    <Group gap="sm" justify="center" wrap="wrap">
      {actions.map((actionConfig, index) => (
        <SemanticButton
          key={`${actionConfig.action}-${index}`}
          action={actionConfig.action}
          onClick={actionConfig.onClick}
          loading={actionConfig.loading}
          disabled={actionConfig.disabled}
          color={actionConfig.color}
          variant={actionConfig.variant ?? (index === 0 ? 'filled' : 'default')}
        />
      ))}
    </Group>
  );
}

export function AccessRecoveryPanel({
  state,
  title,
  description,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  onRetry,
  onSignIn,
  onBack,
  supportAction,
  compact = false,
}: AccessRecoveryPanelProps) {
  const { t } = useGdsTranslation();
  const defaultCopy = defaultCopyByState[state];
  const defaults = defaultActionsForState(state, {
    onRetry,
    onSignIn,
    onBack,
    supportAction,
  });

  return (
    <StateBlock
      variant={stateBlockVariantByState[state]}
      compact={compact}
      title={title ?? t(`gds.accessRecovery.${state}.title`, defaultCopy.title)}
      description={description ?? t(`gds.accessRecovery.${state}.description`, defaultCopy.description)}
      action={
        <ActionGroup
          primaryAction={primaryAction ?? defaults.primary}
          secondaryAction={secondaryAction ?? defaults.secondary}
          tertiaryAction={tertiaryAction ?? defaults.tertiary}
        />
      }
    />
  );
}
