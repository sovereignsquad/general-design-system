# Camera Adoption Plan

Status: Reusable-contract driver, adoption gaps open
Version: 2.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/camera`

Paths below are relative to the Camera repository root.

## Objective

Define the reusable GDS contracts, compliance rules, and migration guidance that Camera and similar media-heavy admin products need so they can become clean consumers instead of permanently exception-heavy products.

## Current state (verified 2026-10-01)

Read-only check of a local checkout on branch `docs/prompt-management-release-notes` at `2617e00c`. Its tree matches `origin/main` `bdd2d7b2` as last fetched.

- **Packages.** `gds-core`, `gds-theme` and `gds-admin` 6.3.0 in `dependencies` (`package.json:79-81`) and `gds-compliance`, `gds-eslint-config` 6.3.0 in `devDependencies` (`:98-99`), all vendored `file:vendor/gds/` tarballs. `overrides` do not repeat them. [INSTALLATION_GUIDE.md, "Registry outage: bounded vendored fallback"](../INSTALLATION_GUIDE.md#registry-outage-bounded-vendored-fallback) treats vendoring as temporary and asks for a `temporary` exception; no `approvedExceptions` entry records it.
- **Stack.** Next.js `^16.3.7` App Router (`package.json:90`), React 19.2.0 (`:91`), Mantine `^8.3.6` (`:73-78`; installed 8.3.18), `@tabler/icons-react` (`:82`) and Tailwind CSS v4 (`tailwindcss` `:108`, `@tailwindcss/postcss` `:100`, `postcss.config.mjs:3`, `@import "tailwindcss"` at `app/globals.css:1`). Next.js 16 is outside the verified consumer line ([INSTALLATION_GUIDE.md, "Supported consumer baseline"](../INSTALLATION_GUIDE.md#1-supported-consumer-baseline)).
- **Provider and theme.** One `GdsProvider` (`components/gds/CameraGdsProvider.tsx:18-22`), rendered through `app/providers.tsx:6` from `app/layout.tsx:48`, with `GdsTelemetryProvider`, `GdsNotificationProvider`, `GdsToastProvider`, `OverlayManagerProvider` and `GdsConfirmProvider` inside it (`:23-31`). No `theme` prop is passed, so `GdsProvider` applies the `gdsTheme` default, which carries no `--gds-*` variables. `createBrandTheme`, `createPublicBrandTheme` and `createTheme` appear nowhere in `app`, `components` or `lib`, and `components/admin/TryOnResultModerationTable.test.tsx:3,36` renders under a bare `MantineProvider`. Event brand colours are hex strings on the event record (`brandColor`, `app/capture/[eventId]/page.tsx:65`) passed into Mantine props (`components/capture/WhoAreYouPage.tsx:154-156`), with defaults in `lib/gds/tokens/colors.ts:1-3`.
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is not imported. `app/layout.tsx:4-7` imports the Mantine stylesheets, `components/gds/gds-theme.css` and `app/globals.css`. `components/gds/gds-theme.css` is a local copy of an older GDS stylesheet (added in `332ea67`, 2026-06-08). Its rules are gated on `html[data-gds-theme-preset]`, which GDS sets only through `useGdsThemePresetState`, and no file in `app`, `components` or `lib` calls it. The copy defines none of the role and overlay tokens (`--gds-bg-*`, `--gds-text-*`, `--gds-border-card`, `--gds-overlay-surface`, `--gds-overlay-scrim`), so they are undefined; consumers include `components/admin/UserManagementActions.tsx:180-193` and `components/admin/CustomPagesManager.tsx:466,468`. Admin code also reads `--gds-*` names that no GDS release defines, for example `--gds-color-border`, `--gds-color-muted` and `--gds-color-surface` (`components/admin/TryOnFunnelChart.tsx` and others).
- **Manifest and compliance posture.** `gds-adoption.json` declares `gdsVersion` 6.3.0 (`:3`) and no `compliance.strictMode` (`:301-330`). `migrationStatus` `direct-consumption-in-progress` (`:331`) and the adapter `status` values `app-provider-composition` and `compatibility-adapter` (`:56`, `:62`) are not values in `schemas/gds-adoption.schema.json`. Six of the seven `approvedExceptions` have a `reviewDate` earlier than 2026-10-01 (`:94`, `:123`, `:165`, `:193`, `:223`, `:298`). The guided-tour exception says `gds-core` exports no Tour contract (`:238`), and installed 6.3.0 exports `GdsTourProvider`, `GdsGuidedTour`, `GdsTourButton` and `useGdsTour`. The landing exception waits for a creator-theming contract (`:162`), and installed 6.3.0 exports `CreatorThemeBoundary` and `validateCreatorCss`. `requiredContracts` (`:13-51`) lists contracts no file imports, for example `MediaCard`, `AdminReviewLayout`, `AdminDetailDrawer`, `ConfirmDialog`, `GdsChart`, `ShareButtonGroup` and `PlaybackControls`. `compliance.scopedBannedImports` (`:315-328`) is a key `gds-compliance` does not read. `scripts/check-gds-boundaries.mjs` enforces it for `app/admin` and `components/gds` only (`gds:check`, `package.json:13`), and its allow list names `components/gds/styles.ts`, which does not exist. `gds-compliance check` from the current GDS release reports no finding against this checkout. That does not cover any stylesheet (including `@import "tailwindcss"` at `app/globals.css:1`), colour literals under `lib/gds/tokens/`, which a `tokens/` path exempts as theme-owned, or any strict rule while `strictMode` is absent ([COMPLIANCE_TOOLKIT.md, "What a zero-finding run proves"](../COMPLIANCE_TOOLKIT.md#what-a-zero-finding-run-proves)).
- **Surfaces still without GDS.** The kiosk landing page (`app/landing/[slug]/page.tsx`) and its consent gate (`components/landing/LandingPageCookieConsent.tsx`) import no GDS or Mantine package. The landing shell is a CSS string in the page (`:115`), and creator CSS is injected as an unscoped `<style>` element (`:402`) outside `CreatorThemeBoundary`. The capture and public pages import `@mantine/core` directly (`app/capture/[eventId]/page.tsx:19`, `app/capture/page.tsx:17`, `app/page.tsx:14`, `components/camera/CameraCapture.tsx:24`), and the capture runtime uses Tailwind utility classes (`app/capture/[eventId]/page.tsx:1236`). In the capture progress stepper (`app/capture/[eventId]/page.tsx:1236-1262`), the active and inactive step classes differ only by whitespace. Browser `alert()` and `confirm()` calls remain (for example `app/admin/events/[id]/frames/page.tsx:119,124`) while `GdsToastProvider` and `GdsConfirmProvider` are mounted (`components/gds/CameraGdsProvider.tsx:25-27`). The admin chrome renders `AppShell` from `@sovereignsquad/gds-admin/client` (`components/admin/AdminChrome.tsx:6`).
- **Local code that duplicates a shipped GDS export.** Exports below are in installed 6.3.0.

| Local | Shipped export |
|---|---|
| `components/admin/UserManagementActions.tsx:174-200` and `components/admin/CustomPagesManager.tsx:461-470`: `role="dialog"` modals | `AdminModal` (`gds-admin`), `GdsModal` (`gds-core`); `AdminModal` is already used at `components/admin/TryOnResultModerationTable.tsx:1554` |
| `components/admin/PartnerSearchDropdown.tsx` | `SearchableSelect` (`gds-core`) |
| `Field` and `ColorField` in `components/gds/PublicPrimitives.tsx:39-55` | `FormField` (`gds-core`) |
| Raw `<input>` and `<textarea>` forms (for example `app/admin/partners/[id]/edit/page.tsx:168-210`) | `AdminCrudForm`, `AdminTextInput`, `AdminTextarea`, `AdminCheckbox` (`gds-admin`) |
| Bars drawn by hand inside `ReportingSection` (`components/admin/TryOnFunnelChart.tsx`) | `GdsChart` (`gds-core`) |
| `TextInput type="date"` (`app/admin/events/new/page.tsx:449`, `app/admin/events/[id]/edit/page.tsx:634`, `components/admin/TryOnAnalyticsFilterForm.tsx:38-39`) | `GdsDateInput`, `GdsDateRangeInput` (`gds-core`, with `@sovereignsquad/gds-theme/dates.css`) |
| `lib/tour/`, `components/tour/` | `GdsTourProvider`, `GdsGuidedTour`, `GdsTourButton`, `useGdsTour` (`gds-core`) |
| Creator CSS injection (`app/landing/[slug]/page.tsx:393-402`) | `CreatorThemeBoundary`, `validateCreatorCss`, `CreatorThemeDiagnostics` (`gds-core`) |
| `components/shared/LoadingSpinner.tsx` | `Loader`, `StateBlock` (`gds-core`) |
| `alert()` and `confirm()` | `useGdsToasts`, `useGdsConfirm` (`gds-core`) |
| `@mantine/core` re-exports in `components/gds/PublicPrimitives.tsx:4-36` | `Button`, `Stack`, `Badge`, `TextInput`, `NumberInput`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Container`, `Center`, `Box`, `Anchor`, `SimpleGrid` and `Group`, which `@sovereignsquad/gds-core/client` exports itself |

