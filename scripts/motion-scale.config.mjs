// Issue 584 — motion declarations that legitimately sit off the interaction scale.
//
// Keyed by `file:line`, so an entry cannot silently drift onto a different declaration: if
// the line moves, the entry stops matching and the gate fails until it is re-examined. That
// is deliberate churn — the alternative is an allowlist that quietly excuses whatever
// happens to land on that line later.
export const MOTION_ALLOWLIST = {

};
