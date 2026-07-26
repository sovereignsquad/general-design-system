'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { ConfirmDialog } from './ConfirmDialog';
import { GdsNotificationProvider, useGdsNotifications } from './Notifications.client';
import type { GdsNotificationMessage } from './Notifications';
import type { SemanticAction } from './vocabulary';

/** Description of a confirmation prompt shown by `useGdsConfirm().confirm`. */
export interface ConfirmRequest {
  id?: string;
  title: string;
  message: ReactNode;
  /** Name of the target being acted on, shown in bold above the message. */
  targetName?: string;
  /** Consequence text rendered beneath the message. */
  consequence?: ReactNode;
  /** Semantic action id for the confirm button; defaults to `confirm` (or `delete` when `danger`). */
  confirmAction?: SemanticAction;
  /** Semantic action id for the cancel button; defaults to `cancel`. */
  cancelAction?: SemanticAction;
  /** Styles the dialog as destructive (red confirm button). */
  danger?: boolean;
}

/** Imperative confirmation API provided by `GdsConfirmProvider` and read via `useGdsConfirm`. */
export interface GdsConfirmApi {
  /** Opens a yes/no confirmation and resolves to whether the user confirmed. */
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  /** Opens a pre-marked destructive confirmation that requires a target name. */
  confirmDestructive: (request: ConfirmRequest & { targetName: string }) => Promise<boolean>;
  /** Runs a full destructive-action flow (validate, execute, optional undo) and resolves with the result. */
  confirmAction: <TPayload = unknown>(request: GdsConfirmationRequest<TPayload>) => Promise<GdsDestructiveActionResult<TPayload>>;
}

/** Relative risk of a confirmed action, used to derive default danger styling and event metadata. */
export type GdsRiskLevel = 'low' | 'medium' | 'high' | 'critical';
/** Lifecycle status of a destructive-action confirmation. */
export type GdsConfirmationStatus = 'idle' | 'open' | 'validating' | 'executing' | 'succeeded' | 'failed' | 'undoable' | 'cancelled';
/** Telemetry event types emitted over a confirmation's lifecycle. */
export type GdsConfirmationEventType = 'opened' | 'cancelled' | 'confirmed' | 'failed' | 'retry' | 'undo_started' | 'undo_completed';

/** Undo policy for a confirmed action, exposing a time-boxed undo affordance. */
export interface GdsUndoPolicy<TPayload = unknown> {
  /** How long, in milliseconds, undo stays available after the action succeeds. */
  windowMs: number;
  /** Label for the undo button; defaults to "Undo". */
  label?: string;
  /** Invoked when the user triggers undo within the window. */
  onUndo: (payload: TPayload) => void | Promise<void>;
}

/** A destructive-action request carrying a payload plus optional validation, execution, timeout, retry, and undo behavior. */
export interface GdsConfirmationRequest<TPayload = unknown> extends ConfirmRequest {
  payload: TPayload;
  riskLevel?: GdsRiskLevel;
  /** Preview node rendered inside the dialog body. */
  preview?: ReactNode;
  /** Pre-execution check; return `true` to proceed, or a string/false to abort with a message. */
  validateTarget?: (payload: TPayload) => boolean | string | Promise<boolean | string>;
  /** Performs the action once confirmed and validated. */
  execute?: (payload: TPayload) => void | Promise<void>;
  /** Milliseconds before `execute` is treated as timed out; defaults to the provider's timeout. */
  timeoutMs?: number;
  /** Allows re-running the action from the failed state. */
  retryable?: boolean;
  undo?: GdsUndoPolicy<TPayload>;
}

/** Result returned by `confirmAction`, reporting the final status and any undo window. */
export interface GdsDestructiveActionResult<TPayload = unknown> {
  status: GdsConfirmationStatus;
  payload?: TPayload;
  error?: string;
  /** Epoch-ms deadline until which undo remains available, when the action is undoable. */
  undoUntil?: number;
}

