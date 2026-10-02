# AI Agent Guide

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

How any AI coding agent — any LLM-powered coding tool — should consume the General Design System (GDS). The machine-readable summary lives in [`llms.txt`](../llms.txt) at the repo root; this is the human- and agent-readable long form.

## 1. What GDS is

GDS (`@sovereignsquad/gds`) is a governed React design system built on Mantine. It ships 324 components, design tokens, theme presets, and runtime systems (forms, data tables, overlays, notifications, access gates, i18n). Products compose shipped GDS contracts rather than reinventing UI locally. Mantine and Tabler are implementation dependencies behind GDS-owned APIs. GDS re-exports a fixed set of Mantine components (the list in `packages/gds-core/src/GdsPrimitives.tsx`); import those from a GDS entry, never from `@mantine/core`. The policy, and the GDS replacement for each Mantine name GDS does not re-export, are in [DEPENDENCY_GOVERNANCE.md "Mantine boundary"](../DEPENDENCY_GOVERNANCE.md#mantine-boundary).

## 2. Install and bootstrap

GDS publishes current and future releases to GitHub Packages (`https://npm.pkg.github.com`); every install authenticates, even for public packages. (A frozen, deprecated `3.9.0` snapshot also remains on npmjs.com; use GitHub Packages for new installs.) Add to `.npmrc` first:

```ini
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` is a personal access token with `read:packages` scope (yours, or your CI's provisioned token) — not a GDS-owned secret. Then:

```bash
npm install @sovereignsquad/gds react react-dom
```

npm 7+ installs the umbrella's `peerDependencies` automatically. When peer auto-install is off (for example `--legacy-peer-deps`), follow the peer-dependency rule in [INSTALLATION_GUIDE.md "Single install surface"](../INSTALLATION_GUIDE.md#single-install-surface).

Bootstrap is two steps. Both are required; neither replaces the other.

**1. Load the GDS stylesheet** exactly once at the app entry, before any app styles. This is mandatory; without it GDS surfaces (including dropdown/overlay backgrounds) render unstyled:

```tsx
import '@sovereignsquad/gds-theme/styles.css';
```

The stylesheet supplies the Mantine component CSS (it already includes `@mantine/core/styles.css` and `@mantine/notifications/styles.css`; do not import those separately), the default `--gds-*` role, overlay and motion tokens, the Inter font, the rules gated on `data-gds-theme-preset`, and the `forced-colors`, `prefers-reduced-motion` and global `:focus-visible` rules.

**2. Wrap the app once in `GdsProvider`.** It supplies the Mantine theme (`gdsTheme` unless you pass `theme`) and its `--mantine-*` variables, color-scheme handling, text direction, locale and messages, and the modals and notifications mounts. It writes `--gds-*` variables only when the theme carries `theme.other.gdsCssVariables` (themes built with `createBrandTheme`), and it loads no fonts.

```tsx
import { GdsProvider, AppShell, PageHeader, MetricCard, SemanticButton } from '@sovereignsquad/gds';

export default function App() {
  return (
    <GdsProvider defaultColorScheme="light">
      <AppShell>
        <PageHeader title="Dashboard" />
        <MetricCard label="Revenue" value="$128k" trend={{ tone: 'positive', label: '+4%' }} />
        <SemanticButton action="add" />
      </AppShell>
    </GdsProvider>
  );
}
```

Never nest a second `GdsProvider` or add a parallel Mantine `MantineProvider` — there is exactly one theme authority, and it also owns the color scheme. Add no scheme library (such as `next-themes`), no `html` class toggle and no `color-scheme` declaration in app CSS. Neither `GdsProvider` nor the `AppShell` theme toggle persists the user's choice across reloads. Single-scheme, OS-following and user-switchable recipes: [THEME_GOVERNANCE.md "Colour scheme"](../THEME_GOVERNANCE.md#colour-scheme).

For server components, prefer the documented `@sovereignsquad/gds/server` subpath; use `/client` or the root for interactive surfaces.

## 3. The styling idiom — props and tokens, never raw CSS

GDS is Mantine-based, so you style by component props and theme tokens, not utility classes or custom CSS:

- **Layout/spacing:** GDS layout primitives take token props — `<GdsStack gap="md">`, `<GdsInline gap="sm">`, `<GdsGrid>`, `<GdsBox padding="lg">`. `gap`, `padding` and `margin` take `GdsLayoutToken` and `maxWidth` takes `GdsLayoutSize` (`packages/gds-core/src/LayoutPrimitives.tsx`); `GdsLayoutToken` reaches `2xl`. Mantine style props (`mt`, `mb`, `px`, `py`) and Mantine component `gap` resolve only the keys of `gdsTheme.spacing` (`packages/gds-theme/src/theme.ts`: `xs`–`xl`); a larger key such as `2xl` does not resolve to a spacing value there. Section spacing above `xl` goes through a layout primitive. [`docs/SAFE_STYLING.md`](SAFE_STYLING.md) lists the steps each prop family accepts and the values that have no step.
- **Color/typography:** Mantine props (`c`, `bg`, `variant`, `color`, `size`, `radius`) on the GDS exports whose props type includes them: the Mantine passthroughs GDS re-exports and the GDS layout primitives. Import those components from a GDS entry, never from `@mantine/core`. Text goes through the typography roles (`PageTitle`, `SectionTitle`, `CardTitle`, `BodyText`, `MetadataText`); GDS does not re-export Mantine `Text` or `Title`.
- **No literals:** never hard-code hex, rgb, px, rem or bare numbers (`gap={48}`, `maw={860}`, `fz="3rem"`) in feature code; colors come from theme tokens. `gds/no-raw-design-values` inspects string literals only, so numeric props, rem strings in props and style-object values pass lint. A clean lint run is not evidence of token use.
- **Prefer the semantic component:** `SemanticButton action="save"`, `SectionPanel` for titled panels, `MetricCard` for one numeric KPI and its trend, `EmptyState`, `StatusBadge`, `GdsDataTable`, the shells — over raw controls.

There is no class-name vocabulary to invent. If you reach for a CSS class, you are off-pattern; use a prop or a GDS layout primitive.

## 4. Key contracts to honor

- **Semantic actions:** `SemanticButton`, `ActionBar`, `SemanticNavLink`, and page/template actions take a semantic `action` enum (`save`, `add`, `edit`, `delete`, `search`, `settings`, `export`, `refresh`, `submit`, `analytics`, `dashboard`, …), not free text. Use `add` (not "create"), `refresh` (not "retry").
- **Mantine passthroughs:** `Select`, `MultiSelect`, `TextInput`, `Switch`, `Radio` and `Table` are Mantine components re-exported by GDS. Import them from `@sovereignsquad/gds/client` (granular lane: `@sovereignsquad/gds-core/client`).
- **Selects:** `Select`, `MultiSelect` and `AdminSelect` (gds-admin) take `data={[{value,label}]}`, not `<option>` children. Use `placeholder` + `value={null}` for an unselected state. `SearchableSelect` (typeahead, async options, grouping) takes `options` instead. Prefer `AdminSelect` in admin forms and `SearchableSelect` for searchable or async lists.
- **States are part of every surface:** design loading / empty / error / disabled / success. Reach for `StateBlock` (variant sweep), `EmptyState`, and the `loading`/`error` props components expose.
- **Access gating:** wrap private/paid content in `GdsAccessGate protectedContentPolicy="never-render-while-locked"` so it is never mounted while locked.
- **Data tables:** build with `createGdsTableAdapter(rows, columns)` + `GdsDataTable`, or `SimpleDataTable` for small static tables.
- **Forms:** `GdsForm` / `GdsSchemaForm` (schema-driven) / `FormField` + `FormSection`; validation summaries read from a `GdsFormProvider` snapshot.

## 5. Component families

See [`llms.txt`](../llms.txt) for the grouped list, and [`COMPONENTS_AND_PATTERNS.md`](../COMPONENTS_AND_PATTERNS.md) for the full catalog with contracts. Layout, shells, cards/surfaces, forms, data/charts, feedback/overlays, public/editorial/discovery, and access families are all covered.

Before choosing a panel, card, metric or progress component, read the [Component Selection Rules](../COMPONENTS_AND_PATTERNS.md#component-selection-rules). They state when each of `SectionPanel`, `ReportingSection`, `AccentPanel`, `PublicProductCard`, `MetricCard`, `ProgressCard` and `GdsMeter` is the wrong choice and what to use instead.

## 6. Where the truth lives

- **Props:** each component's TypeScript `<Name>Props` interface (shipped `.d.ts`).
- **Patterns & rules:** [`FOUNDATION.md`](../FOUNDATION.md), [`COMPONENTS_AND_PATTERNS.md`](../COMPONENTS_AND_PATTERNS.md), [`GOVERNANCE_AND_ADOPTION.md`](../GOVERNANCE_AND_ADOPTION.md).
- **API reference:** https://sovereignsquad.github.io/general-design-system/api
- **Live catalog:** https://sovereignsquad.github.io/general-design-system/patterns

When in doubt, read the component's props type and compose it — the shipped component already encodes the correct behavior, accessibility, and responsive intent. Do not hand-write a lookalike.

## 7. Make your repo agent-ready

Drop [`TEMPLATES/AGENTS.md.template`](../TEMPLATES/AGENTS.md.template) in as `AGENTS.md` (the cross-tool standard read by any agentic coding tool). It encodes these rules so every agent session follows GDS automatically.
