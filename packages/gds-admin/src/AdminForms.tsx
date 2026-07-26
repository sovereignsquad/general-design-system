import type { ReactNode } from 'react';
import {
  Checkbox,
  FileInput,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import type {
  CheckboxProps,
  FileInputProps,
  SelectProps,
  TextareaProps,
  TextInputProps,
} from '@mantine/core';
import { ActionBar, type ActionBarProps, FormField, StateBlock } from '@sovereignsquad/gds-core';
import { FormSection } from './FormSection';

/** Governed per-field lifecycle state; drives disabled/read-only derivation. */
export type AdminFieldState = 'idle' | 'loading' | 'error' | 'success' | 'readonly' | 'disabled';
/** Governed form-level status state rendered by {@link AdminFormStatus}. */
export type AdminFormStatusState = 'idle' | 'loading' | 'error' | 'success' | 'dirty' | 'readonly';

/** Shared props for the governed admin field wrappers (text, textarea, checkbox, select, file). */
export interface AdminFieldBaseProps {
  /** Control id; defaults to `name` when omitted. */
  id?: string;
  /** Form field name. */
  name: string;
  /** Field label. */
  label: ReactNode;
  /** Supporting description text. */
  description?: ReactNode;
  /** Error content; presence marks the field invalid. */
  error?: ReactNode;
  /** Mark the field required. */
  required?: boolean;
  /** Governed field state; `loading`/`disabled` disable the control, `readonly` makes it read-only. */
  state?: AdminFieldState;
  /** Explicitly disable the control. */
  disabled?: boolean;
  /** Explicitly make the control read-only. */
  readOnly?: boolean;
}

function fieldId({ id, name }: Pick<AdminFieldBaseProps, 'id' | 'name'>) {
  return id ?? name;
}

function isDisabled({ disabled, state }: Pick<AdminFieldBaseProps, 'disabled' | 'state'>) {
  return disabled || state === 'disabled' || state === 'loading';
}

function isReadOnly({ readOnly, state }: Pick<AdminFieldBaseProps, 'readOnly' | 'state'>) {
  return readOnly || state === 'readonly';
}

/** Props for {@link AdminTextInput}: {@link AdminFieldBaseProps} plus a controlled string value. */
export interface AdminTextInputProps extends AdminFieldBaseProps, Omit<TextInputProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  /** Controlled input value. */
  value: string;
  /** Called with the next value on change. */
  onChange?: (value: string) => void;
}

/**
 * Governed single-line text field: a Mantine `TextInput` wrapped in the GDS
 * `FormField` for consistent label/description/error handling, with disabled
 * and read-only state derived from {@link AdminFieldBaseProps.state}.
 */
export function AdminTextInput({
  id,
  name,
  label,
  description,
  error,
  required,
  state = 'idle',
  disabled,
  readOnly,
  value,
  onChange,
  ...props
}: AdminTextInputProps) {
  const controlId = fieldId({ id, name });
  return (
    <FormField label={label} description={description} error={error}>
      <TextInput
        id={controlId}
        name={name}
        aria-label={typeof label === 'string' ? label : undefined}
        value={value}
        required={required}
        disabled={isDisabled({ disabled, state })}
        readOnly={isReadOnly({ readOnly, state })}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        {...props}
      />
    </FormField>
  );
}

/** Props for {@link AdminTextarea}: {@link AdminFieldBaseProps} plus a controlled string value. */
export interface AdminTextareaProps extends AdminFieldBaseProps, Omit<TextareaProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  /** Controlled textarea value. */
  value: string;
  /** Called with the next value on change. */
  onChange?: (value: string) => void;
}

/**
 * Governed multi-line text field: a Mantine `Textarea` (autosizing, min 3 rows)
 * wrapped in the GDS `FormField`, with disabled/read-only state derived from
 * {@link AdminFieldBaseProps.state}.
 */
export function AdminTextarea({
  id,
  name,
  label,
  description,
  error,
  required,
  state = 'idle',
  disabled,
  readOnly,
  value,
  onChange,
  ...props
}: AdminTextareaProps) {
  const controlId = fieldId({ id, name });
  return (
    <FormField label={label} description={description} error={error}>
      <Textarea
        id={controlId}
        name={name}
        aria-label={typeof label === 'string' ? label : undefined}
        value={value}
        required={required}
        disabled={isDisabled({ disabled, state })}
        readOnly={isReadOnly({ readOnly, state })}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        autosize
        minRows={3}
        {...props}
      />
    </FormField>
  );
}

