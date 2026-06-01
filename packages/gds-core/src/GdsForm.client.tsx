'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { Alert, Anchor, Stack, Text } from '@mantine/core';

export type ValidationSeverity = 'blocking' | 'warning' | 'info';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
}

export type SubmitState = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

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

interface GdsFormController<TValues extends Record<string, unknown>> {
  snapshot: FormSnapshot;
  setFieldValue: (field: keyof TValues & string, value: unknown) => void;
  touchField: (field: keyof TValues & string) => void;
  submit: () => Promise<boolean>;
  retrySubmit: () => Promise<boolean>;
}

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
        Object.entries(snapshot.fields).reduce<Record<string, unknown>>((acc, [field, state]) => {
          acc[field] = state.value;
          return acc;
        }, {}) as TValues,
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
