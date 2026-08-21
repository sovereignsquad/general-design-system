# `@sovereignsquad/gds-eslint-config`

Custom ESLint rules for GDS consumers, exposed via `createGdsConfig(options)`. Flat-config
only (ESLint 9+).

```js
import { createGdsConfig } from '@sovereignsquad/gds-eslint-config';

export default [
  ...createGdsConfig({
    allowedImports: ['some-approved-package'],
  }),
];
```

## Rules

### `no-raw-design-values` (always on)

Forbids raw color literals (`#hex`, `rgb()`/`rgba()`) and hard-coded spacing/radius values
(`padding: '16px'`, etc.) in feature UI code. Use GDS theme tokens instead. Exempts files
under a `theme/` or `tokens/` path segment.

### `no-forbidden-ui-imports` (always on)

Forbids importing from a fixed list of legacy/non-GDS UI sources (`@radix-ui/*`,
`tailwindcss`, `lucide-react`, `@/components/ui/*`). Pass `allowedImports` (an array of
exact import specifiers) for reviewed exceptions.

### `require-exported-jsdoc` (opt-in via `enforceExportedJsdoc: true`)

Requires a leading JSDoc comment on top-level exported functions, consts, classes, and
interfaces. Off by default (enabling it repo-wide against an unbackfilled codebase fails
immediately); scope it to already-documented files via `jsdocFiles` (a glob array).

### `no-accent-as-background` (opt-in via `accentBackgroundVariables`)

Flags a `background`/`backgroundColor`/`background-color`/`bg` declaration whose value
references an accent-classed GDS token (issue #644's `ACCENT_ROLES`) -- meant to be scarce
by 60-30-10 design intent, never a large-surface fill (issue #647).

```js
import { createGdsConfig } from '@sovereignsquad/gds-eslint-config';
import { ACCENT_BACKGROUND_VARIABLES } from '@sovereignsquad/gds-eslint-config/generated-accent-background-vars.js';

export default [
  ...createGdsConfig({
    accentBackgroundVariables: ACCENT_BACKGROUND_VARIABLES,
    // Reviewed exceptions: small, scarce, high-signal fills (a CTA button, a badge,
    // an active-tab indicator) are the intended use of an accent token, not a violation.
    allowedAccentBackgrounds: ['--gds-brand-accent', '--gds-state-success'],
  }),
];
```

Off by default -- there is no built-in variable list, since the rule cannot see
`@sovereignsquad/gds-theme`'s classification without depending on it. Passing an
explicitly empty `accentBackgroundVariables: []` throws at config-build time rather than
silently linting nothing; omit the option entirely to leave the rule off.

Static source scan only: it cannot see a dynamically computed CSS value (a string built by
concatenation, or a CSS-in-JS function call whose argument isn't a literal) -- the same
scope boundary `no-raw-design-values` already accepts.
