# Design System Competitive Gap Analysis

Status: Active reference — roadmap input (not an implementation commitment).
Canonical roadmap doc as of 2026-07-24 (housekeeping issue #406); superseded
GDS_GAP_INVENTORY.md is archived — see that file for a pointer here.
Last updated: 2026-07-26
Tracking issue: #386 (P0/P1/P2 delivery batch tracked in #387-#398)

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
  `packages/gds-a11y`) and the current SSOT docs at `v4.0.0` — not inferred
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

| Dimension | GDS (v4.0.0) | Material 3 | Fluent 2 | Carbon | Ant Design 5 | Polaris / Spectrum / Atlassian / Chakra |
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

1. **Date/time picker & calendar.** ~~`GdsSchemaForm`'s schema adapters
   (`jsonSchemaToGdsFormSchema`, `openApiToGdsFormSchema`,
   `zodToGdsFormSchema`) already infer a `date` field type from
   `format: 'date'`, but there is no backing UI component — `@mantine/dates`
   isn't even a dependency anywhere in the monorepo.~~ **Resolved** (issue
   #389): `GdsDateInput`/`GdsDateTimeInput`/`GdsDateRangeInput` wrap
   `@mantine/dates` behind a fully GDS-owned prop contract (no vendor type
   leakage — see `verify-public-types-boundary.mjs`), now backing
   `GdsSchemaForm`'s `date` field type and live-demoed in the Forms pattern.
