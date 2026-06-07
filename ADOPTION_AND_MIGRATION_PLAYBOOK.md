# Adoption & Migration Playbook

Status: Active SSOT
Version: 3.0.0
Last updated: 2026-05-31

This playbook defines the canonical path for adopting GDS through direct package consumption and for migrating repos away from local mirrored adapters or legacy UI systems.

## 1. Target End State

Every governed consumer should converge on this shape:

1. install `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, `@doneisbetter/gds-admin`, and governance packages from a registry
2. mount `GdsProvider` once at the application root
3. consume shared contracts through documented `server` and `client` entrypoints
4. keep local adapters narrow, temporary, and machine-declared in `gds-adoption.json`
5. validate adoption through build, test, codemods where applicable, and `gds-compliance`

## 2. Adoption Profiles

### Package-first greenfield

Use when the product has little or no existing UI system.

Execution:
1. install packages
2. wire root provider and theme through one approved lane (`gdsTheme`, shipped public preset, or `createPublicBrandTheme(...)`)
3. choose shell, page-header, state-block, card, and action contracts
4. add `gds-adoption.json`
5. enable shared lint/gds-compliance in CI

### Mirrored-local transition

Use when the product already mirrors GDS contracts locally because registry or release readiness was not available earlier.

Execution:
1. record all local mirrored contracts in `gds-adoption.json`
2. replace one mirrored contract family at a time with direct `@doneisbetter/gds-*` consumption
3. delete the local mirror only after build, test, and route verification pass
4. remove temporary import aliases and sibling-repo assumptions
5. use the reference codemods for safe mechanical rewrites before touching bespoke cases manually

### Legacy migration

Use when the product still has a prior design/token/component authority.

Execution:
1. freeze legacy UI expansion
2. establish `GdsProvider` and theme ownership
3. migrate one governed surface family at a time in this order: shell -> navigation -> actions -> listing -> detail -> embeds
4. record exceptions narrowly
5. delete legacy primitives and token sources

## 3. Next.js App Router Contract

### Server files

Use server-safe entrypoints for layouts, metadata builders, and non-interactive composition.

```tsx
import { gdsTheme } from '@doneisbetter/gds-theme/server';
import { BrowseSurface, DocsPageShell, EditorialCard } from '@doneisbetter/gds-core/server';
```

### Client files

Use client entrypoints for providers and interactive widgets.

```tsx
'use client';

import { GdsProvider } from '@doneisbetter/gds-theme/client';
import { ThemeToggle } from '@doneisbetter/gds-core/client';
import { AppShell } from '@doneisbetter/gds-admin/client';
```

### Root bootstrap

`app/layout.tsx` should own:
- `ColorSchemeScript`
- root `lang`
- root `dir`

`app/providers.tsx` should be the only required client boundary for the shared provider.

Theme ownership rule:

- use shipped theme lanes first
- use `createPublicBrandTheme(...)` when a branded public product needs governed overrides
- do not keep a consumer-local `extendGdsTheme(...)` branding layer as the long-term adopter path

## 4. Vite / SPA Contract

Single-runtime apps may consume `@doneisbetter/gds-*/client` directly for interactive surfaces. Keep the provider at the top of the tree and avoid local theme forks.

## 5. Migration Algorithm

```ts
async function migrateConsumerRepo() {
  freezeLegacyUI();
  addGdsProviderAtRoot();
  declareAdoptionManifest();
  runReferenceCodemods();
  replaceOneSurfaceFamilyAtATime();
  runBuildAndCompliance();
  deleteRetiredAdapters();
}
```

Reference codemods currently available:

- `node scripts/codemods/run-codemod.mjs discovery-shell ./src`
- `node scripts/codemods/run-codemod.mjs action-bar ./src`
- `node scripts/codemods/run-codemod.mjs listing-card ./src`

## 6. Required Verification Before Promotion

Run:

```bash
npm install
npm run build
npm run test:run
npm run verify:mantine
gds-compliance check --manifest ./gds-adoption.json
```

Also verify the affected surface against the live public reference when applicable:

- `https://sovereignsquad.github.io/general-design-system/patterns`
- relevant family page for the surface being adopted

