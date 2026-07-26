'use client';

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Anchor, Stack, Text } from '@mantine/core';

/** Severity of a validation issue; `blocking` prevents submit, `warning`/`info` do not. */
export type ValidationSeverity = 'blocking' | 'warning' | 'info';

/** A single field-level validation issue. */
export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
}

/** Lifecycle state of a form submission, from `idle` through validation, autosave, and success/error. */
export type SubmitState = 'idle' | 'validating' | 'autosaving' | 'saved' | 'submitting' | 'optimistic' | 'success' | 'error' | 'restored';

/** Per-field state tracked by the form reducer. */
export interface FieldState {
  value: unknown;
  /** Whether the field has been focused/blurred by the user. */
  touched: boolean;
  /** Whether the field's value has changed from its initial value. */
  dirty: boolean;
}

/** Complete immutable snapshot of a form: all field states, current issues, and submit status. */
export interface FormSnapshot {
  fields: Record<string, FieldState>;
  issues: ValidationIssue[];
  submitState: SubmitState;
  submitError?: string;
}

type GdsFormAction =
  | { type: 'set-field'; field: string; value: unknown }
  | { type: 'touch-field'; field: string }
  | { type: 'set-issues'; issues: ValidationIssue[] }
  | { type: 'set-submit-state'; submitState: SubmitState; submitError?: string }
  | { type: 'reset'; values?: Record<string, unknown> };

function createFieldState(value: unknown): FieldState {
  return { value, touched: false, dirty: false };
}

function createSnapshot(values: Record<string, unknown>): FormSnapshot {
  const fields = Object.entries(values).reduce<Record<string, FieldState>>((acc, [field, value]) => {
    acc[field] = createFieldState(value);
    return acc;
  }, {});
  return { fields, issues: [], submitState: 'idle' };
}

/** Pure reducer that advances a `FormSnapshot`: setting/touching fields, replacing issues, updating submit state, or resetting to new values. */
export function gdsFormReducer(state: FormSnapshot, action: GdsFormAction): FormSnapshot {
  switch (action.type) {
    case 'set-field': {
      const current = state.fields[action.field] ?? createFieldState('');
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: {
            value: action.value,
            touched: current.touched,
            dirty: true,
          },
        },
      };
    }
    case 'touch-field': {
      const current = state.fields[action.field] ?? createFieldState('');
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: { ...current, touched: true },
        },
      };
    }
    case 'set-issues':
      return { ...state, issues: [...action.issues] };
    case 'set-submit-state':
      return { ...state, submitState: action.submitState, submitError: action.submitError };
    case 'reset':
      return createSnapshot(action.values ?? {});
    default:
      return state;
  }
}

function sortIssues(issues: ValidationIssue[]) {
  const weight: Record<ValidationSeverity, number> = { blocking: 0, warning: 1, info: 2 };
  return [...issues].sort((a, b) => weight[a.severity] - weight[b.severity]);
}

type SyncValidator = (snapshot: FormSnapshot) => ValidationIssue[];
type AsyncValidator = (snapshot: FormSnapshot) => Promise<ValidationIssue[]>;
type SubmitHandler<TValues> = (values: TValues) => Promise<void>;

interface UseGdsFormConfig<TValues extends Record<string, unknown>> {
  initialValues: TValues;
  validate?: SyncValidator;
  validateAsync?: AsyncValidator;
  onSubmit: SubmitHandler<TValues>;
}

/** Pluggable draft persistence for form orchestration: load, save, and clear draft values. */
export interface GdsDraftAdapter<TValues extends Record<string, unknown>> {
  load: () => Promise<TValues | null> | TValues | null;
  save: (values: TValues) => Promise<void> | void;
  clear: () => Promise<void> | void;
}

/** A server-side validation error, optionally tied to a specific field. */
export interface GdsFormServerError {
  field?: string;
  message: string;
}

/** Metadata-only telemetry event emitted over the orchestrated form lifecycle. */
export interface GdsFormOrchestrationEvent {
  type: 'dirty_changed' | 'validation_failed' | 'autosave_succeeded' | 'submit_failed' | 'retry_succeeded' | 'draft_restored';
  status: SubmitState;
  timestamp: number;
  /** Always `'metadata-only'` — events never carry field values. */
  privacy: 'metadata-only';
}

