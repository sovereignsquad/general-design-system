# ClassScout / Class USA Integration Guide

GDS 4.0.0 delivered the first-class `Class USA` theme and the missing ClassScout primitives required to ship on pure GDS with no app-level forks, raw design values, or app-local chart/control shims. The current stable line is **6.4.0**; see B11–B18 below for what shipped since 4.0.0.

## Install

GDS publishes current and future releases to GitHub Packages (`https://npm.pkg.github.com`); a frozen, deprecated `3.9.0` snapshot also remains on npmjs.com (use GitHub Packages for new installs). These packages are **private** to the `sovereignsquad` org — your token needs `read:packages` scope and org read access (request access from the GDS maintainers if you don't have it). Add to `.npmrc` first:

```ini
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @sovereignsquad/gds@6.4.0
```

## Bootstrap

Wrap the app once. For ClassScout the provider belongs in your root layout/providers file:

> **Mandatory first step — load the GDS stylesheet.** Import `@sovereignsquad/gds-theme/styles.css` exactly once at your app entry (Vite `main.tsx`, Next `app/layout.tsx`), before your own app styles. Without it, GDS surfaces — including dropdown/menu/overlay backgrounds — render unstyled (transparent dropdowns).

```tsx
// At your app entry, before app styles:
import '@sovereignsquad/gds-theme/styles.css';
```

```tsx
import { GdsProvider } from '@sovereignsquad/gds';
import { createBrandTheme } from '@sovereignsquad/gds-theme';

const classUsaTheme = createBrandTheme('class-usa').mantineTheme;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GdsProvider theme={classUsaTheme} defaultColorScheme="light">
      {children}
    </GdsProvider>
  );
}
```

Never nest a second `GdsProvider` or add a parallel Mantine `MantineProvider`. `GdsProvider` applies theme-owned `--gds-*` variables to the document root so portalled modals, drawers, menus, selects, tooltips, and notifications inherit the active brand lane.

---

## B1 — Class USA brand theme (`createBrandTheme('class-usa')`)

#316 · `@sovereignsquad/gds-theme`

```tsx
import { createBrandTheme } from '@sovereignsquad/gds-theme';

const { mantineTheme, cssVariables, tokenGraph } = createBrandTheme('class-usa', {
  fonts: {
    display: '"Bogart","Fraunces","Playfair Display"',
    body: '"Garet","Outfit",ui-sans-serif',
  },
});

// Pass to GdsProvider: <GdsProvider theme={mantineTheme}>
```

The theme emits semantic variables including `--gds-brand-primary`, `--gds-brand-primary-pressed`, `--gds-brand-accent`, `--gds-brand-accent-action`, `--gds-support`, `--gds-bg-canvas`, `--gds-bg-card`, `--gds-border-card`, `--gds-text-body`, `--gds-text-meta`, `--gds-price`, `--gds-star`, `--gds-state-*`, `--gds-badge-*`, and `--gds-focus-ring`. The accent token remains the locked brand accent; filled accent actions use `--gds-brand-accent-action` for AA contrast.

To override the locked ramps, pass 10-step tuples under `colorRamps`. The composer validates ramp length, hex format, token graph shape, and AA text/surface contrast.

**Two separate radius scales, by design, not a bug to reconcile.** GDS's own shape axis
(`GDS_DEFAULT_SHAPE_AXIS`, `--gds-radius-*`) is a different scale from `createBrandTheme`'s
Mantine `theme.radius` override — Class USA's handoff specifies its own `theme.radius` steps
independently of GDS's shape axis, and neither is derived from the other. The shape axis's 14
semantic radius roles (`card`, `modal`, `chip`, etc.) fall back to one default step when a
theme declares no per-role overrides, which Class USA currently doesn't — see the live,
computed proof (how many of the 14 roles currently share a value) on the reference site's
Foundations → Shape & Elevation page.

**Design rule profile (issue #648).** `createBrandTheme`'s result now includes
`designRuleProfile` — the 60-30-10 color-proportion classification, color-harmony
classification, and named type-scale ratio actually applied to this theme (computed for
`'class-usa'`/`'gold-athlete'`; `GDS_DEFAULT_DESIGN_RULE_PROFILE` — no proportion rule — for
a custom brand built from `brandColors`). Nothing needs to change to get this: it's on the
existing return value.

```tsx
const { mantineTheme, designRuleProfile } = createBrandTheme('class-usa', { fonts });
designRuleProfile.colorProportion.rule; // '60-30-10'
```

If `overrides` sets a `background`/`backgroundColor`/`bg` key anywhere to a color matching
one of this theme's accent-classed tokens (`--gds-brand-accent`, `--gds-state-*`,
`--gds-badge-*`, etc. — scarce by design intent), a development-only console warning fires
once, naming the offending value. It's a warning, not a thrown error: the governed role
still wins over the collision at render time either way, matching this doc's own line above
("governed roles always win over collisions"). Pass `designRuleProfile:
GDS_DEFAULT_DESIGN_RULE_PROFILE` explicitly to opt out and suppress the warning entirely.

**CI-side check (issue #652).** The dev-time warning above only fires locally, in a
running app. `gds-compliance check-design-rules` is the CI-side equivalent — it scans this
repo's own source (no app needs to run) for the same accent-as-background misuse, plus any
`createBrandTheme(...)` call with no `designRuleProfile`:

```bash
npx gds-compliance check-design-rules --manifest ./gds-adoption.json --format text
```

```text
GDS compliance check found 2 issue(s):
- [warn] design-rule.accent-as-background (src/components/Hero.tsx:42): Token "--gds-brand-accent" is classified accent (issue #644) -- meant to be scarce, never a background fill.
- [warn] design-rule.missing-profile (src/theme.ts:10): createBrandTheme(...) call has no designRuleProfile (issue #648) -- adoption-visibility signal, not a hard requirement.
```

Informational (`warn`, exit code `0`) by default. Add `compliance.designRuleProfile.enforced:
true` to `gds-adoption.json` to make an accent-as-background finding an `error` and fail CI
— `missing-profile` stays a `warn`-only signal either way, since it names an adoption gap,
not a violation.

## 3.8.0 replacement surfaces

Use these primitives to delete app-local ClassScout forks:

```tsx
import {
  FilterChipGroup,
  GdsAreaChart,
  GdsBenchmarkBarChart,
  GdsCalendarHeatmapChart,
  GdsDialog,
  GdsDivergingBarChart,
  GdsGaugeChart,
  GdsHistogramChart,
  GdsLongitudinalChart,
  GdsMaturityRadarChart,
  GdsRatingScale,
  GdsRadarChart,
  GdsSegmentedControl,
  GdsSidePanel,
  GdsSlider,
  GdsSlopeChart,
  GdsSparkline,
  GdsSymmetryChart,
  GdsWizardStepper,
  MissingDataPrompt,
  PillBar,
  SemanticButton,
  SoftChipGroup,
} from '@sovereignsquad/gds';
```

- Brand actions: `SemanticButton brandVariant="primary" | "secondary" | "accent" | "disabled"` maps to Class USA semantic tokens and keeps filled action contrast AA-safe.
- Selection: `PillBar` covers macro region tabs, `SoftChipGroup` covers compact neighborhood taxonomy, and `FilterChipGroup` covers active age/day/activity filters. All are controlled radio groups with horizontal mobile overflow.
- Forms: `GdsSegmentedControl` uses scroll or wrap overflow for mobile tabs, `GdsSlider` defaults to a 1-10 scale, `GdsRatingScale` supports 1-5 and 1-10 scales, and `GdsWizardStepper` provides the mobile Save & Next progression pattern.
- Overlays: `GdsDialog` and `GdsSidePanel` are aliases over the governed modal/drawer runtime with focus trap, restore, escape policy, and portal theming.
- Reporting: the chart wrappers share `GdsChart` shell semantics: summary copy, accessible table fallback, loading/empty/sparse/error states, reduced-motion-safe SVG renderers, semantic series tokens, and opt-in large-series decimation.
- Listing cards: `ListingCard` supports `compact`, `density`, `saved`, `price`, `rating`, `saveAction`, `shareAction`, `score`, `reason`, and action footer slots. Saved, price, and rating visuals read `--gds-brand-accent-action`, `--gds-price`, and `--gds-star`.
- Sparse data: `MissingDataPrompt` wraps `StateBlock variant="not-enough-data"` with required-field guidance for analytics and recommendations.

---

## B2 — Mobile bottom-tab navigation (`BottomTabBar`)

#317 · `@sovereignsquad/gds-core`

Used automatically when you pass `mobileNavigationMode="bottom-tab"` to `PublicShell` or `DiscoveryShell`. Direct use:

```tsx
import { BottomTabBar } from '@sovereignsquad/gds-core';
import { IconHome, IconSearch, IconPlus, IconMessage } from '@tabler/icons-react';

<BottomTabBar
  items={[
    { id: 'home',   href: '/',        label: 'Home',   icon: <IconHome size={22} /> },
    { id: 'search', href: '/search',  label: 'Search', icon: <IconSearch size={22} /> },
    { id: 'post',   href: '/post',    label: 'Post',   icon: <IconPlus size={22} />,  emphasized: true },
    { id: 'inbox',  href: '/inbox',   label: 'Inbox',  icon: <IconMessage size={22} /> },
  ]}
  activeId="home"
  emphasizedItemId="post"
  onNavItemSelect={(id) => router.push(itemHrefs[id])}
/>
```

Max 5 items. The `emphasizedItemId` renders the raised center-action button. `hiddenFrom="sm"` — the bar is invisible on desktop.

`renderItem?: (item, active, emphasized) => ReactNode` overrides rendering for every item (mirrors `PublicNav`'s `renderLink`), for cases like opening a sheet instead of navigating. A custom render is responsible for reproducing the 44x44 min hit target and `flex: 1` sizing, and — if overriding the emphasized item — its raised-button layout.

---

## B3 — Conversation surface (`ChatThread` / `ChatMessage` / `ChatInput` / `StreamingIndicator`)

#321 · `@sovereignsquad/gds-core`

```tsx
import { ChatThread, type ChatMessageModel } from '@sovereignsquad/gds-core';
import { useState } from 'react';

const [messages, setMessages] = useState<ChatMessageModel[]>([]);
const [streaming, setStreaming] = useState(false);

async function handleSend(text: string) {
  setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
  setStreaming(true);
  const reply = await fetchAssistantReply(text);
  setStreaming(false);
  setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply }]);
}

<ChatThread
  messages={messages}
  streaming={streaming}
  onSend={handleSend}
  placeholder="Ask a question…"
  maxEmbeddedCards={3}
/>
```

Embed `ListingCard` or any GDS surface in `message.cards[]` — up to `maxEmbeddedCards` are shown inline, the rest summarized. Auto-scrolls while pinned to bottom; user scroll unpins.

---

## B4 — Searchable select / combobox (`SearchableSelect`)

#318 · `@sovereignsquad/gds-core`

```tsx
import { SearchableSelect } from '@sovereignsquad/gds-core';

// Synchronous options
<SearchableSelect
  value={selected}
  onChange={setSelected}
  options={[
    { value: 'math',    label: 'Mathematics' },
    { value: 'english', label: 'English Language', group: 'Core' },
  ]}
  placeholder="Select a subject"
  clearable
  ariaLabel="Subject"
/>

// Async options
<SearchableSelect
  value={selected}
  onChange={setSelected}
  loadOptions={(query) => fetch(`/api/subjects?q=${query}`).then((r) => r.json())}
  debounceMs={300}
  placeholder="Search subjects…"
/>
```

Stale async responses are discarded automatically. The `group` field clusters options under headings.

---

## B5 — Fit-score chip (`FitScoreChip`)

#319 · `@sovereignsquad/gds-core`

```tsx
import { FitScoreChip } from '@sovereignsquad/gds-core';

// Score-driven (auto-label)
<FitScoreChip value={87} />                  // "Great fit · 87"
<FitScoreChip value={63} />                  // "Good fit · 63"
<FitScoreChip value={31} />                  // "Partial fit · 31"

// With dimensions tooltip
<FitScoreChip
  value={87}
  dimensions={[
    { label: 'Location' },
    { label: 'Grade level' },
    { label: 'Schedule' },
  ]}
/>

// Custom label
<FitScoreChip label="Top match" />
```

Color is deterministic from score band — but meaning is always conveyed by text too (accessible by default).

---

## B6 — AI listing card slots (`ListingCard` reason / score / actions)

#320 · `@sovereignsquad/gds-core`

```tsx
import { ListingCard, FitScoreChip, SemanticButton } from '@sovereignsquad/gds';

<ListingCard
  title="Westside Academy"
  href="/schools/westside"
  description="K–8 STEM-focused charter school in the Mission district."
  metadata={[
    { id: 'district', label: 'SFUSD', icon: <IconMapPin size={14} /> },
    { id: 'grades',   label: 'K–8',   icon: <IconSchool size={14} /> },
  ]}
  score={<FitScoreChip value={91} dimensions={[{ label: 'Location' }, { label: 'Grades' }]} />}
  reason={
    <ul>
      <li>0.4 mi from home</li>
      <li>Matches grade preference</li>
    </ul>
  }
  actions={[
    <SemanticButton key="save"  action="save"   size="sm" />,
    <SemanticButton key="share" action="share"  size="sm" />,
  ]}
  price="$0 tuition"
/>
```

`reason` renders in a labeled region ("Why this fits"). `actions` replaces the default `primaryAction` footer slot (max 4).

---

## B7 — Meaning badges (`MeaningBadge`)

#322 · `@sovereignsquad/gds-core`

Distinct from `StatusBadge` (system status). Use for editorial/brand labels:

```tsx
import { MeaningBadge } from '@sovereignsquad/gds-core';

<MeaningBadge variant="attention"   label="New this week" />
<MeaningBadge variant="validation"  label="Verified" />
<MeaningBadge variant="info"        label="BETA" />
<MeaningBadge variant="urgency"     label="Deadline: Friday" />
```

Variants map to brand tokens; meaning is always conveyed by label text, not color alone.

---

## B8 — Resilient card media (`MediaWithFallback`)

#323 · `@sovereignsquad/gds-core`

```tsx
import { MediaWithFallback } from '@sovereignsquad/gds-core';

<MediaWithFallback
  src={school.imageUrl}        // optional — renders branded fallback if missing or broken
  alt={school.name}
  ratio={4 / 3}
  fallbackLabel={school.name}  // initials extracted automatically: "Westside Academy" → "WA"
  showShimmer
/>
```

Never collapses to null — always reserves the aspect-ratio box. Fires `onError` for analytics on load failure.

---

## B9 — Number stepper (`NumberStepper`)

#324 · `@sovereignsquad/gds-core`

```tsx
import { NumberStepper } from '@sovereignsquad/gds-core';

const [qty, setQty] = useState(1);

<NumberStepper
  value={qty}
  onChange={setQty}
  min={1}
  max={10}
  step={1}
  ariaLabel="Number of applications"
/>
```

Keyboard: Arrow keys step, Home/End jump to bounds. Disables the relevant button at each bound.

---

## B10 — AI search card (`AISearchCard`)

#325 · `@sovereignsquad/gds-core`

Governed assistant-entry surface — search input + BETA badge + prompt chips:

```tsx
import { AISearchCard } from '@sovereignsquad/gds-core';

<AISearchCard
  placeholder="Ask about schools near me…"
  prompts={[
    'Best STEM schools in Mission',
    'Schools with after-care programs',
    'Top-rated K–5 near me',
  ]}
  onSubmit={(query) => router.push(`/chat?q=${encodeURIComponent(query)}`)}
/>
```

`onSubmit` fires on Enter or the search button. `onPromptSelect` lets you intercept chip taps separately (defaults to `onSubmit`).

---

## B11 — Static score/measurement (`GdsMeter`)

#638 · `@sovereignsquad/gds-core`

For a static score or measurement — not an operation in flight. `Progress`/`ProgressCard`
render `role="progressbar"`; passing `role="meter"` to them is a no-op (Mantine's top-level
`Progress` hardcodes `progressbar` on the element that carries ARIA semantics and does not
expose a way to override it). `GdsMeter` is built on Mantine's lower-level compound API
instead, so it carries a real `role="meter"`:

```tsx
import { GdsMeter } from '@sovereignsquad/gds-core';

<GdsMeter value={72} max={100} label="Fit score" />
```

`min`/`max` default to `0`/`100` but aren't required to be a percentage — `role="meter"`
doesn't need one — so a 1–5 rating or any other bounded range works directly:
`<GdsMeter value={3} min={1} max={5} label="Rating" valueText="3 out of 5 stars" />`.

---

## B12 — Icon-only category mark (`GdsIconBadge`)

#638 · `@sovereignsquad/gds-core`

For a category marker where the label is redundant or carried by adjacent content — a
legend, a caption, an `aria-labelled` group. `GdsBadge` deliberately requires `label`
(meaning never lives in color alone); `GdsIconBadge` is the separate, narrow component for
the already-labelled-elsewhere case, not an escape hatch on `GdsBadge` itself.

```tsx
import { GdsIconBadge } from '@sovereignsquad/gds-core';

<GdsIconBadge accent="teal" icon="Habit" label="Fitness" />
<GdsIconBadge accent="ocean" shade="deep" icon="Location" />
```

Decorative (`aria-hidden`) by default; pass `label` when the badge stands alone with no
adjacent text naming the category.

---

## B13 — Disabling a removable tag (`GdsRemovableTag.disabled`)

#638 · `@sovereignsquad/gds-core`

For a filter pill where removal must be suppressed mid-request (e.g. `ScoutAssistantView`'s
active-filter row while a search is in flight):

```tsx
<GdsRemovableTag label="Ages 6-8" removeLabel="Remove filter: Ages 6-8" onRemove={() => {}} disabled />
```

Native `disabled` + `aria-disabled`, matching the same convention already used elsewhere on
GDS's native-button components (`ChoiceChip`'s `SelectionBadge`).

---

## B14 — Generated-imagery tint and interactive category badges

#638 · `@sovereignsquad/gds-core`

`GdsGeneratedThumbnailProps`/`GdsGeneratedHeroProps` gained `tintWithBackground`/`mixRatio`
to mix the resolved palette toward another color — `color-mix()` on the live-DOM path,
`mixCssColors` (now exported from `gds-theme`'s root entrypoint) on the literal-hex path
used for OG images/email with no DOM. Does not apply when an explicit `colors` override is
given.

```tsx
<GdsGeneratedThumbnail category="hiking" tintWithBackground="var(--gds-bg-surface)" mixRatio={0.7} />
```

Category badges on both components also gained `onSelect?: (key: string) => void` — when
set, a badge renders as a real `<button>` and fires on click with the category's key,
instead of static decorative content.

---

## B15 — Read-only rating display (`GdsRatingDisplay`)

#642 · `@sovereignsquad/gds-core`

For a display-only rating (a star glyph plus `4.5/5` and a review count on a card or
detail page) — `GdsRatingScale` is a `GdsSlider` preset for *choosing* a rating, the wrong
tool for showing one that's already fixed.

```tsx
import { GdsRatingDisplay } from '@sovereignsquad/gds-core';

<GdsRatingDisplay value={4.5} count={128} />
```

Filled/half/empty glyphs, colored from the same `--gds-star` token this app already uses
directly. One accessible name (e.g. "4.5 out of 5 stars, 128 ratings") rather than one
announced per star; `max` (default `5`) and `label` are available for a non-5-point scale
or a fully custom accessible name.

---

## B16 — Compact status strip (`BannerNotice variant="compact"`)

#642 · `@sovereignsquad/gds-core`

For a one-line, centered, page-level status line with no heading — `BannerNotice`'s default
`panel` variant requires `title` and renders a title+message block, the wrong shape for
something like a preview-mode indicator.

```tsx
<BannerNotice variant="compact" severity="info" message="Preview mode — changes are not saved." />
```

No `title`/`eyebrow`/status badge in this variant; severity still drives the message color
and the live-region role (`alert` for `error`, `status` otherwise).

---

## B17 — Narrow aside layout token (`GdsSidebar sidebarWidth="aside"`)

#642 · `@sovereignsquad/gds-core`

`GdsLayoutSize` gained an `'aside'` step (`18rem` / 288px) between the spacing-scale tokens
and `'content'` (42rem) — for a filter rail or detail-page aside narrower than any existing
named content width.

```tsx
<GdsSidebar sidebarWidth="aside" side="end"><FilterRail /><Results /></GdsSidebar>
```

---

## B18 — Raw token scale vs. Mantine-rendered scale (item 8, closed)

`THEME_GOVERNANCE.md`'s "Raw `--gds-*` custom properties vs. the Mantine-rendered scale"
section is the governance answer to this: the raw `--gds-radius-*` custom properties are
the public design-intent scale, `mantineTheme.radius` is a separate brand-remapped
rendering scale Mantine components consume directly, and the two are not required to
align — by design, not oversight. The same split applies to `resolveGdsTypographyTokens()`'s
`tracking` output, which `createBrandTheme`'s `cssVariables` does not include; a consumer
who wants it applied to the document wires it themselves.

---

## Drop-in agent rules for ClassScout repo

Copy these into the ClassScout repo root so every AI coding session follows GDS automatically:

**`AGENTS.md`** (the cross-tool standard read by any agentic coding tool):

```markdown
# AGENTS.md — UI is built with the General Design System (GDS)

This project uses @sovereignsquad/gds for all UI. When building or changing interfaces:
- Import from '@sovereignsquad/gds' — do not author parallel primitives.
- GdsProvider wraps the app at src/providers.tsx — do not add a second one.
- Style with component props and GDS tokens only — no custom CSS or raw hex.
- SemanticButton takes action="save"|"add"|"edit"|"delete"... not free text.
- New ClassScout-specific components: BottomTabBar, ChatThread, AISearchCard,
  FitScoreChip, ListingCard (with reason/score/actions slots), MeaningBadge,
  MediaWithFallback, NumberStepper, SearchableSelect — all in @sovereignsquad/gds-core.
- Brand theme: createBrandTheme from @sovereignsquad/gds-theme.
- Install (GitHub Packages) — add to .npmrc first:
  @sovereignsquad:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
  then: npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications
- Full guide: https://sovereignsquad.github.io/general-design-system/ai
```
