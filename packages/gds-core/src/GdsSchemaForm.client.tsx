'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Checkbox, Group, Paper, Stack, Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { FormField } from './FormField';
import { GdsDateInput } from './GdsDateInput.client';
import { GdsFormProvider, GdsValidationSummary, type GdsFormOrchestrationEvent, type ValidationIssue, ValidatedFieldMessage, useGdsFormOrchestration } from './GdsForm.client';
import { StateBlock } from './StateBlock';
import { UploadDropzone, type UploadDropzoneState } from './UploadDropzone';

function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type GdsSchemaFieldType = 'text' | 'email' | 'url' | 'password' | 'number' | 'boolean' | 'select' | 'checkbox-group' | 'repeatable' | 'textarea' | 'date' | 'hidden' | 'conditional' | 'file-upload' | 'unsupported';

export interface GdsFieldOption {
  label: string;
  value: string;
}

export interface GdsFieldDescriptor {
  name: string;
  type: GdsSchemaFieldType;
  label: string;
  description?: string;
  i18nKey: string;
  required?: boolean;
  hidden?: boolean;
  condition?: string;
  /** Choices for `select` and `checkbox-group` fields. */
  options?: GdsFieldOption[];
  /** Sub-fields of a `repeatable` row group. Each row is an object keyed by these fields' names. */
  fields?: GdsFieldDescriptor[];
  /** Minimum rows for a `repeatable` field (also its initial row count when no `defaultValue`). */
  minRows?: number;
  /** Maximum rows for a `repeatable` field. */
  maxRows?: number;
  /** Accessible/visible label for a `repeatable` field's add-row button (default "Add row"). */
  addRowLabel?: string;
  /** Accessible/visible label for a `repeatable` field's remove-row button (default "Remove"). */
  removeRowLabel?: string;
  defaultValue?: unknown;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  accept?: string;
  multiple?: boolean;
  maxFileSizeBytes?: number;
  maxFileSizeLabel?: string;
  uploadActionLabel?: string;
  uploadPolicyText?: string;
  uploadState?: UploadDropzoneState;
  uploadProgress?: number;
  unsupportedReason?: string;
}

export interface GdsFormSchema {
  id: string;
  title?: string;
  description?: string;
  fields: GdsFieldDescriptor[];
}

export interface GdsSchemaAdapterResult {
  schema?: GdsFormSchema;
  issues: ValidationIssue[];
  events: GdsSchemaFormEvent[];
}