/** Configuration for `useGdsFormOrchestration`, extending the base form config with drafts, autosave, optimistic submit, server-error mapping, and telemetry. */
export interface UseGdsFormOrchestrationConfig<TValues extends Record<string, unknown>> extends UseGdsFormConfig<TValues> {
  /** Adapter enabling draft load/save/clear (draft restore requires this). */
  draftAdapter?: GdsDraftAdapter<TValues>;
  /** Autosave the draft before each submit. Defaults to `false`. */
  autosave?: boolean;
  /** Enter the `optimistic` state instead of `submitting` while the submit is in flight. Defaults to `false`. */
  optimisticSubmit?: boolean;
  /** Maps a thrown submit error into field-level server errors. */
  mapServerErrors?: (error: unknown) => GdsFormServerError[];
  /** Receives lifecycle telemetry events. */
  onEvent?: (event: GdsFormOrchestrationEvent) => void;
}

interface GdsFormController<TValues extends Record<string, unknown>> {
  snapshot: FormSnapshot;
  setFieldValue: (field: keyof TValues & string, value: unknown) => void;
  touchField: (field: keyof TValues & string) => void;
  submit: () => Promise<boolean>;
  retrySubmit: () => Promise<boolean>;
  restoreDraft?: () => Promise<boolean>;
  discardDraft?: () => Promise<void>;
  autosaveDraft?: () => Promise<boolean>;
}

function snapshotValues<TValues extends Record<string, unknown>>(snapshot: FormSnapshot) {
  return Object.entries(snapshot.fields).reduce<Record<string, unknown>>((acc, [field, state]) => {
    acc[field] = state.value;
    return acc;
  }, {}) as TValues;
}

function emitFormEvent(onEvent: UseGdsFormOrchestrationConfig<any>['onEvent'], type: GdsFormOrchestrationEvent['type'], status: SubmitState) {
  onEvent?.({ type, status, timestamp: Date.now(), privacy: 'metadata-only' });
}

/** Builds a `GdsDraftAdapter` backed by a Web Storage store (defaults to `localStorage`), JSON-serializing values under `storageKey` and treating parse failures as no draft. */
export function createGdsDraftAdapter<TValues extends Record<string, unknown>>(
  storageKey: string,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage,
): GdsDraftAdapter<TValues> {
  return {
    load: () => {
      const raw = storage.getItem(storageKey);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as TValues;
      } catch {
        return null;
      }
    },
    save: (values) => {
      storage.setItem(storageKey, JSON.stringify(values));
    },
    clear: () => {
      storage.removeItem(storageKey);
    },
  };
}

/**
 * Headless controller for a governed form: it holds the field snapshot, runs
 * synchronous then (only if clean) asynchronous validation on submit, and tracks
 * the submit lifecycle (`validating` → `submitting` → `success`/`error`). Use it
 * for a self-contained form where you render the fields yourself and just need
 * value state, ordered validation, and submit/retry wiring. For draft autosave,
 * optimistic submit, server-error mapping, or telemetry, use
 * {@link useGdsFormOrchestration} instead.
 */
