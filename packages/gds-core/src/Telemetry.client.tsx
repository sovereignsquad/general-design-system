'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

export const gdsOperationalEventTypes = [
  'submit',
  'submit_success',
  'submit_error',
  'validation_error',
  'retry',
  'timeout',
  'upload_failure',
  'destructive_action',
  'user_cancel',
  'action_complete',
  'adapter_error',
  'payload_rejected',
] as const;

export const gdsUxFailureReasons = [
  'adapter_unavailable',
  'network_unavailable',
  'permission_denied',
  'validation_failed',
  'request_timeout',
  'upload_failed',
  'destructive_action_rejected',
  'user_cancelled',
  'payload_rejected',
  'unknown',
] as const;

export type GdsOperationalEventType = (typeof gdsOperationalEventTypes)[number] | (string & {});
export type GdsUxFailureReason = (typeof gdsUxFailureReasons)[number] | (string & {});
export type GdsTelemetryOutcome = 'pending' | 'success' | 'error' | 'info' | 'cancelled' | 'timeout' | 'rejected';
export type GdsTelemetryPayloadValue = string | number | boolean | null;
export type GdsTelemetryPayload = Record<string, GdsTelemetryPayloadValue>;

export interface GdsOperationalEvent {
  component: string;
  eventType: GdsOperationalEventType;
  ts: number;
  correlationId: string;
  outcome?: GdsTelemetryOutcome;
  reason?: GdsUxFailureReason;
  actionId?: string;
  workflowId?: string;
  operationId?: string;
  attempt?: number;
  timeoutMs?: number;
  context?: GdsTelemetryPayload;
  payload?: GdsTelemetryPayload;
}

export interface GdsUiEvent extends GdsOperationalEvent {}

export type GdsOperationalEventInput = Omit<GdsOperationalEvent, 'ts'> & { ts?: number };
export type GdsTelemetrySink = (event: GdsOperationalEvent) => void | Promise<void>;

export interface GdsTelemetryAdapter {
  id: string;
  emit: GdsTelemetrySink;
  isAvailable?: () => boolean;
  flush?: () => void | Promise<void>;
}

export interface GdsEventPayloadPolicy {
  redactKeys?: string[];
  rejectKeys?: string[];
  rejectUnsafePayload?: boolean;
  maxKeys?: number;
  maxStringLength?: number;
  onRejectedPayload?: (details: GdsRejectedPayloadDetails) => void;
}

export interface GdsRejectedPayloadDetails {
  component: string;
  eventType: GdsOperationalEventType;
  correlationId: string;
  rejectedKeys: string[];
}

export type GdsTelemetryDispatchStatus =
  | 'emitted'
  | 'adapter-unavailable'
  | 'payload-rejected'
  | 'sampled-out'
  | 'sampling-disabled'
  | 'dropped';

export interface GdsTelemetryDispatchResult {
  status: GdsTelemetryDispatchStatus;
  event?: GdsOperationalEvent;
  rejectedKeys?: string[];
}

export interface GdsTelemetryDispatchOptions {
  adapter?: GdsTelemetryAdapter;
  sink?: GdsTelemetrySink;
  sampleRate?: number;
  payloadPolicy?: GdsEventPayloadPolicy;
  onAdapterError?: (error: unknown, event: GdsOperationalEvent) => void;
}

export interface GdsTelemetryAdapterOptions {
  id: string;
  emit: GdsTelemetrySink;
  isAvailable?: () => boolean;
  flush?: () => void | Promise<void>;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  onError?: (error: unknown, event: GdsOperationalEvent) => void;
}

export interface GdsTelemetryProviderProps {
  children: ReactNode;
  sink?: GdsTelemetrySink;
  adapter?: GdsTelemetryAdapter;
  sampleRate?: number;
  payloadPolicy?: GdsEventPayloadPolicy;
  onAdapterError?: (error: unknown, event: GdsOperationalEvent) => void;
}

interface GdsTelemetryContextValue {
  emit: (event: GdsOperationalEventInput) => GdsTelemetryDispatchResult;
  emitGdsEvent: (event: GdsOperationalEventInput) => GdsTelemetryDispatchResult;
}

const GdsTelemetryContext = createContext<GdsTelemetryContextValue | null>(null);

const defaultUnsafePayloadKeys = [
  'address',
  'auth',
  'cookie',
  'credential',
  'email',
  'ip',
  'jwt',
  'name',
  'password',
  'phone',
  'secret',
  'session',
  'ssn',
  'token',
];

function hashToUnit(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function delay(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function withTimeout(promise: Promise<void>, timeoutMs?: number) {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  return Promise.race([
    promise,
    new Promise<void>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(`GDS telemetry adapter timed out after ${timeoutMs}ms.`)), timeoutMs);
    }),
  ]);
}

function isPromiseLike(value: unknown): value is Promise<void> {
  return Boolean(value && typeof (value as Promise<void>).then === 'function');
}

function normalizePolicy(policy?: GdsEventPayloadPolicy) {
  return {
    redactKeys: [...defaultUnsafePayloadKeys, ...(policy?.redactKeys ?? [])],
    rejectKeys: policy?.rejectKeys ?? [],
    rejectUnsafePayload: policy?.rejectUnsafePayload ?? false,
    maxKeys: policy?.maxKeys ?? 24,
    maxStringLength: policy?.maxStringLength ?? 160,
    onRejectedPayload: policy?.onRejectedPayload,
  };
}

function keyMatches(key: string, configuredKeys: string[]) {
  const normalizedKey = key.toLowerCase();
  return configuredKeys.some((configuredKey) => normalizedKey.includes(configuredKey.toLowerCase()));
}