export interface GdsSchemaUploadResult {
  [key: string]: unknown;
  id?: string;
  name?: string;
  url?: string;
  size?: number;
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface GdsSchemaUploadRequest {
  field: GdsFieldDescriptor;
  files: File[];
  signal: AbortSignal;
  onProgress: (progress: number) => void;
}

export interface GdsSchemaUploadRemoveRequest {
  field: GdsFieldDescriptor;
  value: GdsSchemaUploadResult[];
  signal: AbortSignal;
}

export interface GdsSchemaUploadAdapter {
  upload: (request: GdsSchemaUploadRequest) => Promise<GdsSchemaUploadResult | GdsSchemaUploadResult[]>;
  remove?: (request: GdsSchemaUploadRemoveRequest) => Promise<void>;
}

export interface GdsSchemaFormEvent {
  type:
    | 'schema_parse_failed'
    | 'unsupported_field'
    | 'generated_submit_failed'
    | 'upload_started'
    | 'upload_progress'
    | 'upload_succeeded'
    | 'upload_failed'
    | 'upload_cancelled'
    | 'upload_removed'
    | 'upload_retry_requested';
  field?: string;
  timestamp: number;
  privacy: 'metadata-only';
  message?: string;
}

export type GdsFieldRenderer = (context: GdsFieldRendererContext) => ReactNode;

export interface GdsFieldRendererContext {
  field: GdsFieldDescriptor;
  value: unknown;
  setValue: (value: unknown) => void;
  describedBy: string;
  invalid: boolean;
}

export type GdsFieldRendererMap = Partial<Record<GdsSchemaFieldType | string, GdsFieldRenderer>>;

export interface CreateGdsFormFromSchemaOptions {
  adapter: 'json-schema' | 'openapi' | 'zod';
  id?: string;
  schemaName?: string;
}

export interface GdsSchemaFormProps<TValues extends Record<string, unknown> = Record<string, unknown>> {
  schema: GdsFormSchema;
  onSubmit: (values: TValues) => Promise<void> | void;
  renderers?: GdsFieldRendererMap;
  uploadAdapter?: GdsSchemaUploadAdapter;
  onEvent?: (event: GdsSchemaFormEvent | GdsFormOrchestrationEvent) => void;
  submitLabel?: string;
}

function createSchemaEvent(type: GdsSchemaFormEvent['type'], message?: string, field?: string): GdsSchemaFormEvent {
  return { type, message, field, timestamp: Date.now(), privacy: 'metadata-only' };
}

function humanizeFieldName(name: string) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function makeI18nKey(formId: string, fieldName: string) {
  return `gds.form.${formId}.${fieldName}`;
}

function normalizeJsonField(formId: string, name: string, source: Record<string, unknown>, required: boolean): GdsFieldDescriptor {
  const title = typeof source.title === 'string' ? source.title : humanizeFieldName(name);
  const description = typeof source.description === 'string' ? source.description : undefined;
  const customType = typeof source['x-gds-fieldType'] === 'string' ? source['x-gds-fieldType'] : undefined;
  const hidden = source['x-gds-hidden'] === true;
  const condition = typeof source['x-gds-condition'] === 'string' ? source['x-gds-condition'] : undefined;
  const base = {
    name,
    label: title,
    description,
    required,
    hidden,
    condition,
    i18nKey: typeof source['x-gds-i18nKey'] === 'string' ? source['x-gds-i18nKey'] : makeI18nKey(formId, name),
    defaultValue: source.default,
    minLength: typeof source.minLength === 'number' ? source.minLength : undefined,
    maxLength: typeof source.maxLength === 'number' ? source.maxLength : undefined,
    min: typeof source.minimum === 'number' ? source.minimum : undefined,
    max: typeof source.maximum === 'number' ? source.maximum : undefined,
    pattern: typeof source.pattern === 'string' ? source.pattern : undefined,
    accept: typeof source['x-gds-accept'] === 'string' ? source['x-gds-accept'] : typeof source.contentMediaType === 'string' ? source.contentMediaType : undefined,
    multiple: typeof source['x-gds-multiple'] === 'boolean' ? source['x-gds-multiple'] : undefined,
    maxFileSizeBytes: typeof source['x-gds-maxFileSizeBytes'] === 'number' ? source['x-gds-maxFileSizeBytes'] : undefined,
    maxFileSizeLabel: typeof source['x-gds-maxFileSizeLabel'] === 'string' ? source['x-gds-maxFileSizeLabel'] : undefined,
    uploadActionLabel: typeof source['x-gds-uploadActionLabel'] === 'string' ? source['x-gds-uploadActionLabel'] : undefined,
    uploadPolicyText: typeof source['x-gds-uploadPolicyText'] === 'string' ? source['x-gds-uploadPolicyText'] : undefined,
    uploadState: typeof source['x-gds-uploadState'] === 'string' ? source['x-gds-uploadState'] as UploadDropzoneState : undefined,
    uploadProgress: typeof source['x-gds-uploadProgress'] === 'number' ? source['x-gds-uploadProgress'] : undefined,
  };
  const enumValues = Array.isArray(source.enum) ? source.enum : undefined;

  if (hidden) return { ...base, type: 'hidden' };
  if (condition) return { ...base, type: 'conditional' };
  if (enumValues?.length) {
    return {
      ...base,
      // A schema author opts into a checkbox group over a dropdown with
      // `x-gds-fieldType: 'checkbox-group'`; otherwise an enum renders as a select.
      type: customType === 'checkbox-group' ? 'checkbox-group' : 'select',
      options: enumValues.map((value) => ({ label: String(value), value: String(value) })),
    };
  }
  if (customType) return { ...base, type: customType as GdsSchemaFieldType };
  if (source.oneOf || source.anyOf) return { ...base, type: 'unsupported', unsupportedReason: 'oneOf/anyOf schemas require an explicit GDS renderer override.' };
  if (source.type === 'array') return { ...base, type: 'unsupported', unsupportedReason: 'Array schemas require an explicit GDS renderer override.' };
  if (source.type === 'object' || source.$ref) return { ...base, type: 'unsupported', unsupportedReason: 'Nested or referenced schemas require a separate form section or renderer override.' };
  if (source.type === 'boolean') return { ...base, type: 'boolean' };
  if (source.type === 'number' || source.type === 'integer') return { ...base, type: 'number' };
  if (source.format === 'email') return { ...base, type: 'email' };
  if (source.format === 'uri' || source.format === 'url') return { ...base, type: 'url' };
  if (source.format === 'date') return { ...base, type: 'date' };
  if (source.format === 'password') return { ...base, type: 'password' };
  if (source.format === 'binary' || source.format === 'data-url') return { ...base, type: 'file-upload' };
  if (Number(source.maxLength) > 160) return { ...base, type: 'textarea' };
  return { ...base, type: 'text' };
}

export function jsonSchemaToGdsFormSchema(schema: Record<string, unknown>, options: { id?: string } = {}): GdsSchemaAdapterResult {
  const id = options.id ?? (typeof schema.$id === 'string' ? schema.$id.replace(/[^a-zA-Z0-9_-]/g, '-') : 'schema-form');
  const properties = schema.properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {
      issues: [{ field: 'schema', message: 'JSON Schema form generation requires an object schema with properties.', severity: 'blocking' }],
      events: [createSchemaEvent('schema_parse_failed', 'Missing object properties.')],
    };
  }

