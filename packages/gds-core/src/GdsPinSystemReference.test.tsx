import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GDS_ACCENT_SHADES, getGdsContrastRatio, resolveGdsAccentTokens } from '@sovereignsquad/gds-theme';
import { GdsPinSystemReference } from './GdsPinSystemReference';
import { GDS_PIN_HEAD_CENTER_OFFSET, GDS_PIN_ICON_SCALE } from './GdsMapPinBadge';
import { renderWithGds } from '../../../test-utils/render';

describe('GdsPinSystemReference (issue 571)', () => {
  it('surfaces the geometry from the source rather than retyping it', () => {
    // The whole point: a copied constant drifts the first time the source changes, which is
    // the failure the pin component exists to prevent, reappearing in its own documentation.
    renderWithGds(<GdsPinSystemReference />);
    expect(screen.getByText(new RegExp(GDS_PIN_HEAD_CENTER_OFFSET.replace(/[()%]/g, '\\$&')))).toBeInTheDocument();
    // Appears in both the code block and the prose bound — both are surfaced, not retyped.
    expect(screen.getAllByText(new RegExp(String(GDS_PIN_ICON_SCALE))).length).toBeGreaterThan(0);
  });

  it('computes contrast live, matching the resolver the gate uses', () => {
    renderWithGds(<GdsPinSystemReference accents={['ocean']} />);
    const tokens = resolveGdsAccentTokens(undefined, 'light', 'default');
    const expected = getGdsContrastRatio('#ffffff', tokens['--gds-accent-ocean-base'])!;
    expect(screen.getAllByText(new RegExp(`${expected.toFixed(2)}:1`)).length).toBeGreaterThan(0);
  });

  it('shows the ratio AND its threshold, with a text verdict rather than colour alone', () => {
    renderWithGds(<GdsPinSystemReference accents={['ocean']} />);
    expect(screen.getAllByText(/:1 \/ 4\.5/).length).toBeGreaterThan(0);
  });

  it('covers every shade for each accent shown', () => {
    renderWithGds(<GdsPinSystemReference accents={['teal']} />);
    for (const shade of GDS_ACCENT_SHADES) {
      expect(screen.getAllByText(shade).length).toBeGreaterThan(0);
    }
  });

  it('renders all three composition modes, not just the default', () => {
    renderWithGds(<GdsPinSystemReference />);
    for (const mode of ['Outline mode', 'Filled mode', 'Emoji mode']) {
      expect(screen.getByLabelText(mode)).toBeInTheDocument();
    }
  });

  it('states why shades only darken, where a consumer will read it', () => {
    renderWithGds(<GdsPinSystemReference />);
    expect(screen.getByText(/fails at only \+4 lightness/)).toBeInTheDocument();
  });

  it('captions the matrix with the preset and scheme it measured', () => {
    const { container } = renderWithGds(<GdsPinSystemReference preset="editorial" colorScheme="dark" />);
    expect(container.querySelector('caption')?.textContent).toMatch(/editorial in dark mode/);
  });
});
