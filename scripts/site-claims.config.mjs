// Issue 605 / CLAUDE.md Rule 14 — the reference site's absolute claims and their evidence.
//
// Owner directive, 2026-08-13: "We can have either Approved or Non-existing cases, especially
// on visible surfaces." A sentence on the reference site that asserts a guarantee is a promise
// GDS makes to a client. There is no third state where a promise is merely plausible.
//
// So every absolute on a visible surface must appear here with the evidence that supports it,
// and the gate fails on any that does not. Adding a new one is deliberately not free: you have
// to name what makes it true, or not write it.
//
// `evidence` kinds:
//   derived  — the page COMPUTES it at render time; the claim cannot drift from the system
//   gate     — a named verification script fails when the claim stops holding
//   test     — a named unit test fails when the claim stops holding
//   contract — a design rule with no mechanical check TODAY. Allowed, but it must be stated as
//              a convention on the page rather than implying an enforced guarantee, and it
//              carries a `reviewBy` so it is re-examined rather than accumulating forever.

export const SITE_CLAIM_SOURCES = [
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/page-copy.ts',
  'apps/playground/src/pattern-pages.tsx',
  'apps/playground/src/pattern-registry.ts',
  'apps/playground/src/showcase-pages.tsx',
  'apps/playground/src/accessibility-evidence-registry.ts',
];

// Words that turn a description into a promise.
export const ABSOLUTE_PATTERN = /\b(every preset|all 25|in every theme|always|never|identical|no exception|guarantee[ds]?|100%|the same (?:value|colour|color) in every)\b/i;

export const REGISTERED_CLAIMS = {
  'Focus never depends on hover-only reveal.': {
    evidence: 'gate',
    ref: 'verify:accessibility-evidence',
    note: 'The evidence registry is verified per pattern (113 patterns, 337 AT/browser rows). A focus behaviour that stopped holding would fail its row rather than silently contradict this line.',
  },
  'One GdsProvider at the app root — never nest a second one': {
    evidence: 'gate',
    ref: 'verify:references -> verify-playground-shell-contract.mjs (single-provider check)',
    // First registered against this gate on the assumption it already checked. It did not —
    // the check was added for issue 605, and its negative control was run both ways. A nested
    // provider re-declares the theme, so identity, scheme and the governed variant lane stop
    // agreeing between subtrees: the class of bug issue 597 traced.
    note: 'The gate counts <GdsProvider> mounts in the playground and fails on a second one, so the site obeys the rule it states.',
  },
  'Gate private content with GdsAccessGate protectedContentPolicy="never-render-while-locked"': {
    evidence: 'gate',
    ref: 'verify:access-gate',
    note: 'The access-gate verification covers the policy value named here; a renamed or removed policy fails it.',
  },
  'Irreversible actions require an explicit, dismissible confirmation — never a permanently-open dialog.': {
    evidence: 'contract',
    reviewBy: '2027-02-01',
    note: 'A composition rule for consumers, not a property of a shipped component: GDS cannot detect that an app left a dialog permanently open. Stated as guidance on the page.',
  },
  'Map markers use GdsMapPinBadge — a governed pin marker, correct by construction, so consumers never hand-tune the centering/stroke/contrast constants themselves.': {
    evidence: 'derived',
    ref: 'GdsPinSystemReference',
    note: 'The centring offset, icon scale and contrast matrix on the pin page are surfaced from source exports and computed live, so "correct by construction" is shown rather than asserted.',
  },
  "GdsMapPinBadge follows the same ambient mode — the ring stays the category's accent, the pin fills with a fixed dark-neutral disc in emoji mode (never the accent), and the emoji centers on it.": {
    evidence: 'test',
    ref: 'packages/gds-core/src/badge-system.test.tsx (emoji-mode pin disc is never the accent)',
    // The existing emoji test asserted the glyph renders and shape is ignored — NOT that the
    // fill is neutral. The claim had no evidence until issue 605 added it. An OS-rendered
    // emoji has colours GDS cannot control, so its legibility must not depend on the accent.
    note: 'Asserts a neutral fill is present and no filled shape carries the accent token, plus that the ring keeps the accent.',
  },
  'Multiple badges read left-to-right in a wrapping row beside identity — never stacked on the avatar, which the GdsBadgeStack corner model reserves for a single verification mark.': {
    evidence: 'contract',
    reviewBy: '2027-02-01',
    note: 'Layout guidance for consumers composing badges; GdsBadgeStack enforces the corner model it describes, but nothing can stop an app stacking badges by hand.',
  },
  'A modal can confirm a badge was just earned; an inline alert carries a badge as its action content. Badges never appear inside a toast body, which stays text-only for assistive tech.': {
    evidence: 'contract',
    reviewBy: '2027-02-01',
    note: 'A rule about what a consumer puts in a toast. GDS ships no toast that renders a badge; it cannot prevent an app passing one.',
  },
  'The catalog stays a strict consumer of shipped primitives — each entry maps back to the canonical markdown SSOT, never a local fork.': {
    evidence: 'gate',
    ref: 'verify:pattern-catalog-coverage + verify:playground-gds-only',
    note: 'The GDS-only gate fails on a playground-local reimplementation, which is exactly the "local fork" this forbids.',
  },
  'Paywalls and login gates must expose a public teaser while never rendering protected content until access is unlocked.': {
    evidence: 'gate',
    ref: 'verify:access-gate',
    note: 'The protected-content policy is verified rather than trusted.',
  },
  'Image primitive with a branded fallback and reserved aspect-ratio box so a failed image never collapses a card or shifts layout.': {
    evidence: 'test',
    ref: 'packages/gds-core/src/classscout-components.test.tsx (MediaWithFallback reserves its box)',
    // The pre-existing tests covered WHICH content renders, not that the box keeps its height
    // when that content is the fallback — so the no-layout-shift half was unevidenced.
    note: 'Asserts the same reserved ratio in the image, missing-src and errored-image states.',
  },
  '%count% governed, accessible React components, design tokens, and runtime systems — composed in every product, never reinvented.': {
    evidence: 'derived',
    ref: 'apps/playground/src/generated-component-census.ts (verify:component-census) + verify-playground-gds-only.mjs for "never reinvented"',
    // Was a hardcoded "250+". The first fix DELETED the number, on the grounds that this slot
    // cannot use a template literal without dropping the sentence from all eight locales. That
    // was solving the wrong problem: the owner's standing requirement is no hardcoded values,
    // and "the page cannot compute it here" is a constraint to solve, not a licence to remove
    // information. A `%count%` placeholder survives extraction and translation, and the number
    // lands after translation from the same census the parity gate enforces against.
    note: 'The count is generated from collectPublicComponents(), the function verify-component-catalog-parity checks against, so page and gate cannot disagree. "never reinvented" is what the GDS-only gate enforces.',
  },
  'One value in every preset, in both schemes.': {
    evidence: 'derived',
    ref: 'apps/playground/src/pattern-pages.tsx (measureToneBehaviour) + apps/playground/src/badge-theme-matrix.test.tsx',
    note: 'Chosen by counting distinct token values at render time, not written. The test recomputes the counts independently, so page and tokens cannot disagree without failing the build.',
  },
  'Some local constructs should never have become part of the reference site.': {
    evidence: 'gate',
    ref: 'verify:playground-gds-only',
    note: 'Retrospective prose about why the GDS-only gate exists; the gate is the evidence.',
  },
};
