# Amanoba Mantine-Only Refactor

Status: Legacy UI stack removed, GDS adoption gaps open
Version: 2.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/amanoba`

Paths below are relative to the Amanoba repository root.

## Objective

Refactor Amanoba into a strict Mantine-only product UI that follows the General Design System (`sovereignsquad/general-design-system`) without preserving Tailwind, Radix, or local CSS token layers as competing design authority.

This is a true refactor. The target is not a visual refresh, bridge layer, connector layer, or long-lived hybrid. The Tailwind/Radix primitive foundation is removed from product UI (see Current state), and Mantine is the only approved product UI runtime.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `67fb1e28`.

- **Packages.** `gds-core`, `gds-theme` and `gds-admin` 6.0.0 in `dependencies` (`package.json:117-119`) and `gds-a11y`, `gds-compliance`, `gds-eslint-config` 3.14.17 in `devDependencies` (`:170-172`). All six are GitHub Release tarball URLs, which [INSTALLATION_GUIDE.md, "Release-visibility artifacts"](../INSTALLATION_GUIDE.md#8-release-visibility-artifacts-not-an-install-path) excludes as a consumer install path. No file imports `gds-a11y`.
- **Stack.** Next.js 16 App Router (`package.json:145`), React 19 (`:152`) and Mantine `^9.2.2` (`:110-115`). Next.js 16 is outside the verified consumer line ([INSTALLATION_GUIDE.md, "Supported consumer baseline"](../INSTALLATION_GUIDE.md#1-supported-consumer-baseline)). `@mantine/form` is `^8.3.18` (`:112`) and no file imports it. Tailwind, Radix, `sonner`, `vaul` and `lucide-react` are not dependencies, and `tailwind.config.ts` and `postcss.config.mjs` no longer exist.
- **Provider and theme.** One `GdsProvider` (`app/components/providers/MantineRuntimeProvider.tsx:9`) with `defaultColorScheme="dark"` and no `locale`. A `next-themes` `ThemeProvider` with `attribute="class"` wraps it (`app/[locale]/layout.tsx:147-153`). The theme comes from `extendGdsTheme` (`app/lib/ui/amanoba-gds-theme.ts:1,13`), which `@sovereignsquad/gds-theme` marks `@deprecated` and [THEME_GOVERNANCE.md, "Base rule"](../THEME_GOVERNANCE.md#base-rule) leaves out of the approved lanes. Its component defaults hard-code dark surface and text colours (`:38`, `:43`, `:214-215`). The admin and editor layouts render `AppShell` from `@sovereignsquad/gds-admin/client` (`app/[locale]/admin/layout.tsx:13`, `app/[locale]/editor/layout.tsx:12`).
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is not imported. `app/[locale]/layout.tsx:24-27` imports the Mantine stylesheets, then `globals.css` (which imports `design-system.css`, `app/globals.css:1`) and `mobile-styles.css`, so the `--gds-*` tokens that GDS components read are undefined. `app/globals.css:28-31` assigns `--mantine-color-text` and `--mantine-color-dimmed` on `html[data-mantine-color-scheme='dark']`, a selector with lower specificity than Mantine's `:root[data-mantine-color-scheme='dark']` rule that sets the same variables (`@mantine/core/styles.css`). `app/mobile-styles.css:38-44` applies size and padding to every `button`, `a.button` and `[role="button"]` at 768px and below.
- **Manifest and compliance posture.** `gds-adoption.json` declares `gdsVersion` 6.0.0 (`:3`) and no `compliance.strictMode`. `productArchetype` `lms-game` (`:4`), `migrationStatus` `enforced` (`:134`) and the adapter `status` `brand-composition` (`:29`, `:39`, `:44`, `:49`, `:54`) are not values in `schemas/gds-adoption.schema.json`. The five `approvedExceptions` (`:82-115`) carry only `surface`, `reason`, `owner` and `reviewDate` (2026-05-26), plus `dependency` and `allowImports` on one, and `gds-compliance check` from the current GDS release reports `exception-required-fields` for each. Two of them name surfaces the code does not contain: no file uses `TypographyStylesProvider` and no game file uses a canvas. The same check reports `forbidden-color` in `scripts/`, in the certificate and OG renderers under `app/api`, and in the colour constants under `app/lib`; it reports nothing under `app/[locale]`, `app/components` or `components`, because it reads no stylesheet and skips every strict rule while `strictMode` is absent ([COMPLIANCE_TOOLKIT.md, "What a zero-finding run proves"](../COMPLIANCE_TOOLKIT.md#what-a-zero-finding-run-proves)). The repository has no CI workflow (`.github/workflows` was removed in `ca5cff27`). `npm run ui:gds:check` runs local scripts that call the exported `validateManifest` (`scripts/gds-compliance-product-ui.mjs:8`), not the `gds-compliance check` command.
- **Surfaces still without GDS.** The auth, public, article, learner and admin list pages render through `AuthShell`, `PublicAppShell`, `ArticleShell`, `LearnerShellAdapter` and `DataToolbar` in `app/components/patterns/gds/`. These carry GDS contract names, import no GDS package and render raw Mantine; the manifest declares them `brand-composition`. Outside `admin` and `editor`, no page under `app/[locale]` imports a GDS package directly. `CourseCard` passes course data into the pickup and inventory slots of `PublicProductCard` (`app/components/patterns/gds/CourseCard.tsx:298-310`), which installed 6.0.0 labels "Pickup" and "Availability" and badges "Available" by default (`PublicProductCard` in `@sovereignsquad/gds-core`). The `MetricCard` wrapper accepts `progress` and `color` and passes neither on (`app/components/patterns/gds/MetricCard.tsx:26-33,73-80`). Tailwind utility class names remain in markup with no Tailwind to generate them (for example `app/[locale]/courses/[courseId]/page.tsx:1303,1338`, `components/CourseDiscussion.tsx:251`).
- **Local adapter doc.** `docs/product/DESIGN_UPDATE.md:4` reads "GDS 3.14.17 enforced via `@sovereignsquad/*` from npm".
- **Local code that duplicates a shipped GDS export.** Exports below are in installed 6.0.0.

| Local | Shipped export |
|---|---|
| `app/components/patterns/gds/AuthShell.tsx`, `PublicAppShell.tsx`, `ArticleShell.tsx`, `DataToolbar.tsx`, `LearnerShellAdapter.tsx` | `AuthShell`, `PublicShell`, `ArticleShell`, `DataToolbar` (`gds-core`) |
| `app/[locale]/auth/signin/page.tsx:112-129`: hand-drawn Google button using `--color-google-*` tokens | `SocialAuthButtons`, `ProviderIdentityButton` (`gds-core`) |
| `app/[locale]/admin/courses/new/page.tsx:152`: Mantine `Stepper` | `GdsWizardStepper` (`gds-core`) |
| `app/[locale]/admin/settings/page.tsx:25,29`: `Select` and `TextInput` admin forms | `AdminCrudForm`, `AdminTextInput`, `AdminSelect` (`gds-admin`) |
| `app/[locale]/notifications/page.tsx:81-99`: hand-composed notification list | `NotificationCenterView` (`gds-core`) |
| `notifications.show` calls | `showGdsNotification` (`gds-theme`) |
| `modals.openConfirmModal` calls and `confirm()` (`app/[locale]/admin/questions/page.tsx:281`) | `useGdsConfirm` (`gds-core`) |

## Next steps

1. Import `@sovereignsquad/gds-theme/styles.css` once in `app/[locale]/layout.tsx` before `globals.css`, in place of the Mantine stylesheet imports at `:24-25`, which it already includes.
2. Replace `extendGdsTheme` with `createPublicBrandTheme` and pin the dark scheme in `GdsProvider`, as in [THEME_GOVERNANCE.md, "Appendix: Amanoba dark shell + yellow CTA"](../THEME_GOVERNANCE.md#appendix-amanoba-dark-shell--yellow-cta), in place of the `next-themes` provider.
3. Install all six GDS packages from GitHub Packages at one version ([INSTALLATION_GUIDE.md, "Canonical install commands"](../INSTALLATION_GUIDE.md#2-canonical-install-commands)).
4. Back `AuthShell`, `PublicAppShell`, `ArticleShell` and `DataToolbar` with the GDS exports. Keep course data off `PublicProductCard` until GDS ships a course or progress card.
5. Set `compliance.strictMode: true`, bring `productArchetype`, `migrationStatus` and the adapter `status` values into the schema, move the exceptions to the canonical exception contract, and run `gds-compliance check` in CI.

The full fix list is `gds_fix_handover.md` at the repository root.

## SSOT Rule

The General Design System repository (`sovereignsquad/general-design-system`) is the single source of truth for design, UI, UX, Mantine runtime rules, component contracts, responsive behavior, and design-system governance.

Amanoba-local documentation may describe current migration status, local file paths, validation commands, approved exceptions, and implementation sequencing. Amanoba-local documentation may not redefine component behavior, token policy, interaction meaning, responsive rules, accessibility expectations, or Mantine-only runtime requirements.

## Non-Goals

- preserving Tailwind as the product UI design authority
- preserving Radix primitives as the product UI primitive layer
- preserving `app/design-system.css` as a permanent token source
- preserving `tailwind.config.ts` as a permanent UI token map
- preserving local CSS utility classes as a parallel component system
- adding Mantine beside the existing stack and calling that complete
- migrating game canvas internals that are not ordinary product UI primitives

## Former UI foundation (superseded)

Before 2026-05-23 Amanoba used the stack below. Current status of each item:

| Former item | Status |
|---|---|
| Tailwind CSS utility classes across `app/**` and `components/**` | Dependency and `tailwind.config.ts` removed in `3c3aa30b` (2026-05-23). Class names remain in markup |
| `app/design-system.css`, `app/globals.css`, `app/mobile-styles.css` | Present |
| `@radix-ui/*` packages | Not in `package.json`, no importers |
| `sonner`, `vaul` | Not in `package.json`, no importers |
| `tailwindcss-animate`, `@tailwindcss/typography` | Removed in `3c3aa30b` |
| `app/components/ui/markdown-editor.tsx` | Present; Mantine-governed lesson Markdown editor |

The former local `Button`, `Card`, rich text editor, and `cn` adapters were retired on 2026-05-21.

## Target End State

- one root provider governs Amanoba product UI: `GdsProvider` (done); a `next-themes` provider still sits beside it
- one exported Amanoba Mantine theme is the only product token authority (open: `app/design-system.css` still defines a second token layer, and the theme is built with the deprecated `extendGdsTheme`)
- Mantine notifications and modals are configured centrally (done: `GdsProvider` mounts both)
- product UI primitives render from Mantine directly or thin Amanoba Mantine wrappers (in progress per the phase statuses; the learner, public and article shells import no GDS package)
- buttons, inputs, selects, checkboxes, radios, switches, forms, cards, alerts, modals, drawers, tabs, tables, badges, tooltips, loaders, skeletons, pagination, and notifications follow the shared component contracts (open: raw Mantine controls and local wrappers remain, see Current state)
- page shells and responsive behavior follow [RESPONSIVE_AND_PLATFORM_GUIDANCE.md](../docs/RESPONSIVE_AND_PLATFORM_GUIDANCE.md) (the former `NAVIGATION_RESPONSIVE.md` no longer exists; adherence not verified 2026-10-01)
- current Tailwind/Radix/local CSS files are deleted or reduced to narrow non-product exceptions (Tailwind and Radix done; the three global CSS files remain)
- no new product UI may import Radix primitives, Tailwind design utilities, `sonner`, `vaul`, or local CSS token systems
- `@sovereignsquad/gds-theme/styles.css` loaded once (open)

## Pattern Service Priorities

Amanoba must use `PATTERN_SERVICE_MODEL.md` as the cross-project implementation plan for reusable Mantine patterns.

Highest-value contracts to complete next:

1. **Learner/Public/Article Shells**: promote existing Mantine learner navigation into explicit shell contracts and ensure public and article/news surfaces use equally strict shells. Status: local wrappers exist and render raw Mantine.
2. **Course Card System**: replace all course card variants with canonical `CourseCatalogCard`, `EnrolledCourseCard`, `CourseProgressCard`, and `AdminCourseCard` contracts. Status: one `CourseCard` exists, built on `PublicProductCard`; the four named contracts do not exist.
3. **Metric And Progress Cards**: normalize dashboard, profile, course progress, certificate, and achievement metrics through shared Mantine metric components. Status: `MetricCard` and `ProgressCard` wrappers delegate to GDS; `MetricCard` drops `progress` and `color`.
4. **State Blocks**: replace page-local loading, empty, error, permission, disabled, and success states with shared state-block contracts. Status: a `StateBlock` wrapper delegates to GDS.
5. **Article/News Layout**: standardize news/blog index cards, article detail layout, side rails, and metadata through an article shell contract. Status: `ArticleShell` is local and renders raw Mantine.

Acceptance requirements:

- no page-local shell/card/state implementation where a local contract exists
- all card and metric variants use Mantine primitives and the Amanoba theme
- mobile surfaces show one visible primary action per card
- dark-mode readability is verified through theme tokens, not page-local overrides

## Required Mantine Package Baseline

Status: complete. `@mantine/form` is declared at 8.3.18 beside Mantine 9 and is unused.

Add:

- `@mantine/core`
- `@mantine/hooks`
- `@mantine/form`
- `@mantine/notifications`
- `@mantine/modals`
- `@tabler/icons-react`

Likely optional after surface review:

- `@mantine/dates`
- `@mantine/charts`
- `@mantine/dropzone`
- `@mantine/spotlight`
- `@mantine/tiptap`

## Required Local Adapter

Amanoba must maintain local adapter status in:

- `docs/product/DESIGN_UPDATE.md`
- `docs/architecture/layout_grammar.md`
- `docs/core/CODING_STANDARDS.md`

All three exist. `docs/product/DESIGN_UPDATE.md:4` states a GDS version and install source that differ from `package.json`.

The adapter must document:

- local status: `migrating`
- current UI foundation
- target UI foundation
- Mantine-only primitive policy
- root provider/theme implementation note
- wrapper component paths or direct primitive policy
- notifications/modals setup path
- validation commands
- known exceptions
- migration backlog

## Required Root Runtime

Status: complete.

Create or define:

- root Mantine provider composition in the App Router root
- one Amanoba theme module
- Mantine notifications root
- Mantine modals provider
- wrapper/direct primitive policy
- legacy-import freeze policy

Implemented in:

- `app/components/providers/MantineRuntimeProvider.tsx`
- `app/lib/ui/mantine-theme.ts`, which re-exports `app/lib/ui/amanoba-gds-theme.ts`
- `app/[locale]/layout.tsx`

## Legacy Inventory To Retire

| Item | State |
|---|---|
| `app/design-system.css` | Present |
| `app/mobile-styles.css` | Present |
| product-UI authority inside `app/globals.css` | Present |
| `tailwind.config.ts` | Deleted in `3c3aa30b` |
| `postcss.config.mjs` | Deleted in `3c3aa30b` |
| current Radix-backed UI primitive usage | None |
| `sonner` and `vaul` product UI usage | None |
| Tailwind helper usage in product UI | Dependencies removed; class names remain in markup |
| stale docs that describe local CSS/Tailwind as the design authority | Not verified 2026-10-01 |

## Allowed Exceptions

Exceptions must be documented locally and kept narrow:

- game canvas or game-engine internals
- certificate/OG image rendering
- email rendering constrained by email clients
- rich lesson/editorial content where Mantine is the surrounding layout
- third-party provider-branded controls
- charting or visualization engines, with Mantine-governed surrounding layout and state

## Migration Phases

### Phase 0: Freeze And Readiness

Status: Complete as of 2026-05-21.

Tasks:

- [x] update local docs to reference this plan
- [x] add a legacy-import freeze rule
- [x] define Mantine direct-vs-wrapper policy
- [x] define Phase 1 files and acceptance criteria
- [x] stop adding new Tailwind/Radix product UI primitives

Exit criteria:

- [x] Amanoba docs point to this plan
- [x] new UI work has a clear Mantine-only rule
- [x] Phase 1 root-runtime scope is approved

### Phase 1: Root Mantine Runtime

Status: Complete as of 2026-05-21.

Tasks:

- [x] install required Mantine packages
- [x] create one Amanoba Mantine theme
- [x] add root provider composition
- [x] register Mantine notifications and modals
- [x] keep existing UI visually stable while root runtime lands
- [x] add initial guardrail against new legacy primitive imports

Exit criteria:

- [x] all product UI renders under `MantineProvider`
- [x] one theme module is the only approved new token authority
- [x] notifications and modals are available centrally
- [x] docs and validation commands reflect the root runtime

### Phase 2: Core Primitives

Status: In progress. Active course-surface voting, discussion, study-group, cookie consent, catalog, course detail primitives, sign-in, anonymous login, dashboard, referral card, saved lessons, Practice Hub, lesson quiz runtime, final exam, public certificate verification, profile/certificate pages, new-course admin form, admin course-family list, full admin course editor, admin dashboard, admin payments, admin settings, admin certificates, quiz manager modal, editor lesson page, and Markdown lesson editor have moved to Mantine. The legacy local Button/Card/rich-text/cn adapters are retired.

Migrate first:

- button/action icon
- text input/password input/textarea/select
- checkbox/radio/switch
- alert/notification
- modal/drawer
- card/paper
- loader/skeleton
- badge/tooltip

Exit criteria:

- all new forms and core actions use Mantine primitives or thin Mantine wrappers
- legacy shared primitives are deprecated or redirected
- remaining broad legacy product UI is tracked as surface-specific migration work, not shared primitive foundation work

### Phase 3: Auth, Course, And Learner-Critical Flows

Status: In progress. Public course browse/detail/enrolment, enrolled lesson runtime, lesson quiz runtime, final exam, saved lessons, Practice Hub, sign-in/anonymous login, dashboard, referral card, public profile, profile certificate, and public certificate verification have Mantine-governed UI. Remaining learner-critical gaps are course detail internals, game UI internals where applicable, and older account/rewards/challenges flows.

Primary surfaces:

- sign-in and auth return flows
- dashboard
- course browse/detail/enrolment
- lesson page
- lesson quiz page
- final exam and certificate purchase/completion flows
- saved lessons and practice hub

Exit criteria:

- learner-critical flows no longer depend on Tailwind/Radix product primitives
- loading, empty, error, disabled, and permission states are Mantine-governed

### Phase 4: Admin And Editor Surfaces

Status: In progress. New-course admin form, admin course-family list, full admin course editor, admin dashboard, admin payments, admin settings, admin certificates, quiz manager modal, editor lesson page, and Markdown lesson editor have Mantine-governed UI. The largest remaining admin gaps are now admin questions, achievement editor pages, analytics, surveys, players, games, rewards, and reporting surfaces.

Primary surfaces:

- admin dashboard
- course CRUD
- lesson builder
- quiz manager
- player management
- achievements/rewards/challenges
- feature flags/settings
- analytics tables and filters

Exit criteria:

- high-change admin/editor screens use Mantine forms, tables, tabs, modals, drawers, alerts, and notifications
- bulk/destructive actions follow shared contracts

### Phase 5: Secondary Surfaces And Docs UI

Primary surfaces:

- blog/news pages
- static policy/legal pages
- release/archive surfaces
- profile/certificate public pages
- lower-traffic game chrome

Exit criteria:

- only documented non-primitive exceptions remain

### Phase 6: Deletion And Dependency Cleanup

Status: Partial. Radix, `sonner`, `vaul` and Tailwind dependencies are removed. `app/design-system.css`, `app/mobile-styles.css` and the product rules in `app/globals.css` remain.

Tasks:

- remove unused Radix dependencies
- remove `sonner` and `vaul` if fully replaced
- remove Tailwind dependencies if no longer used
- delete obsolete CSS/token files
- remove obsolete Tailwind helper utilities
- rewrite UI audit scripts to enforce Mantine-only product UI

Exit criteria:

- no product UI imports old primitive layers
- no local CSS/Tailwind token system remains active as design authority
- dependency graph no longer includes removed UI foundations
- docs describe Mantine-only as current runtime truth, not future target

## Enforcement Rules

- no new product UI imports from Radix packages
- no new product UI uses `sonner` or `vaul`
- no new product UI adds Tailwind utility styling as its primary design implementation
- no new design tokens outside the Mantine theme
- no new page-level CSS for ordinary product UI
- any exception must be recorded in `docs/product/DESIGN_UPDATE.md`

## Validation Commands

During migration, run the relevant subset:

- `npm run lint`
- `npm test`
- `npm run type-check`
- `npm run build`
- `npm run docs:check`
- `npm run ui:check:mantine`
- `npm run ui:check:foundation`
- `npm run ui:check:layout`

The dedicated Mantine-only check is active as `npm run ui:check:mantine`; it rejects new product UI imports from frozen legacy primitive systems.

## Progress Snapshot As Of 2026-05-23 (historical)

- Root Mantine runtime is active through `app/components/providers/MantineRuntimeProvider.tsx`.
- Amanoba Mantine theme is active in `app/lib/ui/mantine-theme.ts`.
- Mantine notifications and modals are centrally available.
- `npm run ui:check:mantine`, `npm run ui:check:foundation`, and `npm run ui:check:layout` are active local guardrails.
- Course catalog and public course detail page wrappers are Mantine-based.
- Learner navigation now uses `app/components/LearnerPageHeader.tsx` as the canonical Mantine header across dashboard, my courses, course catalog, Practice Hub, saved lessons, blog, and news index pages.
- Blog/news index pages and the language switcher no longer use Tailwind/raw form chrome; they use Mantine primitives.
- Active course voting, discussion, and study-group components use Mantine primitives and Tabler icons.
- Cookie consent uses compact Mantine controls.
- Enrolled lesson runtime wrapper/actions use Mantine primitives for completion, quiz gating, saved lessons, assessment feedback, navigation, voting, and locked recovery.
- Lesson and quiz protected-route recovery states use Mantine primitives.
- Lesson quiz runtime and final exam runtime use Mantine forms, cards, buttons, progress, alerts, and result states.
- Saved lessons, Practice Hub, dashboard/referral card, sign-in, anonymous login, profile, and profile certificate pages use Mantine learner UI primitives.
- Public certificate verification pages use Mantine cards, status badges, notifications, and actions.
- Superseded: the admin navigation shell now uses `AppShell` from `@sovereignsquad/gds-admin/client` in `app/[locale]/admin/layout.tsx:13`, with Mantine `NavLink` and `Menu` and Tabler icons.
- New-course admin form, admin course-family list, full admin course editor, admin dashboard, admin payments, admin settings, admin certificates, quiz manager modal, editor lesson page, and Markdown lesson editor use Mantine form, table, card, notification, and modal primitives.
- Superseded: local adapter docs aligned to GDS 2.2.0. `docs/product/DESIGN_UPDATE.md:4` names 3.14.17 and `package.json` declares 6.0.0.
- Course access recovery uses `CourseAccessRecoveryActions` and structured day API codes for protected lesson/quiz routes.
- Mobile course catalog/detail surfaces reserve space for cookie consent via `app/lib/ui/consent-layout.ts`.
- Legacy local `Button`, `Card`, rich text editor, and `cn` adapters are deleted; `class-variance-authority`, `clsx`, and `tailwind-merge` are no longer direct Amanoba dependencies.
- Stale duplicate app-level course community components were removed from Amanoba.

Remaining high-priority gaps:

- secondary learner rewards, challenges, leaderboards, onboarding, and game chrome still need Mantine-only conversion or documented exception handling
- admin questions, achievement editor pages, analytics, surveys, players, games, rewards, and reporting surfaces still need Mantine-only conversion or documented exception handling
- `app/design-system.css` and transitional `app/globals.css` product rules remain deletion-phase work after remaining legacy surfaces migrate
- superseded: `lucide-react` is not a dependency and no file imports it

## First Implementation PR Shape

Phase 1 delivered this shape.

The first implementation PR should include:

- Mantine dependencies
- root provider and theme files
- notifications/modals setup
- initial wrapper/direct primitive policy
- local docs updated with concrete implementation paths
- guardrail preventing new legacy primitive imports
- one small migrated surface or one migrated core primitive for proof

It should not:

- attempt full app conversion in one PR
- keep two active token systems as a planned end state
- create broad wrapper abstractions before Mantine defaults are evaluated

## Done Criteria

Status 2026-10-01: the Tailwind, Radix, `sonner` and `vaul` criteria are met. The single token authority and local-docs criteria are open (see Current state).

Amanoba is Mantine-only only when:

- Mantine is the only foundational product UI runtime
- one Amanoba Mantine theme is the only token authority for product UI
- product UI primitives are Mantine or thin approved Mantine wrappers
- notifications and modals are Mantine-based
- Tailwind/Radix/sonner/vaul are removed from ordinary product UI
- old CSS/token files are deleted or narrowed to documented exceptions
- local docs consistently point to the shared SSOT and describe Mantine-only as current truth
