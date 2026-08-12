import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { GDS_ACCENT_MODES, GDS_ACCENT_NAMES, GDS_ACCENT_SHADES, evaluateGdsAccentContrast, getGdsVibeThemeCssVariables } from '@sovereignsquad/gds-theme';
import { GdsAccentContrastMatrix } from './GdsAccentContrastMatrix';
import { renderWithGds } from '../../../test-utils/render';

describe('GdsAccentContrastMatrix (issue 596)', () => {
  it('shows the measured ratio AND its threshold, never a bare pass/fail', () => {
    renderWithGds(<GdsAccentContrastMatrix preset="default" colorScheme="light" />);
    const light = getGdsVibeThemeCssVariables('default', 'light');
    const dark = getGdsVibeThemeCssVariables('default', 'dark');
    const expected = evaluateGdsAccentContrast(undefined, { light: light['--gds-bg-page'], dark: dark['--gds-bg-page'] }, 'default')
      .find((r) => r.scheme === 'light' && r.accent === 'plum' && r.shade === 'base' && r.mode === 'filled')!;

    // The number a theme author needs is the ratio and what it had to clear.
    expect(screen.getAllByText(new RegExp(`${expected.ratio}:1`)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`/ ${expected.required}`)).length).toBeGreaterThan(0);
  });

  it('agrees with the gate exactly, because both read the same function', () => {
    // A UI that contradicts the build is worse than no UI.
    const light = getGdsVibeThemeCssVariables('editorial', 'light');
    const dark = getGdsVibeThemeCssVariables('editorial', 'dark');
    const fromEvaluator = evaluateGdsAccentContrast(undefined, { light: light['--gds-bg-page'], dark: dark['--gds-bg-page'] }, 'editorial')
      .filter((r) => r.scheme === 'dark');
    renderWithGds(<GdsAccentContrastMatrix preset="editorial" colorScheme="dark" />);
    const caption = screen.getByText(/Accent contrast for editorial in dark mode/);
    expect(caption.textContent).toContain(`${fromEvaluator.filter((r) => r.enforced).length} enforced combinations`);
  });

  it('renders every accent as a row header and every shade/mode as a column header', () => {
    renderWithGds(<GdsAccentContrastMatrix preset="default" colorScheme="light" />);
    for (const accent of GDS_ACCENT_NAMES) {
      expect(screen.getByRole('rowheader', { name: accent })).toBeInTheDocument();
    }
    // shades x modes column headers, plus the leading "Accent" header
    expect(screen.getAllByRole('columnheader')).toHaveLength(GDS_ACCENT_SHADES.length * GDS_ACCENT_MODES.length + 1);
  });

  it('does not convey state by colour alone', () => {
    // The matrix reports on accessibility; failing 1.4.1 itself would be worse than not
    // shipping it. Every cell carries an icon and the numeric ratio, not just a tint.
    const { container } = renderWithGds(<GdsAccentContrastMatrix preset="default" colorScheme="light" />);
    const firstCell = container.querySelector('tbody td') as HTMLElement;
    expect(within(firstCell).getByText(/:1/)).toBeInTheDocument();
    expect(firstCell.querySelector('svg')).toBeInTheDocument();
  });

  it('captions the table, so a screen-reader user knows what 120 numbers mean', () => {
    const { container } = renderWithGds(<GdsAccentContrastMatrix preset="default" colorScheme="light" />);
    expect(container.querySelector('caption')?.textContent).toMatch(/Accent contrast for default/);
  });

  it('marks unenforced modes and states why, rather than hiding them', () => {
    renderWithGds(<GdsAccentContrastMatrix preset="default" colorScheme="light" />);
    expect(screen.getByText(/measured but not enforced/)).toBeInTheDocument();
    expect(screen.getAllByText(/measured, not enforced/).length).toBeGreaterThan(0);
  });
});