  const required = new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);
  const fields = Object.entries(properties as Record<string, Record<string, unknown>>).map(([name, value]) => normalizeJsonField(id, name, value, required.has(name)));
  const unsupported = fields.filter((field) => field.type === 'unsupported');
  return {
    schema: {
      id,
      title: typeof schema.title === 'string' ? schema.title : undefined,
      description: typeof schema.description === 'string' ? schema.description : undefined,
      fields,
    },
    issues: unsupported.map((field) => ({ field: field.name, message: field.unsupportedReason ?? 'Unsupported schema field.', severity: 'warning' })),
    events: unsupported.map((field) => createSchemaEvent('unsupported_field', field.unsupportedReason, field.name)),
  };
}

export function openApiToGdsFormSchema(document: Record<string, any>, options: { id?: string; schemaName?: string } = {}): GdsSchemaAdapterResult {
  const schema = options.schemaName
    ? document.components?.schemas?.[options.schemaName]
    : document.schema ?? document.requestBody?.content?.['application/json']?.schema ?? document.components?.schemas?.[Object.keys(document.components?.schemas ?? {})[0]];
  if (!schema) {
    return {
      issues: [{ field: 'openapi', message: 'OpenAPI form generation requires a requestBody schema or components.schemas entry.', severity: 'blocking' }],
      events: [createSchemaEvent('schema_parse_failed', 'Missing OpenAPI schema.')],
    };
  }
  return jsonSchemaToGdsFormSchema(schema, { id: options.id ?? options.schemaName ?? 'openapi-form' });
}

function readZodShape(schema: any): Record<string, any> | null {
  const shape = schema?.shape ?? schema?._def?.shape;
  if (typeof shape === 'function') return shape();
  if (shape && typeof shape === 'object') return shape;
  return null;
}

function zodFieldToJson(name: string, field: any): Record<string, unknown> {
  const definition = field?._def ?? field?.def ?? {};
  const typeName = String(definition.typeName ?? definition.type ?? field?.type ?? '');
  const inner = definition.innerType ?? definition.schema;
  const optional = typeName.toLowerCase().includes('optional') || Boolean(inner);
  const target = inner ?? field;
  const targetDefinition = target?._def ?? target?.def ?? definition;
  const targetType = String(targetDefinition.typeName ?? targetDefinition.type ?? typeName).toLowerCase();
  const description = typeof target.description === 'string' ? target.description : undefined;
  const json: Record<string, unknown> = { title: humanizeFieldName(name), description };
  if (targetType.includes('number')) json.type = 'number';
  else if (targetType.includes('boolean')) json.type = 'boolean';
  else if (targetType.includes('enum')) {
    json.type = 'string';
    json.enum = targetDefinition.values ?? targetDefinition.entries ? Object.values(targetDefinition.entries ?? targetDefinition.values) : undefined;
  } else if (targetType.includes('array')) json.type = 'array';
  else if (targetType.includes('object')) json.type = 'object';
  else json.type = 'string';
  json['x-gds-optional'] = optional;
  return json;
}

export function zodToGdsFormSchema(zodSchema: unknown, options: { id?: string } = {}): GdsSchemaAdapterResult {
  const shape = readZodShape(zodSchema);
  if (!shape) {
    return {
      issues: [{ field: 'zod', message: 'Zod form generation requires an object schema with a readable shape.', severity: 'blocking' }],
      events: [createSchemaEvent('schema_parse_failed', 'Missing Zod object shape.')],
    };
  }
  const properties = Object.fromEntries(Object.entries(shape).map(([name, field]) => [name, zodFieldToJson(name, field)]));
  const required = Object.entries(properties).filter(([, value]) => value['x-gds-optional'] !== true).map(([name]) => name);
  return jsonSchemaToGdsFormSchema({ type: 'object', properties, required }, { id: options.id ?? 'zod-form' });
}

export function createGdsFormFromSchema(source: unknown, options: CreateGdsFormFromSchemaOptions): GdsSchemaAdapterResult {
  if (options.adapter === 'json-schema') return jsonSchemaToGdsFormSchema(source as Record<string, unknown>, { id: options.id });
  if (options.adapter === 'openapi') return openApiToGdsFormSchema(source as Record<string, unknown>, { id: options.id, schemaName: options.schemaName });
  return zodToGdsFormSchema(source, { id: options.id });
}

function scalarInitialValue(field: GdsFieldDescriptor): unknown {
  if (field.type === 'boolean') return false;
  if (field.type === 'checkbox-group' || field.type === 'repeatable') return [];
  return '';
}

/** Builds one blank row for a `repeatable` field from its sub-field defaults. */
function makeRepeatableRow(field: GdsFieldDescriptor): Record<string, unknown> {
  return Object.fromEntries((field.fields ?? []).map((sub) => [sub.name, sub.defaultValue ?? scalarInitialValue(sub)]));
}

