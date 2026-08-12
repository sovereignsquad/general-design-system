import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME } from '@mantine/core';
import {
  GDS_DEFAULT_SHAPE_AXIS, GDS_RADIUS_ROLES, GDS_RADIUS_STEPS, GdsAxisError,
  gdsRadius, resolveGdsShapeTokens, validateGdsShapeAxis,
} from './axes';
import { gdsTheme } from './theme';
import { getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

describe('shape axis (issue 555)', () => {
  it('reproduces Mantine\'s radius values exactly, including the scale factor', () => {
    // The zero-visual-regression requirement is about what RENDERS. Substituting a plain
    // '0.5rem' would read more cleanly and would silently drop var(--mantine-scale) — a real
    // rendering change dressed as a tidy-up.
    for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      expect(GDS_DEFAULT_SHAPE_AXIS.scale[step]).toBe(DEFAULT_THEME.radius[step]);
      expect(gdsTheme.radius[step]).toBe(DEFAULT_THEME.radius[step]);
    }
  });

  it('emits a token for every step and every role, in every preset', () => {
    // A role nobody overrode must still emit. A component reading --gds-radius-pin landing on
    // an undefined variable because one preset stayed silent is the shape of defect #537.
    for (const { id } of getGdsVibeThemes()) {
      const vars = getGdsVibeThemeCssVariables(id, 'light');
      for (const name of [...GDS_RADIUS_STEPS, ...GDS_RADIUS_ROLES]) {
        expect(vars[`--gds-radius-${name}`]).toBeTruthy();
      }
    }
  });

  it('resolves a role override to its step value, and an unoverridden role to defaultStep', () => {
    const tokens = resolveGdsShapeTokens({
      scale: { ...GDS_DEFAULT_SHAPE_AXIS.scale, lg: '20px', md: '6px' },
      roles: { card: 'lg', pin: '3px' },
      defaultStep: 'md',
    });
    expect(tokens['--gds-radius-card']).toBe('20px');   // step reference
    expect(tokens['--gds-radius-pin']).toBe('3px');     // direct length
    expect(tokens['--gds-radius-button']).toBe('6px');  // falls back to defaultStep
  });

  it('rejects a bad axis at construction time, naming the offending key', () => {
    // Construction time, not render time: a bad radius found while rendering is a visual
    // defect someone has to notice.
    expect(() => validateGdsShapeAxis({ scale: { ...GDS_DEFAULT_SHAPE_AXIS.scale, md: 'chunky' } }))
      .toThrow(/shape step "md" is "chunky"/);
    expect(() => validateGdsShapeAxis({ scale: GDS_DEFAULT_SHAPE_AXIS.scale, roles: { nope: 'md' } as never }))
      .toThrow(/"nope" is not a known radius role/);
    expect(() => validateGdsShapeAxis({ scale: GDS_DEFAULT_SHAPE_AXIS.scale, defaultStep: 'huge' as never }))
      .toThrow(/defaultStep "huge" is not a declared step/);
    const { md, ...missing } = GDS_DEFAULT_SHAPE_AXIS.scale;
    expect(() => validateGdsShapeAxis({ scale: missing as never })).toThrow(GdsAxisError);
  });

  it('returns a var() reference rather than a resolved literal', () => {
    // A literal captured at render time freezes the geometry of whichever theme happened to
    // be active, which is what makes a theme switch look half-applied.
    expect(gdsRadius('card')).toBe('var(--gds-radius-card)');
    expect(gdsRadius('pill')).toBe('var(--gds-radius-pill)');
  });

  it('lets a theme change corner geometry system-wide without touching component source', () => {
    const sharp = resolveGdsShapeTokens({ scale: { ...GDS_DEFAULT_SHAPE_AXIS.scale, md: '0', lg: '0' }, defaultStep: 'md' });
    expect(sharp['--gds-radius-card']).toBe('0');
    expect(sharp['--gds-radius-button']).toBe('0');
    expect(sharp['--gds-radius-pill']).toBe('9999px'); // pill is not collateral damage
  });
});
