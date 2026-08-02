# Pattern Service Model

Status: Active SSOT
Version: 3.14.16
Last updated: 2026-07-26

This document defines how shared UI patterns are discovered, evaluated, promoted, implemented, and enforced across projects. It exists so product teams can borrow proven Mantine-native ideas without creating a second design system, local visual drift, or page-specific UI inventions.

This document works together with:

- `FOUNDATION.md` for non-negotiable Mantine-only rules
- `COMPONENTS_AND_PATTERNS.md` for canonical behavior contracts
- `SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md` for portfolio operating structure
- `GOVERNANCE_AND_ADOPTION.md` for local adoption and migration rules
- `CONTRIBUTING.md`'s "Adding a Component or Pattern" section for the concrete,
  step-by-step authoring mechanics (file layout, registration, i18n, the
  `verify:*` gates) that implement this model
- `docs/TUTORIAL_CRUD_ADMIN_SCREEN.md` for a worked, end-to-end example of
  composing the governed resource/form/table/shell primitives into one screen

## 1. Operating Principle

Mantine is the only approved product UI platform. Mantine UI may be used as a reference library for Mantine-native composition ideas, but it is not a separate authority.

Borrowing from Mantine UI means:

- study the interaction shape and Mantine primitive composition
- rebuild the pattern as a GDS-approved contract
- implement it through the local project theme and Mantine runtime
- verify readability, responsiveness, accessibility, and internationalization
- enforce reuse through local project guardrails

Borrowing does not mean:

- copy external CSS as product styling authority
- copy visual treatment that conflicts with the active product mode
- create local page-only variants of shells, cards, forms, filters, or state blocks
- bypass Mantine primitives with raw controls
- use Mantine UI examples as permission to add hard-coded design values

## 2. Shared Pattern Pipeline

Every reusable UI pattern follows the same lifecycle.

| Stage | Required Output | Approval Rule |
|---|---|---|
| 1. Need | Product problem statement and affected projects | Must describe a real workflow gap, not aesthetic preference |
| 2. Reference | Mantine/Mantine UI examples considered | Reference is advisory only |
| 3. Contract | GDS behavior, variants, responsive rules, state rules | Must live in this repository before broad rollout |
| 4. Local Adapter | Project-specific component path and theme usage | May not redefine behavior |
| 5. Implementation | Mantine primitives or thin Mantine wrappers | No raw product controls or alternate primitive stacks |
| 6. Verification | Visual, responsive, accessibility, and CI checks | Failing readability or mobile behavior blocks release |
| 7. Enforcement | Lint/static checks and deletion of older variants | Pattern is not complete until old competing variants are removed |

## 2A. Required Service Outputs

Every shared pattern effort must produce the following outputs before it can be considered reusable:

1. **Problem Statement**: what repeated workflow is being solved
2. **Reference Note**: what Mantine or Mantine UI example was studied
3. **Contract Definition**: purpose, semantic slots, required states, responsive rules, accessibility rules
4. **Local Adapter Path**: exact project file path that implements the contract
5. **Verification Rule**: how the project proves the contract is applied correctly
6. **Deletion Rule**: what older competing local variants must be removed or frozen

If any one of these outputs is missing, the pattern is still local work, not a GDS-backed service contract.

## 2B. Contract Maturity

Use these maturity states when discussing reusable patterns:

| State | Meaning |
|---|---|
| `reference-only` | idea source only |
| `planned` | GDS intends to formalize it |
| `pilot` | one project is validating the contract |
| `active` | approved reusable contract |
| `required` | mandatory where applicable |
| `deprecated` | old contract pending removal |

High-frequency patterns should move toward `required`, not remain permanently optional.

## 3. Approved Borrowing Targets

These Mantine UI pattern families are approved as high-value references because they map to repeated product needs across Amanoba, KIDEX, ClassScout, and SSO.

### Application Shells

Use as reference for:

- authenticated app shell
- public shell
- admin shell
- article/docs shell
- mobile navigation behavior

Required GDS outcome:

- one shell contract per product area
- one active navigation model per area
- mobile access to primary destinations without hiding all routine work behind a drawer
- secondary actions in menu/drawer/overflow, not competing with page actions

Preferred Mantine primitives:

- `AppShell`
- `NavLink`
- `Burger`
- `Drawer`
- `Menu`
- `Group`
- `Stack`
- `ScrollArea`
- `ActionIcon`

### Product Cards

Use as reference for:

- course cards
- provider cards
- child/person cards
- account cards
- content/article cards
- compact admin list cards

