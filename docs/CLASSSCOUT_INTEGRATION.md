# ClassScout / Class USA Integration Guide

GDS 3.14.5 delivers the first-class `Class USA` theme and the missing ClassScout primitives required to ship on pure GDS with no app-level forks, raw design values, or app-local chart/control shims.

## Install

GDS publishes exclusively to GitHub Packages (`https://npm.pkg.github.com`) — add to `.npmrc` first (every install requires authentication, even for public packages):

```ini
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @sovereignsquad/gds@3.14.5
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

## Drop-in agent rules for ClassScout repo

Copy these into the ClassScout repo root so every AI coding session follows GDS automatically:

**`AGENTS.md`** (Claude Code, Cursor, Codex, Copilot):

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
- Full guide: https://sovereignsquad.github.io/general-design-system/ai
```

**`CLAUDE.md`** (Claude Code):

```markdown
# CLAUDE.md
GDS installs exclusively from GitHub Packages — add to .npmrc first:
  @sovereignsquad:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
Install: npm install @sovereignsquad/gds @mantine/core @mantine/hooks @mantine/modals @mantine/notifications
Wrap once: <GdsProvider theme={classcoutTheme}> in src/providers.tsx
Key rules:
- SemanticButton action="save"|"add"|"edit"|"delete" — not children
- SearchableSelect/Select data={[{value,label}]} — not <option>
- BottomTabBar items max 5; emphasizedItemId for raised center action
- ChatThread onSend, messages[], streaming bool
- AISearchCard onSubmit, prompts[]
Full rules: https://sovereignsquad.github.io/general-design-system/ai
```
