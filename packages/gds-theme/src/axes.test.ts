import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME } from '@mantine/core';
import {
  GDS_CONTROL_HEIGHT_EXCEPTIONS, GDS_CONTROL_SIZES, GDS_DEFAULT_DENSITY_AXIS,
  GDS_DEFAULT_SHAPE_AXIS, GDS_RADIUS_ROLES, GDS_RADIUS_STEPS, GDS_SPACE_STEPS, GdsAxisError,
  gdsRadius, resolveGdsDensityTokens, resolveGdsShapeTokens, validateGdsShapeAxis,
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

describe('density axis (issue 556)', () => {
  it('reproduces Mantine\'s spacing values exactly, scale factor included', () => {
    for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      expect(GDS_DEFAULT_DENSITY_AXIS.scale[step]).toBe(DEFAULT_THEME.spacing[step]);
      expect(gdsTheme.spacing[step]).toBe(DEFAULT_THEME.spacing[step]);
    }
  });

  it('emits every space step and control height in every preset', () => {
    for (const { id } of getGdsVibeThemes()) {
      const vars = getGdsVibeThemeCssVariables(id, 'light');
      for (const step of GDS_SPACE_STEPS) expect(vars[`--gds-space-${step}`]).toBeTruthy();
      for (const size of GDS_CONTROL_SIZES) expect(vars[`--gds-control-height-${size}`]).toBeTruthy();
      expect(vars['--gds-density']).toBe('comfortable');
    }
  });

  it('rejects a theme that DECLARES a control below the 44px floor', () => {
    expect(() => resolveGdsDensityTokens(
      { ...GDS_DEFAULT_DENSITY_AXIS, controlHeights: { ...GDS_DEFAULT_DENSITY_AXIS.controlHeights, md: '30px' } },
      'probe',
    )).toThrow(/declared as 30px, below the 44px target floor/);
  });

  it('CLAMPS a control at the floor under compact density instead of banning the mode', () => {
    // 44px x 0.75 = 33px. Throwing here would make `compact` unusable with any accessible
    // control set — the floor would have quietly banned a whole density mode rather than
    // protecting it. Spacing tightens; hit targets hold their line.
    const compact = resolveGdsDensityTokens({ ...GDS_DEFAULT_DENSITY_AXIS, mode: 'compact' }, 'probe');
    expect(compact['--gds-control-height-md']).toBe('44px');
    expect(compact['--gds-space-md']).toContain('0.75');
  });

  it('lets xs and sm scale below the floor, because their exception says they are not primary targets', () => {
    const compact = resolveGdsDensityTokens({ ...GDS_DEFAULT_DENSITY_AXIS, mode: 'compact' }, 'probe');
    expect(compact['--gds-control-height-xs']).toBe('24px');
    expect(GDS_CONTROL_HEIGHT_EXCEPTIONS.xs).toBeTruthy();
  });

  it('rejects a density factor outside [0.5, 2]', () => {
    expect(() => resolveGdsDensityTokens({ ...GDS_DEFAULT_DENSITY_AXIS, factors: { compact: 0.2, spacious: 1.25 } }, 'probe'))
      .toThrow(/must be between 0.5 and 2/);
  });

  it('scales spacing by mode while preserving calc() references', () => {
    const spacious = resolveGdsDensityTokens({ ...GDS_DEFAULT_DENSITY_AXIS, mode: 'spacious' }, 'probe');
    // Wrapped rather than flattened: multiplying the numbers out would discard
    // var(--mantine-scale) and change what renders at non-default scales.
    expect(spacious['--gds-space-md']).toContain('var(--mantine-scale)');
    expect(spacious['--gds-space-md']).toContain('1.25');
    expect(spacious['--gds-density']).toBe('spacious');
  });
});
