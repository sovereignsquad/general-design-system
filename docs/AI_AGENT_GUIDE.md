# AI Agent Guide

Status: Active SSOT
Version: 3.14.13
Last updated: 2026-07-31

How any AI coding agent — any LLM-powered coding tool — should consume the General Design System (GDS). The machine-readable summary lives in [`llms.txt`](../llms.txt) at the repo root; this is the human- and agent-readable long form.

## 1. What GDS is

GDS (`@sovereignsquad/gds`) is a governed React design system built on Mantine. It ships 250+ components, design tokens, theme presets, and runtime systems (forms, data tables, overlays, notifications, access gates, i18n). Products compose shipped GDS contracts rather than reinventing UI locally. Mantine and Tabler are implementation dependencies behind GDS-owned APIs.

## 2. Install and bootstrap

GDS publishes exclusively to GitHub Packages (`https://npm.pkg.github.com`) — there is no npmjs.com publish and no anonymous install, even for public packages. Add to `.npmrc` first:

```ini
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` is a personal access token with `read:packages` scope (yours, or your CI's provisioned token) — not a GDS-owned secret. Then:

```bash
npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react react react-dom
```

First, load the GDS stylesheet exactly once at the app entry, before any app styles — this is mandatory; without it GDS surfaces (including dropdown/overlay backgrounds) render unstyled:

```tsx
import '@sovereignsquad/gds-theme/styles.css';
```

Then wrap the app once in `GdsProvider` (the single required root provider — it injects theme, tokens, fonts, color-scheme handling, and locale):

```tsx
import { GdsProvider, AppShell, PageHeader, MetricCard, SemanticButton, EmptyState } from '@sovereignsquad/gds';

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

Never nest a second `GdsProvider` or add a parallel Mantine `MantineProvider` — there is exactly one theme authority. For server components, prefer the documented `@sovereignsquad/gds/server` subpath; use `/client` or the root for interactive surfaces.

## 3. The styling idiom — props and tokens, never raw CSS

GDS is Mantine-based, so you style by component props and theme tokens, not utility classes or custom CSS:

- **Layout/spacing:** GDS primitives — `<GdsStack gap="md">`, `<GdsInline gap="sm">`, `<GdsGrid>`, `<GdsBox p="lg">` — plus token spacing props (`mt`, `mb`, `p`, `px` with `xs|sm|md|lg|xl`).
- **Color/typography:** semantic props — `c="dimmed"`, `variant`, `color`, `size`, `radius`. Colors come from theme tokens; never hard-code hex/rgb or px in feature code.
- **Prefer the semantic component:** `SemanticButton action="save"`, `MetricCard`, `EmptyState`, `StatusBadge`, `GdsDataTable`, the shells — over raw controls.

There is no class-name vocabulary to invent. If you reach for a CSS class, you are off-pattern; use a prop or a GDS layout primitive.

## 4. Key contracts to honor

- **Semantic actions:** `SemanticButton`, `ActionBar`, `SemanticNavLink`, and page/template actions take a semantic `action` enum (`save`, `add`, `edit`, `delete`, `search`, `settings`, `export`, `refresh`, `submit`, `analytics`, `dashboard`, …), not free text. Use `add` (not "create"), `refresh` (not "retry").
- **Selects:** Mantine `Select`/`MultiSelect` (incl. `AdminSelect`) take `data={[{value,label}]}`, not `<option>` children. Use `placeholder` + `value={null}` for an unselected state.
- **States are part of every surface:** design loading / empty / error / disabled / success. Reach for `StateBlock` (variant sweep), `EmptyState`, and the `loading`/`error` props components expose.
- **Access gating:** wrap private/paid content in `GdsAccessGate protectedContentPolicy="never-render-while-locked"` so it is never mounted while locked.
- **Data tables:** build with `createGdsTableAdapter(rows, columns)` + `GdsDataTable`, or `SimpleDataTable` for small static tables.
- **Forms:** `GdsForm` / `GdsSchemaForm` (schema-driven) / `FormField` + `FormSection`; validation summaries read from a `GdsFormProvider` snapshot.

## 5. Component families

See [`llms.txt`](../llms.txt) for the grouped list, and [`COMPONENTS_AND_PATTERNS.md`](../COMPONENTS_AND_PATTERNS.md) for the full catalog with contracts. Layout, shells, cards/surfaces, forms, data/charts, feedback/overlays, public/editorial/discovery, and access families are all covered.

## 6. Where the truth lives

- **Props:** each component's TypeScript `<Name>Props` interface (shipped `.d.ts`).
- **Patterns & rules:** [`FOUNDATION.md`](../FOUNDATION.md), [`COMPONENTS_AND_PATTERNS.md`](../COMPONENTS_AND_PATTERNS.md), [`GOVERNANCE_AND_ADOPTION.md`](../GOVERNANCE_AND_ADOPTION.md).
- **API reference:** https://sovereignsquad.github.io/general-design-system/api
- **Live catalog:** https://sovereignsquad.github.io/general-design-system/patterns

When in doubt, read the component's props type and compose it — the shipped component already encodes the correct behavior, accessibility, and responsive intent. Do not hand-write a lookalike.

## 7. Make your repo agent-ready

Drop [`TEMPLATES/AGENTS.md.template`](../TEMPLATES/AGENTS.md.template) in as `AGENTS.md` (the cross-tool standard read by any agentic coding tool). It encodes these rules so every agent session follows GDS automatically.