function getInitialValues(schema: GdsFormSchema) {
  return Object.fromEntries(schema.fields.map((field) => {
    if (field.type === 'repeatable') {
      if (Array.isArray(field.defaultValue)) return [field.name, field.defaultValue];
      const minRows = field.minRows ?? 0;
      return [field.name, Array.from({ length: minRows }, () => makeRepeatableRow(field))];
    }
    return [field.name, field.defaultValue ?? scalarInitialValue(field)];
  }));
}

function isFileValue(value: unknown) {
  return typeof File !== 'undefined' && value instanceof File;
}

type GdsTranslate = (id: string, defaultMessage: string) => string;

function validateSchemaValues(schema: GdsFormSchema, values: Record<string, unknown>, renderers: GdsFieldRendererMap = {}, options: { uploadAdapter?: GdsSchemaUploadAdapter; t?: GdsTranslate } = {}): ValidationIssue[] {
  const t = options.t ?? ((_id: string, defaultMessage: string) => defaultMessage);
  return schema.fields.flatMap((field) => {
    if (field.hidden || field.type === 'hidden') return [];
    const value = values[field.name];
    const fileValues = Array.isArray(value) ? value : [];
    const text = String(value ?? '').trim();
    if (field.type === 'unsupported' && !renderers[field.name] && !renderers[field.type]) return [{ field: field.name, message: field.unsupportedReason ?? 'Unsupported schema field.', severity: 'blocking' as const }];
    if (field.type === 'checkbox-group') {
      const selected = Array.isArray(value) ? value : [];
      if (field.required && selected.length === 0) {
        return [{ field: field.name, message: `${field.label} ${t('gds.schemaForm.selectionRequired', 'requires at least one selection.')}`, severity: 'blocking' as const }];
      }
      return [];
    }
    if (field.type === 'repeatable') {
      const rows = (Array.isArray(value) ? value : []) as Array<Record<string, unknown>>;
      const minRows = field.minRows ?? (field.required ? 1 : 0);
      const issues: ValidationIssue[] = [];
      if (rows.length < minRows) {
        issues.push({ field: field.name, message: `${field.label} ${t('gds.schemaForm.minRowsPhrase', 'requires at least')} ${minRows} ${minRows === 1 ? t('gds.schemaForm.rowOne', 'row') : t('gds.schemaForm.rowMany', 'rows')}.`, severity: 'blocking' as const });
      }
      if (field.maxRows !== undefined && rows.length > field.maxRows) {
        issues.push({ field: field.name, message: `${field.label} ${t('gds.schemaForm.maxRowsPhrase', 'allows at most')} ${field.maxRows} ${field.maxRows === 1 ? t('gds.schemaForm.rowOne', 'row') : t('gds.schemaForm.rowMany', 'rows')}.`, severity: 'blocking' as const });
      }
      const requiredSubFields = (field.fields ?? []).filter((sub) => sub.required);
      const hasMissingRequired = rows.some((row) =>
        requiredSubFields.some((sub) => {
          const subValue = row?.[sub.name];
          if (sub.type === 'checkbox-group') return !Array.isArray(subValue) || subValue.length === 0;
          return subValue === undefined || subValue === null || String(subValue).trim() === '';
        }),
      );
      if (hasMissingRequired) {
        issues.push({ field: field.name, message: `${field.label} ${t('gds.schemaForm.rowMissingRequired', 'has a row with a missing required field.')}`, severity: 'blocking' as const });
      }
      return issues;
    }
    if (field.required && field.type === 'file-upload' && fileValues.length === 0) return [{ field: field.name, message: `${field.label} ${t('gds.schemaForm.required', 'is required.')}`, severity: 'blocking' as const }];
    if (field.required && field.type !== 'file-upload' && (value === undefined || value === null || text === '')) return [{ field: field.name, message: `${field.label} ${t('gds.schemaForm.required', 'is required.')}`, severity: 'blocking' as const }];
    if (field.type === 'file-upload' && field.maxFileSizeBytes && fileValues.some((file) => isFileValue(file) && file.size > field.maxFileSizeBytes!)) return [{ field: field.name, message: `${field.label} contains a file larger than ${field.maxFileSizeLabel ?? `${field.maxFileSizeBytes} bytes`}.`, severity: 'blocking' as const }];
    if (field.type === 'file-upload' && options.uploadAdapter && fileValues.some(isFileValue)) return [{ field: field.name, message: `${field.label} upload must finish before submit.`, severity: 'blocking' as const }];
    if (field.minLength && text.length > 0 && text.length < field.minLength) return [{ field: field.name, message: `${field.label} must contain at least ${field.minLength} characters.`, severity: 'blocking' as const }];
    if (field.maxLength && text.length > field.maxLength) return [{ field: field.name, message: `${field.label} must contain at most ${field.maxLength} characters.`, severity: 'blocking' as const }];
    if (field.pattern && text.length > 0 && !new RegExp(field.pattern).test(text)) return [{ field: field.name, message: `${field.label} does not match the required format.`, severity: 'blocking' as const }];
    if (field.type === 'email' && text.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return [{ field: field.name, message: `${field.label} must be a valid email address.`, severity: 'blocking' as const }];
    if (field.type === 'number' && value !== '' && value !== undefined) {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) return [{ field: field.name, message: `${field.label} must be a number.`, severity: 'blocking' as const }];
      if (field.min !== undefined && numberValue < field.min) return [{ field: field.name, message: `${field.label} must be at least ${field.min}.`, severity: 'blocking' as const }];
      if (field.max !== undefined && numberValue > field.max) return [{ field: field.name, message: `${field.label} must be at most ${field.max}.`, severity: 'blocking' as const }];
    }
    return [];
  });
}

