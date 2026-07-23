# Design System Competitive Gap Analysis

Status: Active reference — roadmap input (not an implementation commitment)
Last updated: 2026-07-23
Tracking issue: #386

This document compares GDS's current theme foundation, layout primitives, and
component/pattern catalog against eight major design systems, to build a
prioritized gap list for future roadmap planning. It does **not** commit GDS
to any timeline — it is the working comparison future planning should start
from. When a gap here is picked up for actual work, open a dedicated GitHub
issue referencing this doc (per the standing "always work from GitHub
issues" rule), don't work directly off this list.

## Methodology

- **GDS-side findings** were produced by directly reading source
  (`packages/gds-theme`, `packages/gds-core`, `packages/gds-admin`,
  `packages/gds-a11y`) and the current SSOT docs at `v3.11.1` — not inferred
  from naming conventions or memory. Every claim below about what GDS does or
  doesn't ship was verified by grep/read of actual source files.
- **External-side findings** combine two sources: (a) live web searches run
  the same day (2026-07-23) against Material Design 3's token docs
  (`m3.material.io`), Fluent 2's design-tokens site
  (`fluent2.microsoft.design`), Carbon's spacing docs
  (`carbondesignsystem.com`), Ant Design 5's token architecture docs, and
  Shopify Polaris's component list; and (b) established, stable knowledge of
  Adobe Spectrum, Atlassian Design System, and Chakra UI that was not
  independently re-verified live this session (a research-agent session
  limit was hit mid-task). Where a claim rests only on (b), treat it as
  "believed accurate, not freshly re-verified" rather than source-confirmed —
  worth a spot-check before it drives a specific implementation decision.
- Scope is deliberately narrow: theme foundations, layout/screen-alignment
  conventions, component/function breadth, and i18n/a11y coverage. It
  excludes areas where GDS is already known to be strong or has made a
  deliberate, documented policy choice (motion system, accessibility CI
  tooling, the chart wrapper/contract architecture, the font-lane system) —
  those are noted only where a competitor still materially exceeds them.

---

## 1. Theme foundation comparison

| Dimension | GDS (v3.11.1) | Material 3 | Fluent 2 | Carbon | Ant Design 5 | Polaris / Spectrum / Atlassian / Chakra |
|---|---|---|---|---|---|---|
| **Elevation / shadow** | No dedicated scale. Base theme overrides only `shadows.md`/`shadows.lg`; `gdsFlatSurfaceTheme` and `gdsEditorialPublicTheme` zero out **all five** shadow steps. `FOUNDATION.md` explicitly prohibits "decorative shadow layering." | 6-level token scale (`--mat-sys-level0`…`level5`), each a defined box-shadow | z-depth scale 0–32dp, key-shadow + ambient-shadow pairing, explicit prominence tiers | Tokenized shadow depths, paired with theme tokens | 4 shadow tiers, paired with motion durations/easings in one "Elevation & Depth" spec | Spectrum ships a full elevation ramp; Chakra ships a `shadow` token scale (`xs`–`2xl`) |
| **z-index / stacking layers** | **None published.** Overlay coordination (`OverlayManagerProvider`) is behavioral only — no `--gds-z-*` scale exists anywhere in `gds-theme/src` (confirmed by grep, zero hits) | Explicit z-index/layer tokens | Documented layer tokens | Explicit z-index scale | Component-level z-index tokens | Chakra publishes a documented `zIndex` token scale |
| **Density modes** | No global theme-level axis. Density appears only as scattered per-component props (`AdvancedDataTable` density modes, card `size`/`density`) | In-progress workstream (window-size-class driven) | Density built into the platform-scaled spacing ramp (pt/dp/px) | First-class axis — the layout spacing scale doubles as an explicit density control | Not fully global either — density is a per-component `size` prop (`small`/`middle`/`large`), similar shape to GDS's gap | Atlassian ships an explicit compact mode; Chakra has no global density axis either |
| **Spacing scale** | Mantine native `xs`–`xl` + one added `2xl` step = 7 steps total (`none, xs, sm, md, lg, xl, 2xl`) | 4dp-grid-derived scale | 4px-base ramp, 8 named steps (`XXS`(2)…`XXXL`(32)) | 2/4/8-multiple scale serving both fine "spacing" and coarser "layout/density" purposes | Seed→Map→Alias-derived spacing tokens | Comparable step counts across all — not a material gap |
| **Typography scale** | Only `h1`–`h3` overridden (2.5rem/1.75rem/1.25rem); `h4`–`h6`/body fall through to Mantine defaults; no named weight scale, no standalone type-scale file (each theme file redeclares its own heading sizes) | Full scale: display/headline/title/body/label × sizes, applied uniformly | Full named ramp | Full scale paired with IBM Plex | Full scale via the token pipeline | All ship deeper, fully-named type ramps applied everywhere, not just h1–h3 |
| **Color roles** | 27 semantic role tokens exist (`BrandSemanticRole` in `brand-tokens.ts`) but are **scoped only to `createBrandTheme()`** (used by 2 of 23 presets) — the default `gdsTheme` has no semantic role vocabulary, just Mantine's raw 10-step color ramps | Full role system (primary/secondary/tertiary/error × container/on-variants), applied to every surface | Global + alias 2-layer token system, universal | Theme tokens, universal | Seed→Map→Alias→Component 4-layer system, universal | All apply their semantic role system as the default, not as an opt-in generator |
| **Motion system** | Mature and arguably ahead of peers: 5 durations, 5 named easings, 7 purpose-built presets (`overlay`/`drawer`/`command`/`list`/`feedback`/`skeleton`/`state`), structured `prefers-reduced-motion` policy resolution | Motion tokens + easing curves | Motion tokens | Motion curves as tokens, paired with elevation | Durations/easings paired with the elevation spec | GDS's motion system is comparably or more mature than every peer surveyed — not a gap |
| **Icon system** | Tabler, fully wrapped behind a semantic layer, ~92 icons re-exported | Material Symbols — thousands of icons, variable-weight/fill axes | Fluent icon catalog, large and filled/regular/light variants | Carbon icon library, large catalog + pictograms | Ant Design Icons, large catalog | All ship materially larger first-party icon catalogs than GDS's wrapped ~92-icon Tabler subset |
| **Breakpoints / grid** | Independent 6-step breakpoint set (`xs:480, sm:640, md:768, lg:1024, xl:1280`) used only by flex/CSS-grid layout primitives (`GdsGrid`, `GdsSplit`, `GdsSidebar`) — **no named column-grid system** | Window size classes (compact/medium/expanded/…) + breakpoint tokens | Documented layout/breakpoint system | Explicit **2x Grid** (12/16-column) | Explicit 24-column `Grid` component | Carbon and Ant Design both ship a named, explicit column-grid primitive GDS has no equivalent of |

---

## 2. Component / function gap list

Ranked by how broadly the gap blocks real consumer work, not by ease of
implementation.

### P0 — highest-impact, broadly blocking

1. **Date/time picker & calendar.** `GdsSchemaForm`'s schema adapters
   (`jsonSchemaToGdsFormSchema`, `openApiToGdsFormSchema`,
   `zodToGdsFormSchema`) already infer a `date` field type from
   `format: 'date'`, but there is **no backing UI component** — `@mantine/dates`
   isn't even a dependency anywhere in the monorepo. Every system surveyed
   (Material, Fluent, Carbon, Ant Design, Polaris, Spectrum, Chakra) ships
   one. This is the single most concrete, verifiable hole found.
2. **Standalone `Breadcrumbs` component.** Currently folded only into
   `PageHeader`/`WorkspaceHeader`/`DocsPageShell` — no independently
   exported, reusable primitive. Polaris, Carbon, Ant Design, Atlassian all
   ship this as a first-class nav component.
3. **z-index / stacking-layer token scale.** No `--gds-z-*` scale exists.
   Consumers building any custom overlay (a common escape hatch even in a
   governed system) have no documented layering authority to align against —
   this will keep causing ad hoc z-index guesses until it's published.

### P1 — real gaps, narrower blast radius

4. **Rich text / markdown editor contract.** "Content Ops Editor" patterns
   own the surrounding layout (section grouping, preview rail, save bar) but
   not the actual text-editing surface inside them — zero hits for
   `RichText`/`tiptap`/markdown-editor in source.
5. **Global density-mode theme primitive** (`compact`/`comfortable`/
   `spacious`). Exists only as scattered per-component props today; Carbon
   and Fluon (via platform scaling) both treat density as a top-level theme
   axis GDS has no equivalent for.
6. **Named column-grid layout primitive** (12/16/24-column). GDS's
   `GdsGrid`/`GdsSplit`/`GdsSidebar` cover flex/CSS-grid layout needs but
   there's no explicit grid system matching Carbon's 2x Grid or Ant Design's
   24-col `Grid` — worth deciding whether this is actually needed given
   GDS's existing primitives already solve most real layouts, or whether
   it's cosmetic parity.
7. **Elevation/shadow token scale**, even a minimal 3–4 level one scoped to
   overlays only. The current "no decorative shadows" policy is a
   deliberate, reasonable stance for cards/surfaces — but modals/drawers/
   popovers still need *some* documented elevation contract rather than
   ad hoc per-component shadow values.
8. **CJK / Indic locale coverage.** All 9 shipped locales
   (`en/es/hu/de/fr/it/ru/he/ar`) are Latin/Cyrillic/Hebrew/Arabic script
   families — no Chinese, Japanese, Korean, Thai, or Devanagari support.
   Blocks any APAC-facing consumer product outright. Ant Design is
   CJK-native; Carbon and Fluent both support CJK broadly.

### P2 — lower urgency, narrower audience or already partially mitigated

9. **Broader first-party icon catalog / icon-search tooling** — ~92 wrapped
   Tabler icons is materially smaller than every peer's catalog, but
   consumers can request additions to the semantic wrapper as needed today.
10. **Financial/network chart types** (candlestick/OHLC, Sankey, box-plot,
    choropleth map). Only relevant to data-heavy consumer products; GDS's
    chart *contract* architecture (12 types across two governed sets) would
    accommodate new types cleanly if/when a real consumer need appears.

### Internal tech debt surfaced incidentally (not competitive gaps, but should feed the same roadmap)

11. **Locale-metadata drift.** `gds-core/locales` ships full `es` (Spanish)
    messages, but `gds-theme/src/i18n.ts`'s `gdsLocaleMetadata` — which
    drives RTL detection and font-lane locale-coverage — only registers 8
    locales and **omits `es`**. `isGdsRtlLocale('es')` and
    `getGdsLocaleIdsByScript(['latin'])` silently fall back to `en`'s
    defaults instead of reflecting Spanish explicitly. This reads as a small
    bug, not a roadmap item — worth just fixing directly rather than
    scheduling.
12. **Duplicate preset/token systems.** Every one of the 23
    `GdsThemePresetId` entries needs both a Mantine `MantineThemeOverride`
    object (`theme-presets.ts`) and an independently hand-authored CSS "vibe
    theme" object with its own color-authoring approach (`vibe-themes.ts`).
    16 of the 23 presets are one-line "vibrant" generator calls in the first
    file but still require a fully hand-written counterpart in the second —
    a real drift risk that compounds with every new preset added.
13. **Stale `GDS_GAP_INVENTORY.md`.** Dated 2026-06-13, materially older
    than the rest of the SSOT (2026-07-23). Several of its "not covered"
    claims are now resolved in current source (charts, uploads, command
    palette, evidence panels, period selectors) — anyone using it as a gap
    source without cross-checking source, as this document did, would
    over-count GDS's actual gaps. Should be refreshed or formally
    superseded by this document.

---

## 3. What this document deliberately does not do

- It does not propose a timeline, milestone, or version target for any item
  — that's a future planning decision, not something to bake into a
  comparison doc.
- It does not re-litigate GDS's deliberate policy choices (no decorative
  shadows, no native HTML5 drag-and-drop, chart-wrapper-not-chart-engine,
  consumer-owned upload transport) as gaps — those are documented,
  reasoned decisions, not oversights.
- It does not attempt exhaustive parity with every competitor feature —
  some gaps (e.g. broader icon catalogs) are real but low-urgency, and are
  ranked accordingly rather than treated as equally important to, say, the
  missing date picker.

## 4. Using this document

When any P0/P1/P2 item here is picked up for real implementation:

1. Open a dedicated GitHub issue (or issue set, for larger items) that
   references this document by name and section number.
2. Re-verify the specific competitor claim live if the implementation
   decision depends on precise current behavior — several external claims
   above are flagged as "not freshly re-verified"; don't build against a
   six-month-old memory of a competitor's API.
3. Follow the existing sequencing pattern used for prior GDS feature work
   (dependency governance amendment → core implementation → accessibility/
   i18n verification → docs/changelog) rather than shipping silently.
