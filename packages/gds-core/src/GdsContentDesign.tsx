import { Badge, Card, Group, List, Stack, Text, Title } from '@mantine/core';
import { createGdsTextExpansionFixture } from './GdsI18nRuntime';

/** Severity/intent lane a content pattern or message belongs to. */
export type GdsMessageSeverity = 'info' | 'success' | 'warning' | 'error' | 'destructive' | 'empty' | 'permission';
/** Identifier for each governed UX content pattern (error recovery, empty state, primary CTA, and so on). */
export type GdsContentPatternId =
  | 'error-recovery'
  | 'retryable-failure'
  | 'destructive-confirmation'
  | 'empty-state'
  | 'permission-denied'
  | 'primary-cta'
  | 'form-hint'
  | 'success-feedback';

/** Contract for one placeholder token in a copy template: its name, description, example, and whether it is required and localization-safe. */
export interface GdsPlaceholderContract {
  name: string;
  description: string;
  required: boolean;
  example: string;
  localizationSafe: boolean;
}

/** A localizable copy template for a content pattern: its i18n key, text with placeholders, and recommended max length. */
export interface GdsCopyTemplate {
  id: string;
  patternId: GdsContentPatternId;
  i18nKey: string;
  text: string;
  placeholders: GdsPlaceholderContract[];
  maxRecommendedLength: number;
}

/** Full definition of a governed content pattern: intent, voice rules, component/task mappings, live-region policy, templates, and accessibility/localization guidance. */
export interface GdsContentPattern {
  id: GdsContentPatternId;
  title: string;
  intent: string;
  severity: GdsMessageSeverity;
  voiceRules: string[];
  componentContracts: string[];
  taskPatterns: string[];
  ariaLive: 'off' | 'polite' | 'assertive';
  telemetryEvents: string[];
  templates: GdsCopyTemplate[];
  localization: {
    expansionLocales: string[];
    placeholderRules: string[];
  };
  accessibility: string[];
  edgeCases: string[];
  doNotWrite: string[];
}

function placeholder(name: string, description: string, example: string, required = true): GdsPlaceholderContract {
  return {
    name,
    description,
    required,
    example,
    localizationSafe: !/[{}]/.test(example),
  };
}

