# Compliance Toolkit

Status: Active SSOT
Version: 6.5.0
Last updated: 2026-08-25

This document defines the canonical governance enforcement toolkit for GDS consumers.

## Packages

- `@sovereignsquad/gds-eslint-config` provides shared lint rules for raw design values and forbidden UI imports.
- `@sovereignsquad/gds-compliance` provides the `gds-compliance` CLI for manifest validation, adapter verification, stale-doc detection, and repo-level drift checks.

## Canonical command contract

```bash
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

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

- missing required manifest fields
- invalid approved exception metadata
- missing declared adapter paths
- forbidden raw color literals outside approved theme/token files -- this check runs
  unconditionally, regardless of `compliance.strictMode`; it excludes a hex/rgb literal used
  solely as a `var(--token, <fallback>)` fallback value, and it honors
  `compliance.themeOwnershipPaths` the same way the strict-mode version of this rule does (see
  "Where a literal value is allowed to live" below)
- forbidden UI imports such as `@radix-ui/gds-*`, `tailwindcss`, or other configured legacy UI dependencies
- stale SSOT references in docs, including legacy path references to superseded local SSOT directories
- strict consumer drift rules when `compliance.strictMode` is `true`:
- `strict.import.mantine-core` for direct consumer `@mantine/core` imports
- `strict.import.tabler-icons` for direct consumer `@tabler/icons-react` imports
- `strict.raw-control` for raw `<button>`, `<input>`, `<select>`, or `<textarea>` usage outside approved scopes
- `strict.browser-dialog` for `alert()`, `confirm()`, or `window.confirm()`
- `strict.raw-table` for raw `<table>`, `<th>`, or `<td>` usage outside approved table contracts
- `strict.inline-style` for inline `style={{ ... }}` drift outside approved scopes
- `strict.local-gds-adapter` for undeclared local `components/gds/*` adapters

## Where a literal value is allowed to live

The rules above are prohibitions, and a prohibition alone teaches nothing about the places a
plain hex or pixel value is *correct*. Those places are narrow, named, and each has a reason —
this list is the positive half of the contract, and it matches what the scanner actually
enforces (verified against `packages/gds-compliance/index.js`, issue 543):

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
   mechanism category 1 already uses, and, as of issue #670, honored by this rule whether or not
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
inconvenient here" does not qualify. Comments are not code and are never scanned (issue 615).

**`themeOwnershipPaths` vs. `approvedExceptions` vs. `approvedTemporaryExceptions`** — three
different manifest mechanisms, easy to confuse by name:

- `compliance.themeOwnershipPaths` (used above): declares a file or glob as a literal-value
  *authority*, exempting it from the raw-color/radius scans entirely, in both strict and
  non-strict mode. This is what a categorical color palette needs.
- `approvedExceptions` (top-level manifest array): suppresses specific `strict.*` findings
  (`strict.raw-color`, `strict.inline-color`, `strict.raw-control`, etc.) — **only when
  `compliance.strictMode` is `true`**. It does not affect the always-on `forbidden-color` check
  a non-strict consumer actually runs, and is the wrong mechanism for the categorical-palette
  case above unless the repo has also adopted strict mode.
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

`gds-compliance` will fail broad scopes such as `src/**` and will flag missing canonical fields as manifest drift. Use [EXCEPTION_SURFACES.md](EXCEPTION_SURFACES.md) and [TEMPLATES/gds-adoption.json.template](TEMPLATES/gds-adoption.json.template) as the normative examples.

Additional enforcement now applies for creator-authored experience exceptions:

- `category: "product-authored-experience"` must also define `a11yRequirements`, `testingRequirements`, and `observabilityRequirements`
- approved exception scopes must match at least one real repository file
- local adapters with `status: "exception"` must be covered by an approved exception scope

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
- direct Mantine/Tabler dependency imports in strict consumer surfaces unless covered by a `dependency-boundary` exception with owner, review date, replacement issue, accessibility/testing/observability requirements, exit condition, and rollback plan
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