/** Metadata-only telemetry event describing a confirmation lifecycle transition. */
export interface GdsConfirmationEvent {
  type: GdsConfirmationEventType;
  id: string;
  riskLevel: GdsRiskLevel;
  status: GdsConfirmationStatus;
  timestamp: number;
  privacy: 'metadata-only';
}

/** Props for `GdsConfirmProvider`. */
export interface GdsConfirmProviderProps {
  children: ReactNode;
  /** Default execute timeout in ms applied when a request omits `timeoutMs`. Defaults to 10000. */
  defaultTimeoutMs?: number;
  onConfirmationEvent?: (event: GdsConfirmationEvent) => void;
}

type ActiveConfirmRequest =
  | (ConfirmRequest & {
    mode: 'boolean';
    status: GdsConfirmationStatus;
    resolve: (confirmed: boolean) => void;
  })
  | (GdsConfirmationRequest<any> & {
    mode: 'action';
    status: GdsConfirmationStatus;
    error?: string;
    resolve: (result: GdsDestructiveActionResult<any>) => void;
  });

interface UndoState {
  id: string;
  label: string;
  expiresAt: number;
  onUndo: () => Promise<void>;
}

const GdsConfirmContext = createContext<GdsConfirmApi | null>(null);

function createConfirmationEvent(type: GdsConfirmationEventType, request: Pick<ConfirmRequest, 'id' | 'danger'> & { riskLevel?: GdsRiskLevel }, status: GdsConfirmationStatus): GdsConfirmationEvent {
  return {
    type,
    id: request.id ?? 'confirmation',
    riskLevel: request.riskLevel ?? (request.danger ? 'high' : 'medium'),
    status,
    timestamp: Date.now(),
    privacy: 'metadata-only',
  };
}

function timeoutPromise(timeoutMs: number) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Confirmation action timed out.')), timeoutMs);
  });
}

/**
 * Provides the imperative confirmation API and renders the shared `ConfirmDialog`
 * plus an undo banner. Handles boolean confirms and full destructive-action flows
 * (validate, then execute with a timeout, then an optional time-boxed undo),
 * restoring focus on close and emitting metadata-only lifecycle events.
 */
