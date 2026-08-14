// Issue 612 — classification of known forward-trace gaps.
//
// A gap here is CLASSIFIED, not excused: it stays in `tokensWithGaps`, the budget still counts
// it, and the ratchet still only moves down by closing it. What a classification adds is the
// reason the gap is open and a date by which that reason must be re-examined — the same shape
// token-reachability.config.mjs uses for extension points. An expired entry is dropped at
// trace time, so a stale reason cannot keep explaining a gap nobody has looked at.
//
// Every reason below was verified against source when written, and cites where.

export const GAP_CLASSIFICATIONS = {
  '--gds-focus-ring-offset': {
    reason: 'Focus-ring axis token (axes.ts emits it; accessibility-floor.ts polices the axis at '
      + 'runtime). Reference-site documentation of the focus-ring axis is scoped under issue 552 '
      + '(focus-ring governance), currently blocked — the docs land with that work, not before it.',
    reviewBy: '2026-11-01',
  },
  '--gds-focus-ring-style': {
    reason: 'Same axis and same plan as --gds-focus-ring-offset (issue 552).',
    reviewBy: '2026-11-01',
  },
  '--gds-focus-ring-color': {
    reason: 'Same axis and same plan as --gds-focus-ring-offset (issue 552). Resolves to '
      + 'var(--gds-<colorRole>), so its variation story is the color role\'s.',
    reviewBy: '2026-11-01',
  },
  '--gds-focus-ring-width': {
    reason: 'Same axis and same plan as --gds-focus-ring-offset (issue 552). Its floor is already '
      + 'enforced in accessibility-floor.ts; what is missing is the reference-page story.',
    reviewBy: '2026-11-01',
  },
  '--gds-density': {
    reason: 'The density axis MODE FLAG (axes.ts writes the current mode name into it). The axis '
      + 'itself is demonstrated through components; the flag token has no variation demo or '
      + 'use-case prose of its own on the site.',
    reviewBy: '2026-11-01',
  },
  '--gds-identity-unresolved': {
    reason: 'A diagnostic channel, not a design surface: theme-identity.ts emits it ONLY when a '
      + 'preset fails to resolve, carrying the unresolved name for inspection. Demoing it means '
      + 'demonstrating a failure state; whether the reference site should show failure-state '
      + 'tokens is the open question this classification records.',
    reviewBy: '2026-11-01',
  },
  '--gds-motion-duration-ambient': {
    reason: 'Ambient motion duration in styles.css with a prefers-reduced-motion: 0ms override. '
      + 'Motion-token documentation coverage is finding F2\'s territory and lands with it.',
    reviewBy: '2026-11-01',
  },
  '--gds-transition-scope': {
    reason: 'axes.ts emits the list of transitioned properties into it; it is read back by the '
      + 'transition machinery rather than styled against. Its demo/variation story needs the '
      + 'motion documentation (F2) to exist first.',
    reviewBy: '2026-11-01',
  },
  '--gds-text-on-support': {
    reason: 'Derived readable foreground (semantic-token-source.ts computes it against '
      + '--gds-support at 4.5:1; accessibility-report.ts audits the pair). Only variationsShown '
      + 'is open, and that obligation is itself a LOW-confidence proxy heuristic per the trace\'s '
      + 'own confidence block.',
    reviewBy: '2026-11-01',
  },
};