/** Props for {@link AdminCheckbox}: {@link AdminFieldBaseProps} plus a controlled boolean. */
export interface AdminCheckboxProps extends AdminFieldBaseProps, Omit<CheckboxProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  /** Controlled checked state. */
  checked: boolean;
  /** Called with the next checked state on change. */
  onChange?: (checked: boolean) => void;
}

/**
 * Governed checkbox field: a Mantine `Checkbox` wrapped in the GDS `FormField`,
 * with disabled state derived from {@link AdminFieldBaseProps.state}.
 */
export function AdminCheckbox({
  id,
  name,
  label,
  description,
  error,
  required,
  state = 'idle',
  disabled,
  checked,
  onChange,
  ...props
}: AdminCheckboxProps) {
  const controlId = fieldId({ id, name });
  return (
    <FormField label={label} description={description} error={error}>
      <Checkbox
        id={controlId}
        name={name}
        aria-label={typeof label === 'string' ? label : undefined}
        checked={checked}
        required={required}
        disabled={isDisabled({ disabled, state })}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
        {...props}
      />
    </FormField>
  );
}

/** Props for {@link AdminSelect}: {@link AdminFieldBaseProps} plus a controlled nullable value. */
export interface AdminSelectProps extends AdminFieldBaseProps, Omit<SelectProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  /** Controlled selected value, or `null` when nothing is selected. */
  value: string | null;
  /** Called with the next value on change. */
  onChange?: (value: string | null) => void;
}

/**
 * Governed select field: a Mantine `Select` wrapped in the GDS `FormField`,
 * with disabled state derived from {@link AdminFieldBaseProps.state}.
 */
export function AdminSelect({
  id,
  name,
  label,
  description,
  error,
  required,
  state = 'idle',
  disabled,
  value,
  onChange,
  ...props
}: AdminSelectProps) {
  const controlId = fieldId({ id, name });
  return (
    <FormField label={label} description={description} error={error}>
      <Select
        id={controlId}
        name={name}
        aria-label={typeof label === 'string' ? label : undefined}
        value={value}
        required={required}
        disabled={isDisabled({ disabled, state })}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        onChange={(next) => onChange?.(next)}
        {...props}
      />
    </FormField>
  );
}

/** Props for {@link AdminFileUpload}: {@link AdminFieldBaseProps} plus a controlled nullable file. */
export interface AdminFileUploadProps extends AdminFieldBaseProps, Omit<FileInputProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  /** Controlled selected file, or `null` when none. */
  value: File | null;
  /** Called with the next file (or `null` when cleared) on change. */
  onChange?: (value: File | null) => void;
}

/**
 * Governed file field: a clearable Mantine `FileInput` wrapped in the GDS
 * `FormField`, with disabled state derived from {@link AdminFieldBaseProps.state}.
 */
export function AdminFileUpload({
  id,
  name,
  label,
  description,
  error,
  required,
  state = 'idle',
  disabled,
  value,
  onChange,
  ...props
}: AdminFileUploadProps) {
  const controlId = fieldId({ id, name });
  return (
    <FormField label={label} description={description} error={error}>
      <FileInput
        id={controlId}
        name={name}
        aria-label={typeof label === 'string' ? label : undefined}
        value={value}
        required={required}
        disabled={isDisabled({ disabled, state })}
        error={Boolean(error)}
        aria-invalid={Boolean(error)}
        onChange={(next) => onChange?.(next)}
        clearable
        {...props}
      />
    </FormField>
  );
}

/** Props for {@link AdminFormSection}. */
export interface AdminFormSectionProps {
  /** Section heading. */
  title: string;
  /** Supporting description text under the heading. */
  description?: string;
  /** Section content. */
  children: ReactNode;
  /** Render a trailing divider below the section. */
  withDivider?: boolean;
}

/** Thin governed pass-through over {@link FormSection} for grouping admin form fields. */
export function AdminFormSection(props: AdminFormSectionProps) {
  return <FormSection {...props} />;
}

/** Props for {@link AdminFormStatus}. */
export interface AdminFormStatusProps {
  /** Governed status state; `idle` renders nothing. */
  state: AdminFormStatusState;
  /** Override for the default per-state title. */
  title?: string;
  /** Supporting description text. */
  description?: ReactNode;
  /** Action element rendered alongside the status. */
  action?: ReactNode;
}