export interface FileUploadFieldProps {
  id: string;
  label: string;
  field?: GdsFieldDescriptor;
  value?: unknown;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  maxFileSizeBytes?: number;
  maxFileSizeLabel?: string;
  actionLabel?: string;
  policyText?: string;
  state?: UploadDropzoneState;
  progressValue?: number;
  uploadAdapter?: GdsSchemaUploadAdapter;
  onUploadEvent?: (event: GdsSchemaFormEvent) => void;
  onChange?: (value: File[] | GdsSchemaUploadResult[]) => void;
}

function getUploadFileNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((file) => {
    if (typeof File !== 'undefined' && file instanceof File) return file.name;
    if (file && typeof file === 'object' && 'name' in file) return String((file as { name: unknown }).name);
    return String(file);
  });
}

export function FileUploadField({
  id,
  label,
  field,
  value,
  describedBy,
  invalid,
  required,
  accept,
  multiple,
  maxFileSizeBytes,
  maxFileSizeLabel,
  actionLabel,
  policyText,
  state,
  progressValue,
  uploadAdapter,
  onUploadEvent,
  onChange,
}: FileUploadFieldProps) {
  const abortRef = useRef<AbortController | null>(null);
  const lastFilesRef = useRef<File[]>([]);
  const [adapterState, setAdapterState] = useState<UploadDropzoneState | undefined>();
  const [adapterProgress, setAdapterProgress] = useState<number | undefined>();
  const [adapterError, setAdapterError] = useState<string | undefined>();
  const selectedFiles = getUploadFileNames(value);
  const oversize = Array.isArray(value) && maxFileSizeBytes
    ? value.some((file) => isFileValue(file) && file.size > maxFileSizeBytes)
    : false;
  const effectiveState = adapterState ?? state ?? (oversize ? 'too-large' : selectedFiles.length > 0 ? 'selected' : 'idle');
  const effectivePolicyText = oversize
    ? `One or more files exceed ${maxFileSizeLabel ?? `${maxFileSizeBytes} bytes`}.`
    : policyText;
  const effectiveProgressValue = adapterProgress ?? progressValue;

  const emitUploadEvent = useCallback((type: GdsSchemaFormEvent['type'], message?: string) => {
    onUploadEvent?.(createSchemaEvent(type, message, field?.name ?? id));
  }, [field?.name, id, onUploadEvent]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  const uploadFiles = useCallback((files: File[]) => {
    const selectedOversize = Boolean(maxFileSizeBytes && files.some((file) => file.size > maxFileSizeBytes));
    if (!uploadAdapter || !field || selectedOversize) {
      onChange?.(files);
      if (selectedOversize) {
        setAdapterState('too-large');
      }
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastFilesRef.current = files;
    onChange?.(files);
    setAdapterState('upload-pending');
    setAdapterProgress(0);
    setAdapterError(undefined);
    emitUploadEvent('upload_started');

    void uploadAdapter.upload({
      field,
      files,
      signal: controller.signal,
      onProgress: (progress) => {
        const clamped = Math.max(0, Math.min(100, progress));
        setAdapterProgress(clamped);
        emitUploadEvent('upload_progress');
      },
    }).then((result) => {
      if (controller.signal.aborted) {
        return;
      }
      const results = Array.isArray(result) ? result : [result];
      onChange?.(results);
      setAdapterState('selected');
      setAdapterProgress(100);
      setAdapterError(undefined);
      emitUploadEvent('upload_succeeded');
    }).catch((error) => {
      if (controller.signal.aborted) {
        return;
      }
      setAdapterState('upload-failed');
      setAdapterError(error instanceof Error ? error.message : 'Upload failed.');
      emitUploadEvent('upload_failed', error instanceof Error ? error.message : undefined);
    });
  }, [emitUploadEvent, field, maxFileSizeBytes, onChange, uploadAdapter]);

  const handleFilesSelected = (files: File[]) => {
    uploadFiles(files);
  };

  const retryUpload = () => {
    if (!lastFilesRef.current.length) {
      return;
    }
    emitUploadEvent('upload_retry_requested');
    uploadFiles(lastFilesRef.current);
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setAdapterState('idle');
    setAdapterProgress(undefined);
    setAdapterError(undefined);
    onChange?.([]);
    emitUploadEvent('upload_cancelled');
  };

  const removeUpload = () => {
    const controller = new AbortController();
    const currentValue = Array.isArray(value) ? value.filter((item): item is GdsSchemaUploadResult => !isFileValue(item) && typeof item === 'object' && item !== null) : [];

    abortRef.current?.abort();
    abortRef.current = controller;
    const completeRemoval = () => {
      onChange?.([]);
      setAdapterState('removed');
      setAdapterProgress(undefined);
      setAdapterError(undefined);
      emitUploadEvent('upload_removed');
    };

    if (!uploadAdapter?.remove || !field || currentValue.length === 0) {
      completeRemoval();
      return;
    }

    void uploadAdapter.remove({ field, value: currentValue, signal: controller.signal })
      .then(() => {
        if (!controller.signal.aborted) completeRemoval();
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        setAdapterState('upload-failed');
        setAdapterError(error instanceof Error ? error.message : 'Remove failed.');
        emitUploadEvent('upload_failed', error instanceof Error ? error.message : undefined);
      });
  };

  return (
    <Stack gap={4}>
      <UploadDropzone
        title={label}
        inputId={id}
        describedBy={describedBy}
        invalid={invalid || oversize}
        required={required}
        accept={accept}
        multiple={multiple}
        actionLabel={actionLabel}
        acceptedTypesLabel={accept}
        maxSizeLabel={maxFileSizeLabel}
        policyText={effectivePolicyText}
        state={effectiveState}
        selectedFiles={selectedFiles}
        progressValue={effectiveProgressValue}
        error={adapterError}
        mode="inline"
        retryAction={effectiveState === 'upload-failed' && uploadAdapter ? <Button size="xs" variant="light" onClick={retryUpload}>Retry upload</Button> : undefined}
        removeAction={effectiveState === 'upload-pending' && uploadAdapter ? <Button size="xs" variant="subtle" onClick={cancelUpload}>Cancel upload</Button> : selectedFiles.length > 0 ? <Button size="xs" variant="subtle" onClick={removeUpload}>Remove</Button> : undefined}
        onFilesSelected={handleFilesSelected}
      />
    </Stack>
  );
}

const visuallyHidden = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden' as const,
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
};

/**
 * Grouped multi-select rendered as a `fieldset` of checkboxes (value is a
 * `string[]`), distinct from the single `boolean` checkbox and the `select`
 * dropdown. The visible group label comes from the surrounding `FormField`; a
 * visually-hidden `legend` names the group for assistive tech.
 */
function CheckboxGroupField({ field, value, setValue, describedBy, invalid }: GdsFieldRendererContext) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const toggle = (optionValue: string, checked: boolean) => {
    setValue(checked ? [...selected, optionValue] : selected.filter((entry) => entry !== optionValue));
  };
  return (
    <fieldset
      data-gds-checkbox-group={field.name}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      style={{ border: 0, margin: 0, padding: 0, minInlineSize: 'auto' }}
    >
      <legend style={visuallyHidden}>{field.label}</legend>
      <Stack gap={6}>
        {(field.options ?? []).map((option) => (
          // Mantine Checkbox (not a raw native input) so the control inherits the GDS
          // theme styling and the governed forced-colors remap like every other control.
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
            aria-label={option.label}
            checked={selected.includes(option.value)}
            onChange={(event) => toggle(option.value, event.currentTarget.checked)}
          />
        ))}
      </Stack>
    </fieldset>
  );
}

