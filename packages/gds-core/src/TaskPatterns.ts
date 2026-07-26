/** The canonical lifecycle states every governed task pattern must cover. */
export type GdsTaskState = 'start' | 'in-progress' | 'success' | 'empty' | 'error' | 'retry' | 'cancelled';

/** A telemetry event a pattern emits, named with the metadata-only fields carried in its payload. */
export interface GdsPatternTelemetryEvent {
  name: string;
  payloadFields: string[];
}

/** One step within a task pattern, naming its state, the component contracts it uses, accessibility requirements, and retry/timeout guidance. */
export interface GdsTaskStep {
  id: string;
  label: string;
  state: GdsTaskState;
  componentContracts: string[];
  accessibility: string[];
  retryTimeout: string;
}

/** A complete governed task pattern: its intent, trigger, required data, states, steps, component contracts, telemetry, copy, accessibility, edge cases, and anti-patterns. */
export interface GdsTaskPattern {
  id: string;
  title: string;
  intent: string;
  trigger: string;
  requiredData: string[];
  states: GdsTaskState[];
  steps: GdsTaskStep[];
  componentContracts: string[];
  telemetry: GdsPatternTelemetryEvent[];
  copy: {
    start: string;
    success: string;
    error: string;
  };
  accessibility: string[];
  edgeCases: string[];
  doNotBuild: string[];
}

const allTaskStates: GdsTaskState[] = ['start', 'in-progress', 'success', 'empty', 'error', 'retry', 'cancelled'];

