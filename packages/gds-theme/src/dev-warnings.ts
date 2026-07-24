const warnedKeys = new Set<string>();

/**
 * Emits a `console.warn` at most once per unique `key`, and only outside
 * production builds. GDS uses this to surface *recoverable* API misuse — a
 * missing `GdsProvider`, an impossible prop combination, a violated component
 * contract — to developers as an actionable console message, with zero
 * production cost: the guarded body is dead-code-eliminated wherever
 * `process.env.NODE_ENV === 'production'` (every standard app bundler inlines
 * that constant, so the branch and its string literals drop out of prod builds).
 *
 * Deduping by `key` keeps a warning that lives on a render path from repeating on
 * every re-render — it fires once per distinct problem, not once per frame.
 *
 * This complements, and never replaces, GDS's fail-loud `throw` for *hard*
 * contract breaks (e.g. a required context read as `null`): `throw` when the
 * component genuinely cannot proceed, `gdsDevWarnOnce` when it can still render
 * but the caller is almost certainly making a mistake.
 *
 * @param key A stable de-duplication key, e.g. `'GdsDateInput:min-after-max'`.
 * @param message Developer-facing explanation; emitted prefixed with `[GDS]`.
 */
export function gdsDevWarnOnce(key: string, message: string): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return;
  }
  if (warnedKeys.has(key)) {
    return;
  }
  warnedKeys.add(key);
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`[GDS] ${message}`);
  }
}

/**
 * Clears the once-per-`key` dedup set used by {@link gdsDevWarnOnce}. Intended
 * for test isolation — call it in a `beforeEach` so each scenario can assert a
 * warning fires from a clean slate. Has no effect on production behavior.
 */
export function resetGdsDevWarnings(): void {
  warnedKeys.clear();
}
