# Consumer GDS Gap Implementation Plan

Status: Draft implementation plan
Owner: GDS
Date: 2026-06-06
Source: consumer migration audit for a repo currently in `partial` GDS adoption state

## Purpose

This plan maps the consumer migration request list against the current GDS repository. The goal is to separate:

- capabilities already shipped and good enough for consumer migration
- capabilities already shipped but too thin and requiring contract hardening
- capabilities missing from package-native GDS and requiring implementation

The consumer evidence shows active direct Mantine and Tabler usage, local adapters, native browser dialogs, raw tables, inline styles, and approved runtime exceptions. Those are not all consumer failures. Several are caused by missing or underspecified GDS package contracts.

## Current Package Coverage Summary

| Request area | Current GDS surface | Status | Decision |
|---|---|---:|---|
| Admin CRUD form primitives | `FormSection`, `FormField`, `useGdsForm`, `ContentOpsEditor`, `ContentOpsActionBar` | Partial | Implement package-native admin field and action primitives |
| Admin media card / asset preview | `MediaCard`, `MediaField`, `UploadDropzone` | Partial | Fine-tune media preview card contract for admin assets |
| Responsive inventory grid | `ResponsiveDataView`, `ListingCard`, `MediaCard`, `BrowseSurface` | Partial | Implement admin resource grid/card pattern |
| Admin data table / analytics table | `DataTable`, `SimpleDataTable`, `AdvancedDataTable` | Partial | Harden admin table and analytics table contracts |
| Confirmation/destructive action API | `ConfirmDialog`, `OverlayManagerProvider` | Partial | Add imperative/provider-based confirm API and destructive action patterns |
| Toast/notification contract | `GdsNotificationProvider`, `NotificationCenter`, `InlineAlert`, `BannerNotice` | Partial | Add toast helpers, live region semantics, and action/retry affordances |
| Admin modal / detail drawer | `OverlayManagerProvider`, `DetailProfileShell`, `ConfirmDialog` | Partial | Implement GDS modal/drawer wrappers for admin detail/review |
| Icon system | `GdsIcons` | Partial | Keep registry, add icon key component and compliance ban for direct Tabler imports |
| Admin resource manager pattern | `ContentOpsEditor`, `ContentOpsSection`, `ResponsiveDataView`, `ActionBar` | Missing as a pattern | Implement high-level resource manager shell |
| Public flow shell extensions | `PublicFlowShell`, `ActionBar`, `ShareButtonGroup`, `MediaField` | Partial | Extend staged flow contracts for capture/consent/share/restart |
| Playback surface controls | `PlaybackSurface` | Partial | Add first-class playback controls and keyboard contract |
| Creator-authored landing theme contract | `ReferenceThemeExplorer`, theme lanes, vibe themes, compliance exceptions | Partial | Implement creator CSS boundary and validation contract |
| No-inline-style replacement path | `SectionPanel`, `SurfacePresentation`, card contracts, layout blocks | Partial | Add small layout/style primitives for recurring inline patterns |
| Compliance tooling | `gds-compliance` | Partial | Expand scanner rules and fixture coverage |
| Exception registry support | `gds-adoption.json` validation and exception-scope checks | Mostly covered | Fine-tune rule suppression by exception category/status |

## What Is Already Enough

These surfaces can be used now by consumers with only documentation and examples:

- `ActionBar` and `SemanticButton` for save/cancel/primary/secondary action ordering.
- `StateBlock`, `EmptyState`, and `AsyncSurface` for loading, empty, error, permission, disabled, and success states.
- `MediaField` and `UploadDropzone` for upload field state contracts where the consumer owns storage transport.
- `PublicFlowShell` as the top-level staged public flow wrapper around hardware-adjacent surfaces.
- `ShareButtonGroup` for public share/copy-link actions.
- `GdsIcons` as the central icon authority, provided consumers can migrate by semantic key.
- Existing exception manifest validation for canonical exception fields, narrow scopes, stale scopes, and local adapter coverage.

## What Needs Fine-Tuning

### Admin Data Tables

Current `packages/gds-admin/src/DataTable.tsx` is a simple Mantine table wrapper. It needs:

