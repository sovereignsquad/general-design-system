# Amanoba Mantine-Only Refactor

Status: In progress
Version: 1.0.0
Last updated: 2026-05-23
Project: `/Users/moldovancsaba/Projects/amanoba`

## Objective

Refactor Amanoba into a strict Mantine-only product UI that follows `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` without preserving Tailwind, Radix, or local CSS token layers as competing design authority.

This is a true refactor. The target is not a visual refresh, bridge layer, connector layer, or long-lived hybrid. The end state removes the current Tailwind/Radix primitive foundation from product UI and makes Mantine the only approved product UI runtime.

## SSOT Rule

`/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` is the single source of truth for design, UI, UX, Mantine runtime rules, component contracts, responsive behavior, and design-system governance.

Amanoba-local documentation may describe current migration status, local file paths, validation commands, approved exceptions, and implementation sequencing. Amanoba-local documentation may not redefine component behavior, token policy, interaction meaning, responsive rules, accessibility expectations, or Mantine-only runtime requirements.

## Non-Goals

- preserving Tailwind as the product UI design authority
- preserving Radix primitives as the product UI primitive layer
- preserving `app/design-system.css` as a permanent token source
- preserving `tailwind.config.ts` as a permanent UI token map
- preserving local CSS utility classes as a parallel component system
- adding Mantine beside the existing stack and calling that complete
- migrating game canvas internals that are not ordinary product UI primitives

## Current UI Foundation

Amanoba currently uses:

- Tailwind CSS utility classes across `app/**` and `components/**`
- local CSS token files:
  - `/Users/moldovancsaba/Projects/amanoba/app/design-system.css`
  - `/Users/moldovancsaba/Projects/amanoba/app/globals.css`
  - `/Users/moldovancsaba/Projects/amanoba/app/mobile-styles.css`