const statusTitle: Record<AdminFormStatusState, string> = {
  idle: 'Ready to edit',
  loading: 'Saving changes',
  error: 'Unable to save',
  success: 'Changes saved',
  dirty: 'Unsaved changes',
  readonly: 'Read only',
};

/**
 * Governed form-status banner: maps {@link AdminFormStatusState} to a `StateBlock`
 * variant with a default per-state title. Renders nothing while `idle`.
 */
export function AdminFormStatus({ state, title, description, action }: AdminFormStatusProps) {
  if (state === 'idle') {
    return null;
  }
  const variant = state === 'error'
    ? 'error'
    : state === 'loading'
      ? 'loading'
      : state === 'success'
        ? 'success'
        : state === 'readonly'
          ? 'disabled'
          : 'info';
  return (
    <Paper withBorder radius="lg" p="md">
      <StateBlock
        variant={variant}
        title={title ?? statusTitle[state]}
        description={description}
        action={action}
        compact
      />
    </Paper>
  );
}

/** Props for {@link AdminFormActions}. */
export interface AdminFormActionsProps {
  /** Whether the form has unsaved changes; drives the status label. */
  dirty?: boolean;
  /** Whether a save is in flight; sets the submit action's loading state. */
  submitting?: boolean;
  /** Disable the submit action. */
  disabled?: boolean;
  /** Primary submit action. */
  submitAction?: ActionBarProps['primary'];
  /** Cancel action, prepended to the secondary actions. */
  cancelAction?: NonNullable<ActionBarProps['secondary']>[number];
  /** Delete action, appended to the tertiary actions and defaulted to red. */
  deleteAction?: NonNullable<ActionBarProps['tertiary']>[number];
  /** Additional secondary actions. */
  secondaryActions?: ActionBarProps['secondary'];
  /** Additional tertiary actions. */
  tertiaryActions?: ActionBarProps['tertiary'];
  /** Supporting status text shown beside the state label. */
  status?: ReactNode;
}

/**
 * Governed form action bar: composes submit/cancel/delete plus extra actions
 * into the GDS `ActionBar`, and shows a Saving/Unsaved changes/Ready label
 * derived from `submitting` and `dirty`.
 */
export function AdminFormActions({
  dirty = false,
  submitting = false,
  disabled = false,
  submitAction,
  cancelAction,
  deleteAction,
  secondaryActions = [],
  tertiaryActions = [],
  status,
}: AdminFormActionsProps) {
  const primary = submitAction
    ? { ...submitAction, loading: submitting || submitAction.loading, disabled: disabled || submitAction.disabled }
    : undefined;
  const secondary = cancelAction ? [cancelAction, ...secondaryActions] : secondaryActions;
  const tertiary = deleteAction ? [...tertiaryActions, { color: 'red', ...deleteAction }] : tertiaryActions;

  return (
    <Paper withBorder radius="xl" p="md">
      <Group justify="space-between" gap="md" wrap="wrap">
        <Stack gap={2}>
          <Text size="sm" fw={600}>{submitting ? 'Saving' : dirty ? 'Unsaved changes' : 'Ready'}</Text>
          {status ? <Text size="xs" c="dimmed">{status}</Text> : null}
        </Stack>
        <ActionBar primary={primary} secondary={secondary} tertiary={tertiary} />
      </Group>
    </Paper>
  );
}

/** Props for {@link AdminCrudForm}. */
export interface AdminCrudFormProps {
  /** Optional form title; when set, fields are wrapped in an {@link AdminFormSection}. */
  title?: string;
  /** Supporting description text under the title. */
  description?: string;
  /** Form status banner props. */
  status?: AdminFormStatusProps;
  /** Form action bar props. */
  actions?: AdminFormActionsProps;
  /** Form fields. */
  children: ReactNode;
}

/**
 * Governed CRUD form scaffold: stacks an optional titled section, the
 * {@link AdminFormStatus} banner, and the {@link AdminFormActions} bar around the
 * supplied fields.
 */
export function AdminCrudForm({ title, description, status, actions, children }: AdminCrudFormProps) {
  return (
    <Stack gap="lg">
      {title ? (
        <AdminFormSection title={title} description={description} withDivider={false}>
          {children}
        </AdminFormSection>
      ) : children}
      {status ? <AdminFormStatus {...status} /> : null}
      {actions ? <AdminFormActions {...actions} /> : null}
    </Stack>
  );
}