export function useGdsForm<TValues extends Record<string, unknown>>({
  initialValues,
  validate,
  validateAsync,
  onSubmit,
}: UseGdsFormConfig<TValues>): GdsFormController<TValues> {
  const [snapshot, dispatch] = useReducer(gdsFormReducer, initialValues, createSnapshot);

  const submit = async () => {
    dispatch({ type: 'set-submit-state', submitState: 'validating' });
    const syncIssues = sortIssues(validate ? validate(snapshot) : []);
    let mergedIssues = syncIssues;
    if (syncIssues.filter((issue) => issue.severity === 'blocking').length === 0 && validateAsync) {
      const asyncIssues = sortIssues(await validateAsync(snapshot));
      mergedIssues = sortIssues([...syncIssues, ...asyncIssues]);
    }
    dispatch({ type: 'set-issues', issues: mergedIssues });
    if (mergedIssues.some((issue) => issue.severity === 'blocking')) {
      dispatch({ type: 'set-submit-state', submitState: 'error', submitError: 'Please resolve blocking validation issues.' });
      return false;
    }

    dispatch({ type: 'set-submit-state', submitState: 'submitting' });
    try {
      await onSubmit(
        snapshotValues<TValues>(snapshot),
      );
      dispatch({ type: 'set-submit-state', submitState: 'success' });
      return true;
    } catch (error) {
      dispatch({
        type: 'set-submit-state',
        submitState: 'error',
        submitError: error instanceof Error ? error.message : 'Submission failed.',
      });
      return false;
    }
  };

  return useMemo<GdsFormController<TValues>>(
    () => ({
      snapshot,
      setFieldValue: (field, value) => dispatch({ type: 'set-field', field, value }),
      touchField: (field) => dispatch({ type: 'touch-field', field }),
      submit,
      retrySubmit: submit,
    }),
    [snapshot],
  );
}

/**
 * Extended form controller that layers product-grade orchestration on top of
 * {@link useGdsForm}: optional draft persistence and autosave (via a
 * `draftAdapter`), optimistic submit, server-error mapping, and lifecycle
 * telemetry through `onEvent`. Reach for this when a form must survive reloads,
 * report analytics, or reconcile server-side validation errors; use the lighter
 * {@link useGdsForm} when it does not.
 */
export function useGdsFormOrchestration<TValues extends Record<string, unknown>>({
  initialValues,
  validate,
  validateAsync,
  onSubmit,
  draftAdapter,
  autosave = false,
  optimisticSubmit = false,
  mapServerErrors,
  onEvent,
}: UseGdsFormOrchestrationConfig<TValues>): GdsFormController<TValues> {
  const [snapshot, dispatch] = useReducer(gdsFormReducer, initialValues, createSnapshot);
  const submitAttempt = useRef(0);
  const [lastSubmitFailed, setLastSubmitFailed] = useState(false);

  const setFieldValue = useCallback((field: keyof TValues & string, value: unknown) => {
    dispatch({ type: 'set-field', field, value });
    emitFormEvent(onEvent, 'dirty_changed', 'idle');
  }, [onEvent]);

  const validateSnapshot = useCallback(async () => {
    dispatch({ type: 'set-submit-state', submitState: 'validating' });
    const syncIssues = sortIssues(validate ? validate(snapshot) : []);
    const asyncIssues = syncIssues.some((issue) => issue.severity === 'blocking') || !validateAsync
      ? []
      : sortIssues(await validateAsync(snapshot));
    const mergedIssues = sortIssues([...syncIssues, ...asyncIssues]);
    dispatch({ type: 'set-issues', issues: mergedIssues });
    if (mergedIssues.some((issue) => issue.severity === 'blocking')) {
      emitFormEvent(onEvent, 'validation_failed', 'error');
      dispatch({ type: 'set-submit-state', submitState: 'error', submitError: 'Please resolve blocking validation issues.' });
      return false;
    }
    return true;
  }, [onEvent, snapshot, validate, validateAsync]);

  const autosaveDraft = useCallback(async () => {
    if (!draftAdapter) return false;
    dispatch({ type: 'set-submit-state', submitState: 'autosaving' });
    await draftAdapter.save(snapshotValues<TValues>(snapshot));
    dispatch({ type: 'set-submit-state', submitState: 'saved' });
    emitFormEvent(onEvent, 'autosave_succeeded', 'saved');
    return true;
  }, [draftAdapter, onEvent, snapshot]);

  const submit = useCallback(async () => {
    const attempt = submitAttempt.current + 1;
    submitAttempt.current = attempt;
    const valid = await validateSnapshot();
    if (!valid) return false;

    if (autosave) await autosaveDraft();
    dispatch({ type: 'set-submit-state', submitState: optimisticSubmit ? 'optimistic' : 'submitting' });

    try {
      await onSubmit(snapshotValues<TValues>(snapshot));
      await draftAdapter?.clear();
      dispatch({ type: 'set-submit-state', submitState: 'success' });
      if (lastSubmitFailed) emitFormEvent(onEvent, 'retry_succeeded', 'success');
      setLastSubmitFailed(false);
      return true;
    } catch (error) {
      const serverErrors = mapServerErrors?.(error) ?? [];
      if (serverErrors.length > 0) {
        dispatch({
          type: 'set-issues',
          issues: serverErrors.map((item) => ({
            field: item.field ?? 'form',
            message: item.message,
            severity: 'blocking',
          })),
        });
      }
      setLastSubmitFailed(true);
      emitFormEvent(onEvent, 'submit_failed', 'error');
      dispatch({
        type: 'set-submit-state',
        submitState: 'error',
        submitError: error instanceof Error ? error.message : 'Submission failed.',
      });
      return false;
    }
  }, [autosave, autosaveDraft, draftAdapter, lastSubmitFailed, mapServerErrors, onEvent, onSubmit, optimisticSubmit, snapshot, validateSnapshot]);

  const restoreDraft = useCallback(async () => {
    const draft = await draftAdapter?.load();
    if (!draft) return false;
    dispatch({ type: 'reset', values: draft });
    dispatch({ type: 'set-submit-state', submitState: 'restored' });
    emitFormEvent(onEvent, 'draft_restored', 'restored');
    return true;
  }, [draftAdapter, onEvent]);

  const discardDraft = useCallback(async () => {
    await draftAdapter?.clear();
  }, [draftAdapter]);

  return useMemo<GdsFormController<TValues>>(
    () => ({
      snapshot,
      setFieldValue,
      touchField: (field) => dispatch({ type: 'touch-field', field }),
      submit,
      retrySubmit: submit,
      restoreDraft,
      discardDraft,
      autosaveDraft,
    }),
    [autosaveDraft, discardDraft, restoreDraft, setFieldValue, snapshot, submit],
  );
}

