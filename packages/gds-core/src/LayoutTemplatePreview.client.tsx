'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Group, NativeSelect, Stack, Text, Textarea } from '@mantine/core';
import { SectionPanel } from './SectionPanel';
import { StateBlock } from './StateBlock';
import {
  type GdsLayoutTemplate,
  type LayoutSchema,
  getGdsLayoutTemplates,
  renderGdsLayoutWithDiagnostics,
} from './LayoutBlocks';

/** Props for `GdsLayoutTemplatePreview`. */
export interface GdsLayoutTemplatePreviewProps {
  /** Templates to choose from; defaults to the built-in GDS layout templates. */
  templates?: GdsLayoutTemplate[];
  /** Id of the template selected initially; falls back to the first template. */
  initialTemplateId?: string;
  /** Panel heading; defaults to "Template cookbook". */
  title?: string;
  /** Panel description shown under the title. */
  description?: string;
}

function templateText(template: GdsLayoutTemplate) {
  return JSON.stringify(template.schema, null, 2);
}

function parseSchema(schemaText: string): LayoutSchema {
  return JSON.parse(schemaText) as LayoutSchema;
}

/**
 * Interactive layout-template cookbook: pick a template, edit its schema JSON, and
 * apply it to render the live layout with validation diagnostics; also supports
 * resetting to the template and copying the schema to the clipboard.
 */
export function GdsLayoutTemplatePreview({
  templates = getGdsLayoutTemplates(),
  initialTemplateId,
  title = 'Template cookbook',
  description = 'Pick a template, edit JSON, then apply to preview live diagnostics and rendered layout.',
}: GdsLayoutTemplatePreviewProps) {
  const initialTemplate = templates.find((template) => template.id === initialTemplateId) ?? templates[0];
  const initialText = initialTemplate ? templateText(initialTemplate) : '{\n  "version": "1",\n  "blocks": []\n}';
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id ?? '');
  const [schemaText, setSchemaText] = useState(initialText);
  const [appliedSchemaText, setAppliedSchemaText] = useState(initialText);
  const [editorError, setEditorError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  const renderedTemplate = useMemo(() => {
    try {
      return renderGdsLayoutWithDiagnostics(parseSchema(appliedSchemaText));
    } catch {
      return {
        issues: [{ blockId: 'schema', message: 'Unable to parse schema JSON. Make sure the payload is valid JSON.' }],
        node: (
          <StateBlock
            variant="error"
            title="Schema parser error"
            description="The current editor JSON is not valid. Fix the braces, quotes, and commas before applying."
          />
        ),
      };
    }
  }, [appliedSchemaText]);

  const handleTemplateChange = (nextTemplateId: string) => {
    const nextTemplate = templates.find((template) => template.id === nextTemplateId);

    if (!nextTemplate) {
      return;
    }

    const nextText = templateText(nextTemplate);
    setSelectedTemplateId(nextTemplate.id);
    setSchemaText(nextText);
    setAppliedSchemaText(nextText);
    setEditorError('');
    setCopyState('idle');
  };

  const applySchema = () => {
    try {
      parseSchema(schemaText);
      setAppliedSchemaText(schemaText);
      setEditorError('');
      setCopyState('idle');
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Invalid JSON payload');
    }
  };

  const resetTemplate = () => {
    handleTemplateChange(selectedTemplateId);
  };

  const copySchema = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyState('error');
      return;
    }

    try {
      await navigator.clipboard.writeText(appliedSchemaText);
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
  };

  const issueCount = renderedTemplate.issues.length;

  return (
    <SectionPanel title={title} description={description}>
      <Stack gap="md">
        <NativeSelect
          label="Template preset"
          aria-label="Template preset"
          value={selectedTemplateId}
          onChange={(event) => handleTemplateChange(event.currentTarget.value)}
          data={templates.map((template) => ({ value: template.id, label: template.title }))}
        />
        <Textarea
          label="Current template summary"
          value={selectedTemplate ? `${selectedTemplate.description}\nUse case: ${selectedTemplate.useCase}` : ''}
          readOnly
          autosize
          minRows={2}
        />
        <Textarea
          label="Layout schema JSON"
          aria-label="Layout schema JSON"
          value={schemaText}
          minRows={16}
          autosize
          onChange={(event) => setSchemaText(event.currentTarget.value)}
        />
        <Group gap="sm">
          <Button type="button" onClick={applySchema}>Apply schema</Button>
          <Button type="button" variant="default" onClick={resetTemplate}>Reset to template</Button>
          <Button type="button" variant="light" onClick={() => void copySchema()}>Copy schema</Button>
        </Group>
        {editorError ? <StateBlock variant="error" title="Invalid JSON" description={editorError} /> : null}
        {copyState === 'success' ? <Alert color="green">Schema copied to clipboard.</Alert> : null}
        {copyState === 'error' ? <Alert color="yellow">Clipboard copy is unavailable in this browser context.</Alert> : null}
        <Text aria-live="polite">
          Diagnostic result: {issueCount === 0 ? 'no issues' : `${issueCount} issue${issueCount === 1 ? '' : 's'}`}
        </Text>
        <SectionPanel
          title={`Schema render preview (${selectedTemplate?.schema.version ?? '1'})`}
          description="Rendered output is produced from the current applied schema."
        >
          {renderedTemplate.node}
        </SectionPanel>
        {issueCount ? (
          <SectionPanel title="Schema issues" description="Fix these payload issues before using the template in production code.">
            <Stack component="ul" gap={4}>
              {renderedTemplate.issues.map((issue, index) => (
                <li key={`${issue.blockId ?? 'schema'}-${index}`}>{issue.blockId ? `${issue.blockId}: ` : ''}{issue.message}</li>
              ))}
            </Stack>
          </SectionPanel>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
