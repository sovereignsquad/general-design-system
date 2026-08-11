// Issue 581 — single source of truth for what each registry atom kind must satisfy.
//
// Finding F18 measured 1,699 of 2,829 atoms (60%) with no obligation coverage at all:
// 590 exports, 1,002 props, 97 variants, 10 accents. Those are not obscure internals —
// `export` and `prop` are the public API consumers build against, and `variant` is
// exactly the union-literal set Rule 2 requires be demonstrated.
//
// The point of deriving obligations from the registry rather than a hand-written list:
// a new token, prop, variant or export enters scope THE MOMENT IT IS ADDED. There is no
// checklist to forget, because there is no checklist. That directly closes the failure
// mode DO-178C names and issue 516 exhibited — tests written from code rather than from
// requirements make coverage look good while requirement coverage is partial.

/**
 * Obligations are deliberately NOT uniform across kinds.
 *
 * Applying the five-obligation token model wholesale would generate thousands of
 * meaningless gaps — every internal prop demanding its own use case — and a gate that
 * cries wolf is a gate people learn to skip. Each kind carries only the obligations
 * that are actually meaningful for it, and the rationale is stored here so the choice
 * is reviewable rather than folklore.
 */
export const OBLIGATION_MODEL = {
  prop: {
    obligations: ['jsdoc'],
    rationale:
      'Props are discoverable through types, so prose documentation per prop would be '
      + 'noise. A JSDoc line at the declaration is the proportionate bar: it is what shows '
      + 'in editor tooltips, which is where a consumer actually reads it.',
    exclude: [
      { pattern: '\\.(className|style|children|id|key|ref)$', reason: 'Standard React passthroughs with no GDS-specific meaning.' },
    ],
  },
  variant: {
    obligations: ['variationShown'],
    rationale:
      'An undemonstrated variant is an undiscoverable feature, and undemonstrated states '
      + 'are where accessibility defects survive. This repository has the evidence: #480 '
      + '(a "good"/"partial" band pair rendering identically) and #479 (a preset tint '
      + 'overriding a fixed semantic colour) were both undemonstrated variant states.',
    exclude: [
      { pattern: '=(true|false)$', reason: 'Boolean discriminants are not a visual variation set.' },
    ],
  },
  accent: {
    obligations: ['contrastVerified'],
    rationale:
      'The ten accent ramps feed the badge and map-pin contrast guarantee. An accent with '
      + 'no contrast evidence is an unverified claim about legibility, and #560 replaces '
      + 'hand-verification with computation precisely because the hand-verified freeze '
      + 'could not be checked.',
  },
};

/**
 * Kinds covered by an earlier audit phase or an existing gate. Listed explicitly so the
 * coverage gate can report what it does NOT model, rather than silently ignoring it —
 * an unmodelled kind is a gap in this gate, and it should say so in its own output.
 */
export const COVERED_ELSEWHERE = {
  // NOT modelled here, and this is a correction to finding F18.
  //
  // F18 counted `export` (590 atoms) among the 60% with "no coverage at all". That was
  // true of AUDIT PHASE coverage and false of GATE coverage: verify:api-jsdoc-coverage
  // already measures exactly this at 99.8% across 1,242 declarations.
  //
  // A first attempt modelled `jsdoc` here anyway and reported 3/497 — 494 gaps. Every
  // one was false: the registry records an export at its BARREL line
  // (`packages/gds/src/index.ts:3`, a re-export statement), while the JSDoc lives on the
  // declaration in the component's own file. Duplicating a gate that already works, with
  // a predicate pointed at the wrong file, would have produced 494 false accusations.
  export: 'verify:api-jsdoc-coverage (99.8% across 1,242 declarations, measured at the declaration site)',
  'token-declared': 'Phase 1 backward trace + Phase 2 forward trace',
  'token-emitted': 'Phase 2 forward trace',
  'token-published': 'Phase 2 forward trace + verify:tokens-dtcg',
  'token-referenced': 'Phase 2 forward trace',
  'motion-token': 'Phase 4a',
  'motion-shipped': 'Phase 4a',
  'motion-keyframes': 'Phase 4a',
  'motion-reduced-guard': 'Phase 4a',
  'interaction-state': 'Phase 4a',
  'locale-pack-package': 'Phase 4b + verify:i18n-message-parity',
  'locale-pack-site': 'Phase 4b + verify:site-phrase-translations',
  theme: 'Phase 1 (all 25 presets swept)',
  route: 'Phase 1 (4 of 24 routes — partial, stated)',
  pattern: 'verify:pattern-catalog-coverage',
};