export function GdsConfirmProvider({
  children,
  defaultTimeoutMs = 10000,
  onConfirmationEvent,
}: GdsConfirmProviderProps) {
  const [activeRequest, setActiveRequest] = useState<ActiveConfirmRequest | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const activeResolver = useRef<((confirmed: boolean) => void) | null>(null);
  const actionResolver = useRef<((result: GdsDestructiveActionResult<unknown>) => void) | null>(null);
  const focusReturnTarget = useRef<HTMLElement | null>(null);

  const emit = useCallback((type: GdsConfirmationEventType, request: Pick<ConfirmRequest, 'id' | 'danger'> & { riskLevel?: GdsRiskLevel }, status: GdsConfirmationStatus) => {
    onConfirmationEvent?.(createConfirmationEvent(type, request, status));
  }, [onConfirmationEvent]);

  const restoreFocus = useCallback(() => {
    const target = focusReturnTarget.current;
    focusReturnTarget.current = null;
    if (target) window.setTimeout(() => target.focus(), 0);
  }, []);

  const openConfirm = useCallback((request: ConfirmRequest) => new Promise<boolean>((resolve) => {
    if (activeResolver.current) {
      activeResolver.current(false);
    }
    focusReturnTarget.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeResolver.current = resolve;
    emit('opened', request, 'open');
    setActiveRequest({ ...request, mode: 'boolean', status: 'open', resolve });
  }), [emit]);

  const openActionConfirm = useCallback(<TPayload,>(request: GdsConfirmationRequest<TPayload>) => new Promise<GdsDestructiveActionResult<TPayload>>((resolve) => {
    if (actionResolver.current) {
      actionResolver.current({ status: 'cancelled' });
    }
    focusReturnTarget.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const resolver = resolve as (result: GdsDestructiveActionResult<any>) => void;
    actionResolver.current = resolver;
    emit('opened', request, 'open');
    const isDanger = request.danger ?? (request.riskLevel === 'high' || request.riskLevel === 'critical');
    setActiveRequest({
      ...request,
      mode: 'action',
      status: 'open',
      danger: isDanger,
      confirmAction: request.confirmAction ?? (isDanger ? 'delete' : 'confirm'),
      resolve: resolver,
    });
  }), [emit]);

  const resolveActive = useCallback((confirmed: boolean) => {
    if (activeRequest?.mode === 'boolean') {
      emit(confirmed ? 'confirmed' : 'cancelled', activeRequest, confirmed ? 'succeeded' : 'cancelled');
    }
    activeResolver.current?.(confirmed);
    activeResolver.current = null;
    setActiveRequest(null);
    restoreFocus();
  }, [activeRequest, emit, restoreFocus]);

  const cancelAction = useCallback(() => {
    if (activeRequest?.mode === 'action') {
      emit('cancelled', activeRequest, 'cancelled');
      actionResolver.current?.({ status: 'cancelled', payload: activeRequest.payload });
      actionResolver.current = null;
    }
    setActiveRequest(null);
    restoreFocus();
  }, [activeRequest, emit, restoreFocus]);

  const runAction = useCallback(async (retry = false) => {
    if (!activeRequest || activeRequest.mode !== 'action') return;
    const request = activeRequest;
    if (retry) emit('retry', request, 'executing');
    setActiveRequest({ ...request, status: request.validateTarget ? 'validating' : 'executing', error: undefined });

    try {
      if (request.validateTarget) {
        const validation = await request.validateTarget(request.payload);
        if (validation !== true) {
          throw new Error(typeof validation === 'string' ? validation : 'Target could not be validated.');
        }
      }

      setActiveRequest({ ...request, status: 'executing', error: undefined });
      if (request.execute) {
        await Promise.race([
          request.execute(request.payload),
          timeoutPromise(request.timeoutMs ?? defaultTimeoutMs),
        ]);
      }

      emit('confirmed', request, request.undo ? 'undoable' : 'succeeded');
      if (request.undo) {
        const expiresAt = Date.now() + request.undo.windowMs;
        const undoPolicy = request.undo;
        setUndoState({
          id: request.id ?? 'confirmation-undo',
          label: undoPolicy.label ?? 'Undo',
          expiresAt,
          onUndo: async () => {
            emit('undo_started', request, 'undoable');
            await undoPolicy.onUndo(request.payload);
            emit('undo_completed', request, 'succeeded');
            setUndoState(null);
          },
        });
        window.setTimeout(() => {
          setUndoState((current) => (current?.expiresAt === expiresAt ? null : current));
        }, request.undo.windowMs);
        actionResolver.current?.({ status: 'undoable', payload: request.payload, undoUntil: expiresAt });
      } else {
        actionResolver.current?.({ status: 'succeeded', payload: request.payload });
      }
      actionResolver.current = null;
      setActiveRequest(null);
      restoreFocus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      emit('failed', request, 'failed');
      setActiveRequest({ ...request, status: 'failed', error: message });
    }
  }, [activeRequest, defaultTimeoutMs, emit, restoreFocus]);

  const value = useMemo<GdsConfirmApi>(() => ({
    confirm: openConfirm,
    confirmDestructive: (request) => openConfirm({ ...request, danger: true, confirmAction: request.confirmAction ?? 'delete' }),
    confirmAction: openActionConfirm,
  }), [openActionConfirm, openConfirm]);

  return (
    <GdsConfirmContext.Provider value={value}>
      {children}
      {undoState ? (
        <Paper withBorder radius="md" p="sm" mb="sm" role="status" aria-live="polite" aria-label="Action can be undone">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={700} size="sm">Action can be undone</Text>
              <Text size="sm">Undo is available until the recovery window expires.</Text>
            </Stack>
            <Button size="xs" variant="default" onClick={() => { void undoState.onUndo(); }}>
              {undoState.label}
            </Button>
          </Group>
        </Paper>
      ) : null}
      <ConfirmDialog
        opened={Boolean(activeRequest)}
        onClose={() => (activeRequest?.mode === 'action' ? cancelAction() : resolveActive(false))}
        onConfirm={() => (activeRequest?.mode === 'action' ? void runAction(activeRequest.status === 'failed') : resolveActive(true))}
        title={activeRequest?.title ?? ''}
        confirmAction={activeRequest?.confirmAction ?? (activeRequest?.danger ? 'delete' : 'confirm')}
        cancelAction={activeRequest?.cancelAction ?? 'cancel'}
        isDanger={activeRequest?.danger ?? false}
        loading={activeRequest?.status === 'executing' || activeRequest?.status === 'validating'}
      >
        <Stack gap="xs">
          {activeRequest?.targetName ? <strong>{activeRequest.targetName}</strong> : null}
          {activeRequest?.targetName ? <br /> : null}
          {activeRequest?.message}
          {activeRequest?.consequence ? (
            <>
              <br />
              {activeRequest.consequence}
            </>
          ) : null}
          {activeRequest?.mode === 'action' && activeRequest.preview ? <div>{activeRequest.preview}</div> : null}
          {activeRequest?.mode === 'action' && activeRequest.status === 'failed' ? (
            <Alert color="red" title="Action failed" role="alert">
              <Text size="sm">{activeRequest.error}</Text>
              {activeRequest.retryable ? <Text size="xs">Use the primary action to retry.</Text> : null}
            </Alert>
          ) : null}
        </Stack>
      </ConfirmDialog>
    </GdsConfirmContext.Provider>
  );
}

