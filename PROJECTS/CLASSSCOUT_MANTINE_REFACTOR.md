# ClassScout Mantine-Only Refactor

Status: In progress
Version: 1.1.0
Last updated: 2026-05-23
Project: `/Users/Shared/Projects/classscout`

## Objective

Refactor ClassScout to a Mantine-only UI platform.

This is a true refactor, not a visual refresh and not a hybrid steady state. The target architecture removes shadcn/Radix primitives as the foundational UI layer and makes Mantine the only product UI system.

## SSOT Rule

`/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` is the single source of truth for design, UI, and UX.

ClassScout-local documentation may describe:

- current migration status
- local file paths
- validation commands
- approved exceptions
- implementation sequencing

ClassScout-local documentation may not redefine component behavior, token policy, interaction meaning, responsive rules, or accessibility expectations that are already defined in this repository.

## Non-Goals

- preserving the current shadcn primitive layer as a long-lived compatibility layer
- preserving Tailwind token ownership as the design authority
- preserving `src/components/ui` as an active primitive system for new product work
- leaving Radix overlays, toasts, tabs, sheets, and dialogs as permanent runtime dependencies for product UI

## Current UI Foundation

- primitive/runtime foundation: Mantine root provider setup in `/Users/Shared/Projects/classscout/src/app/providers.tsx`
- theme authority: `/Users/Shared/Projects/classscout/src/theme/mantineTheme.ts`
- local wrapper layer: no live primitive wrapper directory; domain-specific media wrapper now lives in `/Users/Shared/Projects/classscout/src/components/media/CdnImage.tsx`
- styling foundation: Tailwind utility classes plus theme variables in `/Users/Shared/Projects/classscout/src/app/globals.css`
- theme config support: `/Users/Shared/Projects/classscout/tailwind.config.ts`
- app shell and consumer surfaces:
  - `/Users/Shared/Projects/classscout/src/components/scout/*`
  - `/Users/Shared/Projects/classscout/src/components/scout/views/*`
  - `/Users/Shared/Projects/classscout/src/components/scout/panels/*`
  - `/Users/Shared/Projects/classscout/src/components/admin/AdminDashboard.tsx`
  - `/Users/Shared/Projects/classscout/src/app/admin/**/*`

## Target End State

- one Mantine root provider for the application
- one exported ClassScout Mantine theme as the only token authority for product UI
- Mantine notifications and modal management configured centrally
- ClassScout wrappers, if any, remain thin and compositional
- shell, cards, filters, forms, dialogs, drawers, tabs, tables, alerts, and badges all render from Mantine primitives or thin Mantine wrappers
- custom CSS reduced to narrow global defaults, exceptional integration glue, and documented edge cases
- `src/components/ui` no longer serves as the live primitive foundation for product UI

## Pattern Service Priorities

ClassScout must use `PATTERN_SERVICE_MODEL.md` to prevent discovery, card, filter, and admin surfaces from drifting into local composition.

Highest-value contracts to complete next:

1. **Public Discovery Shell**: normalize shell, neighborhood/borough context, search, filters, and primary actions through one Mantine shell contract.
2. **Provider And Meetup Cards**: define fixed slots for media, title, metadata, availability/status, primary action, and overflow actions.
3. **Filter/Data Toolbar**: standardize search, filters, sort, reset, and create actions for public and admin list views.
4. **Admin Responsive Data View**: convert admin tables and forms to the shared responsive table/list strategy.
5. **State Blocks**: replace page-local empty/error/loading states with shared Mantine state-block contracts.

Acceptance requirements:

- public discovery cards expose one visible primary mobile action
- filters remain close to the data they affect and active filters are removable
- admin views do not create local table/filter variants
- Tailwind/global CSS cannot act as product styling authority

## Legacy Inventory To Retire

- removed:
  - `/Users/Shared/Projects/classscout/components.json`
  - obsolete shadcn/Radix primitive files previously stored in `/Users/Shared/Projects/classscout/src/components/ui`
  - Radix-based toast/dialog/sheet/tooltip runtime concerns formerly used in `/Users/Shared/Projects/classscout/src/app/providers.tsx`
