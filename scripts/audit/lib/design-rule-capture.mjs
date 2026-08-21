// In-page capture for the rendered color-proportion sample (issue #649). A dedicated,
// self-contained sweep -- deliberately NOT spliced into render-capture.mjs's CAPTURE_PREP/
// captureSweepChunk, which classify token traceability (a different question, feeding
// budgets this issue must not risk perturbing) over a much larger 8-factor covering-array
// state space. This module answers a narrower question (rendered background-color area
// per preset x scheme x a fixed route sample) with its own single-pass DOM walk, reusing
// only the shared browser/CDP session machinery from scripts/lib/browser-runtime.mjs --
// the actual "no second browser-launch mechanism" constraint (issue #649, Section 7).

/**
 * Executed in-page via CDP `Runtime.evaluate`. Walks every element once, computing:
 * area (`getBoundingClientRect`, clipped to the viewport), visibility (aria-hidden/inert
 * ancestor walk, `display`/`visibility`, zero opacity -- the same exclusions
 * verify-viewport-reachability-runtime.mjs already proves correct, reapplied here since
 * that script's own logic lives inside its own template string, not an importable
 * function), resolved `background-color`, and whether `background-image` paints anything
 * (gradients/images/SVG fills -- excluded from measurement per issue #649's own scope).
 *
 * Does not attempt overflow-hidden clip-region intersection (verify-viewport-reachability
 * -runtime.mjs's horizontal-only clip tracking solves a different problem -- off-canvas
 * reachability at one fixed viewport width -- not general 2D visible-area computation);
 * an element clipped to a smaller visible region than its own box still counts at its
 * full box area, a stated approximation (issue #649, Section 15's own accepted
 * overlapping-area imprecision).
 */
export const CAPTURE_PROPORTION = `(() => {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  const isHiddenFromReaders = (el) => {
    for (let node = el; node; node = node.parentElement) {
      if (node.getAttribute?.('aria-hidden') === 'true' || node.inert) return true;
    }
    const style = getComputedStyle(el);
    return style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity || '1') === 0;
  };

  const elements = [];
  for (const el of document.body.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(vw, rect.right);
    const bottom = Math.min(vh, rect.bottom);
    const area = Math.max(0, right - left) * Math.max(0, bottom - top);
    if (area <= 0) continue;
    const visible = !isHiddenFromReaders(el);
    const cs = getComputedStyle(el);
    elements.push({
      area,
      visible,
      backgroundColor: cs.backgroundColor,
      hasBackgroundImage: cs.backgroundImage !== 'none',
    });
  }
  return { elements };
})()`;
