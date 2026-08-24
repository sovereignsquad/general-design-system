'use client';

import { Fragment, useEffect } from 'react';
import { ActionIcon, Box, Divider, Group, Text } from '@mantine/core';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { GdsIcon, type GdsIconName } from './icons';

/** Props for the `GdsRichTextEditor` component. */
export interface GdsRichTextEditorProps {
  /** Controlled HTML value. */
  value?: string;
  /** Called with the editor's serialized HTML on every content change. */
  onChange?: (html: string) => void;
  label?: string;
  description?: string;
  /** Accessible name for the editable region; defaults to `label`. */
  ariaLabel?: string;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number | string;
}

interface ToolbarAction {
  key: string;
  icon: GdsIconName;
  label: string;
  isActive: boolean;
  run: () => void;
}

interface ToolbarActiveState {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  h1: boolean;
  h2: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  code: boolean;
}

function readToolbarActiveState(editor: Editor): ToolbarActiveState {
  return {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    strike: editor.isActive('strike'),
    h1: editor.isActive('heading', { level: 1 }),
    h2: editor.isActive('heading', { level: 2 }),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    blockquote: editor.isActive('blockquote'),
    code: editor.isActive('code'),
  };
}

function getToolbarActions(editor: Editor, active: ToolbarActiveState): ToolbarAction[] {
  return [
    { key: 'bold', icon: 'Bold', label: 'Bold', isActive: active.bold, run: () => editor.chain().focus().toggleBold().run() },
    { key: 'italic', icon: 'Italic', label: 'Italic', isActive: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { key: 'strike', icon: 'Strikethrough', label: 'Strikethrough', isActive: active.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { key: 'h1', icon: 'Heading1', label: 'Heading 1', isActive: active.h1, run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { key: 'h2', icon: 'Heading2', label: 'Heading 2', isActive: active.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: 'bulletList', icon: 'List', label: 'Bullet list', isActive: active.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { key: 'orderedList', icon: 'OrderedList', label: 'Numbered list', isActive: active.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { key: 'blockquote', icon: 'Quote', label: 'Quote', isActive: active.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { key: 'code', icon: 'InlineCode', label: 'Inline code', isActive: active.code, run: () => editor.chain().focus().toggleCode().run() },
  ];
}

/**
 * GDS-owned rich text / content editor, wrapping Tiptap (fully encapsulated —
 * see DEPENDENCY_GOVERNANCE.md's "Content engine" class; consumers never
 * import `@tiptap/*` or touch its `Editor`/extension APIs directly). Fills
 * the gap where "Content Ops Editor" patterns owned the surrounding layout
 * but not the actual text-editing surface inside them (issue 392).
 *
 * Chosen over a hand-rolled contentEditable build per the same
 * lowest-dependency/rock-solid-reliability standard used for KanbanBoard's
 * @dnd-kit choice — hand-rolling selection/undo/paste-sanitization/IME
 * composition reliably is a much larger, more fragile undertaking than
 * reusing ProseMirror's battle-tested editing model.
 */
export function GdsRichTextEditor({
  value = '',
  onChange,
  label,
  description,
  ariaLabel,
  placeholder,
  readOnly = false,
  minHeight = 180,
}: GdsRichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => onChange?.(updatedEditor.getHTML()),
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? label ?? 'Rich text editor',
        role: 'textbox',
        'aria-multiline': 'true',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  // Toolbar active-state (bold/italic/heading/etc.) depends on the editor's
  // selection and stored marks, which change on transactions that don't
  // necessarily touch document content — plain useState/onUpdate wouldn't
  // re-render for those, so this reads the state through Tiptap's own
  // change-detecting subscription instead.
  const activeState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => (currentEditor ? readToolbarActiveState(currentEditor) : null),
  });

  if (!editor) {
    return null;
  }

  const actions = getToolbarActions(editor, activeState ?? readToolbarActiveState(editor));

  return (
    <Box>
      {label ? (
        <Text component="label" size="sm" fw={500} mb={4} display="block">
          {label}
        </Text>
      ) : null}
      {description ? (
        <Text size="xs" c="dimmed" mb="xs">
          {description}
        </Text>
      ) : null}
      {!readOnly ? (
        <Group role="toolbar" aria-label="Text formatting" gap={4} mb="xs" wrap="wrap">
          {actions.map((action, index) => (
            <Fragment key={action.key}>
              {(index === 3 || index === 5 || index === 8) && <Divider orientation="vertical" />}
              <ActionIcon
                aria-label={action.label}
                aria-pressed={action.isActive}
                variant={action.isActive ? 'filled' : 'default'}
                size="sm"
                data-gds-target-exception="dense-toolbar"
                onClick={action.run}
              >
                <GdsIcon name={action.icon} size="xs" decorative />
              </ActionIcon>
            </Fragment>
          ))}
        </Group>
      ) : null}
      <Box
        style={{
          minHeight,
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-sm)',
          padding: 'var(--mantine-spacing-sm)',
          fontSize: 'max(1rem, var(--mantine-font-size-sm))',
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
