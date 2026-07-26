import type { ReactNode } from 'react';
import { Alert, Stack, Text } from '@mantine/core';

/** Severity of a creator-CSS validation issue; `error` blocks the CSS from applying, `warning` does not. */
export type CreatorCssSeverity = 'error' | 'warning';

/** A single issue found while validating creator-authored CSS, with a machine code and optional offending selector/property. */
export interface CreatorCssValidationIssue {
  code: string;
  severity: CreatorCssSeverity;
  message: string;
  selector?: string;
  property?: string;
}

/** Policy governing what creator-authored CSS may contain. */
export interface CreatorCssPolicy {
  /** Required prefix every selector must start with (the theme scope). */
  scopeSelector?: string;
  /** Maximum allowed CSS length in characters. Defaults to 12,000. */
  maxLength?: number;
  /** Property names that may not be set. Defaults to a layout/visibility block list. */
  blockedProperties?: string[];
  /** Selector patterns that are rejected. Defaults to global/script/visibility-guard patterns. */
  blockedSelectorPatterns?: RegExp[];
  /** Selectors that must remain visible and cannot be hidden. */
  requiredVisibleSelectors?: string[];
}

/** Props for `CreatorThemeBoundary`. */
export interface CreatorThemeBoundaryProps {
  /** Creator-authored CSS to validate and, if clean, inject. */
  css: string;
  /** Unique id used to build the `[data-gds-creator-theme]` scope selector. */
  scopeId: string;
  policy?: CreatorCssPolicy;
  requiredVisibleSelectors?: string[];
  children: ReactNode;
  /** Called with the validation issues found for this CSS. */
  onDiagnostics?: (issues: CreatorCssValidationIssue[]) => void;
}

const defaultBlockedProperties = [
  'position',
  'z-index',
  'display',
  'visibility',
  'pointer-events',
  'content',
];

const defaultBlockedSelectorPatterns = [
  /(^|[\s,{>+~])(?:html|body|:root|\*)\b/i,
  /script/i,
  /\[data-gds-required-visibility/i,
];

function addIssue(issues: CreatorCssValidationIssue[], issue: CreatorCssValidationIssue) {
  issues.push(issue);
}

/**
 * Validates creator-authored CSS against a policy, returning all issues (empty
 * when clean). Flags oversized input, unsafe functions (`javascript:`,
 * `expression()`, `@import`), out-of-scope or blocked selectors, blocked
 * properties, and warns on raw colors that bypass GDS/Mantine token variables.
 */
export function validateCreatorCss(css: string, policy: CreatorCssPolicy = {}): CreatorCssValidationIssue[] {
  const issues: CreatorCssValidationIssue[] = [];
  const maxLength = policy.maxLength ?? 12_000;
  const blockedProperties = new Set([...(policy.blockedProperties ?? defaultBlockedProperties)].map((item) => item.toLowerCase()));
  const blockedSelectorPatterns = policy.blockedSelectorPatterns ?? defaultBlockedSelectorPatterns;
  const scopeSelector = policy.scopeSelector;

  if (css.length > maxLength) {
    addIssue(issues, {
      code: 'creator-css-too-large',
      severity: 'error',
      message: `Creator CSS exceeds the ${maxLength} character limit.`,
    });
  }

  if (/javascript:|expression\s*\(|@import/i.test(css)) {
    addIssue(issues, {
      code: 'creator-css-unsafe-function',
      severity: 'error',
      message: 'Creator CSS contains an unsafe URL, expression, or import.',
    });
  }

  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(rulePattern)) {
    const selector = match[1].trim();
    const declarations = match[2];

    if (scopeSelector && !selector.split(',').every((part) => part.trim().startsWith(scopeSelector))) {
      addIssue(issues, {
        code: 'creator-css-out-of-scope',
        severity: 'error',
        selector,
        message: `Selector "${selector}" is outside the approved creator theme scope.`,
      });
    }

    for (const pattern of blockedSelectorPatterns) {
      if (pattern.test(selector)) {
        addIssue(issues, {
          code: 'creator-css-blocked-selector',
          severity: 'error',
          selector,
          message: `Selector "${selector}" is not allowed in creator-authored CSS.`,
        });
      }
    }

    for (const declaration of declarations.split(';')) {
      const [rawProperty, ...rawValue] = declaration.split(':');
      const property = rawProperty?.trim().toLowerCase();
      const value = rawValue.join(':').trim();
      if (!property) continue;
      if (blockedProperties.has(property)) {
        addIssue(issues, {
          code: 'creator-css-blocked-property',
          severity: 'error',
          selector,
          property,
          message: `Property "${property}" is not allowed in creator-authored CSS.`,
        });
      }
      if (/(#[0-9a-f]{3,8}\b|rgb[a]?\()/i.test(value) && !/var\(--gds-|var\(--mantine-/.test(value)) {
        addIssue(issues, {
          code: 'creator-css-raw-color',
          severity: 'warning',
          selector,
          property,
          message: 'Prefer GDS or Mantine token variables instead of raw colors.',
        });
      }
    }
  }

  return issues;
}

/** Renders creator-CSS validation issues as color-coded alerts (red for errors, yellow for warnings), or a success alert when there are none. */
export function CreatorThemeDiagnostics({ issues }: { issues: CreatorCssValidationIssue[] }) {
  if (!issues.length) {
    return <Alert color="teal" title="Creator theme valid">No blocking creator theme diagnostics.</Alert>;
  }

  return (
    <Stack gap="xs">
      {issues.map((issue, index) => (
        <Alert key={`${issue.code}-${index}`} color={issue.severity === 'error' ? 'red' : 'yellow'} title={issue.code}>
          <Text size="sm">{issue.message}</Text>
        </Alert>
      ))}
    </Stack>
  );
}

/**
 * Scoped wrapper that validates creator CSS against the theme scope and injects
 * it only when there are no blocking errors; on error it renders the diagnostics
 * instead of the styles. Children always render inside the scoped container.
 */
export function CreatorThemeBoundary({
  css,
  scopeId,
  policy,
  requiredVisibleSelectors = [],
  children,
  onDiagnostics,
}: CreatorThemeBoundaryProps) {
  const scopeSelector = `[data-gds-creator-theme="${scopeId}"]`;
  const issues = validateCreatorCss(css, {
    ...policy,
    scopeSelector,
    requiredVisibleSelectors,
  });
  onDiagnostics?.(issues);
  const blocking = issues.some((issue) => issue.severity === 'error');

  return (
    <div data-gds-creator-theme={scopeId}>
      {!blocking && css ? <style>{css}</style> : null}
      {blocking ? <CreatorThemeDiagnostics issues={issues} /> : null}
      {children}
    </div>
  );
}