interface RepeatableFieldProps extends GdsFieldRendererContext {
  renderers: GdsFieldRendererMap;
  uploadAdapter?: GdsSchemaUploadAdapter;
  onEvent?: (event: GdsSchemaFormEvent) => void;
}

/**
 * Repeatable row group: an "add another row of N fields" primitive. The value is
 * an array of row objects keyed by the descriptor's `fields`. Each row renders
 * its sub-fields through the same renderer path (override by sub-field name or
 * type, else the governed default control), with governed add/remove controls,
 * min/max bounds, focus management, and a live row-count announcement.
 */
function RepeatableField({ field, value, setValue, describedBy, invalid, renderers, uploadAdapter, onEvent }: RepeatableFieldProps) {
  const { t } = useGdsTranslation();
  const rows = (Array.isArray(value) ? value : []) as Array<Record<string, unknown>>;
  const subFields = field.fields ?? [];
  const minRows = field.minRows ?? 0;
  const canAdd = field.maxRows === undefined || rows.length < field.maxRows;
  const canRemove = rows.length > minRows;
  const addLabel = field.addRowLabel ?? t('gds.schemaForm.addRow', 'Add row');
  const removeLabel = field.removeRowLabel ?? t('gds.schemaForm.removeRow', 'Remove');
  const rowNoun = (count: number) => (count === 1 ? t('gds.schemaForm.rowOne', 'row') : t('gds.schemaForm.rowMany', 'rows'));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingFocus = useRef<'add' | 'remove' | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (pendingFocus.current === 'add') {
      const lastRow = containerRef.current?.querySelector(`[data-gds-repeatable-row="${rows.length - 1}"]`);
      lastRow?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    } else if (pendingFocus.current === 'remove') {
      addButtonRef.current?.focus();
    }
    pendingFocus.current = null;
  }, [rows.length]);

  const addRow = () => {
    pendingFocus.current = 'add';
    const next = [...rows, makeRepeatableRow(field)];
    setValue(next);
    setAnnouncement(`${t('gds.schemaForm.rowAdded', 'Row added')}, ${next.length} ${rowNoun(next.length)}.`);
  };
  const removeRow = (index: number) => {
    pendingFocus.current = 'remove';
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    setValue(next);
    setAnnouncement(`${t('gds.schemaForm.rowRemoved', 'Row removed')}, ${next.length} ${rowNoun(next.length)}.`);
  };
  const setRowFieldValue = (index: number, name: string, next: unknown) => {
    setValue(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [name]: next } : row)));
  };

  return (
    <Stack gap="sm" ref={containerRef} data-gds-repeatable={field.name} aria-describedby={describedBy} aria-invalid={invalid || undefined}>
      {rows.map((row, index) => (
        <Paper key={index} withBorder radius="md" p="sm" data-gds-repeatable-row={index}>
          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={600} c="dimmed">{`${field.label} ${index + 1}`}</Text>
              <Button
                type="button"
                size="xs"
                variant="subtle"
                color="red"
                disabled={!canRemove}
                aria-label={`${removeLabel}: ${field.label} ${index + 1}`}
                onClick={() => removeRow(index)}
              >
                {removeLabel}
              </Button>
            </Group>
            {subFields.map((sub) => {
              const subContext: GdsFieldRendererContext = {
                field: sub,
                value: row?.[sub.name],
                setValue: (next) => setRowFieldValue(index, sub.name, next),
                describedBy: `${field.name}-${index}-${sub.name}-description`,
                invalid: false,
              };
              const subRenderer = renderers[sub.name] ?? renderers[sub.type];
              return (
                <FormField key={sub.name} label={`${sub.label}${sub.required ? ` ${t('gds.schemaForm.requiredMarker', '(required)')}` : ''}`}>
                  {subRenderer ? subRenderer(subContext) : renderDefaultField(subContext, { uploadAdapter, onEvent, renderers })}
                </FormField>
              );
            })}
          </Stack>
        </Paper>
      ))}
      <Group>
        <Button ref={addButtonRef} type="button" size="xs" variant="light" disabled={!canAdd} onClick={addRow}>
          {addLabel}
        </Button>
      </Group>
      <div aria-live="polite" style={visuallyHidden}>{announcement}</div>
    </Stack>
  );
}