This prevents teams from reintroducing local wrappers for already-shipped contracts that are visibly available in the GDS site.

For Next.js consumers, also verify the production build path. For public products, verify at least one high-traffic route and one empty/error state.

Consumer dependency baseline:

- React `19.x` is supported
- Mantine `8.3.x` and `9.2.x` are verified consumer-install lines
- use GitHub release assets only as an operational fallback when npm publication is temporarily unavailable

For true GDS-only repos, enable strict mode in the manifest once the canonical primitives are in place:

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
    "approvedAdminPrimitives": ["WorkspaceHeader", "InfoCard", "AdminCrudForm", "AdminFormSection", "AdminFormActions", "AdminTextInput", "AdminTextarea", "AdminCheckbox", "AdminSelect", "AdminFileUpload", "AdminResourceCard", "AdminModal", "AdminDetailDrawer"]
  }
}
```

## 6.1 Admin GDS-only migration contract

Use this contract when a consumer admin area has page-local or product-local shims such as `Stack`, `Group`, `Grid`, `SimpleGrid`, `Text`, `Title`, `Card`, `Button`, `Badge`, `Breadcrumbs`, `Anchor`, `TextInput`, `Textarea`, `Checkbox`, `Select`, `FileInput`, `Radio`, `Field`, `ColorField`, `Paper`, `Box`, `Image`, or `UnstyledButton`.

Architecture:

1. keep product-owned data fetching, permissions, server actions, persistence, uploads, retries, and telemetry adapters in the consuming app
2. replace visible admin layout, form, card, action, detail, overlay, and editor chrome with exported GDS contracts
3. keep payload keys and API endpoints unchanged unless the product team explicitly ships a backend migration
4. declare any remaining product-authored runtime surface as a narrow `approvedExceptions` entry with accessibility, testing, and observability obligations
5. enable `compliance.strictMode` with `approvedAdminPrimitives` and run `gds-compliance check`

Canonical replacement map:

| Local pattern | GDS contract |
|---|---|
| page heading, breadcrumb, primary action | `WorkspaceHeader` plus semantic actions |
| detail page hero and section stack | `DetailProfileShell`, `SectionPanel`, `InfoCard`, `StatusBadge` |
| create/edit form shell | `AdminCrudForm`, `AdminFormSection`, `AdminFormActions`, `AdminFormStatus` |
| routine text, textarea, checkbox, select, file fields | `AdminTextInput`, `AdminTextarea`, `AdminCheckbox`, `AdminSelect`, `AdminFileUpload` |
| repeated admin resource cards | `AdminResourceCard` and `AdminResourceGrid` |
| review, preview, audit, and secondary detail overlays | `AdminModal`, `AdminDetailDrawer`, `AdminReviewLayout` where available |
| save/cancel/delete/approve/retry bars | `ActionBar`, `SemanticButton`, or the admin action props that wrap them |
| upload and media preview chrome | `AdminFileUpload`, `MediaField`, `UploadDropzone`, `MediaPreviewCard` |
| CMS-like editors with sections, preview, settings, sticky actions | `ContentOpsEditor`, `ContentOpsSection`, `EditorScaffold` |
| slideshow, kiosk, or timed media controls | `PlaybackSurface`, `PlaybackControls`, `PlaybackOverlayControls` |

Runtime flow:

```ts
async function renderAdminCreateOrEditRoute(params) {
  const initialValues = await productOwnedLoader(params);
  const permissions = await productOwnedPermissionLoader(params);

  return (
    <AdminCrudForm
      title="Edit record"
      status={mapProductStatusToAdminFormStatus(initialValues.status)}
      actions={mapProductActionsToAdminFormActions(permissions)}
    >
      <AdminFormSection title="Details">
        <AdminTextInput name="name" value={initialValues.name} onChange={setName} />
        <AdminSelect name="status" value={initialValues.status} data={statusOptions} onChange={setStatus} />
      </AdminFormSection>
    </AdminCrudForm>
  );
}
```

Accessibility and UX requirements:

- every field must have a visible label and nearby error text
- keyboard order must follow the visual reading order through header, status, fields, secondary actions, and primary action
- submit errors must keep entered data available and move focus to the summary or first invalid field
- loading, readonly, permission-limited, empty, error, success, dirty, and stale-data states must be explicit and not color-only
- destructive actions must use confirmation/runtime feedback contracts and restate the target
- mobile action bars must keep one clear primary action and avoid adjacent ambiguous icon-only controls

Operational requirements:

- product-owned API calls keep existing retry, timeout, idempotency, upload, and rollback behavior
- GDS owns visible affordances and state mapping only
- observability events remain privacy-safe and should distinguish load, validation failure, submit start, submit success, submit failure, retry, timeout, and rollback/reopen
- strict-mode failures for `strict.admin.local-wrapper` mean the product still has local admin UI authority and should not claim 100% GDS-only operation

## 7. Rollback & Recovery

If direct package adoption fails:

1. revert to the last known good package version
2. restore the last working manifest and provider configuration
3. document the blocked contract or entrypoint in the local adapter
4. do not keep both the broken new contract and the restored legacy path active beyond the recovery window

## 7.1 Surface presentation migration

When replacing local state/panel wrappers, migrate to the shared presentation contract directly in `StateBlock` and `SectionPanel`.

Supported modes:

- `inline` for default in-flow surfaces
- `centered` for bounded loading/empty/error composition
- `fill` for panel-body or region-fill state presentation

Canonical replacement direction:

1. replace local `LoadingState` / `ErrorState` wrappers with `StateBlock` + presentation props
2. replace local `SectionCard`/panel-body alignment wrappers with `SectionPanel` + presentation props
3. keep `minHeight` on the canonical surface instead of parent layout wrappers

Example:

```tsx
<SectionPanel title="Catalog" presentation="fill" minHeight={320} contentAlign="center" contentJustify="center">
  <StateBlock
    variant="loading"
    title="Loading catalog"
    description="Retrieving governed listing data"
    presentation="centered"
    minHeight={240}
  />
