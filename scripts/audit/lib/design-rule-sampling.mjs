// Classification and aggregation for the rendered color-proportion sample (issue #649).
// Pure functions only -- no browser, no I/O -- so the arithmetic is unit-testable without
// a live Chrome instance. The in-page capture script that produces the raw element data
// lives in design-rule-capture.mjs; the orchestrator (design-rule-coverage.mjs) wires the
// two together with a real browser session.

/**
 * Normalizes a resolved color string for equality comparison. Handles the same
 * `color-mix()` → `color(srgb ...)` serialization Chrome produces (issue 625's
 * fix in render-capture.mjs's `normColor`, reapplied here independently since this
 * module measures a different thing -- rendered area, not token traceability --
 * and must not take on a runtime dependency on that classifier's internals), plus
 * `#hex`/`#hex8` -- `getGdsVibeThemeCssVariables` returns hex literals, while a
 * captured element's `getComputedStyle(...).backgroundColor` is always browser-
 * serialized `rgb()`/`rgba()`; without converting both to one canonical form, a
 * theme's hex declaration would never match its own rendered pixels.
 */
export function normalizeColor(value) {
  const input = (value || '').trim();

  const srgb = /^color\(srgb\s+([^)]+)\)$/.exec(input);
  if (srgb) {
    const [channels, alphaPart] = srgb[1].split('/');
    const [r, g, b] = channels.trim().split(/\s+/).map((v) => Math.round(parseFloat(v) * 255));
    const a = alphaPart === undefined ? 1 : parseFloat(alphaPart);
    return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input);
  if (hex) {
    const raw = hex[1];
    const expanded = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    const a = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return input;
}

/**
 * Maps every classified role (issue #644's `dominant`/`secondary`/`accent` arrays) to its
 * live resolved CSS value for one preset+scheme, via `cssVariables` -- the exact object
 * `getGdsVibeThemeCssVariables(presetId, scheme)` returns, so this reads the same values
 * GDS's own runtime renders, never a re-derived approximation.
 */
export function buildColorToClassLookup(cssVariables, classification) {
  const lookup = new Map();
  for (const cls of ['dominant', 'secondary', 'accent']) {
    for (const role of classification[cls]) {
      const varName = `--gds-${role.replace('.', '-')}`;
      const value = cssVariables[varName];
      if (!value) continue;
      lookup.set(normalizeColor(value), cls);
    }
  }
  return lookup;
}

/** Classifies a rendered element's resolved background color via a prebuilt lookup (issue #649). */
export function classifyColorToProportionClass(resolvedColor, lookup) {
  return lookup.get(normalizeColor(resolvedColor)) ?? 'unclassified';
}

const TRANSPARENT = new Set(['rgba(0, 0, 0, 0)', 'transparent', '']);

/**
 * Area-weights every visible, opaque-background, solid-colored element into
 * `dominant`/`secondary`/`accent`/`unclassified` percentages summing to 100 (issue #649).
 *
 * Excluded from BOTH numerator and denominator (not counted toward any class, including
 * `unclassified`): invisible elements (`el.visible === false`), zero-area elements,
 * fully-transparent backgrounds, and elements painted via `background-image` (gradients,
 * images, SVG fills -- `el.hasBackgroundImage === true`). A transparent or image-painted
 * element has no solid color to classify; counting its area as `unclassified` would
 * inflate that bucket with elements that were never a 60-30-10 candidate in the first
 * place (most layout containers have a transparent background).
 *
 * `lookup` is a `Map` from {@link buildColorToClassLookup}, applied per element via
 * `el.colorClassLookup` when elements from multiple preset/scheme lookups are pooled in
 * one call (each element carries its own lookup); pass the same lookup on every element
 * when sampling a single preset+scheme.
 */
export function aggregateProportionCoverage(capturedElements) {
  const totals = { dominant: 0, secondary: 0, accent: 0, unclassified: 0 };
  let totalArea = 0;
  for (const el of capturedElements) {
    if (el.visible === false || !(el.area > 0)) continue;
    if (el.hasBackgroundImage) continue;
    if (TRANSPARENT.has(normalizeColor(el.backgroundColor))) continue;
    const cls = classifyColorToProportionClass(el.backgroundColor, el.colorClassLookup);
    totals[cls] += el.area;
    totalArea += el.area;
  }
  if (totalArea === 0) {
    throw new Error('No visible elements captured -- sampling produced zero area, cannot compute a proportion.');
  }
  // Round dominant/secondary/accent independently, then set unclassified as the exact
  // remainder -- guarantees the four percentages sum to precisely 100.0, not just within
  // a rounding-error tolerance across four independently-rounded values.
  const dominant = Math.round((totals.dominant / totalArea) * 1000) / 10;
  const secondary = Math.round((totals.secondary / totalArea) * 1000) / 10;
  const accent = Math.round((totals.accent / totalArea) * 1000) / 10;
  const unclassified = Math.round((100 - dominant - secondary - accent) * 10) / 10;
  return { dominant, secondary, accent, unclassified };
}
