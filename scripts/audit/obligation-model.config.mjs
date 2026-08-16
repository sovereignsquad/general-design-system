// Single source of truth for what each registry atom kind must satisfy.
// Obligations are derived from the registry, so a new token, prop, variant, or export
// enters scope automatically.

/**
 * Obligations are not uniform across kinds — each kind carries only what's meaningful for it.
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
      {
        // Callback-parameter union literals (e.g. reason: 'user' | 'programmatic') have no visual variation to demo.
        pattern: '\\.on[A-Z]\\w*=',
        reason: 'Union literals in a callback signature are argument values, not rendered variations; there is no demo that could satisfy them.',
      },
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
 * coverage gate reports what it does not model.
 */
export const COVERED_ELSEWHERE = {
  // Registry records exports at their barrel line, not the declaration where JSDoc lives.
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
