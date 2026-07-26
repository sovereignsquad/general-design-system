'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

/** Canonical GDS operational (UX) event types emitted by governed components. */
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

/** Canonical failure-reason codes attached to failed/rejected telemetry events. */
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

/** An event type: one of {@link gdsOperationalEventTypes} or any custom string. */
export type GdsOperationalEventType = (typeof gdsOperationalEventTypes)[number] | (string & {});
/** A failure reason: one of {@link gdsUxFailureReasons} or any custom string. */
export type GdsUxFailureReason = (typeof gdsUxFailureReasons)[number] | (string & {});
/** Outcome recorded alongside a telemetry event. */
export type GdsTelemetryOutcome = 'pending' | 'success' | 'error' | 'info' | 'cancelled' | 'timeout' | 'rejected';
/** Allowed primitive value types inside a telemetry payload. */
export type GdsTelemetryPayloadValue = string | number | boolean | null;
/** Flat key/value bag of telemetry payload values. */
export type GdsTelemetryPayload = Record<string, GdsTelemetryPayloadValue>;

/** A normalized operational telemetry event as delivered to sinks and adapters. */
export interface GdsOperationalEvent {
  /** Name of the emitting component. */
  component: string;
  eventType: GdsOperationalEventType;
  /** Emission timestamp (epoch ms). */
  ts: number;
  /** Id used to correlate related events and to drive deterministic sampling. */
  correlationId: string;
  outcome?: GdsTelemetryOutcome;
  reason?: GdsUxFailureReason;
  actionId?: string;
  workflowId?: string;
  operationId?: string;
  /** Attempt number for retried operations. */
  attempt?: number;
  timeoutMs?: number;
  /** Structured context, scrubbed by the payload policy before dispatch. */
  context?: GdsTelemetryPayload;
  /** Event payload, scrubbed by the payload policy before dispatch. */
  payload?: GdsTelemetryPayload;
}

/** Backward-compatible alias of {@link GdsOperationalEvent}. */
export interface GdsUiEvent extends GdsOperationalEvent {}

/** Input shape for emitting an event; `ts` is filled in automatically when omitted. */
export type GdsOperationalEventInput = Omit<GdsOperationalEvent, 'ts'> & { ts?: number };
/** A function that receives normalized telemetry events (sync or async). */
export type GdsTelemetrySink = (event: GdsOperationalEvent) => void | Promise<void>;

/** A telemetry transport: emits events, optionally gated by availability and with a flush hook. */
export interface GdsTelemetryAdapter {
  id: string;
  emit: GdsTelemetrySink;
  /** When present and returning `false`, events are reported as `adapter-unavailable` instead of emitted. */
  isAvailable?: () => boolean;
  flush?: () => void | Promise<void>;
}

/** Governs how event `context`/`payload` are scrubbed before dispatch. */
export interface GdsEventPayloadPolicy {
  /** Keys whose values are dropped (case-insensitive substring match); merged with the built-in unsafe-key list. */
  redactKeys?: string[];
  /** Keys that mark the payload as rejected (case-insensitive substring match). */
  rejectKeys?: string[];
  /** When `true`, an event with any rejected key is dropped entirely rather than scrubbed. */
  rejectUnsafePayload?: boolean;
  /** Maximum number of keys retained per payload. Defaults to 24. */
  maxKeys?: number;
  /** Maximum string length before truncation. Defaults to 160. */
  maxStringLength?: number;
  /** Called with the rejected keys whenever scrubbing removes any. */
  onRejectedPayload?: (details: GdsRejectedPayloadDetails) => void;
}

/** Details reported to `onRejectedPayload` when payload keys are redacted or rejected. */
export interface GdsRejectedPayloadDetails {
  component: string;
  eventType: GdsOperationalEventType;
  correlationId: string;
  /** The payload keys that were removed. */
  rejectedKeys: string[];
}

/** Result status returned when an event is dispatched via {@link emitGdsEvent}. */
export type GdsTelemetryDispatchStatus =
  | 'emitted'
  | 'adapter-unavailable'
  | 'payload-rejected'
  | 'sampled-out'
  | 'sampling-disabled'
  | 'dropped';

/** Outcome of a dispatch attempt: the status plus the normalized event and any rejected keys. */
export interface GdsTelemetryDispatchResult {
  status: GdsTelemetryDispatchStatus;
  /** The normalized (scrubbed, timestamped) event, when one was produced. */
  event?: GdsOperationalEvent;
  rejectedKeys?: string[];
}

/** Options controlling a single {@link emitGdsEvent} dispatch. */
export interface GdsTelemetryDispatchOptions {
  /** Preferred transport; takes precedence over `sink`. */
  adapter?: GdsTelemetryAdapter;
  /** Legacy sink used when no `adapter` is provided. */
  sink?: GdsTelemetrySink;
  /** Fraction of events to keep (0–1), applied deterministically per `correlationId`. Defaults to 1. */
  sampleRate?: number;
  payloadPolicy?: GdsEventPayloadPolicy;
  onAdapterError?: (error: unknown, event: GdsOperationalEvent) => void;
}

/** Configuration for {@link createGdsTelemetryAdapter}, adding timeout/retry behavior around a sink. */
export interface GdsTelemetryAdapterOptions {
  id: string;
  emit: GdsTelemetrySink;
  isAvailable?: () => boolean;
  flush?: () => void | Promise<void>;
  /** Per-attempt timeout in ms. Defaults to 1000. */
  timeoutMs?: number;
  /** Number of extra retries after the first attempt. Defaults to 0. */
  retryAttempts?: number;
  /** Delay between retries in ms. Defaults to 0. */
  retryDelayMs?: number;
  /** Called with the last error once all attempts are exhausted. */
  onError?: (error: unknown, event: GdsOperationalEvent) => void;
}

/** Props for {@link GdsTelemetryProvider}; mirror {@link GdsTelemetryDispatchOptions} for the whole subtree. */
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

/** Type guard: `true` when the string is one of the canonical {@link gdsOperationalEventTypes}. */
export function isGdsOperationalEventType(eventType: string): eventType is (typeof gdsOperationalEventTypes)[number] {
  return gdsOperationalEventTypes.includes(eventType as (typeof gdsOperationalEventTypes)[number]);
}

/**
 * Wraps a sink into a {@link GdsTelemetryAdapter} that applies per-attempt
 * timeout and retry, stamps each attempt number onto the event, and reports the
 * final error to `onError` when all attempts fail.
 */
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

/**
 * Core dispatch: applies sampling, scrubs the payload per policy, and routes the
 * normalized event to the adapter (or legacy sink), returning a
 * {@link GdsTelemetryDispatchResult} describing what happened.
 */
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

/** Provides a memoized telemetry `emit` to the subtree via context, bound to the given adapter/sink and policy. */
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

/** Reads the telemetry context; throws when used outside a {@link GdsTelemetryProvider}. */
export function useGdsTelemetry() {
  const context = useContext(GdsTelemetryContext);
  if (!context) {
    throw new Error('useGdsTelemetry must be used within GdsTelemetryProvider.');
  }
  return context;
}
