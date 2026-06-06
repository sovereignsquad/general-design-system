import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';
import { PublicFlowShell, type PublicFlowAction, type PublicFlowStageStatus } from './PublicFlowShell';
import { ShareButtonGroup, type ShareButtonGroupProps } from './ShareButtonGroup';
import { StateBlock } from './StateBlock';

export type PublicCaptureStageId = 'identify' | 'consent' | 'capture' | 'accept' | 'cta' | 'restart' | 'share';
export type CaptureRuntimeState = 'idle' | 'loading' | 'ready' | 'permission-denied' | 'hardware-unavailable' | 'error' | 'complete';

export interface PublicCaptureFlowProps {
  stage: PublicCaptureStageId;
  state: CaptureRuntimeState;
  title?: ReactNode;
  description?: ReactNode;
  hardwareSurface?: ReactNode;
  body?: ReactNode;
  notice?: ReactNode;
  actions?: PublicFlowAction[];
  share?: ShareButtonGroupProps;
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

export function PublicIdentityStep({ children }: { children: ReactNode }) {
  return <Stack gap="md">{children}</Stack>;
}

export function PublicConsentStep({ consentText, control }: { consentText: ReactNode; control: ReactNode }) {
  return (
    <Stack gap="md">
      <Text>{consentText}</Text>
      {control}
    </Stack>
  );
}

export function PublicAcceptStep({ preview, actions }: { preview: ReactNode; actions?: ReactNode }) {
  return (
    <Stack gap="md">
      {preview}
      {actions}
    </Stack>
  );
}

export function PublicCtaStep({ children }: { children: ReactNode }) {
  return <Stack gap="md">{children}</Stack>;
}

export function PublicRestartStep({ children }: { children: ReactNode }) {
  return <Stack gap="md">{children}</Stack>;
}

export function PublicShareOverlay(props: ShareButtonGroupProps) {
  return <ShareButtonGroup {...props} />;
}