- column alignment and numeric formatting metadata
- sortable column metadata and controlled sort callbacks
- filter/search toolbar integration
- empty, loading, error, and permission states
- responsive overflow strategy and optional mobile card fallback
- accessible `scope`, captions, row headers, and `aria-sort`
- analytics-table variant for metric-heavy rows

Deliverables:

- `AdminDataTable`
- `AdminAnalyticsTable`
- updated `ResponsiveDataView` to delegate to the hardened table
- reference demos and tests for loading, empty, sort, mobile, and numeric metrics

### Media Card / Asset Preview

Current `MediaCard` requires consumers to pass arbitrary media as `ReactNode`, so GDS does not own image treatment or alt/caption behavior. It needs:

- `src`, `thumbnailSrc`, `alt`, `caption`, and `metadata` props
- contain/cover mode
- fixed aspect-ratio presets
- action slots with one mobile primary action and overflow lane
- loading/error/missing-image states
- admin-safe dense variant

Deliverables:

- `AdminMediaPreviewCard`
- optional `AssetMetadataList`
- migration docs from local media preview cards

### Confirmation, Toasts, Modals, Drawers

Current contracts are component-level and require each consumer to wire state. They need a package-native interaction API:

- `GdsConfirmProvider` and `useGdsConfirm()`
- `confirmDestructive({ title, targetName, consequence, onConfirm })`
- `GdsToastProvider` or helpers layered on `GdsNotificationProvider`
- `notifySuccess`, `notifyError`, `notifyActionComplete`
- `AdminModal` and `AdminDetailDrawer` with focus return, mobile full-screen behavior, action footer, and preview/detail layouts

Deliverables:

- provider APIs
- component APIs
- tests for focus/keyboard behavior where feasible
- compliance rule banning `alert()` and `window.confirm()` outside exceptions

### Public Flow And Playback

`PublicFlowShell` and `PlaybackSurface` frame the surface, but controls remain consumer-authored. They need:

- capture stage presets: identify, consent, capture, accept, CTA, restart, share
- mobile/landscape control layout slots
- `PlaybackControls` with play/pause, next/previous, fullscreen, and status
- keyboard operation and reduced-motion behavior
- empty/error/degraded playback control states

Deliverables:

- `PublicCaptureFlow`
- `PublicConsentStep`
- `PublicShareOverlay`
- `PlaybackControls`
- demos for mobile and fullscreen/kiosk modes

## What Must Be Implemented

### Admin CRUD Field Kit

Implement package-native admin CRUD primitives in `packages/gds-admin`:

- `AdminTextInput`
- `AdminTextarea`
- `AdminCheckbox`
- `AdminSelect`
- `AdminFileUpload`
- `AdminFormSection`
- `AdminFormActions`
- `AdminFormStatus`
- `AdminCrudForm`

These should wrap Mantine internally but expose GDS semantic props, validation placement, loading/disabled behavior, and action ordering. Consumers should not import Mantine fields for routine admin CRUD.

### Admin Resource Manager Pattern

Implement a high-level pattern for repeated resource management:

- list existing resources
- add/edit/delete
- assign/unassign/toggle active
- copy public URL
- open preview
- contextual empty/loading/error states

Proposed exports:

- `AdminResourceManager`
- `AdminResourceGrid`
- `AdminResourceCard`
- `AdminResourceToolbar`
- `AdminResourceEmptyState`

### Creator-Authored Landing Theme Contract

Implement a formal contract for product-authored CSS customization:

- allowed token registry
- scoped CSS boundary
- blocked selectors/properties
- contrast validation hooks
- CTA and consent visibility validation
- preview diagnostics state

Proposed exports:

- `CreatorThemeBoundary`
- `validateCreatorCss`
- `CreatorThemeDiagnostics`
- compliance rules for unsafe creator CSS outside approved exceptions

### No-Inline-Style Replacement Primitives

Add package primitives for recurring style/layout patterns:

- `BorderedHeaderPanel`
- `MediaAspectBox`
- `GradientActionPanel` or tokenized `AccentActionPanel`
- `ResponsiveSpacing`
- `PlainLinkBox`
- `ImageContainBox`
- `OverflowPanel`