</SectionPanel>
```

Migration acceptance rule:

- if a wrapper exists only to center/size state or panel-body content, it must be removed in favor of `inline` / `centered` / `fill` on GDS primitives.

## 7.2 Media and upload migration

When replacing local upload widgets, split ownership clearly:

- GDS owns visible field/dropzone chrome, labels, keyboard selection, drag state, selected-file summary, progress display, accepted-type/size guidance, policy copy, inline errors, and retry/remove/replace/reset action placement.
- The consuming product owns file validation, storage calls, signed URLs, retries, timeouts, virus scanning, persistence, and audit logging.
- Do not keep a local `UploadCard`, `ImagePicker`, `AssetDropzone`, or `MediaUploader` wrapper when it only duplicates `MediaField` or `UploadDropzone` behavior.

Canonical replacement direction:

1. replace local asset field wrappers with `MediaField`
2. replace local drop/select surfaces with `UploadDropzone`
3. map runtime state into the exported state unions (`uploading`, `upload-failed`, `unsupported-type`, `too-large`, `readonly`)
4. pass retry/replace/remove/reset through explicit action slots instead of hiding transport behavior inside GDS
5. keep storage/network logic in the product service layer and verify with route-level upload tests

Example:

```tsx
<MediaField
  label="Hero image"
  state={upload.status === 'failed' ? 'upload-failed' : upload.status === 'pending' ? 'uploading' : 'selected'}
  value={asset.url}
  preview={<img alt={asset.alt} src={asset.previewUrl} />}
  acceptedTypes="JPEG, PNG, WebP"
  maxSize="10 MB max"
  progress={upload.progress}
  policyText="Public media must be licensed for reuse and include alt text."
  retryAction={<button type="button" onClick={retryUpload}>Retry</button>}
  replaceAction={<button type="button" onClick={openAssetPicker}>Replace</button>}
  onRemove={removeAsset}