const taskPatterns: GdsTaskPattern[] = [
  {
    id: 'create-resource',
    title: 'Create resource',
    intent: 'Create a durable admin resource from a governed schema or form.',
    trigger: 'Operator chooses Create from a resource manager.',
    requiredData: ['resource type', 'schema or fields', 'permission result'],
    states: allTaskStates,
    componentContracts: ['GdsResourceManager', 'GdsSchemaForm', 'useGdsFormOrchestration', 'GdsNotificationCenter'],
    steps: [
      { id: 'open', label: 'Open create surface', state: 'start', componentContracts: ['GdsResourceManager'], accessibility: ['Create button is keyboard reachable and named.'], retryTimeout: 'No retry required before submit.' },
      { id: 'validate', label: 'Validate required fields', state: 'in-progress', componentContracts: ['GdsSchemaForm', 'GdsValidationSummary'], accessibility: ['Validation summary links to fields.'], retryTimeout: 'Client validation is immediate; server validation maps back to fields.' },
      { id: 'submit', label: 'Submit resource', state: 'success', componentContracts: ['useGdsFormOrchestration'], accessibility: ['Submitting state remains visible.'], retryTimeout: 'Use bounded submit timeout and retry from failed state.' },
    ],
    telemetry: [{ name: 'resource_create_started', payloadFields: ['resourceType'] }, { name: 'resource_create_completed', payloadFields: ['resourceType'] }],
    copy: { start: 'Create resource', success: 'Resource created.', error: 'Resource could not be created. Review the fields and retry.' },
    accessibility: ['Visible labels', 'field errors', 'keyboard submit', 'status announcement'],
    edgeCases: ['permission denied', 'duplicate resource', 'server validation failure'],
    doNotBuild: ['Route-local form wrapper', 'native alert for errors', 'unlabelled create icon'],
  },
  {
    id: 'review-submission',
    title: 'Review submission',
    intent: 'Inspect submitted content, evidence, and action history before approval.',
    trigger: 'Operator opens a pending submission from a table or queue.',
    requiredData: ['submission id', 'review status', 'audit metadata'],
    states: allTaskStates,
    componentContracts: ['GdsResourceManager', 'DetailProfileShell', 'GdsDrawer', 'EvidencePanel'],
    steps: [
      { id: 'open-detail', label: 'Open detail surface', state: 'start', componentContracts: ['GdsResourceManager', 'DetailProfileShell'], accessibility: ['Detail section has an accessible title.'], retryTimeout: 'Retry detail loading on stale data.' },
      { id: 'inspect', label: 'Inspect evidence and metadata', state: 'in-progress', componentContracts: ['EvidencePanel'], accessibility: ['Evidence is text-readable, not color-only.'], retryTimeout: 'No retry required.' },
      { id: 'resolve', label: 'Resolve review outcome', state: 'success', componentContracts: ['GdsConfirmProvider', 'GdsNotificationCenter'], accessibility: ['Outcome buttons are named and confirmation returns focus.'], retryTimeout: 'Retry failed action with stale detail preserved.' },
    ],
    telemetry: [{ name: 'submission_review_opened', payloadFields: ['resourceType'] }, { name: 'submission_review_completed', payloadFields: ['outcome'] }],
    copy: { start: 'Review submission', success: 'Submission reviewed.', error: 'Review action failed. The submission remains unchanged.' },
    accessibility: ['focus return', 'visible review status', 'screen-reader detail title'],
    edgeCases: ['submission deleted during review', 'permission change', 'missing evidence'],
    doNotBuild: ['Unbounded modal for long review', 'approval without status copy'],
  },
  {
    id: 'bulk-approve',
    title: 'Bulk approve',
    intent: 'Approve selected rows while making partial success and recovery visible.',
    trigger: 'Operator selects multiple rows and chooses Approve.',
    requiredData: ['selected ids', 'permission result', 'bulk executor'],
    states: allTaskStates,
    componentContracts: ['GdsDataTable', 'BulkActionsBar', 'GdsConfirmProvider', 'GdsNotificationCenter'],
    steps: [
      { id: 'select', label: 'Select target rows', state: 'start', componentContracts: ['GdsDataTable'], accessibility: ['Row and select-all checkboxes have names.'], retryTimeout: 'Selection clears on filtering stale rows.' },
      { id: 'confirm', label: 'Confirm bulk action', state: 'in-progress', componentContracts: ['GdsConfirmProvider'], accessibility: ['Confirmation names affected count.'], retryTimeout: 'No retry before confirmation.' },
      { id: 'apply', label: 'Apply and report result', state: 'success', componentContracts: ['GdsNotificationCenter'], accessibility: ['Partial success is announced.'], retryTimeout: 'Retry failed subset only.' },
    ],
    telemetry: [{ name: 'bulk_approve_started', payloadFields: ['count'] }, { name: 'bulk_approve_completed', payloadFields: ['count', 'failedCount'] }],
    copy: { start: 'Approve selected', success: 'Selected items approved.', error: 'Some items could not be approved. Retry the failed items.' },
    accessibility: ['keyboard row selection', 'confirmation required', 'partial failure status'],
    edgeCases: ['partial bulk success', 'stale selection', 'permission denied'],
    doNotBuild: ['Silent bulk mutation', 'confirmation without count'],
  },
  {
    id: 'recover-failed-upload',
    title: 'Recover failed upload',
    intent: 'Recover a media upload after validation or network failure.',
    trigger: 'Upload queue item enters failed state.',
    requiredData: ['file metadata', 'validation policy', 'upload adapter'],
    states: allTaskStates,
    componentContracts: ['GdsAssetManager', 'UploadDropzone', 'GdsAssetPreviewCard'],
    steps: [
      { id: 'show-error', label: 'Show terminal failure', state: 'error', componentContracts: ['GdsAssetManager'], accessibility: ['Error text has role alert.'], retryTimeout: 'Timeout comes from adapter policy.' },
      { id: 'retry', label: 'Retry upload', state: 'retry', componentContracts: ['useGdsAssetUploadQueue'], accessibility: ['Retry button is keyboard reachable.'], retryTimeout: 'Bound retry attempts in adapter.' },
      { id: 'metadata', label: 'Complete alt and caption', state: 'success', componentContracts: ['GdsAssetPreviewCard'], accessibility: ['Alt/caption policy is visible.'], retryTimeout: 'No network retry required.' },
    ],
    telemetry: [{ name: 'upload_failed', payloadFields: ['reason'] }, { name: 'upload_retry', payloadFields: ['attempt'] }],
    copy: { start: 'Upload asset', success: 'Asset ready.', error: 'Upload failed. Retry or remove the asset.' },
    accessibility: ['file control labelled', 'progress announced', 'metadata policy visible'],
    edgeCases: ['oversized file', 'unsupported type', 'network interruption'],
    doNotBuild: ['Hidden upload input without visible button', 'publish without required alt text'],
  },
  {
    id: 'copy-public-link',
    title: 'Copy public link',
    intent: 'Copy a shareable public URL with unavailable-link recovery.',
    trigger: 'Operator chooses Copy preview or Share.',
    requiredData: ['public URL', 'permission result'],
    states: allTaskStates,
    componentContracts: ['ShareButtonGroup', 'GdsResourceManager', 'GdsNotificationCenter'],
    steps: [
      { id: 'request-link', label: 'Request public link', state: 'in-progress', componentContracts: ['GdsResourceManager'], accessibility: ['Button name states target action.'], retryTimeout: 'Retry if link generation fails.' },
      { id: 'copy', label: 'Copy or show fallback', state: 'success', componentContracts: ['ShareButtonGroup'], accessibility: ['Fallback link is visible text.'], retryTimeout: 'Clipboard failure falls back to visible URL.' },
    ],
    telemetry: [{ name: 'public_link_requested', payloadFields: ['resourceType'] }, { name: 'public_link_failed', payloadFields: ['reason'] }],
    copy: { start: 'Copy public link', success: 'Public link copied.', error: 'Public link is not available. Check publish status and retry.' },
    accessibility: ['visible fallback URL', 'button label', 'status announcement'],
    edgeCases: ['expired public link', 'clipboard denied', 'unpublished resource'],
    doNotBuild: ['Icon-only copy without label', 'copy failure with no fallback'],
  },
  {
    id: 'publish-toggle',
    title: 'Publish or unpublish',
    intent: 'Change public visibility with confirmation and rollback copy.',
    trigger: 'Operator toggles publish state.',
    requiredData: ['current status', 'permission result', 'visibility executor'],
    states: allTaskStates,
    componentContracts: ['GdsConfirmProvider', 'GdsResourceManager', 'StatusBadge'],
    steps: [
      { id: 'read-status', label: 'Show current status', state: 'start', componentContracts: ['StatusBadge'], accessibility: ['Status is not color-only.'], retryTimeout: 'No retry required.' },
      { id: 'confirm-change', label: 'Confirm visibility change', state: 'in-progress', componentContracts: ['GdsConfirmProvider'], accessibility: ['Confirmation states publish impact.'], retryTimeout: 'No retry before action.' },
      { id: 'apply-status', label: 'Apply visibility change', state: 'success', componentContracts: ['GdsResourceManager'], accessibility: ['New status is visible after completion.'], retryTimeout: 'Retry failed executor; keep previous status visible.' },
    ],
    telemetry: [{ name: 'publish_toggle_started', payloadFields: ['from', 'to'] }, { name: 'publish_toggle_completed', payloadFields: ['to'] }],
    copy: { start: 'Change publish status', success: 'Publish status updated.', error: 'Publish status was not changed. Retry when the service recovers.' },
    accessibility: ['confirmation required', 'status text visible', 'focus return'],
    edgeCases: ['permission denied', 'stale status', 'public cache delay'],
    doNotBuild: ['Immediate destructive visibility toggle', 'color-only published indicator'],
  },
  {
    id: 'confirm-destructive-action',
    title: 'Confirm destructive action',
    intent: 'Confirm irreversible or risky operations with undo or explicit recovery path.',
    trigger: 'Operator chooses delete, archive, revoke, or destructive bulk action.',
    requiredData: ['risk level', 'target label', 'executor'],
    states: allTaskStates,
    componentContracts: ['GdsConfirmProvider', 'GdsResourceManager', 'GdsNotificationCenter'],
    steps: [
      { id: 'present-risk', label: 'Present risk-specific copy', state: 'start', componentContracts: ['GdsConfirmProvider'], accessibility: ['Dialog title and description name the target.'], retryTimeout: 'No retry before confirmation.' },
      { id: 'execute', label: 'Execute destructive action', state: 'in-progress', componentContracts: ['GdsConfirmProvider'], accessibility: ['Submitting state blocks duplicate activation.'], retryTimeout: 'Use bounded executor timeout.' },
      { id: 'recover', label: 'Show undo or recovery', state: 'success', componentContracts: ['GdsNotificationCenter'], accessibility: ['Recovery action remains reachable.'], retryTimeout: 'Retry failed executor from same confirmation context.' },
    ],
    telemetry: [{ name: 'destructive_confirmed', payloadFields: ['riskLevel'] }, { name: 'destructive_failed', payloadFields: ['reason'] }],
    copy: { start: 'Confirm destructive action', success: 'Action completed.', error: 'Action failed. Nothing was changed.' },
    accessibility: ['focus trap', 'return focus', 'explicit cancel', 'visible recovery action'],
    edgeCases: ['operator cancels', 'executor timeout', 'undo unavailable'],
    doNotBuild: ['window.confirm', 'destructive action without target label'],
  },
];

