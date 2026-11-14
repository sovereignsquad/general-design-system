import { describe, expect, it } from 'vitest';
import { GDS_SURFACE_JND_DELTA_E, validateGdsAccessibilityFloor } from './accessibility-floor';
import { createBrandTheme } from './brand-tokens';
import { contrastRatio, deltaE76 } from './color-math';
import { emitSurfaceHierarchyCssVariables, GDS_CLASS_USA_SHELL, GDS_SURFACE_STEP_MIN } from './semantic-token-source';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

const ROLES = ['--gds-bg-sidebar', '--gds-bg-raised', '--gds-border-subtle', '--gds-border-strong'];

describe('surface hierarchy roles (#951)', () => {
  it('every preset and scheme emits the four roles, with legible text and a 3:1 strong border', () => {
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const t = getGdsVibeThemeCssVariables(id, scheme);
        for (const role of ROLES) expect(t[role], `${id} ${scheme} ${role}`).toBeTruthy();
        const failing = validateGdsAccessibilityFloor({ presetId: id, scheme, tokens: t }).filter((v) => v.ruleId === 'surface-hierarchy-legible');
        expect(failing, `${id} ${scheme}`).toEqual([]);
      }
    }
  });

  it('the sidebar is the shell composited over the page', () => {
    const vars = emitSurfaceHierarchyCssVariables({ '--gds-bg-page': '#000000', '--gds-bg-page-dark': '#000000', '--gds-bg-card': '#ffffff', '--gds-bg-card-dark': '#202020' }, { light: 'rgba(255, 255, 255, 0.5)', dark: '#123456' });
    expect(vars['--gds-bg-sidebar']).toBe('rgb(128, 128, 128)');
    expect(vars['--gds-bg-sidebar-dark']).toBe('#123456');
    expect(emitSurfaceHierarchyCssVariables({ '--gds-bg-page': '#f8fafc', '--gds-bg-card': '#ffffff' })['--gds-bg-sidebar']).toBe('#f8fafc');
  });

  it('raised equals the card in light and steps above it in dark', () => {
    const t = getGdsVibeThemeCssVariables('default', 'light');
    expect(t['--gds-bg-raised']).toBe(t['--gds-bg-card']);
    const d = getGdsVibeThemeCssVariables('default', 'dark');
    expect(contrastRatio(d['--gds-bg-raised'], d['--gds-bg-card'], d['--gds-bg-card']) ?? 0).toBeGreaterThanOrEqual(GDS_SURFACE_STEP_MIN);
  });

  it('class-usa resolves the same roles on the preset and the brand-theme path', () => {
    const preset = getGdsVibeThemeCssVariables('class-usa', 'light');
    const brand = createBrandTheme('class-usa').cssVariables;
    for (const role of ROLES) expect(brand[role], role).toBe(preset[role]);
    expect(GDS_CLASS_USA_SHELL.light).toBe('rgba(255, 255, 255, 0.9)');
  });

  it('separation is reported, not enforced, when the sidebar matches both neighbours', () => {
    const t = getGdsVibeThemeCssVariables('high-contrast', 'light');
    expect(deltaE76(t['--gds-bg-page'], t['--gds-bg-sidebar'])).toBeLessThan(GDS_SURFACE_JND_DELTA_E);
    const found = validateGdsAccessibilityFloor({ presetId: 'high-contrast', scheme: 'light', tokens: t }).filter((v) => v.ruleId === 'surface-separation');
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe('report');
  });

  it('deltaE76 is zero for equal colours and about 100 for black on white', () => {
    expect(deltaE76('#123456', '#123456')).toBe(0);
    expect(deltaE76('#000000', '#ffffff')).toBeCloseTo(100, 0);
    expect(deltaE76('var(--x)', '#ffffff')).toBeNull();
  });
});