function renderDefaultField({ field, value, setValue, describedBy, invalid }: GdsFieldRendererContext, options: { uploadAdapter?: GdsSchemaUploadAdapter; onEvent?: (event: GdsSchemaFormEvent) => void; renderers?: GdsFieldRendererMap } = {}) {
  const common = {
    id: field.name,
    'aria-label': field.label,
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    required: field.required,
  };
  if (field.type === 'file-upload') {
    return (
      <FileUploadField
        {...common}
        label={field.label}
        field={field}
        value={value}
        accept={field.accept}
        multiple={field.multiple}
        maxFileSizeBytes={field.maxFileSizeBytes}
        maxFileSizeLabel={field.maxFileSizeLabel}
        actionLabel={field.uploadActionLabel}
        policyText={field.uploadPolicyText}
        state={field.uploadState}
        progressValue={field.uploadProgress}
        uploadAdapter={options.uploadAdapter}
        onUploadEvent={options.onEvent}
        onChange={(files) => setValue(files)}
      />
    );
  }
  if (field.type === 'checkbox-group') {
    return <CheckboxGroupField field={field} value={value} setValue={setValue} describedBy={describedBy} invalid={invalid} />;
  }
  if (field.type === 'repeatable') {
    return (
      <RepeatableField
        field={field}
        value={value}
        setValue={setValue}
        describedBy={describedBy}
        invalid={invalid}
        renderers={options.renderers ?? {}}
        uploadAdapter={options.uploadAdapter}
        onEvent={options.onEvent}
      />
    );
  }
  // Mobile input-focus auto-zoom guard for the raw native text-entry elements below:
  // unlike Mantine-backed controls (guarded via gdsTheme's Input.vars), these carry no
  // Mantine class and no --input-fz variable at all, so the theme-level fix can't reach
  // them. `boolean` (checkbox) is excluded since it never triggers focus-zoom.
  const textEntryStyle = { fontSize: 'max(1rem, 1em)' };
  if (field.type === 'boolean') return <input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.currentTarget.checked)} />;
  if (field.type === 'number') return <input {...common} style={textEntryStyle} type="number" value={String(value ?? '')} onChange={(event) => setValue(event.currentTarget.value === '' ? '' : Number(event.currentTarget.value))} />;
  if (field.type === 'select') {
    return (
      <select {...common} style={textEntryStyle} value={String(value ?? '')} onChange={(event) => setValue(event.currentTarget.value)}>
        <option value="">Select...</option>
        {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }
  if (field.type === 'textarea') return <textarea {...common} style={textEntryStyle} value={String(value ?? '')} onChange={(event) => setValue(event.currentTarget.value)} />;
  if (field.type === 'date') {
    // The field's stored value stays an ISO ("yyyy-mm-dd") string, matching the
    // native <input type="date"> contract this replaces, so existing onSubmit
    // handlers built against that string shape keep working unchanged.
    return (
      <GdsDateInput
        {...common}
        value={typeof value === 'string' && value.length > 0 ? value : null}
        onChange={(next) => setValue(next ? toIsoDateString(next) : '')}
      />
    );
  }
  return <input {...common} style={textEntryStyle} type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'} value={String(value ?? '')} onChange={(event) => setValue(event.currentTarget.value)} />;
}

/**
 * Renders a complete, validated form from a declarative `GdsFormSchema` instead
 * of hand-written inputs: each field's `type` maps to the governed control, with
 * required/length/pattern validation, submitting/error states, and optional file
 * upload built in. Use it for create/edit forms; generate the schema from JSON
 * Schema, OpenAPI, or Zod via `createGdsFormFromSchema` when you already have one.
 */
export function GdsSchemaForm<TValues extends Record<string, unknown> = Record<string, unknown>>({
  schema,
  onSubmit,
  renderers = {},
  uploadAdapter,
  onEvent,
  submitLabel = 'Submit',
}: GdsSchemaFormProps<TValues>) {
  const { t } = useGdsTranslation();
  const initialValues = useMemo(() => getInitialValues(schema), [schema]);
  const form = useGdsFormOrchestration({
    initialValues,
    validate: (snapshot) => validateSchemaValues(schema, Object.fromEntries(Object.entries(snapshot.fields).map(([name, field]) => [name, field.value])), renderers, { uploadAdapter, t }),
    onSubmit: async (values) => {
      try {
        await onSubmit(values as TValues);
      } catch (error) {
        onEvent?.(createSchemaEvent('generated_submit_failed', error instanceof Error ? error.message : 'Generated schema submit failed.'));
        throw error;
      }
    },
    onEvent,
  });

  return (
    <GdsFormProvider snapshot={form.snapshot}>
      <Stack gap="md">
        {schema.title ? <Text fw={700}>{schema.title}</Text> : null}
        {schema.description ? <Text size="sm" c="dimmed">{schema.description}</Text> : null}
        <GdsValidationSummary />
        {schema.fields.map((field) => {
          if (field.hidden || field.type === 'hidden') return null;
          const issue = form.snapshot.issues.find((item) => item.field === field.name && item.severity === 'blocking');
          if (field.type === 'unsupported' && !renderers[field.name] && !renderers[field.type]) {
            return <StateBlock key={field.name} variant="error" title={`Unsupported field: ${field.label}`} description={field.unsupportedReason ?? 'Provide a renderer override for this field.'} compact />;
          }
          const context = {
            field,
            value: form.snapshot.fields[field.name]?.value,
            setValue: (next: unknown) => form.setFieldValue(field.name, next),
            describedBy: `${field.name}-description ${field.name}-error`,
            invalid: Boolean(issue),
          };
          const renderer = renderers[field.name] ?? renderers[field.type];
          return (
            <FormField
              key={field.name}
              label={`${field.label}${field.required ? ` ${t('gds.schemaForm.requiredMarker', '(required)')}` : ''}`}
              description={field.description ? <Text id={`${field.name}-description`} size="xs" c="dimmed">{field.description}</Text> : undefined}
            >
              {renderer ? renderer(context) : renderDefaultField(context, { uploadAdapter, onEvent, renderers })}
              <span id={`${field.name}-error`}>
                <ValidatedFieldMessage field={field.name} />
              </span>
            </FormField>
          );
        })}
        <Button type="button" onClick={() => { void form.submit(); }} loading={form.snapshot.submitState === 'validating' || form.snapshot.submitState === 'submitting' || form.snapshot.submitState === 'optimistic'}>
          {submitLabel}
        </Button>
      </Stack>
    </GdsFormProvider>
  );
}
