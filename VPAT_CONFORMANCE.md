# Accessibility Conformance Report (VPAT® 2.5) — General Design System

Status: Active SSOT
Version: 4.0.0
Last updated: 2026-07-26

**Name of Product/Version:** General Design System (GDS) — `@sovereignsquad/gds` and the granular `@sovereignsquad/gds-*` packages, release line `4.0.0`
**Report Date:** 2026-07-25
**Product Description:** A governed React + Mantine component and pattern library (theme, core components, admin scaffolds, accessibility CI helpers) consumed by product teams to build accessible application and public-site UIs.
**Contact Information:** file an accessibility issue or question through the repository's feature/intake channel — the [`request-feature`](https://sovereignsquad.github.io/general-design-system/request-feature) route or the [GitHub issue board](PROJECT_BOARD.md).
**Evaluation Methods Used:** First-party self-assessment generated from the repository's automated accessibility evidence and CI gates (see [Evaluation methods](#evaluation-methods)). This is a self-assessment, not a third-party audit.

**Target standard:** **WCAG 2.2, Level AA** (the single, prominent, versioned target for GDS). This report covers WCAG 2.2 Level A and Level AA success criteria. Level AAA criteria are out of scope for the stated target and are not tabled here.

> **This is a component library, not a finished website or application.** GDS ships accessible building blocks and enforces component-level behavior in CI, but many WCAG success criteria are satisfied only by the *finished product a consumer assembles* — page structure, real content, alternative text, media alternatives, navigation across pages, and authentication flows are the consuming application's responsibility. Every row below is scored with an explicit **Provider (GDS) / Consumer** split so a procurement reviewer can see exactly which half GDS guarantees. A consumer's own ACR should build on this one, not replace it.

## Conformance level terms

Per the VPAT 2.x / ITI convention:

- **Supports** — the functionality is accessible for the parts GDS controls, substantiated by the cited evidence.
- **Partially Supports** — GDS provides the accessible mechanism, but full conformance also depends on how the consumer uses it (content, composition, or app-level context), or a bounded known limitation applies.
- **Does Not Support** — the majority of the criterion is not met by GDS-owned code.
- **Not Applicable** — the criterion does not apply to a component library in isolation (e.g., whole-page or site-navigation criteria), or GDS ships no component in that category.
- **Not Evaluated** — GDS does not yet systematically verify this criterion; no conformance is claimed here. (Level AAA is simply omitted rather than tabled.)

We deliberately prefer **Partially Supports** / **Not Evaluated** over an optimistic **Supports** wherever the evidence is not first-party and automated. Overclaiming conformance is treated as a defect.

## Evaluation methods

Conformance claims are grounded in first-party, re-runnable repository evidence, not prose assertion:

- **Accessibility evidence registry** — [`ACCESSIBILITY_EVIDENCE.md`](ACCESSIBILITY_EVIDENCE.md) and `apps/playground/src/accessibility-evidence-registry.ts`, validated by `npm run verify:accessibility-evidence`. Every stable pattern publishes keyboard behavior, visible-focus behavior, screen-reader semantics/announcements, WCAG mappings (mandatory baseline `1.3.1`, `1.4.3`, `2.1.1`, `2.4.7`, `4.1.2`), an assistive-technology/browser status matrix, known limitations, and recovery guidance. The gate fails the release if any stable pattern is missing a record, a required field, a required WCAG mapping, an AT/browser row, or a limitation without an owner and recovery path.
- **Contrast gate** — `scripts/verify-theme-accessibility.mjs` (`npm run verify:theme-accessibility`) scores contrast across all shipped themes at release time.
- **Forced-colors runtime gate** — `scripts/verify-forced-colors-runtime.mjs` (`npm run verify:forced-colors-runtime`) drives a real headless-Chrome session with `forced-colors: active` emulated, across the pattern-catalog routes and 8 theme presets, asserting governed surfaces drop decorative backgrounds, controls keep platform-backed colors, focus outlines stay visible, and no horizontal overflow occurs.
- **Input-zoom guard** — `scripts/verify-input-zoom-guard-runtime.mjs` asserts focused text controls compute to ≥ 16px so mobile browsers do not force-zoom (supports Resize Text).
- **Kanban drag accessibility gate** — `scripts/verify-kanban-drag-accessibility-runtime.mjs` asserts the opt-in pointer/keyboard drag never removes the keyboard-and-screen-reader "Move to column" menu, and that the drag handle is itself a labeled, keyboard-focusable control (no native HTML5 drag).
- **Consumer a11y CI package** — `@sovereignsquad/gds-a11y` ([`A11Y_CI_PACKAGE.md`](A11Y_CI_PACKAGE.md)) exposes axe scans, keyboard tab-order assertions, focus-trap assertions, and a contrast gate for the consumer's own routes, with a metadata-only suppression policy that refuses to hide expired suppressions or a missing GDS primitive.
- **Assistive-technology coverage** — the registry tracks shipped evidence against VoiceOver + Safari (iOS, macOS) and NVDA + Chrome/Firefox (Windows).