Required GDS outcome:

- fixed content slots
- one visible primary mobile action
- secondary actions in `Menu`
- predictable media, title, metadata, progress, and CTA placement
- no card-specific color/radius/spacing decisions in feature code

Preferred Mantine primitives:

- `Card`
- `Paper`
- `Image`
- `Badge`
- `Button`
- `Progress`
- `Group`
- `Stack`
- `Menu`

### Metrics And Progress

Use as reference for:

- dashboard metrics
- learner progress
- profile stats
- admin operational metrics
- certificate/achievement status

Required GDS outcome:

- numbers are prominent
- labels are readable
- trend/status text is secondary but never low-contrast
- charts support decisions instead of decorating dashboards
- mobile prioritizes next action and exceptions before analytics

Preferred Mantine primitives:

- `SimpleGrid`
- `RingProgress`
- `Progress`
- `ThemeIcon`
- `Text`
- `Title`
- `Paper`
- `Skeleton`

### Data Toolbars And Tables

Use as reference for:

- admin tables
- searchable lists
- filter drawers
- bulk selection
- mobile list fallback

Required GDS outcome:

- search, filters, sort, reset, and create actions appear in a predictable order
- active filters are visible and removable
- desktop tables do not collapse directly onto mobile
- mobile uses cards, priority columns, or horizontal scroll intentionally
- selected row counts and destructive consequences are visible

Preferred Mantine primitives:

- `Table`
- `TextInput`
- `Select`
- `MultiSelect`
- `Combobox`
- `Checkbox`
- `Drawer`
- `Menu`
- `Pagination`

### Authentication And Onboarding

Use as reference for:

- sign-in
- account linking
- anonymous/guest entry
- consent and onboarding

Required GDS outcome:

- one auth shell per product
- provider actions are clear and accessible
- anonymous/guest entry remains explicit where supported
- errors appear inline and through notifications only as secondary feedback
- mobile labels wrap without clipping

Preferred Mantine primitives:

- `Paper`
- `Stack`
- `TextInput`
- `PasswordInput`
- `Button`
- `Alert`
- `Divider`
- `Anchor`

### Articles, Docs, And News

Use as reference for:

- release notes
- help docs
- blog/news indexes
- article detail pages

Required GDS outcome:

- readable long-form typography
- article cards with consistent metadata
- optional table of contents for long content
- side rails collapse below primary content on mobile
- editorial CSS remains narrow and cannot become a token source

Preferred Mantine primitives:

- `Container`
- `Paper`
- `Title`
- `Text`
- `Badge`
- `Anchor`
- `TypographyStylesProvider`
- `TableOfContents` where available

### State Blocks

Use as reference for:

- loading
- empty
- error
- permission
- disabled
- success
- not enough data yet

Required GDS outcome:

- every state explains what happened
- every recoverable state offers a next action
- critical errors stay visible in page context
- placeholder panels do not ship as learner-facing dead ends
- skeletons preserve layout stability

Preferred Mantine primitives:

- `Alert`
- `Skeleton`
- `Loader`
- `Button`
- `Paper`
- `ThemeIcon`
- `Stack`

## 4. Cross-Project Service Contracts

Every adopting project should maintain these local contracts. Names may vary, but responsibilities may not.

| Contract | Required Responsibility | Required In Projects |
|---|---|---|
| App shell | Navigation, active route, responsive shell, account controls | All product apps |
| Page header | Title, purpose, primary action, secondary actions | All product apps |
| Product card | Repeated user-facing object cards | Apps with listings |
| Metric card | Repeated numeric/status display | Dashboards and profiles |
| Data toolbar | Search, filters, sort, reset, create | Admin/editor/list-heavy apps |
| Responsive data view | Desktop table and mobile fallback | Admin/editor/list-heavy apps |
| Auth shell | Login/account-entry layout and states | Auth-capable apps |
| Article shell | Blog/news/docs layout | Editorial/docs surfaces |
| State block | Loading/empty/error/permission/success states | All product apps |

Local adapters must list the exact file path for each contract they implement and must mark missing contracts as backlog, not as implicit local freedom.

## 4A. Compatibility Promise

An active or required contract must be stable at the semantic level.

Projects may localize:

- content
- data wiring
- domain-specific metadata
- narrow secondary actions

Projects may not localize:

- the role of the pattern
- the primary action hierarchy
- the default responsive behavior
- the required state set
- the Mantine-only primitive foundation

When a contract changes its semantic role or action hierarchy, that is a breaking GDS change and must be versioned accordingly.

