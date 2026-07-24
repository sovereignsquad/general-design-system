'use client';

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Anchor, Stack, Text } from '@mantine/core';

export type ValidationSeverity = 'blocking' | 'warning' | 'info';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
}

export type SubmitState = 'idle' | 'validating' | 'autosaving' | 'saved' | 'submitting' | 'optimistic' | 'success' | 'error' | 'restored';

export interface FieldState {
  value: unknown;
  touched: boolean;
  dirty: boolean;
}

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

export interface GdsDraftAdapter<TValues extends Record<string, unknown>> {
  load: () => Promise<TValues | null> | TValues | null;
  save: (values: TValues) => Promise<void> | void;
  clear: () => Promise<void> | void;
}

export interface GdsFormServerError {
  field?: string;
  message: string;
}

export interface GdsFormOrchestrationEvent {
  type: 'dirty_changed' | 'validation_failed' | 'autosave_succeeded' | 'submit_failed' | 'retry_succeeded' | 'draft_restored';
  status: SubmitState;
  timestamp: number;
  privacy: 'metadata-only';
}

export interface UseGdsFormOrchestrationConfig<TValues extends Record<string, unknown>> extends UseGdsFormConfig<TValues> {
  draftAdapter?: GdsDraftAdapter<TValues>;
  autosave?: boolean;
  optimisticSubmit?: boolean;
  mapServerErrors?: (error: unknown) => GdsFormServerError[];
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

export function GdsFormProvider({ snapshot, children }: { snapshot: FormSnapshot; children: ReactNode }) {
  return <GdsFormContext.Provider value={{ snapshot }}>{children}</GdsFormContext.Provider>;
}

export function useGdsFormSnapshot() {
  const context = useContext(GdsFormContext);
  if (!context) {
    throw new Error('useGdsFormSnapshot must be used within GdsFormProvider.');
  }
  return context.snapshot;
}

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

export const GdsValidationSummary = FormErrorSummary;

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