Re-run the full evidence chain with `npm run verify:accessibility-evidence && npm run verify:release`.

## WCAG 2.2 — Level A

| Success Criterion | Conformance level | Remarks (Provider = GDS / Consumer split) |
|---|---|---|
| **1.1.1** Non-text Content | Partially Supports | GDS icon and control APIs require accessible names (e.g. `GdsIcon` accessibility defaults, `aria-label` on governed controls, the checkbox-group `aria-label`); the **consumer supplies the actual text alternatives** for their images/media. Provider: labeled slots + defaults. Consumer: content. |
| **1.2.1–1.2.3** Audio/Video (prerecorded) alternatives | Not Applicable | GDS ships no media player that owns captions/transcripts/audio description. `PlaybackSurface` is a containment shell; the consumer supplies the media element and its alternatives. |
| **1.3.1** Info and Relationships | Supports | Mandatory registry mapping for every stable pattern; governed components use semantic HTML / documented roles (fieldset+legend for checkbox-group, `aria-expanded`/`aria-controls` for the Kanban collapse toggle, form label/description associations). Evidence: `accessibility-evidence-registry.ts`, `verify:accessibility-evidence`. |
| **1.3.2** Meaningful Sequence | Partially Supports | Governed shells and patterns keep a deterministic DOM/tab order (per-family keyboard evidence); overall reading order of assembled pages is the consumer's composition. |
| **1.3.3** Sensory Characteristics | Partially Supports | GDS state is exposed via text/semantics, not shape/position alone; consumer copy must avoid sensory-only instructions. |
| **1.4.1** Use of Color | Supports | State is never color-only in governed components (evidence: per-family focus/SR records; forced-colors runtime gate verifies controls remain distinguishable without color). |
| **1.4.2** Audio Control | Not Applicable | No GDS component auto-plays audio. |
| **2.1.1** Keyboard | Supports | Mandatory registry mapping; the Kanban drag gate proves the keyboard "Move to column" menu is never removed by the opt-in drag. Evidence: `verify:kanban-drag-accessibility-runtime`, per-family keyboard records. |
| **2.1.2** No Keyboard Trap | Supports | Overlay/modal/drawer focus is intentionally bounded but escapable (Escape closes governed transient surfaces); the `expectGdsFocusTrap` helper verifies bounded-but-not-trapped behavior in consumer CI. Evidence: `A11Y_CI_PACKAGE.md`, feedback-family records. |
| **2.1.4** Character Key Shortcuts | Not Applicable | GDS defines no single-character key shortcuts; documented shortcuts are standard navigation keys. |
| **2.2.1 / 2.2.2** Timing / Pause-Stop-Hide | Partially Supports | GDS ships no time-limited content; motion honors `prefers-reduced-motion` (motion tokens collapse to 0ms). Any consumer-introduced timing is the consumer's responsibility. |
| **2.3.1** Three Flashes | Supports | No GDS component flashes; motion presets are subtle and reduced-motion-aware. |
| **2.4.1** Bypass Blocks | Partially Supports | Governed shells expose landmark structure; a page-level skip link is the consumer's app-shell responsibility. |
| **2.4.2** Page Titled | Not Applicable | Page `<title>` is owned by the consumer application/route, not the component library. |
| **2.4.3** Focus Order | Supports | Deterministic focus order per family; `expectGdsTabOrder` verifies expected keyboard stops in order in consumer CI. Evidence: keyboard records, `A11Y_CI_PACKAGE.md`. |
| **2.4.4** Link Purpose (In Context) | Partially Supports | Link/action primitives preserve link semantics and accessible names; the consumer supplies meaningful link text. |
| **2.5.1** Pointer Gestures | Supports | No governed interaction requires a multipoint or path-based gesture; the Kanban drag always has a single-pointer menu equivalent. |
| **2.5.2** Pointer Cancellation | Supports | Governed controls activate on up-event via native button/link semantics. |
| **2.5.3** Label in Name | Partially Supports | Governed controls keep the visible label within the accessible name; consumer-authored labels must follow suit. |
| **2.5.4** Motion Actuation | Not Applicable | No GDS function is triggered by device motion. |
| **3.1.1** Language of Page | Not Applicable | The document `lang` is set by the consumer application. GDS provides the 12-locale message + RTL direction utilities the consumer wires to it. |
| **3.2.1 / 3.2.2** On Focus / On Input | Supports | Governed controls do not trigger unexpected context changes on focus or input; form orchestration is explicit-submit. |
| **3.3.1** Error Identification | Supports | `GdsSchemaForm` / form orchestration surface validation errors in text, associated to fields, with localized messages across 12 locales; the validation summary and `ValidatedFieldMessage` expose errors programmatically. |
| **3.3.2** Labels or Instructions | Partially Supports | Governed form fields require labels (FormField), expose descriptions, and mark required fields; the consumer supplies the label/instruction copy. |
| **3.2.6** Consistent Help (WCAG 2.2) | Not Applicable | Placement of a help mechanism is a page/site decision owned by the consumer. |
| **3.3.7** Redundant Entry (WCAG 2.2) | Partially Supports | Form orchestration supports draft/restore and controlled values so previously-entered data can be reused; the consumer wires persistence. |
| **4.1.2** Name, Role, Value | Supports | Mandatory registry mapping; governed components expose name/role/value via semantic HTML or documented roles and keep state (expanded/selected/invalid) programmatically determinable. Evidence: `accessibility-evidence-registry.ts`. |