const contentPatterns: GdsContentPattern[] = [
  {
    id: 'error-recovery',
    title: 'Error recovery',
    intent: 'Explain what failed, what remains safe, and the next recovery action.',
    severity: 'error',
    voiceRules: ['Name the failed operation.', 'Avoid blame.', 'State whether data changed.', 'Offer one next action.'],
    componentContracts: ['StateBlock', 'InlineAlert', 'GdsNotificationCenter'],
    taskPatterns: ['review-submission', 'create-resource'],
    ariaLive: 'assertive',
    telemetryEvents: ['error_visible', 'retry_requested'],
    templates: [
      {
        id: 'error-recovery.default',
        patternId: 'error-recovery',
        i18nKey: 'gds.content.errorRecovery',
        text: '{operation} could not be completed. Nothing was changed. Retry when the service recovers.',
        placeholders: [placeholder('operation', 'Human-readable operation label.', 'Save changes')],
        maxRecommendedLength: 120,
      },
    ],
    localization: {
      expansionLocales: ['de', 'ru', 'ar', 'he'],
      placeholderRules: ['Keep placeholders as named tokens.', 'Do not concatenate operation names outside the translated sentence.'],
    },
    accessibility: ['Use role="alert" or assertive live region for blocking failures.', 'Do not rely on color or icon alone.'],
    edgeCases: ['unknown error', 'retry unavailable', 'partial success'],
    doNotWrite: ['Something went wrong.', 'Oops.', 'Failed.'],
  },
  {
    id: 'retryable-failure',
    title: 'Retryable failure',
    intent: 'Distinguish temporary service failures from terminal validation failures.',
    severity: 'warning',
    voiceRules: ['Say retry is available.', 'Keep failed work visible.', 'Avoid promising automatic recovery unless implemented.'],
    componentContracts: ['AsyncSurface', 'GdsToastProvider', 'GdsDataTable'],
    taskPatterns: ['recover-failed-upload', 'copy-public-link'],
    ariaLive: 'polite',
    telemetryEvents: ['retry_visible', 'retry_requested', 'retry_failed'],
    templates: [
      {
        id: 'retryable-failure.default',
        patternId: 'retryable-failure',
        i18nKey: 'gds.content.retryableFailure',
        text: '{resource} is still available. Retry the request or come back later.',
        placeholders: [placeholder('resource', 'The user-visible object still preserved.', 'This upload')],
        maxRecommendedLength: 100,
      },
    ],
    localization: { expansionLocales: ['de', 'ru'], placeholderRules: ['Keep retry action as a separate button label.'] },
    accessibility: ['Retry control must be keyboard reachable and named.', 'Status copy must remain visible during retrying state.'],
    edgeCases: ['network timeout', 'stale resource', 'retry max reached'],
    doNotWrite: ['Try again maybe.', 'Request died.'],
  },
  {
    id: 'destructive-confirmation',
    title: 'Destructive confirmation',
    intent: 'Name the target, consequence, and recovery limit before destructive execution.',
    severity: 'destructive',
    voiceRules: ['Name the target.', 'Use explicit verbs.', 'State undo/recovery availability.', 'Keep cancel neutral.'],
    componentContracts: ['GdsConfirmProvider', 'ConfirmDialog', 'GdsNotificationCenter'],
    taskPatterns: ['confirm-destructive-action', 'publish-toggle'],
    ariaLive: 'assertive',
    telemetryEvents: ['destructive_confirm_visible', 'destructive_confirmed', 'destructive_cancelled'],
    templates: [
      {
        id: 'destructive-confirmation.delete',
        patternId: 'destructive-confirmation',
        i18nKey: 'gds.content.confirmDelete',
        text: 'Delete {target}? This removes it for everyone. You can restore it for {undoWindow}.',
        placeholders: [
          placeholder('target', 'Specific target label.', 'Spring launch event'),
          placeholder('undoWindow', 'Recovery window or explicit no-undo copy.', '30 days'),
        ],
        maxRecommendedLength: 130,
      },
    ],
    localization: { expansionLocales: ['de', 'ar', 'he'], placeholderRules: ['Never split target names across separate translated fragments.'] },
    accessibility: ['Dialog title must name the destructive action.', 'Confirmation buttons must not be icon-only.'],
    edgeCases: ['undo unavailable', 'bulk destructive action', 'permission change'],
    doNotWrite: ['Are you sure?', 'Delete?', 'This cannot be undone unless it can.'],
  },
  {
    id: 'empty-state',
    title: 'Empty state',
    intent: 'Explain why the page is empty and what starts the workflow.',
    severity: 'empty',
    voiceRules: ['Describe the missing object.', 'Give one primary next step.', 'Avoid blaming the user.'],
    componentContracts: ['EmptyState', 'GdsEmptyStateTemplate', 'StateBlock'],
    taskPatterns: ['create-resource'],
    ariaLive: 'off',
    telemetryEvents: ['empty_state_visible', 'empty_state_action_clicked'],
    templates: [
      {
        id: 'empty-state.first-run',
        patternId: 'empty-state',
        i18nKey: 'gds.content.emptyFirstRun',
        text: 'No {resource} yet. Create the first one to start this workflow.',
        placeholders: [placeholder('resource', 'Plural resource name.', 'events')],
        maxRecommendedLength: 90,
      },
    ],
    localization: { expansionLocales: ['de', 'ru'], placeholderRules: ['Use plural nouns that remain grammatically valid in the target locale.'] },
    accessibility: ['Primary recovery action must follow the empty explanation.', 'Do not use decorative-only illustrations as the explanation.'],
    edgeCases: ['permission-gated empty state', 'filtered empty state', 'first-run state'],
    doNotWrite: ['No data.', 'Nothing here.'],
  },
  {
    id: 'permission-denied',
    title: 'Permission denied',
    intent: 'Explain access limits without exposing private resource details.',
    severity: 'permission',
    voiceRules: ['State access is unavailable.', 'Name the role or owner only if safe.', 'Offer a request-access path when available.'],
    componentContracts: ['AccessRecoveryPanel', 'StateBlock', 'GdsErrorPageTemplate'],
    taskPatterns: ['review-submission'],
    ariaLive: 'assertive',
    telemetryEvents: ['permission_denied_visible', 'access_request_clicked'],
    templates: [
      {
        id: 'permission-denied.default',
        patternId: 'permission-denied',
        i18nKey: 'gds.content.permissionDenied',
        text: 'You do not have access to {surface}. Request access or return to a page you can view.',
        placeholders: [placeholder('surface', 'Safe public name for the blocked surface.', 'settings')],
        maxRecommendedLength: 120,
      },
    ],
    localization: { expansionLocales: ['de', 'ar', 'he'], placeholderRules: ['Avoid exposing hidden resource names in placeholders.'] },
    accessibility: ['Use a page heading that states access is denied.', 'Keep recovery controls labelled.'],
    edgeCases: ['resource exists but cannot be named', 'expired session', 'role mismatch'],
    doNotWrite: ['Forbidden.', 'You are not allowed.'],
  },
  {
    id: 'primary-cta',
    title: 'Primary CTA',
    intent: 'Use short action copy that matches the operation users are about to perform.',
    severity: 'info',
    voiceRules: ['Use a verb plus object when space allows.', 'Avoid vague verbs.', 'Keep labels scannable under expansion.'],
    componentContracts: ['SemanticButton', 'ActionBar', 'CtaButtonGroup'],
    taskPatterns: ['create-resource', 'copy-public-link'],
    ariaLive: 'off',
    telemetryEvents: ['action_clicked'],
    templates: [
      {
        id: 'primary-cta.create',
        patternId: 'primary-cta',
        i18nKey: 'gds.content.ctaCreate',
        text: 'Create {resource}',
        placeholders: [placeholder('resource', 'Singular resource label.', 'event')],
        maxRecommendedLength: 36,
      },
    ],
    localization: { expansionLocales: ['de', 'ru'], placeholderRules: ['Do not assume verb/object order is stable across locales.'] },
    accessibility: ['Button labels must make sense out of context.', 'Icon-only CTAs require an accessible label.'],
    edgeCases: ['narrow toolbar', 'loading action', 'destructive primary action'],
    doNotWrite: ['Go', 'Click here', 'Submit' ],
  },
  {
    id: 'form-hint',
    title: 'Form hint',
    intent: 'Help users enter valid data before validation fails.',
    severity: 'info',
    voiceRules: ['Explain format, limits, or consequences.', 'Keep examples generic.', 'Do not duplicate the label.'],
    componentContracts: ['FormField', 'GdsSchemaForm', 'ValidatedFieldMessage'],
    taskPatterns: ['create-resource'],
    ariaLive: 'off',
    telemetryEvents: ['field_hint_visible'],
    templates: [
      {
        id: 'form-hint.format',
        patternId: 'form-hint',
        i18nKey: 'gds.content.formHint',
        text: 'Use {format}. This is shown to {audience}.',
        placeholders: [
          placeholder('format', 'Expected data format.', 'a public display name'),
          placeholder('audience', 'Safe audience label.', 'visitors'),
        ],
        maxRecommendedLength: 110,
      },
    ],
    localization: { expansionLocales: ['de', 'fr', 'ar'], placeholderRules: ['Do not put examples inside placeholder names.'] },
    accessibility: ['Hints must be programmatically associated with the field.', 'Validation errors must not replace persistent format hints.'],
    edgeCases: ['sensitive examples', 'optional fields', 'server-only constraints'],
    doNotWrite: ['Enter valid data.', 'Must be correct.'],
  },
  {
    id: 'success-feedback',
    title: 'Success feedback',
    intent: 'Confirm completion and tell users what changed or what is next.',
    severity: 'success',
    voiceRules: ['Say what completed.', 'Avoid celebration for routine work.', 'Offer next step only when useful.'],
    componentContracts: ['GdsNotificationCenter', 'GdsToastProvider', 'StatusBadge'],
    taskPatterns: ['create-resource', 'publish-toggle', 'copy-public-link'],
    ariaLive: 'polite',
    telemetryEvents: ['success_visible'],
    templates: [
      {
        id: 'success-feedback.saved',
        patternId: 'success-feedback',
        i18nKey: 'gds.content.successSaved',
        text: '{resource} saved. Changes are visible to {audience}.',
        placeholders: [
          placeholder('resource', 'Safe resource label.', 'Event'),
          placeholder('audience', 'Safe audience label.', 'admins'),
        ],
        maxRecommendedLength: 90,
      },
    ],
    localization: { expansionLocales: ['de', 'ru'], placeholderRules: ['Keep status and next-step copy in one translatable sentence when grammar requires it.'] },
    accessibility: ['Use polite live regions for non-blocking success.', 'Do not remove the user from context after success.'],
    edgeCases: ['delayed public cache', 'partial success', 'copy-to-clipboard fallback'],
    doNotWrite: ['Yay!', 'Done.', 'Success!!!'],
  },
];

