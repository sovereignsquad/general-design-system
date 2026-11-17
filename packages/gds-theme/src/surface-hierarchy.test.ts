import { describe, expect, it } from 'vitest';
import { GDS_SURFACE_JND_DELTA_E, validateGdsAccessibilityFloor } from './accessibility-floor';
import { createBrandTheme } from './brand-tokens';
import { contrastRatio, deltaE76 } from './color-math';
import { emitSurfaceHierarchyCssVariables, GDS_CLASS_USA_SHELL, GDS_DARK_CARD_SEPARATION_MIN, GDS_SURFACE_STEP_MIN } from './semantic-token-source';
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

  it('harbor resolves the same roles on the preset and the brand-theme path', () => {
    const preset = getGdsVibeThemeCssVariables('harbor', 'light');
    const brand = createBrandTheme('harbor').cssVariables;
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

  it('every preset and scheme emits nav state roles that clear the nav floor rule (#955)', () => {
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const t = getGdsVibeThemeCssVariables(id, scheme);
        for (const role of ['--gds-nav-active-bg', '--gds-nav-active-fg', '--gds-nav-active-indicator', '--gds-nav-hover-bg']) expect(t[role], `${id} ${scheme} ${role}`).toBeTruthy();
        expect(validateGdsAccessibilityFloor({ presetId: id, scheme, tokens: t }).filter((v) => v.ruleId === 'nav-states-legible'), `${id} ${scheme}`).toEqual([]);
      }
    }
  });

  it('every preset and scheme emits message bubble roles that clear 4.5:1 (#957)', () => {
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const t = getGdsVibeThemeCssVariables(id, scheme);
        expect(validateGdsAccessibilityFloor({ presetId: id, scheme, tokens: t }).filter((v) => v.ruleId === 'message-bubbles-legible'), `${id} ${scheme}`).toEqual([]);
        expect(t['--gds-message-other-bg']).toBe(t['--gds-bg-raised']);
      }
    }
  });
});

describe('dark card separation (#986)', () => {
  const floor = (scheme: 'light' | 'dark', tokens: Record<string, string>) =>
    validateGdsAccessibilityFloor({ presetId: 'fixture', scheme, tokens: { ...getGdsVibeThemeCssVariables('default', scheme), ...tokens } })
      .filter((v) => v.ruleId === 'dark-card-separation');

  it('every preset separates its dark card from the page by fill or border', () => {
    for (const { id } of getGdsVibeThemes()) {
      const t = getGdsVibeThemeCssVariables(id, 'dark');
      const fill = contrastRatio(t['--gds-bg-card'], t['--gds-bg-canvas'], t['--gds-bg-canvas']) ?? 1;
      const border = contrastRatio(t['--gds-border-card'], t['--gds-bg-canvas'], t['--gds-bg-card']) ?? 1;
      expect(fill >= GDS_DARK_CARD_SEPARATION_MIN.fill || border >= GDS_DARK_CARD_SEPARATION_MIN.border, `${id}: fill ${fill}, border ${border}`).toBe(true);
    }
  });

  it('fails a washed-out dark card, passes one with a strong border, and ignores light schemes', () => {
    const flat = { '--gds-bg-canvas': '#14171c', '--gds-bg-card': '#1c2027', '--gds-border-card': '#2c323b' };
    expect(floor('dark', flat)).toHaveLength(1);
    expect(floor('dark', { ...flat, '--gds-border-card': '#ffffff' })).toEqual([]);
    expect(floor('light', flat)).toEqual([]);
  });
});