*(WCAG 2.2 removed 4.1.1 Parsing; it is intentionally omitted.)*

## WCAG 2.2 — Level AA

| Success Criterion | Conformance level | Remarks (Provider = GDS / Consumer split) |
|---|---|---|
| **1.2.4 / 1.2.5** Captions (live) / Audio Description | Not Applicable | No GDS media player owns captions/audio description; the consumer supplies media and alternatives. |
| **1.3.4** Orientation | Supports | Governed responsive layouts (and the Kanban orientation hook) work in both portrait and landscape; nothing locks orientation. |
| **1.3.5** Identify Input Purpose | Partially Supports | Schema-form field types map to appropriate input types/formats; the consumer sets `autocomplete` purposes for personal-data fields. |
| **1.4.3** Contrast (Minimum) | Supports | Mandatory registry mapping **and** two release-blocking contrast gates across all shipped themes: `verify:theme-accessibility` (role-pair contrast) and `verify:token-contrast-scoring` (per-token-pair WCAG 4.5:1 scoring of the readable-text pairs — body and meta text over card/page — computed from the actual token values, #456). Provider: governed token pairs. Consumer: contrast of their own brand tokens (self-checkable via the `gds-a11y` contrast gate). |
| **1.4.4** Resize Text | Supports | The input-zoom guard asserts focused text controls compute to ≥ 16px (no mobile force-zoom); governed type scales use relative units. Evidence: `verify:input-zoom-guard-runtime` (WCAG 1.4.4). |
| **1.4.5** Images of Text | Supports | GDS renders text as text; no governed component uses images of text. |
| **1.4.10** Reflow | Supports | Governed layouts reflow to a single column without horizontal scrolling; the forced-colors runtime gate additionally asserts no horizontal page overflow. Evidence: `PWA_VIEWPORT_POLICY.md` (WCAG 1.4.10), `verify:forced-colors-runtime`. |
| **1.4.11** Non-text Contrast | Supports | Control borders, focus indicators, and UI-component boundaries are contrast- and forced-colors-verified. Evidence: `verify:theme-accessibility`, `verify:forced-colors-runtime`. |
| **1.4.12** Text Spacing | Partially Supports | Governed typography uses relative units and does not clip at increased spacing in tested cases; not yet asserted by a dedicated gate (see [Known limitations](#known-limitations)). |
| **1.4.13** Content on Hover or Focus | Supports | Governed hover/focus surfaces (popovers, tooltips, menus) are dismissible, hoverable, and persistent; overlay close policy is governed. |
| **2.4.5** Multiple Ways | Not Applicable | Providing multiple ways to locate a page is a site-level concern owned by the consumer. |
| **2.4.6** Headings and Labels | Partially Supports | Governed section/heading and label primitives produce descriptive structure; the consumer supplies the heading/label text. |
| **2.4.7** Focus Visible | Supports | Mandatory registry mapping; visible focus is preserved in light, dark, **and** forced-colors modes (the forced-colors gate asserts a visible focus outline). Evidence: `verify:forced-colors-runtime`, focus records. |
| **2.4.11** Focus Not Obscured (Minimum) (WCAG 2.2) | Partially Supports | Governed sticky headers/footers and overlays are designed not to hide the focused control; not yet asserted by a dedicated gate across all sticky compositions. |
| **2.5.7** Dragging Movements (WCAG 2.2) | Supports | The only governed drag interaction (Kanban `enableDrag`) always ships a single-pointer, keyboard-accessible "Move to column" menu equivalent, verified to never be removed. Evidence: `verify:kanban-drag-accessibility-runtime`. |
| **2.5.8** Target Size (Minimum) (WCAG 2.2) | Partially Supports | Governed control sizing targets adequate hit areas; a dedicated ≥ 24×24px target-size gate is not yet in the release chain (tracked). |
| **3.1.2** Language of Parts | Partially Supports | The i18n runtime provides per-locale message packs and `GdsDirectionBoundary`/RTL utilities so the consumer can mark language of parts; wiring `lang` on mixed-language content is the consumer's. |
| **3.2.3 / 3.2.4** Consistent Navigation / Identification | Partially Supports | Governed navigation and semantic-action vocabulary drive consistent identification of the same action across surfaces; page-to-page consistency is the consumer's composition. |
| **3.3.3** Error Suggestion | Supports | Form validation messages are specific and localized (e.g. required, min/max rows, selection-required), not generic failure text. |
| **3.3.4** Error Prevention (legal/financial) | Partially Supports | The confirmation service provides typed destructive/consequential-action confirmation with review and undo windows; the consumer applies it to their legal/financial actions. |
| **3.3.8** Accessible Authentication (Minimum) (WCAG 2.2) | Partially Supports | GDS auth/access primitives (`AuthShell`, `GdsAccessGate`, social-auth buttons) impose no cognitive-function test of their own; the consumer's chosen auth method determines conformance. |
| **4.1.3** Status Messages | Supports | Governed status messaging uses `aria-live` regions without moving focus — e.g. the schema-form `repeatable` row-count announcement (test-asserted) and the notification center's announcement policy. Evidence: `core.test.tsx`, notification-center docs. |

## Known limitations

Carried verbatim from the accessibility-evidence registry (limitations must stay visible, with an owner and recovery path — never hidden behind "supported by browser defaults"):

- **Embed / third-party iframe surfaces** — the GDS containment shell (e.g. `MapPanel`) is verified, but third-party iframe internals remain vendor-owned and require consumer-provided fallback text. Recovery: use the governed fallback and a metadata-tracked suppression with an expiry.
- **Searchable selection (recipe lane)** — keyboard and naming are governed, but a temporary recipe-backed lane still awaits a promoted first-class GDS export.
- **Not yet gate-asserted (scored Partially Supports above):** Text Spacing (1.4.12), Focus Not Obscured (2.4.11), and Target Size (2.5.8) rely on design conventions rather than a dedicated release gate.
- **Contrast scoring coverage:** `verify:token-contrast-scoring` (#456) numerically scores the readable-text fg/bg pairs (body/meta text over card/page) from the actual token values across all 23 themes — **184 pairs, all hard-gated at WCAG AA 4.5:1**. The meta-text-on-page pairs that previously sat marginally below 4.5:1 (4.26–4.48) in eight expressive light lanes were nudged darker and the pair promoted from advisory to hard-gated (#460), so the advisory tier is now empty. One scoped note remains: the runtime-CSS base presets (`default`/`dark-public`/`flat-surface`/`editorial`, painted via Mantine `light-dark()`/`color-mix()`) are scored from their token-graph proxy statically, with their as-painted contrast additionally covered by the forced-colors runtime gate — true runtime scoring of those lanes is a further enhancement.

## Refresh path

This report is regenerated per release from the evidence that already gates every release:

1. Bump the `Version:` header and `Report Date` to the release being cut.
2. Re-run `npm run verify:accessibility-evidence && npm run verify:release`; every "Supports" row above corresponds to a gate in that chain.
3. Reconcile any new stable pattern's WCAG mappings and any newly-added or newly-resolved known limitation from the registry.
4. Move a "Partially Supports / Not Evaluated" row to "Supports" only when a first-party gate substantiates it — not on prose alone.

Legal disclaimer: this is a good-faith first-party self-assessment of the GDS component library against WCAG 2.2 Level AA, provided to help consumers assemble their own product-level conformance report. It is not a warranty and does not certify the conformance of any finished product built with GDS.
