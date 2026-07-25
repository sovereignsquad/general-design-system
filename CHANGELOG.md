# Changelog

All notable policy changes to the General Design System are recorded here.

## Unreleased

- **KanbanColumn server-paginated count** (#432): the header count badge now renders `column.totalCount` when set, falling back to `column.items.length`. Server-paginated columns (where `items` hold only the loaded page) can show their real total instead of the loaded-page count. Additive and backward compatible — omitting `totalCount` is unchanged. `COMPONENTS_AND_PATTERNS.md` updated.
- **KanbanColumnData.title accepts ReactNode** (#434): column headings can now be a `ReactNode` (icon + label, colored dot, custom count pill), matching `KanbanItem.title`. Set the new `KanbanColumnData.ariaLabel` when `title` is not a plain string so move-menu targets and drag announcements keep a meaningful accessible name (string titles need nothing). Backward compatible.
- **KanbanColumn footer slot** (#435): new `footer` / `renderFooter(column)` on `KanbanColumn`, and `renderColumnFooter(column)` on `KanbanBoard`, render an element below the card list (pagination / "load more" / per-column actions) outside the drag `SortableContext`. Additive.
- **Collapsible KanbanColumn** (#436): opt-in `collapsible` (off by default) renders a header disclosure toggle (`button` with `aria-expanded`/`aria-controls`) that folds a column body to its title + count; a collapsed column is not a drop target. Controllable board-wide via `collapsedColumnIds` + `onCollapsedChange(columnId, collapsed)` or per-column via `collapsed` + `onCollapsedChange(collapsed)`. New localized `gds.kanban.collapseColumn`/`expandColumn` strings across all 12 locales. Mirrors the `enableDrag` opt-in pattern — zero behavior change on upgrade.
- **Project board moved from Projects v2 to a label-based issue board** (#438, supersedes #431): the board is now **GitHub Issues grouped by `status:` labels** (`PROJECT_BOARD.md`), not an org-level Projects v2 board. Every board operation is a label change the ambient `GITHUB_TOKEN` can perform, so the `GDS_PROJECT_TOKEN` PAT requirement is gone — the fragile part that could not be managed from the maintainer's agent/mobile workflow and drifted after each release. New taxonomy SSOT (`scripts/board-labels.config.mjs`: `status:`/`priority:`/`area:` labels), a provisioner (`npm run board:labels`, `gh label create --force`), a rewritten label audit (`audit:board` non-strict inside `verify:release` so a missing `gh` never blocks a release; `audit:board:strict` fails when an open issue isn't in exactly one status column), and a label-based `board:sync-release` (closing a delivered issue is its "move to Done"). The retired Projects v2 scripts (`audit-project-board.mjs`, `complete-3-4-board.mjs`, `sync-hvb-board.mjs`) and their npm entries are removed; `.github/workflows/board-sync.yml` now provisions labels and runs the strict audit with the default token. Docs updated: `PROJECT_BOARD.md` (new), `RELEASE_PUBLISH.md`, `docs/BOARD_SYNC_CHECKLIST.md`, `README.md`.

## 3.13.0 - 2026-07-24 — React 19 runtime, react-router 8, Kanban generics/affordance, dev diagnostics, DX docs

- **Workspace runtime upgraded to React 19; react-router advisory remediated** (#430): bumped the dev/app React runtime from 18.3.1 to 19.2.7 across the reference apps and package dev/test tooling, and migrated the playground from `react-router-dom@7` to `react-router@8` (the DOM bindings merged into `react-router` in v7+). This clears the high-severity **GHSA-qwww-vcr4-c8h2** production advisory (`react-router` 7.12.0–8.2.0; react-router 8 peer-requires React ≥19.2.7, which is why the React bump was needed). **The published peer contract is unchanged** — `react`/`react-dom` peers stay `^18.2.0 || ^19.0.0`, so React 18 remains a fully supported consumer lane (still validated by `verify:mantine`'s Mantine 7 + React 18 consumer-install smoke); only the workspace's own dev/CI runtime moved to 19. No GDS component code changed (the codebase was already React-19-clean: `createRoot`, no removed APIs, `@types/react` already 19; Mantine 7.17.8 already declares a React 19 peer). `compatibility.matrix.json` now labels React 19 + Mantine 7 as the primary CI/workspace line. A newly-disclosed dev-only PostCSS source-map advisory (**GHSA-r28c-9q8g-f849**, nested in `next`/`tsup`, non-shipped) — previously masked by the react-router production failure — is documented as an accepted dev advisory in `DEPENDENCY_AUDIT.md`, matching the identical `GHSA-6g55-p6wh-862q` disposition.
- **KanbanCard move-menu icon no longer implies drag** (#429): the "move to column" menu trigger defaulted to `IconArrowsMove` (a 4-way-arrows glyph) whenever `onMoveItem` was set — independent of `enableDrag` — which universally reads as "grab and drag me." But that control is a tap-to-open destination menu, and real pointer/touch drag is gated behind `enableDrag` (a separate grip handle), so on touch the icon promised a free-drag it never performed. The default is now a new governed `More` (vertical-dots) glyph (`IconDotsVertical`) — the standard "tap to open a menu" affordance with zero drag implication — used whether `enableDrag` is on or off. New optional `moveMenuIcon?: ReactNode` and `moveMenuLabel?: string` props on `KanbanBoard`/`KanbanColumn`/`KanbanCard` let consumers override the trigger's icon/verb without losing the governed menu. Backward compatible (icon swap + additive props); the accessible `"Move: {name}"` label and menu behavior are unchanged. Also adds the reusable `GdsIcons.More` kebab icon. See the "Move-menu icon vs. drag-handle icon" note in [`COMPONENTS_AND_PATTERNS.md`](COMPONENTS_AND_PATTERNS.md).
- **`GdsPageTemplateAction.loading` (deprecates `pending`)** (#405): the page-template action busy-state prop is now named `loading`, matching every other GDS action/button API (`SemanticButton`, `ConfirmDialog`, `GdsAccessGateAction`, table row actions) — the previous outlier `pending` name forced consumers to remember which API used which. Backward compatible: `pending` is still honored as an alias (mapped to `loading`) with a one-time dev-only deprecation warning, and will be removed in a future major version; if both are set, `loading` wins. No repo consumer used `pending`, so blast radius is limited to the deprecation path. `docs/PAGE_TEMPLATES.md` updated.
- **Dev-mode misuse diagnostics** (#404): new dev-only `gdsDevWarnOnce` helper (`@sovereignsquad/gds-theme`, with `resetGdsDevWarnings` for test isolation) surfaces three previously-silent misuse gaps as one-time `console.warn` messages, stripped entirely from production builds (`process.env.NODE_ENV === 'production'` guard). Wired into: (1) `useGdsTranslation` — warns when called without a `GdsProvider` ancestor (detected by context-identity), which otherwise silently pins every string to built-in English; (2) `GdsDateInput`/`GdsDateTimeInput`/`GdsDateRangeInput` — warn on transposed `minDate`/`maxDate` or an out-of-range `value`; (3) `GdsAccessGate` — now routes contract-validation findings through the warning in addition to the optional `onEvent`, so an invalid state/reason/action combination is no longer completely silent when `onEvent` is omitted. Additive and non-breaking: correct usage sees zero behavior change and zero production cost; only incorrect usage gains a dev-time signal. This complements — never replaces — GDS's existing fail-loud `throw` for hard contract breaks.
- **Generic `KanbanBoard` item/column typing** (#399): `KanbanBoard`, `KanbanColumn`, `KanbanCard`, and their prop interfaces are now generic over the item and column shape — `KanbanBoard<TItem extends KanbanItem, TColumn extends KanbanColumnData<TItem>>`, with `KanbanColumnData<TItem extends KanbanItem = KanbanItem>` carrying `items: TItem[]`. Both parameters default to the base `KanbanItem` / `KanbanColumnData`, so this is a **backward-compatible typing enhancement with no runtime behavior change** — existing non-generic call sites (including the playground's `KanbanBoardDemo` and all prior tests) compile unchanged. Consumers who extend `KanbanItem` / `KanbanColumnData` with app-specific required fields now receive them fully typed inside `renderItem(item, column)` **without a cast** (previously the fixed `(KanbanItem, KanbanColumnData)` callback signature made an extended-shape `renderItem` a compile error at the call site — surfaced by a real downstream consumer build). `onMoveItem` keeps its string-id signature and no `@dnd-kit` types leak onto the public surface (`verify:boundary` unaffected). See the "Typed item/column extension" note in [`COMPONENTS_AND_PATTERNS.md`](COMPONENTS_AND_PATTERNS.md).

## 3.12.0 - 2026-07-23 — competitive gap-closing batch (#387-#398)

Following `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md`'s benchmark against Material Design 3, Fluent UI 2, IBM Carbon, Ant Design 5, Shopify Polaris, Adobe Spectrum, Atlassian Design System, and Chakra UI, this release closes every P0/P1/P2 gap identified plus three incidental tech-debt items, in one consolidated batch.

**P0 — highest-impact gaps:**
- **Date/time picker family** (#389): `GdsDateInput`, `GdsDateTimeInput`, `GdsDateRangeInput` wrap `@mantine/dates` (new peer dependency, matching the `@mantine/core` engine class). `GdsSchemaForm`'s `date` field type now renders `GdsDateInput` instead of a bare native `<input type="date">`, keeping its stored value as an ISO (`yyyy-mm-dd`) string for backward compatibility.
- **`GdsBreadcrumbs`** (#390): standalone, independently reusable breadcrumb trail (labeled `nav` landmark; last item always renders as the non-link current page even if it carries an `href`). `DocsPageShell` now uses it internally instead of an inline, duplicated implementation.
- **z-index token scale** (#391): `gdsZIndexToken` (`@sovereignsquad/gds-theme`) documents and defers to Mantine's own `--mantine-z-index-*` CSS variable scale as the single stacking authority. Fixed two real ad hoc violations found during implementation — `BottomTabBar` and `FloatingActionPlacement` each independently hardcoded different arbitrary z-index values (200 and 20) with no shared authority; both now use `gdsZIndexToken.app`.

**P1 — real gaps, narrower blast radius:**
- **`GdsRichTextEditor`** (#392): Tiptap-backed rich text editor (user-confirmed dependency choice, matching the `@dnd-kit` precedent's reasoning), composed into `ContentOpsEditor`'s demo as the description field. Fully encapsulated behind a dedicated `@sovereignsquad/gds-core/rich-text-editor` subpath export — kept out of the main package entry so its larger "Content engine" dependency stays genuinely opt-in (confirmed: `apps/reference-vite`'s own vendor chunk stayed at its pre-change size, since it never imports the subpath).
- **Global density-mode primitive** (#393): `GdsDensityProvider`/`useGdsDensity` publish a `compact`/`comfortable`/`spacious` axis products can set once, plus `useGdsCardContract()` documenting the fall-back-to-ambient-density extension pattern. Purely additive — no existing component's default changed.
- **`GdsColumnGrid`/`GdsColumnGridItem`** (#394): named 12-column (configurable) track-span grid, matching Carbon's 2x Grid / Ant Design's 24-col `Grid`, complementing `GdsGrid`'s equal-width auto-column layouts.
- **Overlay elevation scale** (#395): `Popover.defaultProps.shadow` is now explicitly `'md'`, cascading to Menu/HoverCard/Select-family dropdowns. `Card`'s existing `shadow: 'sm'` default is untouched. `Modal` has no theme-configurable shadow prop in this Mantine version, documented as a real constraint rather than left silently unaddressed.
- **CJK locale coverage** (#396): `zh` (Simplified Chinese), `ja`, `ko` message locales ship with full parity (168 keys each) and correct `direction`/`script` metadata. Machine-translated via the same disclosed Google Translate approach already used for playground site-phrases — **not reviewed by a native speaker**; flagged for review before treating as production-quality.

**P2 — lower urgency:**
- **Icon catalog expansion** (#397): ~40 new semantic icon keys (navigation, commerce, security, rich-text-editor toolbar, plus location/building/folder/archive/connectivity/flag/tool/phone/drag-handle).
- **Financial/network chart types** (#398): `candlestick` (OHLC) and `sankey` (flow) ship as a new governed "Set C" (`gdsChartSetCTypeRegistry`), with their own validation rules (OHLC high/low range containment; sankey source/target/non-negative-flow).

**Incidental tech debt fixed:**
- **Locale-metadata drift** (#387): `es` (Spanish) shipped full messages in `gds-core/locales` but was missing from `gds-theme`'s `gdsLocaleMetadata` (RTL/script-detection registry), silently mis-defaulting to English direction/script rules. Fixed, plus a new parity test guards against recurrence. `GDS_GAP_INVENTORY.md`'s stale "not covered" claims (charts, uploads, command palette, evidence panels) were also corrected.
- **Vibe-theme/preset drift guard** (#388): the 23 `GdsThemePresetId` entries each need a Mantine theme override (`theme-presets.ts`) and an independently hand-authored CSS "vibe theme" object (`vibe-themes.ts`). Confirmed the two intentionally draw from different color sources (Mantine's functional ramp vs. a bespoke, more saturated palette), so merging them isn't a safe mechanical refactor — added `vibe-themes.test.ts` instead, which fails CI if a preset id is ever added to one file without the other.

See `DESIGN_SYSTEM_COMPETITIVE_GAP_ANALYSIS.md` for the full comparison this batch was scoped against.

## 3.11.1 - 2026-07-23 — release-cutover patch (no functional change)

- **Patch-only version bump** (#385): `gds-v3.11.0`'s git tag was created by `auto-tag-release.yml` before that same day's fix to the workflow (explicit `gh workflow run --ref` dispatch, added to work around GitHub Actions' anti-recursion rule for `GITHUB_TOKEN`-authored pushes) landed, so the tag was stuck pointing at the pre-fix commit and `release-bundles.yml` never created a GitHub Release/tarball for it. Moving the existing tag directly was attempted and blocked (git proxy `403` on both tag deletion and force-push, no GitHub-API tag-ref tool available). This patch bump carries no functional/code change beyond the version-bump surfaces themselves — it exists solely so the now-fixed automated pipeline produces a correctly-tagged `gds-v3.11.1` release and GitHub Packages publish with zero manual tag surgery.

## 3.11.0 - 2026-07-23 — mobile input-zoom guard + accessible Kanban drag-and-drop

- **Mobile input-focus auto-zoom guard** (#379, #380): `gdsTheme` now floors the effective font-size of every Mantine `Input`-based control (`TextInput`, `Textarea`, `NativeSelect`, `Select`, `PasswordInput`, `NumberInput`, `MultiSelect`, `Autocomplete`, `TagsInput` — including `gds-admin`'s `AdminTextInput`/`AdminTextarea`/`AdminSelect`, which are thin pass-throughs) to at least 16px at `xs`/`sm`/the implicit default size, via a new `components.Input.vars` entry in `packages/gds-theme/src/theme.ts` using `max(1rem, var(--mantine-font-size-sm))`. This prevents iOS Safari's/Chrome's forced page-zoom on input focus — a distinct mechanism from pinch-zoom, unaffected by `getGdsPwaViewportMetaContent`/`zoomPolicy` — without touching pinch-zoom or OS-level text scaling, so it ships as a silent default rather than an opt-in flag. `md`/`lg`/`xl` sizes (already ≥16px) are unchanged. `GdsSchemaForm`'s `renderDefaultField` raw-native-element fallback (no Mantine class, so the theme fix can't reach it) gets its own matching inline font-size floor. **Visual diff for existing consumers on upgrade:** any `xs`/`sm`/default-size input renders measurably larger text (12–14px → 16px) with no code change required. See the new "Input-focus auto-zoom" section in [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md).
- **Accessible Kanban pointer/touch/keyboard drag-and-drop** (#381–#384): `KanbanBoard` gains an opt-in `enableDrag?: boolean` prop (default `false` — zero behavior change for existing consumers). When enabled, each `KanbanCard` gets an additional drag handle built on `@dnd-kit/core` + `@dnd-kit/sortable` (new dependencies of `@sovereignsquad/gds-core`, fully encapsulated — never a public export or consumer import, see the new "Interaction engine" class in [`DEPENDENCY_GOVERNANCE.md`](DEPENDENCY_GOVERNANCE.md)), supporting pointer, touch, and keyboard (Space to pick up, arrows to move, Space to drop, Escape to cancel) dragging with localized live-region announcements (new `gds.kanban.drag*`/`announce*` message keys across all 9 locale packs). Native HTML5 `draggable`/`dragstart` is still never used (it remains inoperable by keyboard/screen-reader users and is prohibited by the accessibility release gate) — the existing keyboard-accessible "Move to column" menu stays unconditionally rendered and fully functional in both modes, and is the guaranteed accessible-equivalent fallback. `onMoveItem`'s signature widens with an optional trailing `toIndex` parameter (backward compatible — existing 3-argument call sites are unaffected). New `scripts/verify-kanban-drag-accessibility-runtime.mjs` (wired into `verify:release`) asserts the Move menu and drag handle both keep working with `enableDrag` on.

## 3.10.0 - 2026-07-22 — kanban + media + PWA viewport lane

- **Kanban Board pattern**: new governed responsive `KanbanBoard` (`KanbanColumn`/`KanbanCard` sub-parts, `useGdsKanbanOrientation` hook) in `@sovereignsquad/gds-core`. Portrait-mobile viewports render one stacked column per row; landscape phones, tablets, and desktop render multi-column with horizontal scroll — resolved automatically via a `useMediaQuery`-backed hook, no consumer CSS or breakpoint logic required. Cards move between columns through a keyboard-accessible "move to column" menu (`onMoveItem(itemId, fromColumnId, toColumnId)`) instead of native HTML5 drag-and-drop, which cannot be operated by keyboard or screen-reader users. Registered in the pattern catalog (`kanban-board`, operations family) with a live demo, i18n keys (`gds.kanban.*`) added to all 9 locale packs, and a new `docs`/`COMPONENTS_AND_PATTERNS.md` "Kanban Board Rules" section.
- **`MediaPreviewCard` / `AdminResourceCard` missing-media handling**: added `hideWhenNoMedia?: boolean` to `MediaPreviewCard` (and threaded through `AdminResourceCard`/`AdminResourceGrid`/`AdminResourceManager`) so records with no `src`/`thumbnailSrc` can omit the media area entirely instead of showing the default "No media" placeholder. Missing media already never crashed the card; this adds explicit opt-in control for record types that structurally never have media (e.g. lead/contact rows).
- **PWA viewport & zoom policy**: new `getGdsPwaViewportMetaContent(...)` export from `@sovereignsquad/gds-theme` generates the canonical `<meta name="viewport">` content. Default `zoomPolicy: 'browser-default'` leaves pinch-zoom untouched (required for WCAG 1.4.4/1.4.10); the new `'app-shell-fixed'` lane adds `maximum-scale=1, user-scalable=no` as a reviewed, documented, opt-in exception for installed PWA app shells. See [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md) for the required accessibility mitigations, scope limits, and exit condition.
- **Fully automatic release cutover**: new `.github/workflows/auto-tag-release.yml` triggers on any push to `main` that changes the root `VERSION` file, and creates/pushes the matching `gds-v<VERSION>` tag using the workflow's own `GITHUB_TOKEN` — no maintainer needs to run `git tag`/`git push` or draft a release in the GitHub web UI for a routine version bump. That tag push fans out into the existing `release-bundles.yml` (build, `verify:release`, pack, create the GitHub Release, attach tarballs) and `publish-npm.yml`, which now also triggers on the tag push (previously `workflow_dispatch`-only) instead of requiring a manual run. See the updated "GitHub Actions publish path" section in [`RELEASE_PUBLISH.md`](RELEASE_PUBLISH.md).
- **GitHub Packages distribution channel**: new `.github/workflows/publish-github-packages.yml` publishes all seven packages to GitHub Packages' npm-compatible registry (`https://npm.pkg.github.com`) on the same `gds-v*` tag trigger, authenticated with the workflow run's own ambient `GITHUB_TOKEN` — no `NPM_TOKEN`/npm.com account dependency, so it keeps working even when the npmjs.com publish is blocked. Unlike the release-bundle tarball fallback, it's a real resolving registry, so the `@sovereignsquad/gds` umbrella package installs correctly there too. `scripts/publish-packages.mjs` and `scripts/check-registry-publication.mjs` already supported a configurable `GDS_NPM_REGISTRY`, so no script changes were needed — only the `.npmrc`/registry-URL wiring in the new workflow and consumer install docs (README.md, `INSTALLATION_GUIDE.md` §9, `RELEASE_PUBLISH.md`).

## 3.9.0 - 2026-07-01 — brand-completion-lane (#362–#368)

- **Choice-chip family catalog coverage** (#362): the `choice-chips` catalog demo now mounts the full exported family — `ChoiceChip` (static, link/button, multi-select toggles) plus the stateful `PillBar`, `SoftChipGroup`, and `FilterChipGroup` selection groups (including a disabled option) — so every-theme render, forced-colors, and a11y-evidence gates exercise the whole family, not just the base chip.
- **MissingDataPrompt catalog coverage + i18n catalog keys** (#363): the `state-blocks` catalog demo renders `MissingDataPrompt` with a required-fields list, a call-to-action slot, and a `role="status"` recovery variant. Localized message keys `gds.state.missingData.title` / `gds.state.missingData.description` are added to all 9 locale packs (public catalog). `MissingDataPrompt` stays server-safe (no `'use client'`, no context hook) with English semantic defaults, so consumers localize by passing `title`/`description` resolved from the catalog — the component remains usable from `@sovereignsquad/gds-core/server`.
- **Form control family catalog coverage + i18n catalog keys** (#364): the `forms` and `form-field` catalog demos now mount `GdsSegmentedControl` (default, disabled, and many-item overflow), `GdsSlider` (1–10 plus a min-equals-max boundary), `GdsRatingScale` (1–5), and `GdsWizardStepper` (first/mid/last steps). Localized wizard/slider/rating message keys (`gds.form.wizard.back|next|finish|progress|optional`, `gds.form.slider.label`, `gds.form.rating.aria`) are added to all 9 packs (public catalog). The controls stay server-safe with English prop defaults; no public API changes.
- **Overlay Dialog/SidePanel alias coverage + i18n** (#365): the `modals` and `drawers` catalog demos now open `GdsDialog` and `GdsSidePanel` (open/close, focus trap, focus return, opaque surface). The overlay close-button `aria-label` now routes through the new `gds.overlay.close` key (added to all 9 packs) via the client-only `OverlayManager`, instead of Mantine's built-in English default.
- **Chart-wrapper family catalog coverage + i18n catalog keys** (#366): the `reporting-contracts` catalog demo now renders all seven wrappers (`GdsAreaChart`, `GdsSparkline`, `GdsLongitudinalChart`, `GdsBenchmarkBarChart`, `GdsRadarChart`, `GdsMaturityRadarChart`, `GdsGaugeChart`) in populated, empty, and loading states so the accessible table fallback is exercised per theme. Localized chart table-header keys (`gds.chart.table.label|value|secondaryValue|group`, all 9 packs) are added to the public catalog; `GdsChart` stays server-safe (English header defaults, consumer-overridable via `tableValueHeader`/`groupLabel`). The reporting legend swatches use `getGdsSeriesColor` instead of raw Mantine tokens, and a focused test asserts the benchmark wrapper mirrors its input into the table fallback.
- **Gold Athlete (Habigoal) brand preset** (#367): new first-class governed brand lane `gold-athlete`, mirroring the `class-usa` apparatus — `brand-tokens.ts` (five 10-step ramps `gold`/`charcoal`/`crimson`/`ivory`/`slate`, `CreateGoldAthleteBrandThemeOptions`, `createBrandTheme('gold-athlete')`), `vibe-themes.ts` (`gold-athlete` VibeTheme + semantic CSS variables, with the single-id brand-semantic guard widened to a preset map so the new lane's variables emit), `goldAthleteThemePreset` in `theme-presets.ts` (catalog + registry), and `index`/`client`/`server` exports (`goldAthleteThemePreset`, `GoldAthleteColorRampName`, `GoldAthleteColorRamps`, `CreateGoldAthleteBrandThemeOptions`). The palette passes WCAG AA in both schemes: charcoal body/heading text on ivory surfaces in light mode, ivory text with metallic-gold accents on near-black surfaces in dark mode, and a separate accessible `--gds-brand-accent-action` (darkened gold `#8a5a00`, 5.9:1 with white) for filled accent controls so the gold accent is never used as on-white body text. Additive — existing presets and the decorative `athlete-gold` vibe are unchanged.
- **Component→pattern-registry parity gate** (#368): new blocking `verify:component-catalog-parity` gate (wired into `verify:release`) fails CI if any public PascalCase UI component exported from `@sovereignsquad/gds-core` or `@sovereignsquad/gds-admin` (via each package's `index`/`client`/`server` entrypoints) is neither registered in the pattern registry (`apps/playground/src/pattern-registry.ts`, as a `sourceComponent`) nor listed in the reviewed exemption allowlist `boundary/component-catalog-exemptions.json` with a reason. Hooks (`use*`) and type-only exports are dropped by classification. Registry membership is what drives catalog render (every-theme + forced-colors), i18n routing, and a11y evidence, so this closes the exact gap that let the 17 lane components ship export-covered but unrendered/unevidenced. Sequencing this gate last surfaced that #362–#366 rendered the lane components in the catalog demos (`pattern-pages.tsx`) but never recorded them as `sourceComponent`, so the gate now completes that link: `PillBar`/`SoftChipGroup`/`FilterChipGroup` on the choice-chips row, `MissingDataPrompt` on state-blocks, `GdsSegmentedControl`/`GdsSlider`/`GdsRatingScale`/`GdsWizardStepper` on forms, the seven chart wrappers (`GdsAreaChart`/`GdsSparkline`/`GdsLongitudinalChart`/`GdsBenchmarkBarChart`/`GdsRadarChart`/`GdsMaturityRadarChart`/`GdsGaugeChart`) on reporting-contracts, `GdsDialog` on modals, and `GdsSidePanel` on drawers. The 124 genuinely non-catalog exports (layout/style primitives, typography atoms, providers/context, i18n formatters, page templates/catalog helpers, chart sub-parts and variant wrappers, `Admin*`/`Partner*` sub-parts of registered composites, icon surfaces, and client-runtime composites whose canonical pattern is registered elsewhere) are exempted with grouped reasons; stale exemptions warn non-fatally. Deterministic sub-second static scan, no build/network. See [`docs/COMPONENT_CATALOG_PARITY.md`](docs/COMPONENT_CATALOG_PARITY.md).

## 3.8.0 - 2026-07-01

- **Opaque overlay surfaces** (#342): GDS now owns the painted background of every overlay/dropdown surface (`Popover`, `Menu`, `Select`/`Combobox`, `MultiSelect`, `Autocomplete`, `HoverCard`). `styles.css` sets an opaque, GDS-owned `--gds-overlay-surface` token (white / `--mantine-color-dark-6` / system `Canvas` under forced-colors) and applies it to all dropdown containers with hard fallbacks, so overlays stay solid even when the vendor base stylesheet is absent or an unlayered consumer reset competes. Resolves the cross-client transparent-dropdown failures.
- **Mandatory stylesheet import documented + guarded** (#344): every consumer integration path — `INSTALLATION_GUIDE.md`, `docs/CLASSSCOUT_INTEGRATION.md`, `docs/AI_AGENT_GUIDE.md`, `README.md`, the Vite/Next `TEMPLATES`, and the playground install code — now shows `import '@sovereignsquad/gds-theme/styles.css'` as the first bootstrap step. `verify-install-bootstrap-docs.mjs` fails CI if any tracked integration doc or template omits it, preventing the documentation gap that caused unstyled/transparent surfaces in consumer apps.
- **Public type-boundary gate** (#343): `verify:public-types` (in `verify:release`) scans the built consumer-facing `.d.ts` for `@mantine/*` references and fails on any not recorded in `boundary/public-type-allowlist.json`. This seals GDS's public type surface — a vendor major or accidental pass-through now fails in GDS's CI, not in a consumer's compile step — and freezes the documented intentional exposures (the `GdsPrimitives` passthrough; theme-override types) so the surface can only shrink deliberately, never grow by accident. See [`docs/PUBLIC_TYPE_BOUNDARY.md`](docs/PUBLIC_TYPE_BOUNDARY.md).
- **Single install surface** (#346): consumers install `@sovereignsquad/gds` (+ React) only — the engine (`@mantine/*`, `@tabler/icons-react`) is pulled in automatically as auto-installed peers and never listed by the consumer. The engine stays a peer on purpose (single resolved instance, no dual-instance/skew failures). New `verify:install-surface` gate enforces that all GDS packages pin the **same** engine range, React/react-dom remain consumer-owned peers, the umbrella declares the full engine, and the GDS-owned `GdsIcons` surface is reachable (so consumers never import `@tabler/icons-react` directly). Install docs now lead with the single command.
- **Boundary contract suite** (#347): one named `verify:boundary` gate (in `verify:release`) composes the boundary gates into a single verdict — public type surface (#343), single install surface (#346), and a new **public CSS-selector gate** (`verify:css-boundary`) that freezes the `.mantine-*` selectors in the published stylesheet to `boundary/public-css-allowlist.json` and fails on new ones. Together with the runtime opaque-overlay checks (#342) and the export contract, this makes the vendor boundary a one-way ratchet: the vendor surface can only shrink deliberately, never grow by accident. See [`docs/BOUNDARY_CONTRACT.md`](docs/BOUNDARY_CONTRACT.md).
- **Vendor version governance** (#348): `vendor-governance.json` is the single source of truth for the GDS-owned engine version; `verify:vendor-pin` (in `verify:release`) fails if any package's engine/platform peer ranges drift from the manifest. Engine upgrades become deliberate, reversible internal migrations behind the sealed public contract via [`docs/VENDOR_UPGRADE_RUNBOOK.md`](docs/VENDOR_UPGRADE_RUNBOOK.md) — the CI matrix smoke-tests the candidate major, breakage is absorbed in adapters only, and rollback is a single revert.
- **Styling-contract migration to GDS hooks** (#345): GDS themes its core surface group (`Paper`, `Card`, `Alert`, `Code`) through GDS-owned classes (`.gds-paper`, `.gds-card`, `.gds-alert`, `.gds-code`) attached globally via theme `classNames`, instead of vendor-internal `.mantine-*` selectors. The published stylesheet's vendor-selector surface shrank 38 → 34 (enforced down by `verify:css-boundary`); migration is visually identical (the GDS class lands on the same element) and verified by the theme-trust + forced-colors runtime checks across all presets. Remaining selectors migrate incrementally under the gate. See [`docs/THEME_STYLING_HOOKS.md`](docs/THEME_STYLING_HOOKS.md).
- **Overlay adapter seam** (#349): a GDS-owned `OverlayAdapter` interface (with default `mantineOverlayAdapter`) makes the overlay engine swappable without changing any consumer call site or the public component API. `GdsProvider` accepts an `overlayAdapter` prop (defaults to current behavior); `useOverlayAdapter()` exposes it; `surfaceProps(role)` carries the `data-gds-overlay-surface` hook (#342). All adapter types are GDS-owned, so the seam does not widen the vendor type boundary. Swappability is proven by a test that reads a different engine purely by swapping the injected adapter. Overlay components adopt the seam incrementally. See [`docs/OVERLAY_ADAPTER.md`](docs/OVERLAY_ADAPTER.md).
- **Class USA first-class theme and primitive completion** (#359): `createBrandTheme('class-usa')` and `classUsaThemePreset` now ship the locked Class USA ramps, fonts, semantic tokens, token graph, and CSS variables, including accessible `--gds-brand-accent-action` for filled accent controls. `GdsProvider` applies theme-owned variables to the document root so portalled overlays inherit the active brand. Core now exposes brand-button variants, pill/soft/filter chip groups, dialog/side-panel aliases, missing-data prompts, saved/rating listing-card anatomy, and a larger accessible chart wrapper set (`GdsAreaChart`, `GdsSparkline`, `GdsLongitudinalChart`, `GdsBenchmarkBarChart`, `GdsRadarChart`, `GdsMaturityRadarChart`, `GdsGaugeChart`, `GdsCalendarHeatmapChart`, `GdsHistogramChart`, `GdsDivergingBarChart`, `GdsSlopeChart`, `GdsSymmetryChart`) with table fallback and opt-in decimation.
- **Gold-Athlete handoff closure** (Habigoal #502): the Athlete Gold lane now benefits from global portal variable propagation and the expanded package-native controls requested by the Habigoal audit: `GdsSegmentedControl`, `GdsSlider`, `GdsRatingScale`, `GdsWizardStepper`, chart-kit wrappers, `MissingDataPrompt`, and strict compliance rules for app-local raw hex/rgb colors, inline color literals, and non-token numeric radii. `docs/CLASSSCOUT_INTEGRATION.md` was updated with the 3.8.0 single-package install and migration surface list.

## 3.7.0 - 2026-06-30

- **Published consumer smoke**: `verify:published` now runs registry polling and a clean npm consumer fixture that installs the published package line outside the monorepo, type-checks imports, and verifies runtime exports across all seven public packages.
- **Athlete Gold reference surface**: `/themes` now includes a package-owned black-and-metallic-gold navigation reference panel backed by the shipped Athlete Gold VibeTheme tokens.
- **Schema upload adapter**: `GdsSchemaForm` accepts `uploadAdapter` for file-upload fields, with progress, retry, cancel, remove, upload-result payloads, and metadata-only upload events.
- **Actionable table cells**: `GdsDataTable` columns can mark `interactive: true`; grid-cell focus remains roving while `Enter`/`F2` enters nested controls and `Escape` returns to the cell.
- **Release board sync**: `board:sync-release` closes explicitly delivered issues and normalizes closed GitHub project-board cards to `Done`, with dry-run and idempotent behavior.

## 3.6.0 - 2026-06-26 (sprint 2)

Two batches shipped under the 3.6.0 version number before per-batch versioning
discipline began in 3.7.0 — kept as two dated entries, sprint 1 first, for
historical accuracy rather than merged or renumbered.

- **GdsDataTable keyboard navigation** (#333): roving grid-cell focus with Up/Down/Left/Right/Home/End traversal, `role="grid"` semantics, `aria-selected`/`aria-rowindex` per row, and `aria-live` row/column announcements.
- **GdsSchemaForm `FileUploadField`** (#334): `'file-upload'` schema field type now maps JSON Schema `format: "binary"` / `data-url` into the governed `UploadDropzone`, supports accept/multiple/max-size/progress metadata, validates required and oversized files, and submits `File[]` payloads.
- **VibeTheme expansion + `VibeThemePicker`** (#335): honey-amber `warm` lane plus the new `Athlete Gold` black-and-gold performance lane are registered in `theme-presets` and `vibe-themes`; `VibeThemePicker` renders swatch buttons for all 20 vibe presets with keyboard-accessible `role="radiogroup"` and live glow/border selection states.
- **CI Mantine 9 matrix** (#336): `quality.yml` now runs `validate` across `mantine-7` and `mantine-9` with `fail-fast: false`, overriding Mantine packages to `^9` in the second leg via `npm install --no-save`.
- **AccessGate `render-degraded-while-locked` policy** (#337): new `protectedContentPolicy` value renders the protected subtree with `aria-hidden` + `inert` while the gate is locked, enabling SEO-crawlable and hydration-ready degraded content surfaces.

## 3.6.0 - 2026-06-26 (sprint 1)

- **`/ai` route** (#327): live playground page at `/ai` surfacing `llms.txt`, install steps, drop-in `AGENTS.md`/`CLAUDE.md` templates, non-negotiable agent rules, and a "Design with GDS in Claude Design" entry point. Registered in locale-coverage and gds-adoption governance contracts; all 9 locale packs covered.
- **10 Claude Design previews** (#328): hand-authored `.design-sync/previews/` for the 10 ClassScout components shipped in 3.5.0 — `BottomTabBar`, `SearchableSelect`, `FitScoreChip`, `ChatThread`, `ChatMessage`, `ChatInput`, `StreamingIndicator`, `MeaningBadge`, `MediaWithFallback`, `NumberStepper`, `AISearchCard`. Pending upload to canonical Claude Design project via `/design-sync`.
- **ClassScout integration guide** (#330): `docs/CLASSSCOUT_INTEGRATION.md` with install, GdsProvider bootstrap with `createBrandTheme`, and per-contract usage examples for all 10 B1–B10 gaps; drop-in `AGENTS.md`/`CLAUDE.md` for the ClassScout repo.
- **Mantine 9 migration audit** (#329): `docs/MANTINE9_MIGRATION.md`; `verify:mantine` already passes Mantine 9 with no GDS code changes required.
- Opened milestone #26 (GDS 3.6.0) and 5 backlog issues (#327-331).
- Closed all 10 ClassScout issues (#316-325) with 3.5.0 delivery notes; closed milestone #25.

## 3.5.0 - 2026-06-21

- ClassScout pure-GDS unblock (issues #316–#325): closed the 10 gaps required for consumers to ship on pure GDS with no app-level forks.
  - `gds-theme`: `createBrandTheme({ brandColors, fonts })` plus a brand-named semantic token layer (`brand.primary`, `bg.page`, `text.*`, `price`, `state.*`) emitted as `--gds-*` variables on top of the governed token graph, with WCAG-AA contrast enforcement (#316).
  - `gds-core`: `'bottom-tab'` mobile navigation mode + `BottomTabBar` (safe-area aware, raised center action) for `PublicShell`/`DiscoveryShell` (#317); `SearchableSelect` combobox with async/grouped options and full keyboard a11y (#318); `FitScoreChip` (#319); `ListingCard` `reason`/`score`/`actions` composition slots (#320); conversation surface `ChatThread`/`ChatMessage`/`ChatInput`/`StreamingIndicator` (#321); `MeaningBadge` distinct from `StatusBadge` (#322); `MediaWithFallback` resilient media (#323); `NumberStepper` (#324); `AISearchCard` governed assistant-entry pattern (#325).
  - All new UI consumes GDS tokens, is keyboard- and screen-reader-accessible, and is registered in the pattern export/API-docs coverage registries.
- Added an AI-agent integration layer so GDS is consumable by Claude, Claude Code, Cursor, Copilot, and any LLM tool: `llms.txt` (universal machine-readable entry point), `docs/AI_AGENT_GUIDE.md`, and a "Use with AI" quick-start in the README.
- Added drop-in repo rule templates `TEMPLATES/AGENTS.md.template` (cross-tool `AGENTS.md` standard) and `TEMPLATES/CLAUDE.md.template` so consuming repos make every agent session build with GDS automatically.
- Added `docs/CLAUDE_DESIGN.md` documenting the Claude Design integration: syncing GDS into claude.ai/design (via `/design-sync` in Claude Code) so the design agent builds screens with the real GDS components, and the committed `.design-sync/` inputs that make a re-sync one command.
- Synced all 252 components (249 hand-authored, render-verified previews + 3 floor-carded body-portal overlays) into the canonical GDS Claude Design project, with a conventions header teaching the GdsProvider/prop-token/semantic-action build idiom.

## 3.4.14 - 2026-06-13

- Added dependency-governance policy for React, Mantine, Tabler, dependency classes, replacement triggers, and exception lifecycle.
- Classified API reference exports by stability and implementation boundary so consumers can distinguish canonical GDS contracts from Mantine/Tabler-backed surfaces.
- Added `GdsIcon name="..."` semantic icon support while keeping the existing `icon` prop compatible.
- Added dependency-boundary exception validation, dependency-risk reporting, and expanded compatibility smoke coverage for Mantine 7/React 18 plus Mantine 8/9 React 19.

## 3.4.13 - 2026-06-13

- Fixed `DocsShell` mobile headers so translated brand labels truncate safely instead of wrapping into the action controls.
- Added `DocsHeaderActionSelect` as the package-owned bounded header select for language and compact docs-shell actions.
- Added browser runtime verification for Russian, German, Hebrew, and Arabic mobile header layouts to catch clipped controls, horizontal overflow, and brand/action overlap before release.
- Updated governance and component rules so responsive localization failures block release instead of being treated as cosmetic defects.

## 3.4.12 - 2026-06-12

- Fixed cosmic and dark-forward preset overrides so mixed light preview cards no longer inherit forced white text, forced dimmed text, or fixed `28px` Paper/Card radius values from the surrounding page.
- Added local contrast CSS ownership for preview-surface buttons, inputs, badges, code, nested cards, foreground text, muted text, backgrounds, borders, and radius tokens.
- Stopped generated phrase translation from mutating interactive controls after React render so buttons, links, labels, selects, and input attributes do not become scrambled or stale.
- Added regression coverage for local contrast surfaces, radius governance, and safe phrase translation boundaries.

## 3.4.9 - 2026-06-12

- Fixed the Theme Lab shipped-lane gallery so light VibeTheme preview cards keep their own dark foreground tokens when the surrounding page is in dark mode.
- Scoped the preset contrast guard away from `[data-gds-local-contrast]` surfaces so intentional mixed-preview cards can own local readable text, controls, and code colors.
- Added release verification coverage for the local contrast marker used by the gallery cards.

## 3.4.8 - 2026-06-12

- Hardened the shared preset stylesheet so VibeTheme surfaces push readable foreground tokens through Mantine text, dimmed text, shell, card, paper, input, table, alert, code, link, and default-button surfaces.
- Fixed dark and dark-forward colorful lanes where nested Mantine components could keep light-mode text colors on dark or saturated backgrounds.
- Added theme-governance verification for preset contrast token coverage so future theme changes cannot silently drop the foreground contract.

## 3.4.7 - 2026-06-07

- Removed English-only route coverage from the official playground so every public route keeps all supported locales available instead of falling back to English.
- Added checked-in generated phrase resources and release verification for route, demo, pattern, and use-case copy that still comes from registry/demo data.
- Localized shared shell/reference labels including navigation section headings and reference link actions, and fixed direct localized URL initialization via `?locale=...`.

## 3.4.6 - 2026-06-07

- Fixed the package-owned theme explorer i18n resolver so incomplete locale resources no longer render mixed-language surfaces by merging partial translations with English fallback copy.
- Added regression coverage proving partial theme-explorer locale resources fall back to one complete language until the locale has full nested copy coverage.
- Aligned package, reference-app, and install metadata to the `3.4.6` patch release line.

## 3.4.5 - 2026-06-07

- Added strict consumer-admin migration enforcement with `approvedAdminPrimitives` and `strict.admin.local-wrapper` detection for product-local admin layout, form, action, card, breadcrumb, media, and field shims.
- Added package-native core exports for primitive/layout, typography role, sanctioned style utility, semantic chart, and icon-tone contracts so strict consumers have installable replacements for common local wrappers.
- Expanded the playground/reference site with Spanish full-copy route coverage and updated release/install guidance for the `3.4.5` package line.

## 3.4.4 - 2026-06-07

- Added the package-native operational telemetry contract with `GdsOperationalEvent`, `GdsEventPayloadPolicy`, `GdsTelemetryAdapter`, `emitGdsEvent`, `createGdsTelemetryAdapter`, event taxonomy, and UX failure reason registry.
- Added non-blocking adapter dispatch with emitted, adapter-unavailable, payload-rejected, sampled-out, sampling-disabled, and dropped states plus bounded retry and timeout behavior for analytics adapters.
- Expanded telemetry tests, API coverage, install guidance, API reference, user guide, and LLD documentation for privacy-safe payload rules, accessibility boundaries, rollback, and operational behavior.

## 3.4.3 - 2026-06-07

- Fixed mobile shell navigation so `DiscoveryShell` opens reliably from the hamburger and closes the mobile menu when a navigation item is selected, with `closeMobileNavigationOnItemSelect` available for rare controlled-menu opt-outs.
- Fixed inline mobile navigation in `DocsShell` and `PublicShell` so documentation and public flow menus collapse back to the hamburger/menu state after link or action activation.
- Added regression coverage for mobile navigation close-on-selection behavior across discovery and public shell contracts.

## 3.4.2 - 2026-06-06

- Moved reference-site localized route labels, app-shell copy, page copy, and theme-explorer copy out of React runtime components into dedicated i18n resource contracts.
- Added public locale metadata helpers in `@sovereignsquad/gds-theme`: `gdsLocaleMetadata`, `getGdsLocaleMetadata(...)`, `isGdsRtlLocale(...)`, and `getGdsLocaleIdsByScript(...)`.
- Updated `GdsProvider` and font-lane coverage to resolve RTL and script support from locale metadata instead of hardcoded language arrays.
- Replaced the locale coverage verifier so CI fails on component-local language dictionaries, `locale === ...` branches, localized route labels, and locale arrays outside approved i18n resource files.

## 3.4.1 - 2026-06-06

- Fixed the public reference site locale experience so the overview route no longer mixes English cards and links into Russian, Italian, Hebrew, Arabic, Hungarian, German, or French full-copy locales.
- Localized the shared site footer and primary navigation labels used by the full-copy routes.
- Added regression coverage to fail when Russian overview renders the English strings `Operational clarity`, `Public trust`, or `Browse patterns`.

## 3.4.0 - 2026-06-06

- Added issue-backed maturity capability contracts for the seven recommended high-value GDS delivery areas: admin delivery, runtime feedback, foundation surfaces, global readiness, adoption governance, theme operations, and product-system delivery.
- Added `getGdsMaturityCapabilities()`, `getGdsRecommendedMaturityCapabilities()`, `getGdsMaturityCapability(...)`, and `getGdsMaturitySummary()` to `@sovereignsquad/gds-core`.
- Added the localized `/maturity` GitHub Pages route so developers and product owners can inspect benefits, package lanes, primary contracts, UX states, accessibility, observability, rollback, testing, and operational behavior in every supported site language.
- Created the 3.4.0 GitHub project-board issue set using the issue #81 production-grade structure.
- Updated API, user-guide, CLI/LLD, install, compatibility, release, and README guidance to the `3.4.0` npm release line.

## 3.3.0 - 2026-06-06

- Added registry-backed `/api` documentation for published GDS package exports, including import paths, runtime lanes, state contracts, accessibility notes, and verification metadata.
- Added `/use-cases` as the product-owner adoption guide for matching product needs to package lanes, primary contracts, risk, accessibility obligations, and operational checks.
- Added `API_REFERENCE.md`, `USER_GUIDE.md`, and `CLI_AND_LLD.md` so GitHub readers can discover the same API, product, CLI, and low-level design contracts without relying only on the GitHub Pages UI.
- Added release gates for API documentation coverage, route localization coverage, package message parity, and native-dialog i18n copy enforcement.
- Fixed project-board audit issue-state pagination so the strict board audit reports all current open project items.

## 3.0.7 - 2026-06-06

- Added package-owned block layout cookbook APIs: `getGdsLayoutTemplates`, `getGdsLayoutTemplate`, and `GdsLayoutTemplatePreview`.
- Replaced the reference-site layout cookbook's app-local raw form controls with the GDS-owned preview component while preserving template selection, JSON editing, diagnostics, copy behavior, and rendered preview states.
- Added `npm run audit:dependencies` to the release gate, upgraded Vitest to `4.1.8`, moved the private Next reference fixture to dev-only scope, and documented the remaining upstream Next/PostCSS dev advisory in `DEPENDENCY_AUDIT.md`.

## 3.0.6 - 2026-06-06

- Added package-native admin CRUD primitives in `@sovereignsquad/gds-admin`: `AdminTextInput`, `AdminTextarea`, `AdminCheckbox`, `AdminSelect`, `AdminFileUpload`, `AdminFormSection`, `AdminFormStatus`, `AdminFormActions`, and `AdminCrudForm`.
- Added hardened admin data/resource surfaces: `AdminDataTable`, `AdminAnalyticsTable`, `AdminModal`, `AdminDetailDrawer`, `AdminReviewLayout`, `AdminResourceManager`, `AdminResourceGrid`, `AdminResourceCard`, `AdminResourceToolbar`, and `AdminResourceEmptyState`.
- Added core interaction/runtime contracts: `GdsConfirmProvider`, `useGdsConfirm`, `GdsToastProvider`, `useGdsToasts`, typed `GdsIcon`, `MediaPreviewCard`, `PublicCaptureFlow`, `PlaybackControls`, and creator theme validation/boundary utilities.
- Expanded `gds-compliance` strict mode to detect direct Mantine imports, direct Tabler imports, raw form controls/buttons, browser dialogs, raw table markup, inline styles, and undeclared local GDS adapters with exception-aware suppression.

## 3.0.5 - 2026-06-02

- Fixed the `cosmic` VibeTheme to behave as a dark-forward runtime lane so the Theme Lab and live preview no longer render washed-out light panels or low-contrast muted text.
- Tightened `cosmic` glass panels, inputs, badges, code blocks, and dimmed text treatment so the high-saturation multicolour background remains vivid while content stays readable.

## 3.0.4 - 2026-06-02

- Added `cosmic` as the first intentionally high-saturation CSS VibeTheme, with a multicolour blue-violet-cyan-magenta background, star-field atmosphere, glass panels, and vivid gradient primary controls.
- Documented `cosmic` as the sanctioned dramatic showcase lane so consumers do not need route-local image backgrounds or private gradient systems for bold launch/public surfaces.

## 3.0.3 - 2026-06-02

- Added package-owned CSS VibeThemes for the colorful preset line so `sunset`, `oceanic`, `forest`, `ruby`, `amber`, `neon-night`, `skyline`, `aurora`, `coral`, `mint`, `orchid`, and `royal` now expose full canvas, shell, surface, border, text, accent, glow, gradient, and hero tokens instead of only changing `primaryColor`.
- Extended `useGdsThemePresetState(...)` to apply `data-gds-theme-preset` plus `--gds-vibe-*` CSS variables on the document root, making whole-site theme switching persistent across direct links and route changes.
- Updated the GitHub Pages Theme Lab with a visual VibeTheme gallery and current-token proof section, and documented the no-image-background/no-local-theme-catalog governance rule.

## 3.0.0 - 2026-05-31

- Delivered the adoption-platform release with hardened install/bootstrap docs, reference-site governance, public feature-request intake, media/upload contracts, reporting/evidence/chart contracts, auth/access identity hardening, strict compliance expansion, and verified reference codemods.
- Added 3.0.0 release-readiness checks covering board scope, implementation evidence, release safety, client communication, and registry verification gates.
- Updated the publish runbook so major releases require strict board audit before and after version bump and may not be announced until npm publication is verified.

## 2.6.7 - 2026-05-31

- Cut and published the `2.6.7` npm release line so the widened docs/reference-shell layout is available through the public package line and not only on repository `main`.
- Updated `DocsPageShell` in `@sovereignsquad/gds-core` to use the full available page width for the official site and other reference/docs surfaces, removing the narrow article cap that was squeezing wide content such as the theme-governance explorer.
- Aligned the public site copy, install guidance, and versioned docs/routes to the `2.6.7` line.

## 2.6.5 - 2026-05-29

- Cut and published the `2.6.5` npm release line so consumers can update to the canonical theme-governance hardening through the public registry instead of relying on unpublished mainline changes.
- Deprecated consumer-facing `extendGdsTheme(...)` as a canonical adopter path and formalized the approved theme lanes around `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)`.
- Added manifest-scoped theme-governance enforcement fields plus `gds-compliance` detection for direct `extendGdsTheme(...)` usage and parallel local branding-layer theme construction in declared theme-ownership files.
- Aligned templates, reference consumers, install/governance docs, and theme guidance to the canonical adopter theme path so teams can copy a governed theme setup directly from GDS.

## 2.6.4 - 2026-05-28

- Deprecated consumer-facing `extendGdsTheme(...)` as a canonical adopter path and formalized the approved theme lanes around `gdsTheme`, the shipped public presets, and `createPublicBrandTheme(...)`.
- Added manifest-scoped theme-governance enforcement fields plus `gds-compliance` detection for direct `extendGdsTheme(...)` usage and parallel local branding-layer theme construction in declared theme-ownership files.
- Aligned templates, reference consumers, install/governance docs, and theme guidance to the canonical adopter theme path so teams can copy a governed theme setup directly from GDS.
- Added `ReferenceSection`, `ReferenceLinkGrid`, `ReferenceLocaleNotice`, and `ReferenceThemeExplorer` to `@sovereignsquad/gds-core` plus `ReferenceSiteShell` to `@sovereignsquad/gds-admin` so the official website can consume GDS-owned docs/reference primitives instead of site-local Mantine composition.
- Converted `apps/playground` onto the new reference-site primitives, replaced the remaining direct page-level Mantine composition in the public site source, and added a strict `gds-adoption.json` baseline for the website.
- Updated the public route structure, docs copy, and rulebooks so the GitHub Pages site is described as both the official GDS website and a strict live reference consumer rather than a separate playground exception.
- Added the registry-backed GitHub Pages pattern catalog under `/patterns` with dedicated family routes for foundations, public, operations, data, access, and feedback coverage.
- Expanded the public docs site to show live demos for the remaining workflow and responsive-guidance contracts that had previously been represented only as reference notes.
- Hardened the GitHub Pages playground with route-level lazy loading, deterministic vendor chunking, and contained shell previews so the public site behaves like a documentation site instead of a nested application demo.
- Added an interactive `/themes` explorer so adopters can switch among shipped theme presets, test light/dark behavior, inspect the bounded creator-authored theming lane, and compare theme lanes directly on the public site.
- Added a dedicated `/live-demos` hub so the public website separates official docs from runtime showcase sections more clearly.
- Strengthened `@sovereignsquad/gds-compliance` exception enforcement to fail stale exception scopes, uncovered local exception adapters, and incomplete creator-authored experience exception metadata.
- Updated theme governance, exception-surface, compliance, and adoption rulebooks to formalize the creator-authored experience contract and the new repo-to-manifest exception checks.
- Added `SocialAuthButtons` to `@sovereignsquad/gds-core` as the canonical provider-entry cluster for Google, Apple, GitHub, Microsoft, LinkedIn, Discord, X, Facebook, and email-shaped auth lanes.
- Added `ShareButtonGroup` to `@sovereignsquad/gds-core` as the canonical public sharing surface for native share, copy-link, email, message, and social-channel actions.
- Enhanced `AuthShell` to support governed social-auth placement and divider rhythm instead of consumer-local auth-provider layouts.
- Published the umbrella install path `@sovereignsquad/gds` as the preferred public npm entrypoint while keeping the granular runtime packages available for stricter dependency boundaries.
- Aligned release automation and public documentation so npm publication, GitHub Pages guidance, and release-bundle fallback distribution target the same live release line.

## 2.6.3 - 2026-05-27

- Added `showGdsNotification(...)` to `@sovereignsquad/gds-theme/client` as the canonical semantic notification helper for consumers already governed by the shared provider stack.
- Enhanced `AuthShell` with `headerActions` so products can place theme toggles or other small auth-entry controls without rebuilding the shell locally.
- Enhanced `PageHeader` to accept `subtitle` as an alias for `description`, reducing consumer-only adapter code.
- Hardened `SemanticButton` to use the label-first prerender path by default, removing the need for client repos to carry their own hydration-safe semantic-button wrappers.

## 2.6.2 - 2026-05-27

- Expanded shared Mantine peer support to include `^9.0.0` across the runtime packages and verified fresh packed-consumer installs against Mantine `9.2.1`, React `19.2.0`, and Next `15.5.18`.
- Added `npm run verify:mantine` as the canonical compatibility command and broadened the smoke harness to cover both Mantine `8.3.6` and `9.2.1` in isolated clean installs.
- Added root optional native bindings for supported macOS and Linux x64 environments so fresh local `npm install` runs provision the Vite/tsup native layer more reliably.
- Updated README, compatibility guidance, migration guidance, release runbook, and consumer-install proof docs to reflect the Mantine 9 support line and the current temporary release-asset install path.
- Added `ChoiceChip` to `@sovereignsquad/gds-core` as the canonical neutral chip for lightweight filter, scope, taxonomy, and mode selection without page-local badge wrappers.
- Added `getSemanticActionLabel(...)` to `@sovereignsquad/gds-core` as a server-safe semantic-label helper for SSR/static fallback rendering without exposing raw vocabulary access as the only consumer path.
- Recorded the current Narimato reference-consumer audit and updated the Narimato project note to reflect direct npm package consumption plus its intentionally local exceptions.

## 2.6.1 - 2026-05-26

- Renamed the public package line from the unpublished placeholder `@gds/*` scope to the real npm organization scope `@sovereignsquad/gds-*`.
- Updated package metadata, workspace wiring, reference consumers, compliance manifests, docs, and release scripts to consume the `@sovereignsquad/gds-*` package family consistently.
- Fixed release-environment dependency gaps (`@floating-ui/core`, `@humanfs/core`, and `@babel/core`) so local and CI release verification run cleanly on the current toolchain.
- Updated the packed Mantine 8 compatibility harness to install the renamed tarballs correctly and verified the `@sovereignsquad/gds-*` line against Mantine `8.3.6`, React `19.2.0`, and Next `15.5.18`.
- Clarified npm as the canonical future registry source and documented public GitHub release assets as the approved temporary install path while npm publication remains unavailable.
- Added `npm run pack:release`, release-bundle checksums/manifests, and the `GDS Release Bundles` GitHub Actions workflow.
- Added `VERIFIED_CONSUMER_INSTALL_PROOF.md` to make the current Next 15 / React 19 / Mantine 8 install evidence explicit for adopter teams.

## 2.6.0 - 2026-05-26

- Added `SectionPanel` and `ConsumerDashboardGrid` to `@sovereignsquad/gds-core` as the canonical operational panel rhythm and consumer dashboard layout scaffolds.
- Hardened shared operational contracts in `@sovereignsquad/gds-admin`: `AppShell` now supports primary/secondary/account navigation regions and header context, `PageHeader` now supports subtitle/status/overflow actions, `ResponsiveDataView` now supports active filter chips plus mobile filter surfaces, and `EditorScaffold` / `ContentOpsEditor` now support context and sticky footer action regions.
- Enhanced `@sovereignsquad/gds-core` `BrowseSurface`, `EditorialCard`, `FilterDrawer`, and `MediaField` to reduce remaining local public/gds-admin overrides.
- Added `createPublicBrandTheme()` to `@sovereignsquad/gds-theme` and formalized the branded public theme merge path.
- Widened shared Mantine peer ranges to include `8.3.x` and added `npm run verify:mantine8` as a packed-consumer compatibility smoke for Mantine 8.3.6 + React 19.2.0 + Next 15.5.18.
- Documented the canonical searchable-selection decision: use governed Mantine recipe composition rather than a new shared wrapper until a stronger repeated contract emerges.

## 2.5.1 - 2026-05-25

- Expanded `@sovereignsquad/gds-compliance` with configurable banned imports plus default stale-SSOT reference detection so consumer repos can catch lingering legacy UI dependencies and outdated documentation paths through shared tooling.
- Added [COMPLIANCE_TOOLKIT.md](COMPLIANCE_TOOLKIT.md) as the canonical CI and local enforcement contract for `@sovereignsquad/gds-eslint-config` and `@sovereignsquad/gds-compliance`.
- Updated template and adoption artifacts to use the canonical repository path and the current machine-readable manifest contract.

## 2.5.0 - 2026-05-25

- Added new cross-project public and consumer contracts in `@sovereignsquad/gds-core`: `BrowseSurface`, `EditorialCard`, `ConsumerSection`, and `MediaField`.
- Added new content-operations contracts in `@sovereignsquad/gds-admin`: `ContentOpsEditor`, `ContentOpsSection`, and `ContentOpsActionBar`.
- Added `gdsEditorialPublicTheme` to `@sovereignsquad/gds-theme` as the approved serif-forward, flatter editorial preset.
- Added `ADOPTION_AND_MIGRATION_PLAYBOOK.md` plus manifest-driven compliance settings for documentation paths, stale-reference detection, and protected surface declarations.
- Updated the Next.js and Vite reference consumers plus shared component tests to exercise the new browse, consumer, media, and content-operations contracts.

## 2.4.4 - 2026-05-25

- Enhanced `PublicShell` with canonical header variants, class-name hooks, and server-safe mobile navigation modes so public consumers can stop shipping repo-local spacing and nav overrides.
- Enhanced `PublicBrandFooter` with documented layout variants and slot-level class hooks for narrative, media, quote, and legal regions.
- Enhanced `PublicProductCard` with localized state-label overrides plus pickup and inventory helper-note support for menu, discovery, and retail-like public surfaces.
- Updated the Vite and Next.js reference consumers plus shared component tests to exercise the new public-surface contracts end to end.

## 2.4.3 - 2026-05-25

- Added `AccentPanel` as the canonical light/dark-safe accent surface contract for public and operator-facing emphasis panels.
- Added `EditorialHero`, `FeatureBand`, and `PublicBrandFooter` to `@sovereignsquad/gds-core` for shared public/editorial composition without repo-local layout authority.
- Hardened release verification with export-contract checks that fail on missing published export targets or server entrypoints that drift into client-only modules.
- Updated the Next.js and Vite reference consumers to exercise the new public/editorial primitives and the server-safe import path.
- Added an authenticated publish runbook and shared `publish:dry-run` / `publish:npm` scripts for the five public GDS packages.
- Added `verify:published` plus a manual GitHub Actions publish workflow so authenticated CI can publish and verify registry availability with bounded retry behavior.

## 2.4.2 - 2026-05-25

- Added `@sovereignsquad/gds-core` `PublicProductCard` for media-first public menu, catalog, and offer surfaces with price/state/action hierarchy.
- Added `es` locale support plus canonical `GdsLocale` and `getGdsMessages(locale)` exports for host-i18n bridges.
- Extended shared lint/gds-compliance tooling to support manifest-driven approved dependency/import exceptions such as `lucide-react`.
- Updated compatibility, governance, and Pesti Est adoption docs for registry-first CI usage and locale/exception guidance.

## 2.4.1 - 2026-05-25

- Added `@sovereignsquad/gds-core` `AccessRecoveryPanel` as the canonical protected-content, expired-session, and recoverable failure surface.
- Updated component contracts to treat access recovery as a first-class shared pattern family.
- Resolved the learner-shell evaluation by documenting that LMS learner shells remain local adapters until broader portfolio reuse is proven.
- Updated Amanoba guidance to consume shared access recovery now while keeping learner shell, course cards, and gamification list cards local for now.

## 2.3.2 - 2026-05-25

- Added `@sovereignsquad/gds-core` `GameBoardTile` for memory-match and flip/select game boards (reduced-motion aware).
- Added `docs/AMANOBA_BLOCKING_CONTRACTS.md` scaffolds for remaining Amanoba-only surfaces (LearnerAppShell, course cards, recovery panel).
- Refreshed `GDS_GAP_INVENTORY.md` §2B to reflect 2.3.0–2.3.1 shipped package surfaces.
- Added Amanoba dark-shell + yellow CTA `extendGdsTheme` recipe appendix to `THEME_GOVERNANCE.md`.

## 2.4.0 - 2026-05-25

- Added `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` as machine-readable compatibility and adoption contracts.
- Added `@sovereignsquad/gds-eslint-config` and `@sovereignsquad/gds-compliance` to provide shared lint and compliance enforcement for adopting repositories.
- Added new public composition primitives in `@sovereignsquad/gds-core`: `PublicNav`, `PublicSiteFooter`, `DocsPageShell`, `DocsCodeBlock`, `CtaButtonGroup`, `PlaceholderPanel`, `SimpleDataTable`, and `StatsSection`.
- Expanded `@sovereignsquad/gds-theme` with `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, and root-provider theme/default color-scheme overrides.
- Added reference consumer fixtures under `apps/reference-vite` and `apps/reference-next`, plus `npm run verify:references` for fixture and manifest validation.
- Added `DEPRECATIONS_AND_MIGRATIONS.md` to formalize contract retirement, migration guidance, and release handover expectations.

## 2.3.1 - 2026-05-25

- Changed `@sovereignsquad/gds-core` `PageHeader` eyebrow styling to a neutral default, removing forced uppercase and decorative tracking from the canonical contract.
- Added opt-in `eyebrowVariant="ornamental"` for products that explicitly want decorative eyebrow styling.
- Removed forced hover motion and transform transitions from the canonical `@sovereignsquad/gds-theme` base theme.
- Added `withGdsMotion()` as an explicit opt-in theme helper for products that want shared motion styling.
- Expanded `COMPATIBILITY_AND_RELEASES.md` with an explicit Next.js App Router consumer path for `server` and `client` package entrypoints.

## 2.3.0 - 2026-05-24

- Added publish-ready package metadata and explicit `client` / `server` subpath exports for `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`.
- Added `COMPATIBILITY_AND_RELEASES.md` to define the active Mantine/React/Next consumption contract, install guidance, and version-alignment rules.
- Added new shared package primitives and scaffolds for `MetricCard`, `ProgressCard`, `ProductCard`, `StateBlock`, `DataToolbar`, `PublicShell`, `AuthShell`, `ArticleShell`, `UploadDropzone`, `MediaCard`, `AccessSummary`, `ResponsiveDataView`, `WorkspaceHeader`, and `EditorScaffold`.
- Expanded admin primitives to support mobile footer navigation, richer page-header action slots, and shared empty-state handling in tables.
- Added release-alignment verification via `npm run verify:release` and a shared pull-request checklist template.
- Added `THEME_GOVERNANCE.md` and `EXCEPTION_SURFACES.md` to cover provider-brand, white-label, tenant-theme, chart, map, embed, and other approved exception surfaces.
- Added portfolio onboarding plans for Impact, Camera, and Pesti Est plus matrix rows reflecting their current GDS adoption pressure.

## 2.2.2 - 2026-05-24

- Updated `@sovereignsquad/gds-theme` `GdsProvider` to include Mantine modals and notifications so the shared provider matches the documented root composition contract.
- Added shared package i18n coverage for theme-toggle labels, empty-data messaging, and semantic error feedback.
- Added a shared Vitest + jsdom test harness plus behavior coverage for `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-core`, and `@sovereignsquad/gds-admin`.
- Added root test commands and pull-request quality gates for build, lint, and tests.

## 2.2.1 - 2026-05-23

- Added `PROJECTS/NARIMATO.md` for Narimato (Mantine-rooted, enforcement phase).
- Updated `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` Narimato row from discovery to enforcement.
- Fixed `@sovereignsquad/gds-core` `ConfirmDialog` confirm button color: `brand` → `violet` (valid Mantine palette).

## 2.2.0 - 2026-05-23

- Added `SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md` to define the GDS as a reliable, cross-project service with authority, pattern, adoption, validation, portfolio, and lifecycle layers.
- Added `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md` to classify projects by foundation signals, migration archetypes, risk, and recommended next actions.
- Added `PROJECTS/MESSMASS_MANTINE_REFACTOR.md` to address the highest known authority-conflict project in the portfolio.
- Expanded `PATTERN_SERVICE_MODEL.md` with required service outputs, contract maturity states, compatibility promises, and portfolio usage guidance.
- Expanded `GOVERNANCE_AND_ADOPTION.md` with authority-conflict handling, adapter-inventory checks, portfolio operations, and normalized remediation categories.

## 2.1.0 - 2026-05-23

- Added `PATTERN_SERVICE_MODEL.md` as the cross-project operating model for borrowing Mantine UI ideas and promoting them into governed GDS contracts.
- Defined mandatory reusable pattern families for shells, page headers, product cards, metrics, data toolbars, responsive data views, auth shells, article/docs shells, and state blocks.
- Added cross-project recommendations for Amanoba, KIDEX, ClassScout, and SSO so each project has a concrete Mantine-only pattern-service implementation path.
- Updated foundation, component, governance, and README guidance to prohibit page-local reinvention of reusable patterns and to require local adapter paths for shared contracts.

## 2.0.0 - 2026-05-22

- **Massive Consolidation & Hardening:** Refactored the sprawling 17-file structure into 3 hardened, professional rulebooks (`FOUNDATION.md`, `COMPONENTS_AND_PATTERNS.md`, and `GOVERNANCE_AND_ADOPTION.md`).
- Eliminated all outdated, duplicated, and inconsistent language.
- Enforced a strictly professional, prescriptive tone for all Mantine, UX, and Token boundaries.

## 1.3.3 - 2026-05-22

- Added the normative color-mode and readability contract for dark mode, light mode, contrast, mixed-mode exceptions, and Mantine theme responsibilities.
- Updated foundation and runtime guidance to make human readability and active-mode consistency release gates.

## 1.3.2 - 2026-05-21

- Updated the Amanoba migration plan from planned to in-progress.
- Recorded completed Amanoba Phase 0/1 runtime work, active Mantine guardrails, and the current course-surface migration snapshot.
- Added remaining Amanoba high-priority gaps for lesson runtime, quiz runtime, final exam, auth, dashboard, saved lessons, practice hub, admin/editor forms, and deletion-phase legacy dependencies.

## 1.3.1 - 2026-05-21

- Updated the SSO migration plan to mark admin-shell migration and legacy theme-stack removal as completed.
- Clarified the SSO path toward the remaining docs/editorial migration and final deletion pass.

## 1.3.0 - 2026-05-21

- Added a primitive policy matrix for direct-versus-wrapper decisions.
- Added implementation tables for variants, sizes, breakpoints, shell switches, and responsive behavior.
- Added enforcement guidance for lint rules, import boundaries, and drift checks.
- Added reusable starter templates for providers, theme, shell, page header, and button wrappers.
- Updated runtime, readiness, and README guidance to point directly to the new implementation assets.

## 1.2.3 - 2026-05-21

- Promoted implementation-readiness checks into the required reading order.

## 1.2.2 - 2026-05-21

- Added root provider/gds-theme implementation notes to the required project-adoption contract.

## 1.2.1 - 2026-05-21

- Added component contracts for date/time inputs, file uploads, loaders/skeletons, tooltips, breadcrumbs, and pagination.
- Expanded migration deliverables with provider/gds-theme implementation notes plus validation and deletion checklist expectations.

## 1.2.0 - 2026-05-21

- Tightened the SSOT from “Mantine preferred/first” language to an explicit Mantine-only product primitive policy.
- Clarified that no new product UI may bypass Mantine with ad hoc primitives or alternate component frameworks.
- Updated migration, governance, adoption, and KIDEX adapter language to reflect the stricter policy.
- Added `MANTINE_RUNTIME.md` to define provider, theme, notifications, modals, wrapper, CSS, form, overlay, and data-display runtime requirements.

## 1.1.0 - 2026-05-21

- Expanded the SSOT into a stricter multi-project policy repository.
- Added Mantine platform policy and navigation/responsive rules to the required reading order.
- Tightened component, foundation, UX, governance, and project-adoption contracts for cross-project enforcement.
- Clarified that product repositories may document only adapters, exceptions, migration state, and validation commands.
- Added repository hygiene rules for shared Git usage across consuming projects.
- Added implementation-readiness requirements so projects document root provider, theme ownership, primitive policy, legacy boundaries, responsive strategy, and drift controls before the first Mantine PR.
- Expanded the SSO project plan with local-adapter requirements, phase exit criteria, validation commands, and initial implementation sequence.

## 1.0.0 - 2026-05-21

- Established `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` as the cross-project design, UI, and UX SSOT.
- Added normative foundation rules for theme ownership, tokens, layout, accessibility, responsiveness, and internationalization.
- Added strict component contracts for buttons, icon buttons, inputs, forms, cards, modals, drawers, tables, navigation, alerts, notifications, empty states, loaders, errors, and pagination.
- Added UX rules for app shells, dashboards, learner flows, admin/editor flows, destructive actions, authentication, search, filters, responsive behavior, and content tone.
- Added governance rules for adoption, project adapters, exceptions, review, migration order, and definition of done.
- Added the project adoption contract that each project must reference in its local documentation.
- Added a true-refactor Mantine migration playbook for legacy projects.
- Added project-specific migration planning under `PROJECTS/`, including the initial SSO refactor plan.
- Added contributing guidance for operating this directory as a shared standalone git repository.
