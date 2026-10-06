# Compliance Toolkit

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

This document defines the canonical governance enforcement toolkit for GDS consumers.

## Packages

- `@sovereignsquad/gds-eslint-config` provides shared lint rules for raw design values and forbidden UI imports. What they inspect is listed under [Lint scope](#lint-scope).
- `@sovereignsquad/gds-compliance` provides the `gds-compliance` CLI for manifest validation, adapter verification, stale-doc detection, and repo-level drift checks.

### Lint scope

`createGdsConfig()` in `packages/gds-eslint-config/index.js` enables `gds/no-raw-design-values` and `gds/no-forbidden-ui-imports` at `error`. `gds/require-exported-jsdoc` and `gds/no-accent-as-background` are opt-in. `shouldIgnoreFile` skips files under `dist/`, `coverage/` and `node_modules/`, and `gds/no-raw-design-values` also skips files under a `theme/` or `tokens/` directory.

`gds/no-raw-design-values` inspects string literals and template-literal text only:

- it reports a string that contains a hex colour, `rgb(` or `rgba(` (`RAW_COLOR_PATTERN`)
- it reports a string in which `padding`, `margin`, `gap`, `radius` or `borderRadius` is followed by a colon and a `px` or `rem` number in that same string (`RAW_SPACING_PATTERN`), as in the CSS text `'padding: 16px'`

It does not report:

- numeric values, such as `gap={48}`, `py={80}` or `style={{ padding: 16 }}`
- a unit string without the property name in the same string, such as `size="2.5rem"` or `style={{ padding: '16px' }}`
- font sizes, widths, heights or letter-spacing in any form
- other colour notations, such as `hsl()` or named colours

A clean lint run does not show that spacing, size and type values come from tokens.

`gds/no-forbidden-ui-imports` reports `import` declarations whose source matches `DEFAULT_FORBIDDEN_IMPORTS`, except exact specifiers passed as `allowedImports` (`resolveAllowedImports(manifest)` collects them from exception `dependency` and `allowImports` fields). The config has no option to extend the list, and the list does not include `@mantine/core` or `@tabler/icons-react`.

## Canonical command contract

```bash
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

`validate-manifest` and `check` run the same `runComplianceCheck` and exit the same way (`packages/gds-compliance/bin/gds-compliance.js`). Neither validates the manifest against `schemas/gds-adoption.schema.json`.

Supported output modes:

```bash
gds-compliance check --manifest ./gds-adoption.json --format text
gds-compliance check --manifest ./gds-adoption.json --format json
gds-compliance adoption-report --manifest ./gds-adoption.json --format md
gds-compliance exceptions --manifest ./gds-adoption.json --format html
gds-compliance expire-check --manifest ./gds-adoption.json --current-date 2026-06-14
```

Exit behavior:

- `0` when the manifest is valid and no compliance errors are found
- non-zero when configuration is invalid or drift is detected
- `expire-check` also exits non-zero when a dependency-boundary exception is past `removeBy` and its `enforcementMode` is `error`

## Covered rule classes

Every rule lives in `packages/gds-compliance/index.js`. `runComplianceCheck` decides which families run.

| Rule family | Findings | Source | Runs |
|---|---|---|---|
| Manifest fields and compliance config types | `manifest.missingField`, `manifest.invalidException`, `manifest.invalidComplianceConfig` | `validateManifest` | Always |
| Declared paths exist | `missing-adapter`, `missing-documentation-path`, `missing-protected-surface` | `runComplianceCheck` | Always, for each declared path |
| Stale SSOT references in docs, including legacy paths to superseded local SSOT directories | `stale-documentation-reference` | `scanDocumentationFile` | Only on files listed in `compliance.documentationPaths` |
| Raw colour literals outside theme and token files | `forbidden-color` | `scanSourceFile` | Always, whatever `compliance.strictMode` is. A hex or rgb literal used only as a `var(--token, <fallback>)` fallback is ignored, and `compliance.themeOwnershipPaths` is honoured (see [Where a literal value is allowed to live](#where-a-literal-value-is-allowed-to-live)) |
| Forbidden UI imports, such as `@radix-ui/*`, `tailwindcss` or configured legacy UI dependencies | `forbidden-import` | `scanSourceFile` | Always: `DEFAULT_FORBIDDEN_IMPORTS` plus `compliance.bannedImports` (exact specifiers, or prefixes ending in `/`). An exception's `dependency` and `allowImports` specifiers are exempt in every file, not only inside that exception's `scope` |
| Exception metadata | `exception-required-fields`, `exception-invalid-category`, `exception-invalid-status`, `exception-broad-scope`, `exception-product-authored-metadata`, `dependency-boundary.*` | `validateApprovedExceptions` | Always |
| Exception scopes against the repository | `exception-scope-no-matches`, `exception-adapter-outside-scope` | `validateApprovedExceptionsAgainstRepo` | Always |
| Theme ownership | `theme.noncanonical-extend-helper`, `theme.parallel-branding-layer` | `scanThemeGovernance` | Only when `compliance.themeOwnershipPaths` is declared |
| Identity-provider branding | `identity.provider.*` | `scanIdentityProviderBranding` | Only when `compliance.identityProviderBranding.approvedProviders` is non-empty |
| Design rules | `design-rule.accent-as-background`, `design-rule.missing-profile` | `scanDesignRuleUsage` | Always. Both report `warn`; `compliance.designRuleProfile.enforced: true` raises accent-as-background to `error` |
| Utility classes on protected surfaces | `protected-surface-utility-drift` (`warn`) | `runComplianceCheck` | Only when `compliance.protectedSurfacePaths` is declared |
| Strict surface adapters and wrappers | `strict.<surface>.local-adapter`, `strict.shell.mantine-app-shell`, `strict.action.legacy-wrapper`, `strict.listing.local-card-wrapper`, `strict.media.local-upload-wrapper`, `strict.reporting.local-chart-wrapper`, `strict.access.local-auth-wrapper`, `strict.admin.local-wrapper` | `runStrictCompliance` | Only when `compliance.strictMode` is `true` |
| Strict consumer drift | listed below | `scanStrictConsumerViolations` | Only when `compliance.strictMode` is `true` |

Strict consumer drift rules (remediation text: `STRICT_RULE_METADATA`):

- `strict.import.mantine-core` for `from '@mantine/core'` imports. Rule, enforcement limits and replacements: [DEPENDENCY_GOVERNANCE.md, "Mantine boundary"](DEPENDENCY_GOVERNANCE.md#mantine-boundary)
- `strict.import.tabler-icons` for `from '@tabler/icons-react'` imports
- `strict.raw-control` for raw `<button>`, `<input>`, `<select>`, or `<textarea>` usage outside approved scopes
- `strict.browser-dialog` for `alert()`, `confirm()`, or `window.confirm()`
- `strict.raw-table` for raw `<table>`, `<th>`, or `<td>` usage outside approved table contracts
- `strict.raw-color` for hex or rgb literals outside theme-owned paths
- `strict.inline-color` for literal colour values in inline `style={{ ... }}` objects
- `strict.non-token-radius` for numeric, `px` or `rem` `radius` and `borderRadius` values
- `strict.inline-style` for inline `style={{ ... }}` drift outside approved scopes
- `strict.local-gds-adapter` for undeclared local `components/gds/*` adapters

### Scanner scope

The source rules scan only the directory that contains the manifest.

- **File types.** `walk` collects only files whose extension is in `SOURCE_EXTENSIONS`, the JavaScript and TypeScript module extensions. No source rule reads stylesheets, HTML or other templates, JSON, Markdown, or non-JavaScript code. The only other files read are those listed in `compliance.documentationPaths`, and only for stale-reference strings.
- **Skipped directories.** `walk` skips every directory whose name is in `IGNORED_DIRS`, at any depth, and does not follow symbolic links to directories. Any other directory is scanned like source, including build output, virtual environments and nested checkouts (for example `build/`, `out/`, `.venv/` or a nested worktree).
- **Comments.** `stripComments` blanks JavaScript comments before the content rules run, so text inside a comment never matches.
- **Path exemptions.**
  - `isThemeOwnedPath`: a path with a `theme/` or `tokens/` directory segment, or one matching `compliance.themeOwnershipPaths`, is exempt from `forbidden-color`, `strict.raw-color`, `strict.inline-color` and `strict.non-token-radius`.
  - Files under `packages/gds-core/`, `packages/gds-admin/` or `packages/gds-theme/` are exempt from `strict.import.mantine-core`, `strict.import.tabler-icons`, `strict.raw-color`, `strict.inline-color` and `strict.non-token-radius`.
  - Files under a `docs/` directory are exempt from `strict.raw-control`, `strict.raw-table`, `strict.raw-color`, `strict.inline-color` and `strict.non-token-radius`.
  - `scanThemeGovernance` skips theme-ownership files that any `approvedExceptions` scope covers.
- **Exception suppression.** `getSuppressionDecision` applies only to the rules `scanStrictConsumerViolations` emits. It suppresses a finding when an exception whose scope matches the file has `status` `approved` or `temporary` and a `category` listed in that rule's `allowedExceptionCategories`. An exception in any other status, including `active` and `removing`, suppresses nothing. `runStrictCompliance` local-adapter findings are cleared only through the `approved*Primitives` lists and `approvedTemporaryExceptions`; its other findings cannot be suppressed.

### Known limitations of the current rules

Each item differs from the rule's stated purpose and affects what a finding means.

- `strict.raw-control` and `strict.raw-table` match tag names case-insensitively. A PascalCase component tag such as `<Button>`, `<Select>`, `<Textarea>` or `<Table>` is reported, including a component imported from `@sovereignsquad/gds-core`.
- `strict.browser-dialog` matches the text `alert(` and `confirm(` (with or without `window.`). The `confirm(...)` call returned by `useGdsConfirm()` is reported. `window.prompt(` is not matched.
- `forbidden-color` and `strict.raw-color` match `#` followed by 3 to 8 hexadecimal characters. A hashtag such as `#b2b` in a string is reported as a colour. `hsl()`, `hsla()` and `oklch()` values are not matched.
- `design-rule.accent-as-background` matches when an accent token name and a background property appear on the same line, whichever property holds the token.
- A repository path in `protectedSurfacePaths` passes manifest validation whatever its extension, but only files with an extension in `SOURCE_EXTENSIONS` are ever scanned.

### What a zero-finding run proves

A run with no findings shows that, within the scope above, none of the rule families that ran matched. It does not show:

- anything about stylesheets, markup, templates or non-JavaScript code
- that the manifest validates against `schemas/gds-adoption.schema.json`
- anything only the strict rules check, when `compliance.strictMode` is not `true`: direct `@mantine/core` and `@tabler/icons-react` imports, raw controls, browser dialogs, raw tables, inline styles and colours, numeric radius, and local GDS adapters and wrappers
- that `@sovereignsquad/gds-theme/styles.css` is loaded: no rule checks for it. No default rule flags a direct `import '@mantine/core/styles.css'`; listing `@mantine/core/styles.css` and `@mantine/notifications/styles.css` in `compliance.bannedImports` reports such imports as `forbidden-import` in JavaScript and TypeScript files, but an `@import` in a stylesheet is never read
- that spacing, size and type values come from tokens: no compliance rule checks them, and the lint rule covers only the forms in [Lint scope](#lint-scope)
- runtime accessibility (contrast, focus, accessible names, keyboard operation); [A11Y_CI_PACKAGE.md](A11Y_CI_PACKAGE.md) covers assembled routes

## Where a literal value is allowed to live

The rules above prohibit literal colour and radius values. The places a plain hex or pixel value is correct are narrow and named, and each has a reason. Categories 1 and 6 are the paths `isThemeOwnedPath` exempts; categories 2 to 5 live inside the GDS packages, which the strict colour and radius rules skip ([Scanner scope](#scanner-scope)):

1. **Theme and token sources** — any path matching `theme/` or `tokens/`, plus whatever a
   consumer declares in `compliance.themeOwnershipPaths` in its `gds-adoption.json`. This is
   the *authority*: the place literals are turned into tokens. `packages/gds-theme`'s ramps and
   vibe definitions are the canonical example.
2. **The GDS packages themselves** (`packages/gds-core|admin|theme`) for the strict raw-colour
   rule — the packages are what the rules route consumers *toward*, so scanning them with
   consumer rules would be a category error. Inside the packages the shape/radius gates
   (`verify:shape-token-adoption`) and the theme-governance gates apply instead; "unscanned by
   consumer compliance" does not mean ungoverned.
3. **Generated SVG output** (`generated-art-svg.ts`, `generated-art-engine.ts`, the generated
   thumbnail/hero palettes): an SVG data URI has no stylesheet and no theme in scope by the
   time it is a string, so its palette is *derived from tokens at build time* and emitted as
   literal hex — see `resolveGdsGeneratedPaletteHex`, whose darkening step is real RGB
   arithmetic on the resolved value.
4. **Map paint** (`GdsMapPinBadge`, `GdsPinSystemReference`): pin silhouettes are SVG paths
   painted outside any stylesheet, same reasoning as 3. The values are resolved from the badge
   token system, not invented per pin.
5. **The PWA manifest** (`packages/gds-theme/src/pwa.ts`): `manifest.json` fields
   (`theme_color`, `background_color`) are consumed by the platform, not by CSS — there is no
   `var()` to read. The generator resolves them from the active theme at build time.
6. **A consumer's own categorical/data-visualization color set** (a chart-library color array, a
   map-legend palette): the same reasoning as 3 and 4 — by the time it's a literal array passed
   to a charting or mapping API, there is no stylesheet and no theme in scope, and it typically
   needs more distinct hues than GDS's semantic accent set provides. Declare the file(s) under
   `compliance.themeOwnershipPaths` in `gds-adoption.json` (worked example below) — the same
   mechanism category 1 already uses, and honored by `forbidden-color` whether or not
   `compliance.strictMode` is set:

   ```json
   {
     "compliance": {
       "themeOwnershipPaths": ["src/lib/chartTheme.ts"]
     }
   }
   ```

   This is a narrow, path-scoped declaration, not a blanket escape hatch — reach for it only
   when the palette genuinely can't be expressed as GDS accent tokens (a 2-3 color palette
   usually can be), and scope it to the specific file(s), not a wide glob.

Everything else reads tokens. If a seventh category ever seems necessary, the burden is on the
new case to show its output genuinely has no stylesheet and no theme in scope — "the token was
inconvenient here" does not qualify. Comments are never scanned (`stripComments`).

**HTML emitted outside the React tree is not a literal-value location.** An HTML document that
an API route or server handler returns as a string loads no GDS or Mantine stylesheet, so
`var(--gds-*)` and `var(--mantine-*)` do not resolve in it, and a literal palette there is not
one of the categories above. Serve the page through GDS instead: render `GdsErrorPageTemplate`
or `AccessRecoveryPanel` on a route and have the handler redirect to it. Pattern:
[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md), subsection "Surfaces outside GdsProvider". An
app with no React tree at all follows the "Runtime-constrained mirror" profile in
[ADOPTION_AND_MIGRATION_PLAYBOOK.md](ADOPTION_AND_MIGRATION_PLAYBOOK.md).

**`themeOwnershipPaths` vs. `approvedExceptions` vs. `approvedTemporaryExceptions`** — three
different manifest mechanisms, easy to confuse by name:

- `compliance.themeOwnershipPaths` (used above): declares a file or glob as a literal-value
  *authority*, exempting it from the raw-color/radius scans entirely, in both strict and
  non-strict mode. This is what a categorical color palette needs.
- `approvedExceptions` (top-level manifest array): suppresses specific `strict.*` findings
  (`strict.raw-color`, `strict.inline-color`, `strict.raw-control`, etc.) — **only when
  `compliance.strictMode` is `true`**, and only for an exception in status `approved` or
  `temporary` (see [Scanner scope](#scanner-scope)). It does not affect the always-on
  `forbidden-color` check a non-strict consumer actually runs, and is the wrong mechanism for
  the categorical-palette case above unless the repo has also adopted strict mode.
- `compliance.approvedTemporaryExceptions` (a flat list of contract names): unrelated to color at
  all — it only suppresses `strict.<surface>.local-adapter` findings for declared `localAdapters`
  entries.

## Manifest configuration

Optional compliance extensions live in `gds-adoption.json`:

```json
{
  "compliance": {
    "documentationPaths": ["README.md"],
    "staleDocumentationReferences": ["legacy-design-system"],
    "protectedSurfacePaths": ["src/gds", "src/components/public"],
    "bannedImports": ["legacy-ui-kit"]
  }
}
```

`approvedExceptions` entries must now use the canonical exception contract, not a free-form note. Each exception should declare:

- `surface`
- `category`
- narrow `scope`
- `reason`
- `allowedImplementation`
- `mustStillUse`
- `mustNotDo`
- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`
- `owner`
- `reviewDate`
- `removeBy` for time-bounded dependency exceptions
- `exitCondition`
- `status`
- `replacementIssue`, `rollbackPlan`, `riskLevel`, and `enforcementMode` for `dependency-boundary` exceptions

Dependency-boundary status contract:

- `active` for a reviewed live bypass
- `removing` when rollout is in progress
- `expired` when CI should fail and force cleanup

Under `compliance.strictMode`, an exception in status `active` or `removing` does not suppress `strict.*` findings; only `approved` and `temporary` do (see [Scanner scope](#scanner-scope)).

`gds-compliance` will fail broad scopes such as `src/**` and will flag missing canonical fields as manifest drift. Use [EXCEPTION_SURFACES.md](EXCEPTION_SURFACES.md) and [TEMPLATES/gds-adoption.json.template](TEMPLATES/gds-adoption.json.template) as the normative examples.

Additional enforcement now applies for creator-authored experience exceptions:

- `category: "product-authored-experience"` must also define `a11yRequirements`, `testingRequirements`, and `observabilityRequirements`
- approved exception scopes must match at least one file the scanner reads (an extension in `SOURCE_EXTENSIONS`), so a scope that lists only stylesheets or templates fails `exception-scope-no-matches`
- local adapters with `status: "exception"` must be covered by an approved exception scope

### Consumers that cannot import the packages

A consumer with no React tree (for example a server-rendered Python app) does not pin `@sovereignsquad/gds-*` packages it cannot import, and omits `supportedEntryPoints` or declares it as `[]`. What GDS supports for such a consumer, and which contracts still apply, is stated in [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md), subsection "Surfaces outside GdsProvider". A minimal manifest that `gds-compliance check` accepts:

```json
{
  "schemaVersion": 1,
  "gdsVersion": "6.7.0",
  "productArchetype": "public",
  "requiredContracts": ["control-height-min-target"],
  "localAdapters": [],
  "approvedExceptions": [],
  "migrationStatus": "planned",
  "owner": "platform-ui",
  "lastReviewedAt": "2026-10-01"
}
```

`requiredContracts` names the GDS contracts the app still meets; `control-height-min-target` is a rule id from [docs/ACCESSIBILITY_FLOOR.md](docs/ACCESSIBILITY_FLOOR.md). An app that mirrors GDS token values adds the exception and adapter entries of the "Runtime-constrained mirror" profile in [ADOPTION_AND_MIGRATION_PLAYBOOK.md](ADOPTION_AND_MIGRATION_PLAYBOOK.md). The scanner reads none of the app's stylesheets, templates or non-JavaScript code ([Scanner scope](#scanner-scope)).

Theme-governance enforcement may also be declared in `gds-adoption.json`:

```json
{
  "compliance": {
    "approvedThemeLanes": [
      "gdsTheme",
      "gdsDarkPublicTheme",
      "gdsFlatSurfaceTheme",
      "gdsEditorialPublicTheme",
      "createPublicBrandTheme"
    ],
    "themeOwnershipPaths": ["src/providers.tsx", "src/theme.ts"]
  }
}
```

When those fields are present, `gds-compliance` will flag:

- direct consumer `extendGdsTheme(...)` usage
- local Mantine theme construction in declared theme-ownership files that bypasses the approved GDS lanes

The output must name the offending theme ownership file and provide an approved remediation path. A valid failure should point the team back to shipped lanes such as `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, or `createPublicBrandTheme(...)`.

For identity-provider branding governance, declare a dedicated policy block:

```json
{
  "compliance": {
    "identityProviderBranding": {
      "approvedProviders": ["google", "apple", "github", "microsoft", "discord", "x", "email"],
      "forbiddenCustomizations": ["leftSection", "variant", "size", "fullWidth"],
      "allowedVariants": ["solid", "outline", "neutral"],
      "colorAuthority": "provider",
      "minTouchTargetPx": 44,
      "policyDocument": "IDENTITY_PROVIDER_BRANDING.md"
    }
  }
}
```

`gds-compliance` checks this policy against all `SocialAuthButtons` usages in the repository source graph:

- rejects providers not listed in `approvedProviders`
- errors when a provider usage sets `variant` outside `allowedVariants`
- errors on forbidden prop customizations defined in `forbiddenCustomizations`
- flags heuristic cases where social auth appears implemented with direct Mantine `Button` controls

For repositories targeting true GDS-only enforcement, enable strict mode:

```json
{
  "compliance": {
    "strictMode": true,
    "approvedShellPrimitives": ["DiscoveryShell"],
    "approvedDetailPrimitives": ["DetailProfileShell"],
    "approvedListingPrimitives": ["ListingCard"],
    "approvedActionPrimitives": ["ActionBar"],
    "approvedMediaPrimitives": ["MediaField", "UploadDropzone"],
    "approvedReportingPrimitives": ["ReportingSection", "PeriodSelector", "EvidencePanel", "ChartTokenPanel"],
    "approvedAccessPrimitives": ["AuthShell", "ProviderIdentityButtonGroup", "AccessSummary", "AccessRecoveryPanel"],
    "approvedTemporaryExceptions": ["MapPanel"]
  }
}
```

Strict mode adds hard failures for:
- local Mantine `AppShell` wrappers
- direct `@mantine/core` and `@tabler/icons-react` imports, unless an exception in status `approved` or `temporary` covers the file with a category the rule allows (`STRICT_RULE_METADATA`); the Mantine rule and its replacements are in [DEPENDENCY_GOVERNANCE.md, "Mantine boundary"](DEPENDENCY_GOVERNANCE.md#mantine-boundary)
- local shell/detail/listing/action/media/reporting/access adapters that are not approved or explicitly excepted
- legacy local button-wrapper patterns that bypass the canonical semantic action system
- local Mantine-card listing wrappers that should use `ListingCard`, `PublicProductCard`, `PublicFoodCard`, or `MediaCard`
- local media/upload wrappers that should use `MediaField` or `UploadDropzone`
- local reporting/chart wrappers that should use `ReportingSection`, `EvidencePanel`, `PeriodSelector`, or `ChartTokenPanel`
- local auth/access wrappers that should use `AuthShell`, provider identity controls, `AccessSummary`, or `AccessRecoveryPanel`

For the official reference site, strict mode should also be treated as the baseline expectation, not an optional maturity step. `apps/playground` is the canonical proof that docs, demos, and theme exploration can be delivered through GDS-owned contracts.

Recommended activation order:

1. migrate to `DiscoveryShell` and governed sidebar primitives
2. migrate action stacks to `ActionBar`
3. migrate repeated discovery cards to `ListingCard`
4. migrate detail surfaces to `DetailProfileShell`
5. migrate media/upload surfaces to `MediaField` and `UploadDropzone`
6. migrate reporting surfaces to `ReportingSection`, `EvidencePanel`, `PeriodSelector`, and `ChartTokenPanel`
7. migrate access/auth surfaces to `AuthShell`, provider identity controls, `AccessSummary`, and `AccessRecoveryPanel`
8. enable `strictMode` and keep any short-lived gaps in `approvedTemporaryExceptions`
9. add `approvedThemeLanes` and `themeOwnershipPaths` once provider/theme files are stable so custom branding-layer drift becomes measurable

Reference review input for migration teams:

- SSOT policy: [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md)
- live pattern site: `https://sovereignsquad.github.io/general-design-system/patterns`

The compliance toolkit does not replace design review. It enforces the declared contract after teams have confirmed the shipped surface inventory.

Use this only for additive repo-local bans and legacy cleanup signals. Do not use it to carve holes in the canonical GDS ruleset.

## CI integration

Recommended consumer CI step:

```bash
npm run lint
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
gds-compliance expire-check --manifest ./gds-adoption.json
```

If the repo uses the reference codemods during migration, run them in dry-run mode in PRs before switching to strict mode:

```bash
node scripts/codemods/run-codemod.mjs discovery-shell ./src
node scripts/codemods/run-codemod.mjs action-bar ./src
node scripts/codemods/run-codemod.mjs listing-card ./src
```

## What this toolkit does not replace

- product-specific business-rule checks
- backend/security policy scanning
- visual regression tooling

Those may exist in consumer repos, but they do not replace the canonical GDS adoption checks.