function clonePattern(pattern: GdsContentPattern): GdsContentPattern {
  return {
    ...pattern,
    voiceRules: [...pattern.voiceRules],
    componentContracts: [...pattern.componentContracts],
    taskPatterns: [...pattern.taskPatterns],
    telemetryEvents: [...pattern.telemetryEvents],
    templates: pattern.templates.map((template) => ({
      ...template,
      placeholders: template.placeholders.map((item) => ({ ...item })),
    })),
    localization: {
      expansionLocales: [...pattern.localization.expansionLocales],
      placeholderRules: [...pattern.localization.placeholderRules],
    },
    accessibility: [...pattern.accessibility],
    edgeCases: [...pattern.edgeCases],
    doNotWrite: [...pattern.doNotWrite],
  };
}

/** Returns deep clones of every governed content pattern. */
export function getGdsContentPatterns() {
  return contentPatterns.map(clonePattern);
}

/** Returns a deep clone of the content pattern with the given id, or `undefined`. */
export function getGdsContentPattern(id: GdsContentPatternId | string) {
  const pattern = contentPatterns.find((item) => item.id === id);
  return pattern ? clonePattern(pattern) : undefined;
}

/** Returns every copy template across all content patterns. */
export function getGdsCopyTemplates() {
  return getGdsContentPatterns().flatMap((pattern) => pattern.templates);
}

