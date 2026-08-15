import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GdsProvider, getGdsVibeThemes, getGdsVibeThemeCssVariables } from '@sovereignsquad/gds-theme';
import { PatternFamilyPage } from './pattern-pages';

/*
 * The documentation must be derived from the system, not describe it.
 *
 * This panel once stated in prose that warning, danger and info were all "fixed" across
 * presets. Only danger is. Correcting the sentence would have left the real defect in place:
 * a sentence drifts the moment either side changes, and nothing notices.
 *
 * So the panel counts distinct token values at render time, and this test recomputes that
 * count INDEPENDENTLY and asserts the page agrees. If a state token is ever pinned or
 * un-pinned, the page updates itself and this test proves it did — the two cannot disagree
 * without failing the build.
 */
function distinctValues(tone: string, scheme: 'light' | 'dark') {
  return new Set(getGdsVibeThemes().map((p) => getGdsVibeThemeCssVariables(p.id, scheme)[`--gds-state-${tone}`])).size;
}

function renderBadgeMatrix() {
  // Rendered through the real family page rather than the demo in isolation: the panel has to
  // be reachable where a reader actually meets it, not merely constructible.
  // Issue 626 moved the badge system to its unified foundations home ("Badges & Indicators");
  // the panel must be found where readers now find it.
  render(<GdsProvider><PatternFamilyPage family="foundations" /></GdsProvider>);
}

describe('Badges across themes panel is derived, not described', () => {
  it('reports the measured counts the tokens actually have', () => {
    renderBadgeMatrix();
    for (const tone of ['success', 'warning', 'danger', 'info']) {
      const light = distinctValues(tone, 'light');
      const dark = distinctValues(tone, 'dark');
      const expected = `${light} / ${dark} distinct values across ${getGdsVibeThemes().length} presets (light / dark)`;
      expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
    }
  });

  it('says danger is anchored and info is not, because that is what the tokens say', () => {
    // Named explicitly because these are the two the old prose got wrong.
    expect(distinctValues('danger', 'light')).toBe(1);
    expect(distinctValues('danger', 'dark')).toBe(1);
    expect(distinctValues('info', 'light')).toBeGreaterThan(1);

    renderBadgeMatrix();
    expect(screen.getAllByText('One value in every preset, in both schemes.').length).toBe(1);
    expect(screen.getAllByText('Tinted per preset in both schemes.').length).toBe(2); // success + info
  });
});