/** Returns the confirmation API; throws if used outside a `GdsConfirmProvider`. */
export function useGdsConfirm() {
  const context = useContext(GdsConfirmContext);
  if (!context) {
    throw new Error('useGdsConfirm must be used within GdsConfirmProvider.');
  }
  return context;
}

/** Toast payload accepted by the toast API: a notification message without a preset id or severity. */
export interface GdsToastMessage extends Omit<GdsNotificationMessage, 'id' | 'severity'> {
  id?: string;
}

/** Imperative toast API provided by `GdsToastProvider` and read via `useGdsToasts`. */
export interface GdsToastApi {
  /** Shows a success toast (auto-closes after 4s by default). */
  notifySuccess: (message: GdsToastMessage) => void;
  /** Shows an error toast (persistent by default) with an optional retry action. */
  notifyError: (message: GdsToastMessage & { retry?: () => void | Promise<void> }) => void;
  /** Shows a short action-complete success toast (auto-closes after 3s by default). */
  notifyActionComplete: (message: GdsToastMessage) => void;
}

const GdsToastContext = createContext<GdsToastApi | null>(null);

function createToastId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Wraps children in the notification provider and exposes the governed toast API via `useGdsToasts`. */
export function GdsToastProvider({ children }: { children: ReactNode }) {
  return (
    <GdsNotificationProvider>
      <GdsToastProviderInner>{children}</GdsToastProviderInner>
    </GdsNotificationProvider>
  );
}

function GdsToastProviderInner({ children }: { children: ReactNode }) {
  const { notify } = useGdsNotifications();
  const value = useMemo<GdsToastApi>(() => ({
    notifySuccess: (message) => notify({
      ...message,
      id: message.id ?? createToastId('success'),
      severity: 'success',
      autoCloseMs: message.autoCloseMs ?? 4000,
    }),
    notifyError: (message) => notify({
      ...message,
      id: message.id ?? createToastId('error'),
      severity: 'error',
      autoCloseMs: message.autoCloseMs ?? false,
      retry: message.retry ? { onRetry: message.retry, maxAttempts: 3, label: 'Retry' } : undefined,
    }),
    notifyActionComplete: (message) => notify({
      ...message,
      id: message.id ?? createToastId('complete'),
      severity: 'success',
      autoCloseMs: message.autoCloseMs ?? 3000,
    }),
  }), [notify]);

  return <GdsToastContext.Provider value={value}>{children}</GdsToastContext.Provider>;
}

/** Returns the toast API; throws if used outside a `GdsToastProvider`. */
export function useGdsToasts() {
  const context = useContext(GdsToastContext);
  if (!context) {
    throw new Error('useGdsToasts must be used within GdsToastProvider.');
  }
  return context;
}