- remaining cleanup scope:
  - keep `/Users/Shared/Projects/classscout/src/components/ui` deleted and prevent reintroduction
  - continue migrating Tailwind-heavy feature composition toward Mantine theme, props, layout primitives, and styles
  - ensure `/Users/Shared/Projects/classscout/src/app/globals.css` and `/Users/Shared/Projects/classscout/tailwind.config.ts` remain styling support rather than competing primitive authority

Tailwind may remain only if the project intentionally keeps it for narrow layout or utility use. It may not remain the design-system authority.

## Known Product Areas

### Public app

- home and editorial surfaces
- discover/filter/search flows
- provider cards and profile panels
- meetup cards and profile panels
- saved and calculator views
- account and preference flows
- mobile navigation and shell behavior

### Admin app

- admin login
- provider CRUD
- meetup CRUD
- site-content editing
- locations editing
- image upload workflows

### API docs and system surfaces

- `/Users/Shared/Projects/classscout/src/app/api/page.tsx`

## Migration Phases

### Phase 0: Freeze and Documentation

- local docs must point to the shared SSOT
- no new product UI should be added on top of `src/components/ui`
- no new local design rules should be invented in ClassScout docs

### Phase 1: Root Mantine Platform

Completed:

- one ClassScout Mantine provider
- one exported Mantine theme
- central notifications setup
- central modal/drawer policy wiring

Replaced:

- current root UI provider concerns in `/Users/Shared/Projects/classscout/src/app/providers.tsx`

### Phase 2: Shell and Navigation

Refactor:

- `/Users/Shared/Projects/classscout/src/components/scout/ClassScoutShell.tsx`
- `/Users/Shared/Projects/classscout/src/components/scout/Sidebar.tsx`
- `/Users/Shared/Projects/classscout/src/components/scout/BoroughBar.tsx`
- `/Users/Shared/Projects/classscout/src/components/scout/NeighborhoodChips.tsx`
- `/Users/Shared/Projects/classscout/src/components/scout/Filters.tsx`

Goal:

- move layout, nav, mobile shell, filter affordances, and header actions to Mantine primitives and responsive rules

### Phase 3: Public Content Surfaces

Refactor:

- provider cards
- meetup cards
- trust strip
- home/discover/saved/calculator/account views
- share dialogs and profile panels

Goal:

- cards, badges, forms, buttons, drawers, and overlays become Mantine-native

### Phase 4: Admin Surfaces

Refactor:

- `/Users/Shared/Projects/classscout/src/components/admin/AdminDashboard.tsx`
- `/Users/Shared/Projects/classscout/src/app/admin/**/*`

Goal:

- tabs, forms, inputs, textareas, save flows, alerts, and table/list management become Mantine-native

### Phase 5: Primitive Deletion

- completed:
  - deleted unused shadcn wrappers
  - deleted the remaining dormant Mantine-backed compatibility wrappers in `/Users/Shared/Projects/classscout/src/components/ui`
  - deleted obsolete Radix dependencies used only for product UI primitives
  - removed outdated local documentation that described the old stack as authoritative
- remaining:
  - continue reducing or rewriting global CSS and utility-heavy styling where it exists only as migration-era support
  - keep the wrapper directory constrained to thin Mantine-backed adapters only

## Enforcement Rules

- no new product UI files should introduce alternate primitive systems beside Mantine and the approved thin local adapters
- no new product UI should add fresh Radix primitive usage for behavior Mantine already covers
- no new design tokens should be declared outside the Mantine theme without a documented exception
- no local document in ClassScout may describe itself as the design authority while the shared SSOT exists

## Allowed Exceptions

The following may remain outside Mantine if they are thin and justified:

- charting libraries
- map integrations
- domain-specific media components such as CDN image wrappers
- third-party embeds with their own runtime constraints

Even when these remain, layout, labeling, spacing, loading, errors, and shell integration still follow the shared design-system contracts.

## Done Criteria

ClassScout is done with this refactor only when:

- Mantine is the only foundational UI library for product UI
- the active theme is Mantine-based and is the only token authority
- public and admin surfaces use Mantine directly or only thin Mantine-backed local adapters
- local docs consistently point to `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` as the SSOT
- remaining exceptions are explicit, narrow, and documented