2. **Standalone `Breadcrumbs` component.** ~~Currently folded only into
   `PageHeader`/`WorkspaceHeader`/`DocsPageShell` — no independently
   exported, reusable primitive.~~ **Resolved** (issue #390): `GdsBreadcrumbs`
   ships as an independently exported, reusable primitive with its own
   labeled `<nav>` landmark, and `DocsPageShell` now composes it internally
   instead of duplicating breadcrumb rendering.
3. **z-index / stacking-layer token scale.** ~~No `--gds-z-*` scale exists.~~
   **Resolved** (issue #391): rather than publishing a competing scale, GDS
   now documents and defers to Mantine's own already-shipped
   `--mantine-z-index-*` CSS variables via a new typed `gdsZIndexToken`
   export, and fixed two real ad hoc violations found during
   implementation (`BottomTabBar` and `FloatingActionPlacement` each
   independently hardcoded different arbitrary numbers — 200 and 20 — with
   no shared authority between them).

### P1 — real gaps, narrower blast radius

4. **Rich text / markdown editor contract.** ~~"Content Ops Editor" patterns
   own the surrounding layout... but not the actual text-editing surface.~~
   **Resolved** (issue #392): `GdsRichTextEditor` wraps Tiptap (user-confirmed
   choice, matching the dnd-kit precedent's reasoning — hand-rolling
   selection/undo/paste-sanitization/IME composition reliably is high-risk),
   fully encapsulated behind a dedicated `@sovereignsquad/gds-core/rich-text-editor`
   subpath export (not the main barrel) so its larger Content-engine
   dependency stays genuinely opt-in — confirmed via `apps/reference-vite`'s
   own vendor chunk staying at its pre-change size since it never imports the
   subpath, while the playground (which does demo the editor) shows the real,
   earned cost.
5. **Global density-mode theme primitive** (`compact`/`comfortable`/
   `spacious`). ~~Exists only as scattered per-component props today~~
   **Resolved** (issue #393): `GdsDensityProvider`/`useGdsDensity` ship as a
   new, additive context products can set once. Existing components
   (`AdvancedDataTable`'s own 2-value density state, `CardContracts`'s
   existing `compact`/`comfortable`/`spacious` prop default) are
   deliberately left unchanged to avoid any behavior-change risk; a new
   `useGdsCardContract()` wrapper documents the opt-in extension pattern
   (fall back to ambient density instead of a hardcoded default) for new
   call sites going forward.
6. **Named column-grid layout primitive** (12/16/24-column). **Resolved**
   (issue #394): `GdsColumnGrid`/`GdsColumnGridItem` add an explicit
   track-span grid (12-column default, configurable) matching Carbon's 2x
   Grid / Ant Design's 24-col `Grid`, complementing rather than replacing
   `GdsGrid`'s equal-width auto-column layouts.
7. **Elevation/shadow token scale**, even a minimal 3–4 level one scoped to
   overlays only. **Resolved** (issue #395): `Popover.defaultProps.shadow`
   is now explicitly `'md'`, cascading to Menu/HoverCard/Select-family
   dropdowns (none of which set their own shadow prop). `Modal` has no
   theme-configurable shadow prop in this Mantine version, so its elevation
   stays Mantine's own fixed styling — documented as a real constraint, not
   silently left unaddressed. Cards/surfaces keep the existing, deliberate
   "no decorative shadows" policy unchanged.
8. **CJK / Indic locale coverage.** ~~All 9 shipped locales... no Chinese,
   Japanese, Korean, Thai, or Devanagari support.~~ **Partially resolved**
   (issue #396): `zh` (Simplified Chinese), `ja`, and `ko` message locales
   now ship (168 keys each, full parity with `en`), with correct
   `direction`/`script` metadata (`han`/`kana`/`hangul`). **Caveat, as
   disclosed in the issue itself**: translated via the same automated
   Google Translate approach already used for the playground's site
   phrases (`scripts/generate-site-phrase-translations.mjs`'s method,
   applied to these message keys) — not reviewed by a native speaker.
   Spot-checked output is plausible (e.g. `设置`/`設定`/`설정` for
   "Settings") but some entries are known-rough (e.g. `ja`'s "Analytics"
   translated to a mathematical/calculus sense of the word, not the
   business-analytics sense) — flag for native-speaker review before
   treating as production-quality, matching how the existing 9 locales
   were not independently re-verified either. Thai/Devanagari remain
   unaddressed.

### P2 — lower urgency, narrower audience or already partially mitigated

9. **Broader first-party icon catalog / icon-search tooling.** ~~~92 wrapped
   Tabler icons is materially smaller than every peer's catalog~~ **Expanded**
   (issue #397): ~40 new semantic icon keys added (navigation: chevron
   left/right, plain arrows, external-link, link; commerce: cart, package,
   payment, wallet, discount, tag; security: lock/unlock, key, biometric;
   rich-text-editor toolbar icons; plus location, building, folder, archive,
   connectivity, flag, tool, phone, drag-handle). Still smaller than every
   peer's full catalog by design — GDS wraps a curated subset behind
   semantic names rather than exposing Tabler's full ~4,000-icon set; still
   no icon-search tooling, and consumers can keep requesting additions to
   the semantic wrapper as needed.
10. **Financial/network chart types** (candlestick/OHLC, Sankey, box-plot,
    choropleth map). **Partially resolved** (issue #398): `candlestick`
    (OHLC) and `sankey` (flow) now ship as a new governed "Set C"
    (`gdsChartSetCTypeRegistry`), with their own validation rules (OHLC
    high/low range containment; sankey source/target/non-negative-flow),
    confirming the chart *contract* architecture (now 14 types across three
    governed sets) accommodates new types cleanly. Box-plot and
    choropleth-map chart types remain unaddressed (maps stay routed to the
    separate `MapPanel` embed contract, deliberately not a `GdsChart` type).

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
    15 of the 23 presets are one-line "vibrant" generator calls in the first
    file but still require a fully hand-written counterpart in the second.
    **Resolved with a scope caveat** (issue #388): the two systems draw from
    genuinely different color sources by design (Mantine's functional ramp
    vs. a bespoke, more saturated "vibe" palette — the hex values don't
    correspond to Mantine's own ramp shades), so mechanically deriving one
    from the other would be a real visual-design decision, not a refactor,
    and wasn't safe to force unilaterally. Added `vibe-themes.test.ts`, a
    parity guard that fails CI if a preset id is ever added to one file
    without the other — the drift risk that *was* safe to eliminate
    mechanically.
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

## 5. Appendix — theme-family coverage gaps (migrated from GDS_GAP_INVENTORY.md)

This section is distinct in kind from Sections 1-2 above: those compare GDS's
*component/pattern catalog* against external design systems. This appendix
instead tracks **theme-family variation** GDS's own token/theme architecture
does not yet define a canonical shared contract for, surfaced from real
consumer-project refactors (evidence links below), not competitive benchmarking.
Definitions: **not covered** = no SSOT contract exists yet; **partially
covered** = rulebooks mention the family generically but no reusable
package-level primitive exists.

1. **Provider-branded auth themes** — `not covered`. `AuthShell` doesn't define
   a canonical rule for how third-party/provider brand colors coexist with
   Mantine token authority. Evidence: `PROJECTS/SSO_MANTINE_REFACTOR.md#L43`,
   `PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L173`.
2. **White-label / tenant / organization theme variation** — `not covered`.
   GDS requires one token authority per product but doesn't define controlled
   per-tenant/per-org branding variation. Evidence:
   `PROJECTS/SSO_MANTINE_REFACTOR.md#L184`,
   `PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L131`.
3. **Reporting / analytics dashboard theme grammar** — `partially covered`.
   Metric cards and dashboard priority rules exist, but no full shared visual
   grammar for reporting-heavy screens. Evidence:
   `COMPONENTS_AND_PATTERNS.md#L19`, `PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L111`,
   `PROJECTS/KIDEX_MANTINE_REFACTOR.md#L49`.
4. **Mixed-mode preview/editor theme exception** — `not covered`. Foundation
   allows preview/editor exceptions to the "one active mode" rule, but no
   reusable contract defines their behavior. Evidence: `FOUNDATION.md#L55`.
5. **Editorial / docs shell theme variant** — `partially covered`. Article/docs
   shells are covered generically but no shared package-level article/docs
   theme implementation exists. Evidence: `COMPONENTS_AND_PATTERNS.md#L67`,
   `PROJECTS/NARIMATO.md#L61`, `PROJECTS/SSO_MANTINE_REFACTOR.md#L43`.
6. **Game / immersive full-viewport theme chrome** — `not covered`. No
   immersive/gameplay theme contract exists. Evidence:
   `PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L169`, `PROJECTS/NARIMATO.md#L66`.
7. **Certificate / OG / email rendering palettes** — `not covered`. Treated as
   exceptions with no shared palette contract. Evidence:
   `PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L170-171`.
8. **Chart / map / embed theming rules** — `not covered`. Charts/maps/embeds
   are allowed as exceptions but GDS doesn't define how their colors align
   with Mantine tokens. Evidence: `PROJECTS/CLASSSCOUT_MANTINE_REFACTOR.md#L198`,
   `PROJECTS/AMANOBA_MANTINE_REFACTOR.md#L174`, `PROJECTS/MESSMASS_MANTINE_REFACTOR.md#L63`.

These are lower-urgency than the P0/P1/P2 catalog gaps above (narrower,
consumer-specific theme-variation needs rather than missing components) and
are not yet prioritized — listed here so the evidence trail isn't lost, not
as a commitment to build any of them next.
