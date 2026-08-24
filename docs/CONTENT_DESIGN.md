# Content Design System

Status: package-native content contract
Package: `@sovereignsquad/gds-core`  
Issue: `#265`

The content design system governs product language for errors, retries, confirmations, empty states, permission states, CTAs, form hints, and success feedback. It is static, docs-renderable, and safe to consume from runtime packages or adoption tooling.

## Exports

```ts
import {
  getGdsContentPatterns,
  getGdsContentPattern,
  getGdsCopyTemplates,
  getGdsCopyTemplate,
  renderGdsCopyTemplate,
  validateGdsCopyTemplate,
  validateGdsContentPatterns,
  createGdsContentExpansionReport,
  GdsContentPatternCatalog,
} from '@sovereignsquad/gds-core';
```

## Pattern Set

- `error-recovery`
- `retryable-failure`
- `destructive-confirmation`
- `empty-state`
- `permission-denied`
- `primary-cta`
- `form-hint`
- `success-feedback`

Each pattern includes intent, severity, voice rules, component contracts, task-pattern mapping, `aria-live` policy, telemetry names, copy templates, localization placeholder rules, accessibility guidance, edge cases, and do-not-write examples.

## Template Rendering

```ts
const template = getGdsCopyTemplate('destructive-confirmation.delete');

renderGdsCopyTemplate(template, {
  target: 'Spring launch event',
  undoWindow: '30 days',
});
```

Placeholders are named and validated. Do not concatenate translated fragments manually. A placeholder may contain a product-owned label, but never secrets, private resource bodies, raw form values, or hidden resource names.

## Voice Rules

Content must be specific, calm, actionable, honest about consequence and recovery, safe for localization and text expansion, and readable without sensory-only references.

Do not use vague copy such as "Something went wrong" as the full error, "Are you sure?" as the full confirmation, "No data" as the full empty state, or "Click here" as CTA text.

## Accessibility

- blocking failures use assertive live regions
- non-blocking success uses polite live regions
- permission-denied pages use semantic headings and labelled recovery actions
- destructive confirmation titles name the action and target
- form hints remain associated with the input and do not disappear when validation errors render

## Localization

Use `createGdsContentExpansionReport(locale)` to generate text-expansion fixtures for all templates. German, Russian, Arabic, and Hebrew are the default stress languages for expansion and direction checks.

Rules:

- keep placeholders inside the translated sentence
- do not assume verb/object order is stable
- keep examples generic and non-sensitive
- validate narrow CTAs, tabs, cards, and header actions with expanded text
- use the i18n runtime for formatting, pluralization, and RTL boundaries

## Validation

Run:

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```

The test suite verifies registry schema, placeholder validation, template rendering, localization-safe examples, defensive cloning, expansion fixtures, and catalog rendering.

## Rollback

The content registry is additive static data. Consumers can pin a previous package version or ignore new templates while migrating product copy pattern by pattern.
