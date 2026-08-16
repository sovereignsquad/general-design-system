import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GdsProvider, getGdsVibeThemes, getGdsVibeThemeCssVariables } from '@sovereignsquad/gds-theme';
import { PatternFamilyPage } from './pattern-pages';

// Recomputes the distinct-token-value count independently of the rendered panel and
// asserts the panel's text matches, so the page and the tokens cannot drift apart silently.
function distinctValues(tone: string, scheme: 'light' | 'dark') {
  return new Set(getGdsVibeThemes().map((p) => getGdsVibeThemeCssVariables(p.id, scheme)[`--gds-state-${tone}`])).size;
}

function renderBadgeMatrix() {
  // Rendered through the real family page so the panel is reachable where readers find it.
  render(<GdsProvider><PatternFamilyPage family="systems" /></GdsProvider>);
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
    expect(distinctValues('danger', 'light')).toBe(1);
    expect(distinctValues('danger', 'dark')).toBe(1);
    expect(distinctValues('info', 'light')).toBeGreaterThan(1);

    renderBadgeMatrix();
    expect(screen.getAllByText('One value in every preset, in both schemes.').length).toBe(1);
    expect(screen.getAllByText('Tinted per preset in both schemes.').length).toBe(2); // success + info
  });
});