## Next steps

1. Import `@sovereignsquad/gds-theme/styles.css` once in `app/layout.tsx` before `app/globals.css`, in place of `@mantine/core/styles.css`, `@mantine/notifications/styles.css` and `components/gds/gds-theme.css` (`:4-6`), and delete the copy.
2. Replace the `--gds-*` names GDS does not define with component props or the role tokens in [SEMANTIC_ROLE_TOKENS.md](../docs/SEMANTIC_ROLE_TOKENS.md).
3. Move `alert()` and `confirm()` onto the mounted `useGdsToasts` and `useGdsConfirm`.
4. Renew the exceptions past their `reviewDate`, close the tour and landing exceptions against the exports above, and set `compliance.strictMode: true` as in [ADOPTION_AND_MIGRATION_PLAYBOOK.md, "Admin GDS-only migration contract"](../ADOPTION_AND_MIGRATION_PLAYBOOK.md#61-admin-gds-only-migration-contract).
5. Replace the hand-rolled dialogs, forms and charts above with the shipped exports.

The full fix list is `gds_fix_handover.md` at the repository root.

## Current pressure areas

Recorded 2026-06-07, with the status of each item on 2026-10-01.

| Pressure area | Status |
|---|---|
| needs Mantine 9 / React 19 / Next 16 clarity | The verified line is Mantine 8.3.x and 9.2.x, React 19.x and Next.js 15.x ([INSTALLATION_GUIDE.md, "Supported consumer baseline"](../INSTALLATION_GUIDE.md#1-supported-consumer-baseline)). Camera runs Mantine 8.3, React 19.2.0 and Next.js 16.3.7, and Next.js 16 is outside the verified line |
| needs stronger admin package coverage | Every entry in Camera's `requiredContracts` is exported by installed 6.3.0. Camera uses `AppShell` and `AdminModal`, and imports none of `AdminReviewLayout`, `AdminDetailDrawer`, `AdminFormStatus` or `AdminFormActions` |
| needs public-surface package coverage | `PublicShell`, `PublicFlowShell` and `PublicCaptureFlow` are exported by 6.3.0. Camera uses `PublicShell` (`components/public/PublicPageShell.tsx:5`), `PublicFlowShell` and `PlaybackSurface`, and does not import `PublicCaptureFlow` |
| needs media/gallery/upload patterns | `MediaCard`, `MediaPreviewCard`, `ListingCard` and `UploadDropzone` are exported by 6.3.0. Camera does not import `MediaCard` |
| needs editor/configuration workflow patterns | `EditorScaffold` is exported by `gds-admin` 6.3.0 |
| needs permission/access UI patterns | `AccessSummary` and `GdsAccessGate` are exported by 6.3.0 |
| needs SSR-safe App Router guidance | [INSTALLATION_GUIDE.md, "Next.js App Router"](../INSTALLATION_GUIDE.md#nextjs-app-router) documents the server and client split |
| needs strict admin-wrapper detection for form-heavy create/edit/detail/editor surfaces | `strict.admin.local-wrapper` exists ([COMPLIANCE_TOOLKIT.md, "Covered rule classes"](../COMPLIANCE_TOOLKIT.md#covered-rule-classes)) and runs only when `compliance.strictMode` is `true`, which Camera has not set |

## Central contracts Camera is expected to drive

1. compatibility and upgrade policy
2. server-safe/client-safe exports
3. stable admin package contract
4. public shell, auth, profile, and share/detail surface contract
5. media-heavy and upload pattern family
6. editor and settings workflow patterns
7. permission and access UI patterns
8. strict admin GDS-only wrapper boundary

## GDS-owned deliverables

- canonical admin create/edit/detail/editor replacement map in `ADOPTION_AND_MIGRATION_PLAYBOOK.md`
- strict-mode `approvedAdminPrimitives` manifest lane
- `gds-compliance` detection for local admin layout, form, action, breadcrumb, card, media, and field shims
- project-board issues phrased as reusable GDS migration contracts with product-specific source paths treated as consumer evidence, not package-owned implementation
- documentation that separates GDS-owned UI chrome from product-owned APIs, uploads, persistence, permissions, telemetry adapters, retries, and rollback behavior

Status 2026-10-01: the replacement map is in [ADOPTION_AND_MIGRATION_PLAYBOOK.md, "Admin GDS-only migration contract"](../ADOPTION_AND_MIGRATION_PLAYBOOK.md#61-admin-gds-only-migration-contract), which also names `approvedAdminPrimitives`. The strict admin rules are in `packages/gds-compliance/index.js` and run only with `compliance.strictMode`. The last two items were not verified 2026-10-01.

## Product-owned execution

The consuming Camera repository remains responsible for editing its app files, preserving its backend payloads, running its CI, and providing route-level visual and accessibility evidence. If the Camera team needs more package coverage, that gap should be escalated back here as a reusable GDS contract request rather than solved as a one-off local wrapper.

## Local exception direction

Keep these local unless another product proves the same contract:

- domain-specific media pipelines
- bespoke slideshow/layout editor internals
- relationship-specific data semantics beyond shared list/card/access framing

## Exit criteria

- Camera is listed in the portfolio matrix
- the missing shared contracts are linked to central GDS issues
- exception boundaries are explicit instead of implicit local freedom
- strict admin-wrapper compliance can fail remaining local admin shims in any admin/hybrid consumer

Status 2026-10-01:

- Met: Camera is listed in [PORTFOLIO_ADOPTION_MATRIX.md](PORTFOLIO_ADOPTION_MATRIX.md).
- Not verified 2026-10-01: links from the missing contracts to central GDS issues.
- Open: seven exceptions are recorded, six are past their `reviewDate`, and the tour and landing exceptions rest on premises that installed 6.3.0 no longer matches.
- Open: the strict rules can fail local admin shims, and Camera has not enabled them.
