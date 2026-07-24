/**
 * Dedicated subpath entry for `GdsRichTextEditor` (`@sovereignsquad/gds-core/rich-text-editor`).
 *
 * Kept out of the main `.`/`./client` barrel deliberately: its Tiptap/
 * ProseMirror "Content engine" dependency (see DEPENDENCY_GOVERNANCE.md) is
 * meaningfully larger than the rest of gds-core's dependency footprint, and
 * bundlers that group a whole package's output into one vendor chunk by file
 * path (a common, not unusual, manual-chunking pattern — both apps in this
 * monorepo use it) can't tree-shake it back out even if a consumer never
 * renders the editor. A dedicated entry point means importing anything else
 * from gds-core never pulls this in — only `import { GdsRichTextEditor } from
 * '@sovereignsquad/gds-core/rich-text-editor'` does.
 */
export * from './GdsRichTextEditor.client';