These should be small and boring. The target is to remove repeated inline styles, not create a second layout framework.

## Compliance Tooling Plan

`packages/gds-compliance` already validates manifests, exception shape, local adapters, strict local wrapper drift, theme governance, and identity provider branding. Expand it with these rules:

| Rule | Severity | Exception-aware |
|---|---:|---:|
| banned `@mantine/core` imports in consumer app code | error | yes |
| banned `@tabler/icons-react` imports in consumer app code | error | yes |
| raw `<button>` outside approved runtime exceptions | error | yes |
| raw `<input>`, `<select>`, `<textarea>` outside approved runtime exceptions | error | yes |
| `alert()` and `window.confirm()` | error | yes |
| raw `<table>`, `<th>`, `<td>` outside GDS table contract | error | yes |
| inline `style={{ ... }}` outside approved exceptions | warn first, error in strict mode | yes |
| local `components/gds/*` adapters not listed in manifest | error | yes |

Exception support should suppress only when:

- file path matches a narrow exception scope
- exception status is `approved` or `temporary`
- exception category matches the violation family
- exception `mustStillUse` names a relevant GDS primitive where applicable

## Delivery Sequence

### Phase 1: Admin Migration Unblockers

1. Implement Admin CRUD Field Kit.
2. Harden Admin Data Table and Analytics Table.
3. Implement confirmation/toast/modal/drawer provider APIs.
4. Add reference examples for common create/edit/delete pages.

Exit criteria:

- consumer admin forms can remove direct Mantine fields for ordinary CRUD
- consumer analytics raw table can migrate to GDS
- browser dialogs can be replaced with GDS confirmation and notification APIs

### Phase 2: Resource And Media Patterns

1. Implement Admin Resource Manager.
2. Implement Admin Resource Grid/Card.
3. Fine-tune Media Preview Card contract.
4. Add migration examples for frames, logos, partners, events, submissions, garments, and users.

Exit criteria:

- local inventory list adapters can be deleted or reduced to thin data mappers
- media preview cards no longer require consumer-owned image layout and action chrome

### Phase 3: Icon And Compliance Enforcement

1. Add semantic `GdsIcon` component and typed icon keys.
2. Expand compliance scanner rules.
3. Add fixtures for Mantine imports, Tabler imports, raw controls, raw tables, browser dialogs, inline styles, and exception-suppressed cases.
4. Update adoption templates to include the new strict rules.

Exit criteria:

- CI can fail on the violations found in the consumer audit
- approved exceptions remain narrow and explicit

### Phase 4: Public Runtime Contracts

1. Extend public capture/consent/share/restart shell contracts.
2. Add playback control primitives.
3. Implement creator-authored landing theme validation.
4. Add mobile/landscape and reduced-motion demos.

Exit criteria:

- approved runtime exceptions cover only hardware/runtime internals
- surrounding public UI can move to GDS-owned contracts
- creator CSS remains product-authored but bounded and validated

## Recommended Issue Breakdown

1. `gds-admin: implement CRUD field kit`
2. `gds-admin: harden data table and analytics table`
3. `gds-core: add confirm/toast provider APIs`
4. `gds-admin: add modal and detail drawer contracts`
5. `gds-admin: implement resource manager/grid/card pattern`
6. `gds-core: harden media preview/card contract`
7. `gds-core: add typed GdsIcon component`
8. `gds-compliance: add strict import/control/table/dialog/style rules`
9. `gds-compliance: make rule suppression exception-category aware`
10. `gds-core: extend public flow and playback controls`
11. `gds-theme/gds-compliance: add creator-authored CSS boundary contract`
12. `docs/reference: add migration recipes for partial-to-strict adoption`

## Consumer Migration Guidance After Delivery

After Phases 1-3, the consumer repo should be able to change `gds-adoption.json` from broad `partial` usage toward a strict profile for admin surfaces while keeping explicit runtime exceptions for capture/slideshow/creator CSS. Public runtime surfaces should move last because their exceptions mix real hardware constraints with currently missing GDS shell and control contracts.