function scrubPayload(payload: GdsTelemetryPayload | undefined, policy?: GdsEventPayloadPolicy) {
  if (!payload) {
    return { payload, rejectedKeys: [] };
  }

  const normalizedPolicy = normalizePolicy(policy);
  const rejectedKeys: string[] = [];
  const entries = Object.entries(payload).slice(0, normalizedPolicy.maxKeys);
  const scrubbed = entries.reduce<GdsTelemetryPayload>((acc, [key, value]) => {
    const shouldReject = keyMatches(key, normalizedPolicy.rejectKeys);
    const shouldRedact = keyMatches(key, normalizedPolicy.redactKeys);

    if (shouldReject || shouldRedact) {
      rejectedKeys.push(key);
      return acc;
    }

    acc[key] = typeof value === 'string' && value.length > normalizedPolicy.maxStringLength
      ? value.slice(0, normalizedPolicy.maxStringLength)
      : value;
    return acc;
  }, {});

  return { payload: scrubbed, rejectedKeys };
}

function normalizeEvent(event: GdsOperationalEventInput, payloadPolicy?: GdsEventPayloadPolicy) {
  const contextResult = scrubPayload(event.context, payloadPolicy);
  const payloadResult = scrubPayload(event.payload, payloadPolicy);
  const rejectedKeys = [...contextResult.rejectedKeys, ...payloadResult.rejectedKeys];

  return {
    event: {
      ...event,
      context: contextResult.payload,
      payload: payloadResult.payload,
      ts: event.ts ?? Date.now(),
    },
    rejectedKeys,
  };
}

function reportRejectedPayload(event: GdsOperationalEventInput, rejectedKeys: string[], policy?: GdsEventPayloadPolicy) {
  if (rejectedKeys.length === 0) {
    return;
  }

  policy?.onRejectedPayload?.({
    component: event.component,
    eventType: event.eventType,
    correlationId: event.correlationId,
    rejectedKeys,
  });
}

function dispatchToAdapter(
  adapter: GdsTelemetryAdapter,
  event: GdsOperationalEvent,
  onAdapterError?: (error: unknown, event: GdsOperationalEvent) => void,
) {
  try {
    const result = adapter.emit(event);
    if (isPromiseLike(result)) {
      void result.catch((error) => onAdapterError?.(error, event));
    }
  } catch (error) {
    onAdapterError?.(error, event);
  }
}

export function isGdsOperationalEventType(eventType: string): eventType is (typeof gdsOperationalEventTypes)[number] {
  return gdsOperationalEventTypes.includes(eventType as (typeof gdsOperationalEventTypes)[number]);
}

export function createGdsTelemetryAdapter({
  id,
  emit,
  isAvailable,
  flush,
  timeoutMs = 1000,
  retryAttempts = 0,
  retryDelayMs = 0,
  onError,
}: GdsTelemetryAdapterOptions): GdsTelemetryAdapter {
  return {
    id,
    isAvailable,
    flush,
    emit: (event) => {
      const run = async () => {
        let lastError: unknown;
        for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
          try {
            await withTimeout(Promise.resolve(emit({ ...event, attempt: event.attempt ?? attempt + 1 })), timeoutMs);
            return;
          } catch (error) {
            lastError = error;
            if (attempt < retryAttempts) {
              await delay(retryDelayMs);
            }
          }
        }
        onError?.(lastError, event);
      };

      void run();
    },
  };
}

export function emitGdsEvent({
  adapter,
  sink,
  sampleRate = 1,
  payloadPolicy,
  onAdapterError,
}: GdsTelemetryDispatchOptions, event: GdsOperationalEventInput): GdsTelemetryDispatchResult {
  if (sampleRate <= 0) {
    return { status: 'sampling-disabled' };
  }

  if (hashToUnit(event.correlationId) > Math.min(sampleRate, 1)) {
    return { status: 'sampled-out' };
  }

  const normalized = normalizeEvent(event, payloadPolicy);
  if (payloadPolicy?.rejectUnsafePayload && normalized.rejectedKeys.length > 0) {
    reportRejectedPayload(event, normalized.rejectedKeys, payloadPolicy);
    return { status: 'payload-rejected', rejectedKeys: normalized.rejectedKeys };
  }

  reportRejectedPayload(event, normalized.rejectedKeys, payloadPolicy);

  if (adapter) {
    if (adapter.isAvailable && !adapter.isAvailable()) {
      return { status: 'adapter-unavailable', event: normalized.event };
    }
    dispatchToAdapter(adapter, normalized.event, onAdapterError);
    return { status: 'emitted', event: normalized.event };
  }

  if (sink) {
    dispatchToAdapter({ id: 'legacy-sink', emit: sink }, normalized.event, onAdapterError);
    return { status: 'emitted', event: normalized.event };
  }

  return { status: 'dropped', event: normalized.event };
}

export function GdsTelemetryProvider({
  children,
  sink,
  adapter,
  sampleRate = 1,
  payloadPolicy,
  onAdapterError,
}: GdsTelemetryProviderProps) {
  const value = useMemo<GdsTelemetryContextValue>(() => ({
    emit: (event) => emitGdsEvent({ adapter, sink, sampleRate, payloadPolicy, onAdapterError }, event),
    emitGdsEvent: (event) => emitGdsEvent({ adapter, sink, sampleRate, payloadPolicy, onAdapterError }, event),
  }), [adapter, onAdapterError, payloadPolicy, sampleRate, sink]);

  return <GdsTelemetryContext.Provider value={value}>{children}</GdsTelemetryContext.Provider>;
}

export function useGdsTelemetry() {
  const context = useContext(GdsTelemetryContext);
  if (!context) {
    throw new Error('useGdsTelemetry must be used within GdsTelemetryProvider.');
  }
  return context;
}