## 5. Cross-Project Recommendations

### Amanoba

Current risk:

- learner and public surfaces now use Mantine, but the product still needs stronger shared contracts for shells, course cards, metric cards, article layouts, and state blocks
- course cards and dashboard/progress surfaces are the highest-value normalization targets

Recommended sequence:

1. promote learner/public/article shells into explicit local contracts
2. replace all course card variants with canonical Mantine card contracts
3. replace dashboard/profile metrics with shared metric/progress components
4. standardize article/news cards and detail layouts
5. strengthen enforcement against page-local shell/card/state implementations

### KIDEX

Current risk:

- Mantine is present, but conductor workflows need stronger mobile-first shell and action priority
- drawer-first mobile navigation can slow repeated operational work

Recommended sequence:

1. define conductor app shell and mobile primary navigation contract
2. reorder dashboard mobile content around overdue/next/resume actions
3. reduce child registry card action competition
4. standardize records/detail headers and action rows
5. audit filters and tables against the responsive data view contract

### ClassScout

Current risk:

- Mantine runtime is active, but public discovery, filters, provider/meetup cards, and admin surfaces can still drift through local composition and utility styling

Recommended sequence:

1. normalize public shell and filter/search toolbar
2. define provider and meetup product-card contracts
3. convert mobile discovery cards to one-primary-action behavior
4. standardize admin tables/forms with data toolbar and responsive data view
5. reduce global CSS and Tailwind utility reliance where it acts as product styling authority

### SSO

Current risk:

- auth/admin flows are mostly aligned, but docs surfaces and legacy CSS deletion remain open

Recommended sequence:

1. finish docs shell migration
2. delete obsolete CSS modules and remaining old theme authority
3. keep the SSO contract set intentionally narrow
4. enforce no new page-local auth/admin/docs shells

## 6. Portfolio Use

Use this document when:

- a project wants to borrow from Mantine UI
- a repeated pattern appears in more than one major product surface
- a project plan needs to identify which contracts it must implement locally

Use `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` when:

- choosing which project should receive the next GDS investment
- classifying a project by migration archetype
- checking whether a local plan should be created before implementation
- SSO should stay intentionally simpler than product apps

Recommended sequence:

1. define `AuthShell`, `AdminShell`, and `DocsShell` as the only local shell contracts
2. migrate docs surfaces to article/docs shell
3. delete obsolete CSS modules and old token sources
4. enforce no new product UI CSS modules
5. keep provider-branded auth controls as narrow documented exceptions inside Mantine layout

## 6. Implementation Plan

### Phase 1: GDS Pattern Registry

Deliver:

- this document as the normative pattern service model
- component contracts updated with the approved reusable pattern families
- project plans updated with cross-project recommendations

Exit criteria:

- every project knows which contracts it must implement
- Mantine UI usage is explicitly limited to reference material

### Phase 2: Local Contract Inventory

Each project creates or updates a local inventory:

- current shell paths
- current page header paths
- card variants
- metric variants
- filter/table variants
- auth/article/state variants
- obsolete variants to delete

Exit criteria:

- no reusable pattern exists anonymously
- every missing pattern is in backlog

### Phase 3: Highest-Value Contract Buildout

Build in this order:

1. app shells
2. page headers
3. product cards
4. state blocks
5. metrics/progress
6. data toolbars
7. article/docs shells

Exit criteria:

- high-traffic surfaces use shared contracts first
- old variants are removed or marked frozen

### Phase 4: Enforcement

Each project adds checks for:

- raw product controls
- alternate primitive imports
- page-local shell/header/card/state implementations
- raw colors and repeated hard-coded spacing
- low-contrast dark/light mode usage
- missing mobile responsive strategy for tables/lists

Exit criteria:

- drift is caught by CI, not by screenshots alone

### Phase 5: Cross-Project Review Cadence

Monthly or after any major product UI slice:

- compare new local patterns against this document
- promote repeated local solutions into GDS contracts
- delete duplicate local variants
- update project-specific recommendation sections

Exit criteria:

- successful local improvements become reusable system knowledge
- one project does not silently fork the design system

## 7. Acceptance Criteria

A borrowed Mantine UI pattern is accepted only when:

- it is implemented with Mantine primitives or approved thin Mantine wrappers
- it uses the local Mantine theme as token authority
- it follows this GDS interaction contract
- it has explicit mobile behavior
- it has loading, empty, error, disabled, and success states where applicable
- it passes color-mode readability requirements
- it supports internationalized text length without clipping
- older competing local variants are deleted or frozen with removal date
