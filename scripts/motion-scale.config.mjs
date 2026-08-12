// Issue 584 — motion declarations that legitimately sit off the interaction scale.
//
// Keyed by `file:line`, so an entry cannot silently drift onto a different declaration: if
// the line moves, the entry stops matching and the gate fails until it is re-examined. That
// is deliberate churn — the alternative is an allowlist that quietly excuses whatever
// happens to land on that line later.
export const MOTION_ALLOWLIST = {
  'packages/gds-core/src/ChatSurface.tsx:137': {
    reason:
      'Issue 592. This is `animation: gds-chat-typing 1s infinite`, and `@keyframes '
      + 'gds-chat-typing` is defined NOWHERE — GDS ships zero @keyframes, so the declaration '
      + 'animates nothing and the indicator renders three static dots. Mapping 1s to the '
      + 'nearest step (360ms) would be meaningless work on a dead reference, and #584 §6 '
      + 'excludes adding keyframes. Allowlisted until #592 decides whether to define the '
      + 'animation (with a scale value and a reduced-motion guard) or delete the declaration.',
    reviewBy: '2026-12-01',
  },
};