/>
```

Rollback rule:

- if storage integration fails, roll back only the product service/upload adapter and keep the GDS presentation contract in place unless the field itself breaks accessibility or form submission.

## 7.3 Reporting, evidence, and chart migration

When replacing local analytics/reporting wrappers, keep runtime ownership explicit:

- GDS owns period-control placement, state disclosure, chart wrapper chrome, text summaries, non-color-only legends, evidence/source/freshness/confidence panels, retry action slots, and accessible fallback placement.
- The consuming product owns data fetching, query retries, timeouts, timezone calculations, chart-library runtime, export generation, and permission filtering.
- Do not keep a local `ReportPanel`, `EvidenceCard`, `ChartCard`, or `DateRangeToolbar` wrapper when it only duplicates `ReportingSection`, `EvidencePanel`, `ChartTokenPanel`, or `PeriodSelector`.

Canonical replacement direction:

1. wrap mixed reporting pages with `ReportingSection`
2. replace local date/period selectors with `PeriodSelector`
3. replace evidence/proof/source disclosures with `EvidencePanel`
4. wrap charts or chart embeds with `ChartTokenPanel`
5. provide a text summary and table fallback for charts that communicate decision-making data
6. map product runtime states into `loading`, `below-threshold`, `partial`, `empty`, `error`, `stale`, `filtered`, and `permission-limited`

Rollback rule:

- if the chart engine or data service fails, roll back only the product chart/data adapter and keep `ReportingSection`, `ChartTokenPanel`, and `EvidencePanel` in place so the user still sees governed error or fallback states.

## 7.4 Auth, identity, and access migration

When replacing local auth and protected-route wrappers, keep identity runtime ownership explicit:

- GDS owns auth shell structure, provider button presentation, provider policy metadata, inline provider errors, tenant-disabled messaging, guest/support lanes, access summaries, and recovery action hierarchy.
- The consuming product owns OAuth/OIDC redirects, session mutation, account linking backend calls, provider telemetry, retries, timeout handling, and tenant policy source data.
- Do not keep a local `SocialLogin`, `ProviderButton`, `AuthCard`, `AccessDenied`, or `ProtectedRouteFallback` wrapper when it only duplicates `AuthShell`, `ProviderIdentityButtonGroup`, `SocialAuthButtons`, `AccessSummary`, or `AccessRecoveryPanel`.

Canonical replacement direction:

1. wrap login/signup/linking surfaces with `AuthShell`
2. replace provider stacks with `ProviderIdentityButtonGroup` or compatibility `SocialAuthButtons`
3. expose provider errors and tenant-disabled states through provider props
4. replace protected-route failures with `AccessRecoveryPanel`
5. replace role/scope summaries with `AccessSummary`
6. declare `compliance.identityProviderBranding` and run `gds-compliance check`

Rollback rule:

- if a provider integration fails, roll back only the product OAuth/session adapter and keep the GDS auth/access presentation in place so the user sees explicit recovery, guest, or support paths.

## 8. Documentation Requirements

Every adopter must maintain:

- local adapter document
- `gds-adoption.json`
- validation commands
- approved exceptions
- current consumed GDS version
- strict-mode status and approved primitive lanes if the repo is targeting 100% GDS-only
- a standardized client update template before each cross-team migration step

A ready-to-send template is maintained in [CLIENT_UPGRADE_PROMPT.md](/Users/Shared/Projects/general-design-system/CLIENT_UPGRADE_PROMPT.md).

Approved exceptions should be declared as governed records, not prose-only reminders. At minimum, each exception in `gds-adoption.json` should define:

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
- `exitCondition`
- `status`

This keeps rollback, review cadence, and compliance enforcement deterministic across repos.

## 9. Anti-Patterns

Do not:
- rely on sibling `file:` links in CI or production-like environments
- preserve local mirrored contracts as permanent hidden authorities
- mix direct package consumption with a second live token system
- skip manifest or compliance setup after package adoption
- introduce new shell/card/button wrappers after the canonical GDS primitive for that surface exists