- Radix primitive dependencies:
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-label`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-select`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toast`
  - `@radix-ui/react-tooltip`
- overlay/toast dependencies outside Mantine:
  - `sonner`
  - `vaul`
- Tailwind helper dependencies:
  - `tailwindcss-animate`
  - `@tailwindcss/typography`
- remaining local UI/editor components in:
  - `/Users/moldovancsaba/Projects/amanoba/app/components/ui/markdown-editor.tsx`
  - `/Users/moldovancsaba/Projects/amanoba/components/*`

The former local `Button`, `Card`, rich text editor, and `cn` adapters were retired on 2026-05-21. The Markdown editor remains as a Mantine-governed content editor for lesson Markdown.

## Target End State

- one root `MantineProvider` governs Amanoba product UI
- one exported Amanoba Mantine theme is the only product token authority
- Mantine notifications and modals are configured centrally
- product UI primitives render from Mantine directly or thin Amanoba Mantine wrappers
- buttons, inputs, selects, checkboxes, radios, switches, forms, cards, alerts, modals, drawers, tabs, tables, badges, tooltips, loaders, skeletons, pagination, and notifications follow the shared component contracts
- page shells and responsive behavior follow `NAVIGATION_RESPONSIVE.md`
- current Tailwind/Radix/local CSS files are deleted or reduced to narrow non-product exceptions
- no new product UI may import Radix primitives, Tailwind design utilities, `sonner`, `vaul`, or local CSS token systems

## Pattern Service Priorities

Amanoba must use `PATTERN_SERVICE_MODEL.md` as the cross-project implementation plan for reusable Mantine patterns.

Highest-value contracts to complete next:

1. **Learner/Public/Article Shells**: promote existing Mantine learner navigation into explicit shell contracts and ensure public and article/news surfaces use equally strict shells.
2. **Course Card System**: replace all course card variants with canonical `CourseCatalogCard`, `EnrolledCourseCard`, `CourseProgressCard`, and `AdminCourseCard` contracts.
3. **Metric And Progress Cards**: normalize dashboard, profile, course progress, certificate, and achievement metrics through shared Mantine metric components.
4. **State Blocks**: replace page-local loading, empty, error, permission, disabled, and success states with shared state-block contracts.
5. **Article/News Layout**: standardize news/blog index cards, article detail layout, side rails, and metadata through an article shell contract.

Acceptance requirements:

- no page-local shell/card/state implementation where a local contract exists
- all card and metric variants use Mantine primitives and the Amanoba theme
- mobile surfaces show one visible primary action per card
- dark-mode readability is verified through theme tokens, not page-local overrides

## Required Mantine Package Baseline

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

- `/Users/moldovancsaba/Projects/amanoba/docs/product/DESIGN_UPDATE.md`
- `/Users/moldovancsaba/Projects/amanoba/docs/architecture/layout_grammar.md`
- `/Users/moldovancsaba/Projects/amanoba/docs/core/CODING_STANDARDS.md`

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

Create or define:

- root Mantine provider composition in the App Router root
- one Amanoba theme module
- Mantine notifications root
- Mantine modals provider
- wrapper/direct primitive policy
- legacy-import freeze policy

Candidate target paths:

- `/Users/moldovancsaba/Projects/amanoba/app/providers.tsx`
- `/Users/moldovancsaba/Projects/amanoba/app/lib/ui/mantine-theme.ts`
- `/Users/moldovancsaba/Projects/amanoba/app/lib/ui/mantine-provider.tsx`
- `/Users/moldovancsaba/Projects/amanoba/app/components/mantine/*`

Exact paths may change during implementation, but the responsibilities may not.

## Legacy Inventory To Retire

Delete or reduce after migration:

- `/Users/moldovancsaba/Projects/amanoba/app/design-system.css`
- `/Users/moldovancsaba/Projects/amanoba/app/mobile-styles.css`
- product-UI authority inside `/Users/moldovancsaba/Projects/amanoba/app/globals.css`
- `/Users/moldovancsaba/Projects/amanoba/tailwind.config.ts`
- `/Users/moldovancsaba/Projects/amanoba/postcss.config.mjs` if only needed for Tailwind
- current Radix-backed UI primitive usage
- `sonner` and `vaul` product UI usage
- Tailwind helper usage in product UI
- stale docs that describe local CSS/Tailwind as the design authority

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

## Current Amanoba Progress Snapshot

As of 2026-05-23:

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
- Admin navigation shell uses Mantine `AppShell` in `app/[locale]/admin/layout.tsx` with `NavLink`, `ScrollArea`, `Menu`, and Tabler icons.
- New-course admin form, admin course-family list, full admin course editor, admin dashboard, admin payments, admin settings, admin certificates, quiz manager modal, editor lesson page, and Markdown lesson editor use Mantine form, table, card, notification, and modal primitives.
- Local adapter docs align to GDS **2.2.0** (`DESIGN_UPDATE.md`, `PATTERN_CONTRACT_INVENTORY.md`) including service backbone and portfolio matrix read order.
- Course access recovery uses `CourseAccessRecoveryActions` and structured day API codes for protected lesson/quiz routes.
- Mobile course catalog/detail surfaces reserve space for cookie consent via `app/lib/ui/consent-layout.ts`.
- Legacy local `Button`, `Card`, rich text editor, and `cn` adapters are deleted; `class-variance-authority`, `clsx`, and `tailwind-merge` are no longer direct Amanoba dependencies.
- Stale duplicate app-level course community components were removed from Amanoba.

Remaining high-priority gaps:

- secondary learner rewards, challenges, leaderboards, onboarding, and game chrome still need Mantine-only conversion or documented exception handling
- admin questions, achievement editor pages, analytics, surveys, players, games, rewards, and reporting surfaces still need Mantine-only conversion or documented exception handling
- `app/design-system.css` and transitional `app/globals.css` product rules remain deletion-phase work after remaining legacy surfaces migrate
- `lucide-react` remains on leaderboards, stats, onboarding, admin votes, and editor shells until those surfaces migrate

## First Implementation PR Shape

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

Amanoba is Mantine-only only when:

- Mantine is the only foundational product UI runtime
- one Amanoba Mantine theme is the only token authority for product UI
- product UI primitives are Mantine or thin approved Mantine wrappers
- notifications and modals are Mantine-based
- Tailwind/Radix/sonner/vaul are removed from ordinary product UI
- old CSS/token files are deleted or narrowed to documented exceptions
- local docs consistently point to the shared SSOT and describe Mantine-only as current truth
