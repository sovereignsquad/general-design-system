// The reference site's absolute claims and their evidence.
//
// Every absolute claim on a visible surface must appear here with the evidence that supports
// it, and the gate fails on any that does not.
//
// `evidence` kinds:
//   derived  — the page COMPUTES it at render time; the claim cannot drift from the system
//   gate     — a named verification script fails when the claim stops holding
//   test     — a named unit test fails when the claim stops holding
//   contract — a design rule with no mechanical check TODAY. Allowed, but it must be stated as
//              a convention on the page rather than implying an enforced guarantee, and it
//              carries a `reviewBy` so it is re-examined rather than accumulating forever.

export const SITE_CLAIM_SOURCES = [
  // Includes site-routes.ts and site-copy.ts: primary navigation labels, easy to miss in a sweep.
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

// A sentence that interpolates its number (via a %placeholder%) needs no registration; a
// sentence with the number typed into it must be registered here or must not exist.
export const NUMERIC_PROSE = /(?<![\w#.\-])(\d{2,4})(?:\+|\s?%)?\s+(?=[a-z])|\b(\d{2,4})\+/;
export const DERIVED_PLACEHOLDER = /%[a-z]+%/i;

/** Prose numbers that are written rather than interpolated, with what makes each one true. */
export const REGISTERED_NUMERIC_CLAIMS = {
  'Every governed accessibility-floor rule (id, axis, WCAG citation, rationale) and a live audit result across all 25 presets x 2 schemes, computed by auditGdsAccessibilityFloor() — the same function verify:a11y-floor runs.': {
    evidence: 'derived',
    ref: 'auditGdsAccessibilityFloor() (packages/gds-theme/src/accessibility-floor.ts): presetsChecked = getGdsVibeThemes().length * 2, computed at call time, never typed.',
    note: '25 presets x 2 schemes is the CURRENT preset count, stated in prose because the sentence describes the mechanism to a reader, not because it is hand-maintained -- the number the page actually shows (audit.presetsChecked) is the live computed value, and a preset added or removed changes that rendered number automatically without touching this sentence.',
  },
};

export const REGISTERED_CLAIMS = {
  'Every BrandSemanticRole grouped by its 60-30-10 proportion classification, the governed accent axis (names, shades, enforcement per mode), and the live contrast matrix for the default preset — embedding GdsAccentContrastMatrix so this page can never disagree with verify:accent-contrast.': {
    evidence: 'derived',
    ref: 'GdsColorSystemReference embeds GdsAccentContrastMatrix, which calls evaluateGdsAccentContrast() -- the same function verify:accent-contrast runs. Two callers of one function cannot compute two different answers.',
    note: '"Can never disagree" is a structural fact about sharing one function, not a promise about behaviour verify:accent-contrast could drift from unnoticed.',
  },
  'Every governed accessibility-floor rule (id, axis, WCAG citation, rationale) and a live audit result across all 25 presets x 2 schemes, computed by auditGdsAccessibilityFloor() — the same function verify:a11y-floor runs.': {
    evidence: 'derived',
    ref: 'GdsAccessibilitySystemReference calls auditGdsAccessibilityFloor() directly -- the same function packages/gds-theme/src/verify (via verify:a11y-floor) runs.',
    note: 'The rule list and the live verdict both come from the one exported function the gate itself calls; there is no second, hand-maintained copy of either to drift.',
  },
  'The same five states with the governed icon ahead of the label. The icon is decorative — it is the second cue, never the only one.': {
    evidence: 'test',
    ref: 'packages/gds-core/src/core.test.tsx (status badges without withIcon render no [data-gds-icon]; the label is always present)',
    note: 'The icon is opt-in and additive: a badge renders its meaning as text with or without it, so colour and glyph are never the only carrier (WCAG 1.4.1).',
  },
  // Same fact as the badge-introduction claim above, restated for accessibility-evidence-registry.ts.
  'badge meaning never relies on colour alone — shape and text carry the same signal': {
    evidence: 'test',
    ref: 'packages/gds-core/src/core.test.tsx (status badges without withIcon render no [data-gds-icon]; the label is always present)',
    note: 'Same fact as the badge introduction claim above: a badge renders its meaning as text with or without the icon, so colour and glyph are never the only carrier (WCAG 1.4.1).',
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
    // A nested provider re-declares the theme, so identity, scheme, and the variant lane can disagree between subtrees.
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
    // OS-rendered emoji has colours GDS cannot control, so legibility must not depend on the accent.
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
    // Covers box height too, not just which content renders.
    note: 'Asserts the same reserved ratio in the image, missing-src and errored-image states.',
  },
  '%count% governed, accessible React components, design tokens, and runtime systems — composed in every product, never reinvented.': {
    evidence: 'derived',
    ref: 'apps/playground/src/generated-component-census.ts (verify:component-census) + verify-playground-gds-only.mjs for "never reinvented"',
    // %count% placeholder survives extraction and translation; filled from the same census the parity gate checks.
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
 * Retired vocabulary, and the malformed words a substring rename makes of it.
 *
 * A substring rename leaves a signature: the replacement term fused to the tail of the word
 * it replaced part of. `derived` lists the legitimate forms; anything else starting with `to`
 * is a defect.
 */
export const RETIRED_VOCABULARY = [
  {
    from: 'demo',
    to: 'proof',
    derived: ['proof', 'proofs', 'proofed', 'proofing', 'proofread', 'proofreader'],
    reason: 'Rule 15: the reference site is documentation with proofs. "Demo" invites staging.',
  },
];