interface GdsFormContextValue {
  snapshot: FormSnapshot;
}

const GdsFormContext = createContext<GdsFormContextValue | null>(null);

/** Context provider that exposes a form `snapshot` to descendant field/summary components (`FormErrorSummary`, `ValidatedFieldMessage`). */
export function GdsFormProvider({ snapshot, children }: { snapshot: FormSnapshot; children: ReactNode }) {
  return <GdsFormContext.Provider value={{ snapshot }}>{children}</GdsFormContext.Provider>;
}

/** Returns the current `FormSnapshot` from the nearest `GdsFormProvider`; throws if used outside one. */
export function useGdsFormSnapshot() {
  const context = useContext(GdsFormContext);
  if (!context) {
    throw new Error('useGdsFormSnapshot must be used within GdsFormProvider.');
  }
  return context.snapshot;
}

/** Renders a red `Alert` listing the snapshot's blocking issues as in-page anchor links to each field; renders nothing when there are none. */
export function FormErrorSummary({ title = 'Please review the following issues.' }: { title?: ReactNode }) {
  const snapshot = useGdsFormSnapshot();
  const blocking = snapshot.issues.filter((issue) => issue.severity === 'blocking');
  if (blocking.length === 0) {
    return null;
  }

  return (
    <Alert color="red" title={title}>
      <Stack gap={4}>
        {blocking.map((issue) => (
          <Anchor key={`${issue.field}-${issue.message}`} href={`#${issue.field}`}>
            {issue.message}
          </Anchor>
        ))}
      </Stack>
    </Alert>
  );
}

/** Alias of {@link FormErrorSummary}. */
export const GdsValidationSummary = FormErrorSummary;

/** Renders the first blocking issue for `field` as an error message (id `${field}-error`, for `aria-describedby`); renders nothing when the field is valid. */
export function ValidatedFieldMessage({ field }: { field: string }) {
  const snapshot = useGdsFormSnapshot();
  const issue = snapshot.issues.find((item) => item.field === field && item.severity === 'blocking');
  if (!issue) {
    return null;
  }
  return (
    <Text size="xs" c="red.7" id={`${field}-error`}>
      {issue.message}
    </Text>
  );
}
