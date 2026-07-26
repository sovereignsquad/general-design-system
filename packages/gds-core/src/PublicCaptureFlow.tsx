import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';
import { PublicFlowShell, type PublicFlowAction, type PublicFlowStageStatus } from './PublicFlowShell';
import { ShareButtonGroup, type ShareButtonGroupProps } from './ShareButtonGroup';
import { StateBlock } from './StateBlock';

/** Stage of the public capture flow. */
export type PublicCaptureStageId = 'identify' | 'consent' | 'capture' | 'accept' | 'cta' | 'restart' | 'share';
/** Runtime state of the capture hardware and flow. */
export type CaptureRuntimeState = 'idle' | 'loading' | 'ready' | 'permission-denied' | 'hardware-unavailable' | 'error' | 'complete';

/** Props for {@link PublicCaptureFlow}. */
export interface PublicCaptureFlowProps {
  /** Current flow stage; selects default title/description copy. */
  stage: PublicCaptureStageId;
  /** Current runtime state; drives the flow status and permission/hardware recovery bodies. */
  state: CaptureRuntimeState;
  /** Overrides the stage's default title. */
  title?: ReactNode;
  /** Overrides the stage's default description. */
  description?: ReactNode;
  /** Bounded hardware surface (e.g. camera view) rendered only during the `capture` stage. */
  hardwareSurface?: ReactNode;
  /** Stage body content shown when no runtime recovery block applies. */
  body?: ReactNode;
  /** Optional inline notice text for the stage. */
  notice?: ReactNode;
  actions?: PublicFlowAction[];
  /** Share options; on the `share` stage these render as the flow body. */
  share?: ShareButtonGroupProps;
  /** Optional exit control rendered in the shell header. */
  exitAction?: ReactNode;
}

const stageCopy: Record<PublicCaptureStageId, { title: string; description: string }> = {
  identify: { title: 'Who are you?', description: 'Enter the information required for this public flow.' },
  consent: { title: 'Review consent', description: 'Confirm the required consent before continuing.' },
  capture: { title: 'Capture media', description: 'Use the bounded capture area to create the media.' },
  accept: { title: 'Review result', description: 'Accept the result or retry the capture.' },
  cta: { title: 'Continue', description: 'Choose the next step for this experience.' },
  restart: { title: 'Start again', description: 'Restart the flow from the beginning.' },
  share: { title: 'Share', description: 'Share or copy the public result.' },
};

function toFlowStatus(state: CaptureRuntimeState): PublicFlowStageStatus {
  if (state === 'loading') return 'loading';
  if (state === 'error' || state === 'permission-denied' || state === 'hardware-unavailable') return 'error';
  if (state === 'complete') return 'complete';
  if (state === 'ready') return 'ready';
  return 'idle';
}

function runtimeStateBody(state: CaptureRuntimeState) {
  if (state === 'permission-denied') {
    return <StateBlock variant="permission" title="Permission required" description="Allow access or use the provided recovery action to continue." />;
  }
  if (state === 'hardware-unavailable') {
    return <StateBlock variant="error" title="Capture unavailable" description="The required hardware surface is not available on this device." />;
  }
  return null;
}

/**
 * Governed public capture flow: maps a capture stage and runtime state onto a
 * {@link PublicFlowShell}, supplying default stage copy, permission/hardware
 * recovery bodies, and an optional share overlay on the final stage.
 */
export function PublicCaptureFlow({
  stage,
  state,
  title,
  description,
  hardwareSurface,
  body,
  notice,
  actions,
  share,
  exitAction,
}: PublicCaptureFlowProps) {
  const copy = stageCopy[stage];
  const runtimeBody = runtimeStateBody(state);
  const flowBody = runtimeBody ?? (stage === 'share' && share ? <PublicShareOverlay {...share} /> : body);
  return (
    <PublicFlowShell
      exitAction={exitAction}
      hardwareSurface={stage === 'capture' ? hardwareSurface : undefined}
      stage={{
        id: stage,
        title: title ?? copy.title,
        description: description ?? copy.description,
        status: toFlowStatus(state),
        body: flowBody,
        notice,
        actions,
      }}
    />
  );
}

/** Identity stage layout: stacks the supplied identity fields. */
export function PublicIdentityStep({ children }: { children: ReactNode }) {
  return <Stack gap="md">{children}</Stack>;
}

/** Consent stage layout: renders consent copy above its control (e.g. a checkbox). */
export function PublicConsentStep({ consentText, control }: { consentText: ReactNode; control: ReactNode }) {
  return (
    <Stack gap="md">
      <Text>{consentText}</Text>
      {control}
    </Stack>
  );
}

/** Accept stage layout: renders the captured result preview above accept/retry actions. */
export function PublicAcceptStep({ preview, actions }: { preview: ReactNode; actions?: ReactNode }) {
  return (
    <Stack gap="md">
      {preview}
      {actions}
    </Stack>
  );
}

/** Call-to-action stage layout: stacks the supplied CTA content. */
export function PublicCtaStep({ children }: { children: ReactNode }) {
  return <Stack gap="md">{children}</Stack>;
}

/** Restart stage layout: stacks the supplied restart content. */
export function PublicRestartStep({ children }: { children: ReactNode }) {
  return <Stack gap="md">{children}</Stack>;
}

/** Share stage overlay: renders a {@link ShareButtonGroup} for the public result. */
export function PublicShareOverlay(props: ShareButtonGroupProps) {
  return <ShareButtonGroup {...props} />;
}
