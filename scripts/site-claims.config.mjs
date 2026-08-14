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
  // Issue 613. `site-routes.ts` and `site-copy.ts` were NOT scanned, and they hold the primary
  // navigation labels — the most-read copy on the site. The `/live-proofs` route shipped with
  // `label: 'Live Demos'` in English and a "demo" rendering in all eleven locales, months after
  // #606 renamed the surfaces, because no sweep ever read the file it lives in.
  'apps/playground/src/site-routes.ts',
  'apps/playground/src/site-copy.ts',
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/page-copy.ts',
  'apps/playground/src/pattern-pages.tsx',
  'apps/playground/src/pattern-registry.ts',
  'apps/playground/src/showcase-pages.tsx',
  'apps/playground/src/accessibility-evidence-registry.ts',
];

// Words that turn a description into a promise.
export const ABSOLUTE_PATTERN = /\b(every preset|all 25|in every theme|always|never|identical|no exception|guarantee[ds]?|100%|the same (?:value|colour|color) in every)\b/i;

// A number in prose is a claim about the system too — "250+ components" was one, and it
// drifted for as long as nothing compared it to reality. A sentence that INTERPOLATES its
// number (via a %placeholder%) is derived by construction and needs no registration; a
// sentence with the number typed into it must be registered here or must not exist.
export const NUMERIC_PROSE = /(?<![\w#.\-])(\d{2,4})(?:\+|\s?%)?\s+(?=[a-z])|\b(\d{2,4})\+/;
export const DERIVED_PLACEHOLDER = /%[a-z]+%/i;

/** Prose numbers that are written rather than interpolated, with what makes each one true. */
export const REGISTERED_NUMERIC_CLAIMS = {
  // Intentionally empty: every prose number on a visible surface is currently interpolated
  // from its source. An entry here is an exception that has to argue for itself.
};

export const REGISTERED_CLAIMS = {
  // Issue 619 — the rebuilt badge introduction. Each section states what it demonstrates, so
  // each of those statements now needs its evidence like any other claim on this site.
  'The same five states with the governed icon ahead of the label. The icon is decorative — it is the second cue, never the only one.': {
    evidence: 'test',
    ref: 'packages/gds-core/src/core.test.tsx (status badges without withIcon render no [data-gds-icon]; the label is always present)',
    note: 'The icon is opt-in and additive: a badge renders its meaning as text with or without it, so colour and glyph are never the only carrier (WCAG 1.4.1).',
  },
  'A count caps rather than growing without bound, and announces its real value to assistive technology so the capped form is never the whole story. This one caps at %cap%.': {
    evidence: 'test',
    ref: 'packages/gds-core/src/core.test.tsx (renders count badges and label tags with governed semantics)',
    note: 'Asserts the visible text caps to "99+" while the accessible name carries the real count — exactly the two halves this sentence claims.',
  },
  'An accent names a category and means the same thing in every theme, which is why it does not shift with the preset the way a tone does.': {
    evidence: 'gate',
    ref: 'verify:accent-contrast',
    note: 'The accent palette is fixed by default across all 25 presets; a preset MAY override it, and the gate then measures that preset\'s own palette rather than the shared one. The invariant the sentence states — an accent is stable where a tone is tinted — is what that gate enforces.',
  },
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

/**
 * Issue 610 — retired vocabulary, and the malformed words a careless rename makes of it.
 *
 * #606 replaced "demo" with "proof" as a SUBSTRING, which turned "demonstrations" into
 * "proofnstrations". That shipped to the live site, was extracted into the phrase corpus, and
 * was then translated into all eight locale packs — German rendered it "Live-Proofnstrationen"
 * to readers. A bad rename does not stay in the file it was applied to.
 *
 * Detecting the failure MODE rather than the word: a substring rename leaves a signature — the
 * replacement term fused to the tail of the word it replaced part of. So any word beginning
 * with a replacement term that is not a real derived form of it is the artifact of one.
 * `derived` lists the legitimate forms; anything else starting with `to` is a defect.
 */
export const RETIRED_VOCABULARY = [
  {
    from: 'demo',
    to: 'proof',
    derived: ['proof', 'proofs', 'proofed', 'proofing', 'proofread', 'proofreader'],
    reason: 'Rule 15: the reference site is documentation with proofs. "Demo" invites staging.',
  },
];
