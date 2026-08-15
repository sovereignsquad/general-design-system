# Design Handoff Template

Status: Governed template (issue 539)
Use with: `CONTRIBUTING.md` "Importing an externally-designed theme", `THEME_GOVERNANCE.md`
"Importing an externally-produced design"

This is the structure GDS holds every design intake to. It is codified from a real handoff
that worked — `brand-requests/class-usa/ClassScout-v2-Handoff-Overview.md` — and every
micro-example below is quoted from it, not invented. Fill every section; where a section
genuinely does not apply, say so and say why, rather than deleting it. A handoff that pairs
each rule with its rationale can be implemented without a meeting; one that ships only values
has to be reverse-engineered, and reverse-engineering is where designs get silently changed.

The one-line test for the whole document: **an implementer who follows it never has to
guess.** Whatever they would have to guess belongs in §12.

---

## 1. Overview

*What the product is, who uses it, and what this handoff covers, in a paragraph. Name the
canonical files and what each one is.*

## 2. Fidelity and scope

*State what is binding and what is indicative — per category, not as a blanket. Warn against
lifting markup or measurements verbatim.*

> **Micro-example (ClassScout):** "High fidelity. Colours, type, spacing, radii and states are
> final and should be reproduced exactly. Layout proportions are indicative — recompose them
> with the codebase's own grid and shell contracts rather than copying measurements."

## 3. Standing build constraints

*Name what will FAIL THE BUILD if ignored, before the implementer hits it: raw design values
outside the theme path, a missing `alt`, an unlabelled control. GDS enforces these with gates;
the handoff naming them up front is what keeps the first build green.*

## 4. Design tokens — role AND rationale

*Every token row carries its role in prose, not just a hex. When two similar values are
different decisions, say why, with computed contrast inline.*

> **Micro-example:** "Cream `#FAF7F1` — the page. Also the map canvas and the paper behind
> every generated image." And the two-oranges rule: "The two oranges are one decision, not a
> gradient. `#C24A0A` clears WCAG AA against both cream (4.6:1) and white with white text on
> it (4.9:1); `#F5793B` does not and is fill-only."

## 5. Exclusivity annotations

*Mark tokens whose meaning depends on scarcity — "used nowhere else" — so reuse cannot dilute
them.*

> **Micro-example:** "Action orange `#C24A0A` — buttons, links, focus ring. **The only colour
> that carries a label.**" (Brand orange, by contrast, is "never under text".)

## 6. Type, shape, and motion — with accessibility in the same table

*Minimum tap targets, minimum font sizes, and `prefers-reduced-motion` behaviour live in the
same tables as the visual spec — never in a separate appendix an implementer can miss.*

## 7. The states contract

*Every surface defines loading, empty, error, unavailable, and success — with CONTENT
guidance, not just visuals: an empty state says what happened, why, and the next actions; an
error state names a human cause, a retry, and a fallback. This is a GDS standing requirement
(`CONTRIBUTING.md` step 7, issue 542); the handoff supplies the copy direction per surface.*

## 8. Content rules

*Voice, forbidden vocabulary, and the degrade-to-zero requirement.*

> **Micro-example:** "Never say guaranteed, safe, perfect match, best, or trust us. … a
> sentence must never name a category, activity or neighbourhood that has been switched off,
> and must degrade as its list shrinks to two, to one, to none. Every text slot needs an
> answer for the day there is nothing true to say in it."

## 9. Runtime configurability — no fixed counts

*Confirm every grid, rail, and sentence holds at full count, at half, at one — and says
something true at zero. This is a GDS standing requirement (issue 541); the handoff states
which compositions are count-driven and how each degrades.*

## 10. Where literal values may live

*The narrow, named exceptions to "everything reads tokens" — each with the reason its output
has no stylesheet or theme in scope. GDS's own allowlist is in `COMPLIANCE_TOOLKIT.md`
("Where a literal value is allowed to live"); a handoff's list must be at least as narrow.*

> **Micro-example:** "Only under the theme path. Three places genuinely need plain hex because
> their output has no stylesheet and no theme in scope: map paint expressions, generated SVG
> data URIs, and the PWA manifest. Everything else reads tokens."

## 11. Files in this bundle

*A table: every file, what it is, and whether it is canonical or reference-only.*

## 12. Open items for the implementer

*Named ambiguities and unconfirmed decisions, flagged explicitly as things to CONFIRM rather
than guess. An empty section here is a claim that nothing is ambiguous — make it on purpose.*

> **Micro-example:** "Pin state colours here differ from a navy-idle / terracotta-selected
> convention. Confirm before sprite generation, since the activity fill is spoken for." (That
> confirmation happened: GDS resolved it by the handoff's own silhouette-and-scale principle,
> issue 545 — which is what this section is for.)

---

## Provenance

*Who produced the source material, with what tool, from what inputs, and under what licence —
per `THEME_GOVERNANCE.md`'s "Importing an externally-produced design". Cross-reference, do not
restate.*