/** Returns the copy template with the given id, or `undefined`. */
export function getGdsCopyTemplate(id: string) {
  return getGdsCopyTemplates().find((template) => template.id === id);
}

/** Interpolates a template's `{placeholder}` tokens with `values`, leaving unknown tokens untouched. */
export function renderGdsCopyTemplate(template: GdsCopyTemplate, values: Record<string, string | number>) {
  return template.text.replace(/\{([A-Za-z0-9_.-]+)\}/g, (match, key) => String(values[key] ?? match));
}

/** Validates one template against its placeholder contracts and length budget, returning human-readable failure messages. */
export function validateGdsCopyTemplate(template: GdsCopyTemplate, values: Record<string, string | number> = {}) {
  const failures: string[] = [];
  for (const placeholder of template.placeholders) {
    if (placeholder.required && values[placeholder.name] === undefined) {
      failures.push(`${template.id} is missing required placeholder ${placeholder.name}`);
    }
    if (!placeholder.localizationSafe) {
      failures.push(`${template.id} placeholder ${placeholder.name} must use localization-safe examples.`);
    }
  }
  if (template.text.length > template.maxRecommendedLength) {
    failures.push(`${template.id} exceeds recommended length ${template.maxRecommendedLength}`);
  }
  return failures;
}

/** Validates the content-pattern catalog for duplicate ids, missing required fields, and per-template failures. */
export function validateGdsContentPatterns(patterns: GdsContentPattern[] = contentPatterns) {
  const failures: string[] = [];
  const ids = new Set<string>();
  for (const pattern of patterns) {
    if (ids.has(pattern.id)) failures.push(`Duplicate content pattern id: ${pattern.id}`);
    ids.add(pattern.id);
    if (!pattern.voiceRules.length) failures.push(`${pattern.id} must define voice rules.`);
    if (!pattern.componentContracts.length) failures.push(`${pattern.id} must map component contracts.`);
    if (!pattern.taskPatterns.length) failures.push(`${pattern.id} must map task patterns.`);
    if (!pattern.accessibility.length) failures.push(`${pattern.id} must define accessibility behavior.`);
    if (!pattern.localization.expansionLocales.length) failures.push(`${pattern.id} must define expansion locales.`);
    for (const template of pattern.templates) {
      failures.push(...validateGdsCopyTemplate(template, Object.fromEntries(template.placeholders.map((item) => [item.name, item.example]))));
    }
  }
  return failures;
}

/** Builds a text-expansion fixture per copy template for the given locale, to preview localized-length growth. */
export function createGdsContentExpansionReport(locale = 'de') {
  return getGdsCopyTemplates().map((template) => ({
    templateId: template.id,
    i18nKey: template.i18nKey,
    fixture: createGdsTextExpansionFixture(locale, template.text),
  }));
}

/** Renders the full content-pattern catalog as cards, listing each pattern's contracts, tasks, telemetry, and "do not write" guidance. */
export function GdsContentPatternCatalog() {
  return (
    <Stack gap="md">
      {contentPatterns.map((pattern) => (
        <Card key={pattern.id} withBorder radius="lg" padding="lg">
          <Stack gap="sm">
            <Group justify="space-between" gap="sm" wrap="wrap">
              <Title order={3}>{pattern.title}</Title>
              <Badge variant="light">{pattern.severity}</Badge>
            </Group>
            <Text c="dimmed">{pattern.intent}</Text>
            <List size="sm">
              <List.Item>Components: {pattern.componentContracts.join(', ')}</List.Item>
              <List.Item>Tasks: {pattern.taskPatterns.join(', ')}</List.Item>
              <List.Item>Telemetry: {pattern.telemetryEvents.join(', ')}</List.Item>
              <List.Item>Do not write: {pattern.doNotWrite.join('; ')}</List.Item>
            </List>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
