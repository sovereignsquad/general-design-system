# Foundation

Status: Active SSOT
Version: 2.4.4
Last updated: 2026-05-25

## 1. Core Principles

1. **One Source of Truth**: Design decisions live in this repository, not inside individual product codebases.
2. **One UI Platform**: Mantine is the required, exclusive product UI foundation.
3. **One Token Source**: The product theme is the absolute authority on design tokens.
4. **Behavior is Design**: Loading, empty, error, success, disabled, and validation states must be explicitly designed.
5. **Accessibility as a Release Gate**: Focus, contrast, semantic labels, and touch ergonomics are strictly required.
6. **Readability Outranks Aesthetics**: Color modes, contrast, and typography must serve human reading speed and comprehension above visual polish.
7. **Responsive Intent**: Mobile and small-screen behavior must be designed intentionally, not left to default browser wrapping.
8. **Pattern Reuse Before Local Invention**: Repeated shells, cards, metrics, toolbars, auth surfaces, article layouts, and state blocks must be promoted into shared contracts before they spread across pages or projects.

## 2. Mantine Platform & Runtime Contract

Mantine is the only approved foundational UI system for product applications.

Mantine UI may be reviewed as a Mantine-native reference library, but it is not a competing design system. Any borrowed idea must be rebuilt through this GDS, the local Mantine theme, and approved Mantine primitives or thin wrappers.

### Root Composition & Theme Ownership
Every product must have one canonical root UI composition utilizing `MantineProvider`, `ModalsProvider`, and Mantine's notification system. 
- The project must export **one** theme module that acts as the single token authority.
- The theme must dictate color palettes, typography scales, spacing, radii, breakpoints, and component defaults.
- Do not build parallel provider systems or duplicate theme behavior. 
- Theme extension must happen through documented overrides on top of `gdsTheme`, not by forking shared tokens into a second authority.

### Styling API Order
When styling Mantine surfaces, enforce this exact order of preference:
1. **Theme defaults**: Fix it for the whole app if it repeats.
2. **Mantine props**: E.g., `c="dimmed"`, `mt="md"`.
3. **Mantine APIs**: `classNames` or `styles`.
4. **Shared Utility CSS**: Narrow, documented global layout classes.
5. **Exception CSS**: Scoped, documented exceptions.

**Prohibited**: 
- Large custom CSS/Tailwind islands that rebuild core layout or component styling.
- Raw CSS hex/rgb values or hard-coded spacing values (e.g., `16px`) in feature code. 
- Copying Mantine UI example CSS into feature code as a styling authority.
- Creating page-local variants of reusable shells, cards, metrics, filters, auth panels, article layouts, or state blocks.

## 3. Visual Language & Token Policy

- **Typography**: App interfaces must prioritize compact, scannable hierarchy. Labels must be concrete and short. 
- **Spacing & Radius**: Use theme tokens strictly. Internal component spacing must be stable to ensure predictable touch targets and layouts.
- **Elevation**: Rely on border and surface contrast for structure. Overlays may use elevation. Decorative shadow layering is prohibited.
- **Accessibility Baseline**: Maintain visible focus states for all controls, semantic labeling, logical heading order, and AA contrast minimums. Focus traps are required on modals.

## 4. Color Modes & Readability

Readable UI is mandatory. Visual mood never outranks whether a human can read and act without strain.

- **One Active Mode**: A page shell must be clearly dark or light. Mixed-mode islands (light cards on dark shells) are prohibited unless explicitly documented as a preview/editor exception.
- **Contrast Requirements**: 
  - Ordinary text: WCAG AA (at least 4.5:1 against background).
  - Large text / Icons: At least 3:1.
  - Interactive states / Outlines: At least 3:1.
- **Mantine Implementation**: The Mantine theme must define readable color-mode defaults for `Text`, `Title`, `Card`, `Paper`, inputs, and overlays so that developers do not need page-level color overrides.
- **Accent Surfaces**: Public and operator accent surfaces must use canonical semantic accent contracts such as `AccentPanel`. Consumer code may not guess readability with raw `bg="*.0"` shades or page-local `light-dark(...)` patches.

## 5. Primitive & Wrapper Policy

Projects should prefer using Mantine primitives directly. **Thin wrappers** are required or recommended only to enforce consistency for product-defining surfaces.

- **App Shell & Page Header**: Thin wrapper **required**. Shell, navigation, and title rhythm are product-defining.
- **Buttons & Forms**: Thin wrapper **recommended** if the project requires standardized variants, analytics hooks, or consistent validation layouts.
- **Modals, Drawers, Tables**: Thin wrapper **recommended** to standardize padding, action layouts, and responsive behaviors.
- **Most Other Controls** (Tabs, Badges, Checkboxes, Menus): Use **Directly**. 

*Wrappers must never hide underlying behavior unpredictably, invent new interaction meanings, or form a secondary UI framework.*

## 6. Shared Pattern Service Requirement

Reusable UI patterns must be treated as service contracts, not visual snippets.

Required shared contract families:

- app shells and page headers
- product cards
- metric and progress cards
- data toolbars and responsive data views
- auth shells and account-entry panels
- article/docs/news layouts
- loading, empty, error, permission, disabled, and success state blocks

Before a project creates a second implementation of any family, it must check `PATTERN_SERVICE_MODEL.md`, update the GDS if the contract is missing, and document the local adapter path.

## 7. Package Runtime Boundaries

- Shared packages must remain consumable in standard package-manager, CI, and hosted-build flows.
- Package versions must align to the repository `VERSION`.
- Server-rendered consumers should prefer documented server-safe subpath exports when they do not need hook-driven interactivity.
- Interactive consumers may use client-safe entrypoints or root exports where backwards compatibility is required.
- Release validation must fail if documented `server` entrypoints drift into client-only modules or published export targets go missing.
