import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsVibeThemeScope } from './VibeThemeScope';
import { getGdsVibeThemeCssVariables } from './vibe-themes';

describe('GdsVibeThemeScope', () => {
  it('applies the resolved preset/scheme CSS variables to the wrapping element', () => {
    const { container } = renderWithGds(
      <GdsVibeThemeScope presetId="high-contrast" scheme="light">
        <span>content</span>
      </GdsVibeThemeScope>,
    );
    const scope = container.querySelector('[data-gds-vibe-theme-scope="high-contrast"]') as HTMLElement | null;
    expect(scope).not.toBeNull();
    const expected = getGdsVibeThemeCssVariables('high-contrast', 'light');
    expect(scope?.style.getPropertyValue('--gds-vibe-primary')).toBe(expected['--gds-vibe-primary']);
  });

  it('renders children unchanged', () => {
    const { getByText } = renderWithGds(
      <GdsVibeThemeScope presetId="default" scheme="light">
        <span>scoped content</span>
      </GdsVibeThemeScope>,
    );
    expect(getByText('scoped content')).toBeTruthy();
  });

  it('keeps the fixed --gds-state-warning-dark/-danger-dark anchors identical across presets, while --gds-state-success genuinely varies', () => {
    const presetIds: Array<Parameters<typeof getGdsVibeThemeCssVariables>[0]> = [
      'default',
      'high-contrast',
      'colorblind-safe',
      'dark-public',
      'amber',
    ];
    const warningValues = presetIds.map((id) => getGdsVibeThemeCssVariables(id, 'light')['--gds-state-warning-dark']);
    const dangerValues = presetIds.map((id) => getGdsVibeThemeCssVariables(id, 'light')['--gds-state-danger-dark']);
    const successValues = presetIds.map((id) => getGdsVibeThemeCssVariables(id, 'light')['--gds-state-success']);

    expect(new Set(warningValues).size).toBe(1);
    expect(new Set(dangerValues).size).toBe(1);
    expect(new Set(successValues).size).toBeGreaterThan(1);
  });
});
