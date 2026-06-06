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
import { ActionBar, type ActionBarProps, FormField, StateBlock } from '@doneisbetter/gds-core';
import { FormSection } from './FormSection';

export type AdminFieldState = 'idle' | 'loading' | 'error' | 'success' | 'readonly' | 'disabled';
export type AdminFormStatusState = 'idle' | 'loading' | 'error' | 'success' | 'dirty' | 'readonly';

export interface AdminFieldBaseProps {
  id?: string;
  name: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  state?: AdminFieldState;
  disabled?: boolean;
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

export interface AdminTextInputProps extends AdminFieldBaseProps, Omit<TextInputProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  value: string;
  onChange?: (value: string) => void;
}

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

export interface AdminTextareaProps extends AdminFieldBaseProps, Omit<TextareaProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  value: string;
  onChange?: (value: string) => void;
}

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

export interface AdminCheckboxProps extends AdminFieldBaseProps, Omit<CheckboxProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

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

export interface AdminSelectProps extends AdminFieldBaseProps, Omit<SelectProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  value: string | null;
  onChange?: (value: string | null) => void;
}

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

export interface AdminFileUploadProps extends AdminFieldBaseProps, Omit<FileInputProps, 'label' | 'description' | 'error' | 'name' | 'id' | 'onChange'> {
  value: File | null;
  onChange?: (value: File | null) => void;
}

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

export interface AdminFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  withDivider?: boolean;
}

export function AdminFormSection(props: AdminFormSectionProps) {
  return <FormSection {...props} />;
}

export interface AdminFormStatusProps {
  state: AdminFormStatusState;
  title?: string;
  description?: ReactNode;
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

export interface AdminFormActionsProps {
  dirty?: boolean;
  submitting?: boolean;
  disabled?: boolean;
  submitAction?: ActionBarProps['primary'];
  cancelAction?: NonNullable<ActionBarProps['secondary']>[number];
  deleteAction?: NonNullable<ActionBarProps['tertiary']>[number];
  secondaryActions?: ActionBarProps['secondary'];
  tertiaryActions?: ActionBarProps['tertiary'];
  status?: ReactNode;
}

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

export interface AdminCrudFormProps {
  title?: string;
  description?: string;
  status?: AdminFormStatusProps;
  actions?: AdminFormActionsProps;
  children: ReactNode;
}

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