function clonePattern(pattern: GdsTaskPattern): GdsTaskPattern {
  return {
    ...pattern,
    requiredData: [...pattern.requiredData],
    states: [...pattern.states],
    componentContracts: [...pattern.componentContracts],
    steps: pattern.steps.map((step) => ({
      ...step,
      componentContracts: [...step.componentContracts],
      accessibility: [...step.accessibility],
    })),
    telemetry: pattern.telemetry.map((event) => ({ ...event, payloadFields: [...event.payloadFields] })),
    copy: { ...pattern.copy },
    accessibility: [...pattern.accessibility],
    edgeCases: [...pattern.edgeCases],
    doNotBuild: [...pattern.doNotBuild],
  };
}

/** Returns deep clones of all built-in task patterns, so callers can read or mutate them without affecting the canonical definitions. */
export function getGdsTaskPatterns() {
  return taskPatterns.map(clonePattern);
}

/** Returns a deep clone of the task pattern with the given id, or `undefined` if none matches. */
export function getGdsTaskPattern(id: string) {
  const pattern = taskPatterns.find((item) => item.id === id);
  return pattern ? clonePattern(pattern) : undefined;
}

/** Validates task patterns (the built-ins by default), returning a list of problems: duplicate ids, missing states, or absent telemetry/accessibility/do-not-build guidance. Empty means valid. */
export function validateGdsTaskPatterns(patterns: GdsTaskPattern[] = taskPatterns) {
  const ids = new Set<string>();
  const issues: string[] = [];
  for (const pattern of patterns) {
    if (ids.has(pattern.id)) issues.push(`Duplicate task pattern id: ${pattern.id}`);
    ids.add(pattern.id);
    for (const state of allTaskStates) {
      if (!pattern.states.includes(state)) issues.push(`${pattern.id} is missing state ${state}`);
    }
    if (!pattern.telemetry.length) issues.push(`${pattern.id} must define telemetry.`);
    if (!pattern.accessibility.length) issues.push(`${pattern.id} must define accessibility guidance.`);
    if (!pattern.doNotBuild.length) issues.push(`${pattern.id} must define do-not-build guidance.`);
  }
  return issues;
}
