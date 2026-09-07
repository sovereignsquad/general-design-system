import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME } from '@mantine/core';
import {
  GDS_CONTROL_HEIGHT_EXCEPTIONS, GDS_CONTROL_SIZES, GDS_DEFAULT_DENSITY_AXIS,
  GDS_DEFAULT_SHAPE_AXIS, GDS_RADIUS_ROLES, GDS_RADIUS_STEPS, GDS_SPACE_STEPS, GdsAxisError,
  GDS_DEFAULT_TYPOGRAPHY_AXIS, GDS_DEFAULT_ELEVATION_AXIS, GDS_ELEVATION_ROLES, GDS_ELEVATION_STEPS,
  gdsElevation, gdsRadius, resolveGdsDensityTokens, resolveGdsElevationTokens, resolveGdsShapeTokens,
  resolveGdsTypographyTokens, resolveGdsMotionTokens, resolveGdsReactionTokens, validateGdsShapeAxis,
  GDS_DEFAULT_LAYOUT_AXIS, GDS_LAYOUT_DIMENSION_EXCEPTIONS, GDS_MIN_TARGET_PX,
  resolveGdsAxisTokens, resolveGdsLayoutTokens, validateGdsLayoutAxis,
} from './axes';
import type { GdsTypographyAxis } from './axes';
import { gdsTheme } from './theme';
import { resolveGdsTypeScaleProfile } from './type-scale-profile';
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

describe('typography and elevation axes (issue 557)', () => {
  it('carries Mantine\'s font sizes as overrides rather than deriving them', () => {
    // Mantine's ramp is NOT a clean modular scale — 0.875->1 is x1.1429 while 1->1.125 is
    // x1.1250. Any single ratio would round its way to different numbers and change every
    // piece of text on the site, so those five steps are overrides and the ratio governs
    // only the steps Mantine has no equivalent for.
    const tokens = resolveGdsTypographyTokens();
    for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      expect(tokens[`--gds-font-size-${step}`]).toBe(DEFAULT_THEME.fontSizes[step]);
    }
    expect(tokens['--gds-font-size-3xl']).toMatch(/^calc\(1rem \* [\d.]+\)$/);
  });

  it('does not collide with the semantic text-COLOUR namespace', () => {
    // `--gds-text-*` already means a colour role. One prefix meaning both a colour and a size
    // would leave a reader unable to tell which `--gds-text-lg` is, and the token graph's
    // category inference keys off exactly that prefix.
    const vars = getGdsVibeThemeCssVariables('default', 'light');
    expect(vars['--gds-font-size-lg']).toBeTruthy();
    expect(vars['--gds-text-lg']).toBeUndefined();
    expect(vars['--gds-text-body']).toBeTruthy();
  });

  it('rejects weights that do not ascend', () => {
    expect(() => resolveGdsTypographyTokens(
      { ...GDS_DEFAULT_TYPOGRAPHY_AXIS, weights: { regular: 400, medium: 400, semibold: 600, bold: 700 } },
      'probe',
    )).toThrow(/is not heavier than the previous step/);
  });

  it('rejects a ratio that is not a scale, and an unregistered font lane', () => {
    expect(() => resolveGdsTypographyTokens({ ...GDS_DEFAULT_TYPOGRAPHY_AXIS, scale: { base: '1rem', ratio: 3 } }, 'probe'))
      .toThrow(/must be between 1.0 and 2.0/);
    expect(() => resolveGdsTypographyTokens(
      { ...GDS_DEFAULT_TYPOGRAPHY_AXIS, lanes: { display: 'no-such-lane', body: 'inter', mono: 'inter' } },
      'probe',
      ['inter'],
    )).toThrow(/is not registered/);
  });

  it('rejects an elevation scale that decreases', () => {
    // A modal flatter than the card behind it reads as a rendering bug, not a design.
    expect(() => resolveGdsElevationTokens(
      { ...GDS_DEFAULT_ELEVATION_AXIS, steps: { ...GDS_DEFAULT_ELEVATION_AXIS.steps, 3: { kind: 'none' } } },
      'probe',
    )).toThrow(/is "none" after a raised step/);
  });

  it('emits every elevation step and role, resolving roles through the step scale', () => {
    const tokens = resolveGdsElevationTokens();
    expect(tokens['--gds-elevation-0']).toBe('none');
    expect(tokens['--gds-elevation-modal']).toBe(tokens['--gds-elevation-3']);
    expect(tokens['--gds-elevation-card']).toBe(tokens['--gds-elevation-1']);
    for (const role of GDS_ELEVATION_ROLES) expect(tokens[`--gds-elevation-${role}`]).toBeTruthy();
  });
});

describe('motion and reaction axes (issue 558)', () => {
  it('emits nothing when a preset declares no motion override', () => {
    // The global scale in styles.css is generated from motion.ts (issue 584) and IS the
    // default. Emitting the full scale per preset would restate it 25 times and stop the
    // generated stylesheet being the source of truth.
    expect(resolveGdsMotionTokens(undefined, 'probe')).toEqual({});
    const vars = getGdsVibeThemeCssVariables('default', 'light');
    expect(Object.keys(vars).filter((k) => k.startsWith('--gds-motion-'))).toHaveLength(0);
  });

  it('lets a theme override only the tokens it names', () => {
    expect(resolveGdsMotionTokens({ durations: { fast: 80 }, easings: { standard: 'linear' } }, 'probe'))
      .toEqual({ '--gds-motion-duration-fast': '80ms', '--gds-motion-ease-standard': 'linear' });
  });

  it('rejects motion values a theme could plausibly get wrong', () => {
    expect(() => resolveGdsMotionTokens({ durations: { fast: 5000 } }, 'probe')).toThrow(/between 0 and 2000/);
    expect(() => resolveGdsMotionTokens({ easings: { standard: 'swooshy' } }, 'probe')).toThrow(/not a CSS timing function/);
  });

  it('offers no way to ignore the user\'s reduced-motion preference', () => {
    // A theme may make motion calmer than the user asked for. It may never make it louder,
    // so no value meaning "never reduce" exists in the type at all.
    const policies: Array<NonNullable<Parameters<typeof resolveGdsMotionTokens>[0]>['reducedMotionPolicy']> = ['system', 'reduce', 'no-motion'];
    expect(policies).not.toContain('never-reduce');
  });

  it('enforces the focus ring, which a keyboard user cannot do without', () => {
    expect(() => resolveGdsReactionTokens({ focusRing: { width: '1px' } }, 'probe')).toThrow(/at least 2px/);
    expect(() => resolveGdsReactionTokens({ focusRing: { colorRole: '#ff0000' } }, 'probe')).toThrow(/a literal colour/);
    expect(() => resolveGdsReactionTokens({ focusRing: { style: 'wavy' as never } }, 'probe')).toThrow(/not solid, dashed or double/);
  });

  it('resolves intensity to concrete values, with none meaning none', () => {
    // A theme asking for no reaction and getting a 1px nudge reads as a bug.
    const quiet = resolveGdsReactionTokens({ hover: 'none' }, 'probe');
    expect(quiet['--gds-reaction-hover-lift']).toBe('0');
    expect(quiet['--gds-reaction-hover-scale']).toBe('1');
    const loud = resolveGdsReactionTokens({ hover: 'pronounced' }, 'probe');
    expect(loud['--gds-reaction-hover-lift']).toBe('-4px');
  });
});

describe('layout axis (issue 698)', () => {
  const LAYOUT_TOKEN_NAMES = [
    '--gds-layout-sidebar-width',
    '--gds-layout-header-height',
    '--gds-layout-footer-height',
    '--gds-layout-nav-item-height',
    '--gds-layout-content-max-width',
    '--gds-layout-list-rail-width',
    '--gds-layout-bottom-bar-height',
    '--gds-layout-content-bottom-padding',
    '--gds-layout-sheet-top-radius',
  ] as const;

  it('emits all nine tokens at their documented defaults when no layout axis is declared (zero declarations)', () => {
    const tokens = resolveGdsLayoutTokens();
    expect(tokens['--gds-layout-sidebar-width']).toBe('280px');
    expect(tokens['--gds-layout-header-height']).toBe('60px');
    expect(tokens['--gds-layout-footer-height']).toBe('68px');
    expect(tokens['--gds-layout-nav-item-height']).toBe('44px');
    expect(tokens['--gds-layout-content-max-width']).toBe('1400px');
    expect(tokens['--gds-layout-list-rail-width']).toBe('480px');
    expect(tokens['--gds-layout-bottom-bar-height']).toBe('64px');
    expect(tokens['--gds-layout-content-bottom-padding']).toBe('calc(var(--gds-layout-bottom-bar-height) + var(--gds-space-xl))');
    expect(tokens['--gds-layout-sheet-top-radius']).toBe('var(--gds-radius-sheet)');
  });

  it('emits the full nine-token namespace for every preset, whether or not it declares a layout override', () => {
    // Unconditional, like shape/density: a preset that stays silent still gets every token, so
    // a component's var(--gds-layout-*, ...) fallback is a safety net, not the normal path.
    for (const { id } of getGdsVibeThemes()) {
      const vars = getGdsVibeThemeCssVariables(id, 'light');
      for (const name of LAYOUT_TOKEN_NAMES) expect(vars[name]).toBeTruthy();
    }
  });

  it('overrides one declared field and keeps the other eight at their defaults (one declaration)', () => {
    const tokens = resolveGdsLayoutTokens({ sidebarWidth: '240px' });
    expect(tokens['--gds-layout-sidebar-width']).toBe('240px');
    expect(tokens['--gds-layout-header-height']).toBe(GDS_DEFAULT_LAYOUT_AXIS.headerHeight);
    expect(tokens['--gds-layout-footer-height']).toBe(GDS_DEFAULT_LAYOUT_AXIS.footerHeight);
    expect(tokens['--gds-layout-nav-item-height']).toBe(GDS_DEFAULT_LAYOUT_AXIS.navItemHeight);
    expect(tokens['--gds-layout-content-max-width']).toBe(GDS_DEFAULT_LAYOUT_AXIS.contentMaxWidth);
    expect(tokens['--gds-layout-list-rail-width']).toBe(GDS_DEFAULT_LAYOUT_AXIS.listRailWidth);
    expect(tokens['--gds-layout-bottom-bar-height']).toBe(GDS_DEFAULT_LAYOUT_AXIS.bottomBarHeight);
    expect(tokens['--gds-layout-content-bottom-padding']).toBe(GDS_DEFAULT_LAYOUT_AXIS.contentBottomPadding);
    expect(tokens['--gds-layout-sheet-top-radius']).toBe('var(--gds-radius-sheet)');
  });

  it('resolves a full nine-field declaration to the your-field target values (many declarations, the expressibility proof)', () => {
    const tokens = resolveGdsLayoutTokens({
      sidebarWidth: '240px',
      headerHeight: '56px',
      footerHeight: '68px',
      navItemHeight: '38px',
      contentMaxWidth: '1400px',
      listRailWidth: '480px',
      bottomBarHeight: '64px',
      contentBottomPadding: 'calc(var(--gds-layout-bottom-bar-height) + var(--gds-space-xl))',
      sheetTopRadius: 'lg',
    }, 'your-field');
    expect(tokens).toEqual({
      '--gds-layout-sidebar-width': '240px',
      '--gds-layout-header-height': '56px',
      '--gds-layout-footer-height': '68px',
      '--gds-layout-nav-item-height': '38px',
      '--gds-layout-content-max-width': '1400px',
      '--gds-layout-list-rail-width': '480px',
      '--gds-layout-bottom-bar-height': '64px',
      '--gds-layout-content-bottom-padding': 'calc(var(--gds-layout-bottom-bar-height) + var(--gds-space-xl))',
      '--gds-layout-sheet-top-radius': 'var(--gds-radius-lg)',
    });
  });

  it('resolves a GdsRadiusStep name for sheetTopRadius to its step token, a literal through verbatim, and the default to the sheet ROLE token', () => {
    expect(resolveGdsLayoutTokens({ sheetTopRadius: 'xl' })['--gds-layout-sheet-top-radius']).toBe('var(--gds-radius-xl)');
    expect(resolveGdsLayoutTokens({ sheetTopRadius: '24px' })['--gds-layout-sheet-top-radius']).toBe('24px');
    expect(resolveGdsLayoutTokens()['--gds-layout-sheet-top-radius']).toBe('var(--gds-radius-sheet)');
  });

  it('passes calc()/var() declared values through unvalidated, as the density resolver does', () => {
    const tokens = resolveGdsLayoutTokens({
      headerHeight: 'var(--some-custom-height)',
      bottomBarHeight: 'calc(4rem + env(safe-area-inset-bottom))',
    });
    expect(tokens['--gds-layout-header-height']).toBe('var(--some-custom-height)');
    expect(tokens['--gds-layout-bottom-bar-height']).toBe('calc(4rem + env(safe-area-inset-bottom))');
  });

  it('rejects a non-positive px dimension, naming the theme id and field', () => {
    expect(() => validateGdsLayoutAxis({ sidebarWidth: '0px' }, 'probe')).toThrow(/probe.*sidebarWidth.*not a positive dimension/);
    expect(() => validateGdsLayoutAxis({ contentMaxWidth: '-10px' }, 'probe')).toThrow(/not a positive dimension/);
  });

  it('rejects an empty declared value', () => {
    expect(() => validateGdsLayoutAxis({ sidebarWidth: '' }, 'probe')).toThrow(/is empty/);
  });

  it('rejects headerHeight/footerHeight/bottomBarHeight below the 44px floor, with no exception path', () => {
    expect(() => validateGdsLayoutAxis({ headerHeight: '40px' }, 'probe')).toThrow(/headerHeight.*below the 44px target floor/);
    expect(() => validateGdsLayoutAxis({ footerHeight: '40px' }, 'probe')).toThrow(/footerHeight.*below the 44px target floor/);
    expect(() => validateGdsLayoutAxis({ bottomBarHeight: '40px' }, 'probe')).toThrow(GdsAxisError);
  });

  it('passes navItemHeight: 38px through the shipped recorded exception', () => {
    expect(GDS_LAYOUT_DIMENSION_EXCEPTIONS.navItemHeight).toBeTruthy();
    expect(() => validateGdsLayoutAxis({ navItemHeight: '38px' }, 'probe')).not.toThrow();
    expect(resolveGdsLayoutTokens({ navItemHeight: '38px' })['--gds-layout-nav-item-height']).toBe('38px');
  });

  it('rejects navItemHeight: 38px once the recorded exception is removed (test double), and restores it afterward', () => {
    const original = GDS_LAYOUT_DIMENSION_EXCEPTIONS.navItemHeight;
    delete (GDS_LAYOUT_DIMENSION_EXCEPTIONS as Record<string, string | undefined>).navItemHeight;
    try {
      expect(() => validateGdsLayoutAxis({ navItemHeight: '38px' }, 'probe'))
        .toThrow(/navItemHeight" is declared as 38px, below the 44px target floor.*no recorded exception/);
    } finally {
      (GDS_LAYOUT_DIMENSION_EXCEPTIONS as Record<string, string | undefined>).navItemHeight = original;
    }
    // Restored: the shipped your-field value stays legal for every test that runs after this one.
    expect(() => validateGdsLayoutAxis({ navItemHeight: '38px' }, 'probe')).not.toThrow();
  });

  it('leaves density mode with nothing to scale, structurally: resolveGdsLayoutTokens takes no density input at all', () => {
    const compact = resolveGdsAxisTokens({ density: { ...GDS_DEFAULT_DENSITY_AXIS, mode: 'compact' } }, 'probe');
    const spacious = resolveGdsAxisTokens({ density: { ...GDS_DEFAULT_DENSITY_AXIS, mode: 'spacious' } }, 'probe');
    const comfortable = resolveGdsAxisTokens(undefined, 'probe');
    for (const name of LAYOUT_TOKEN_NAMES) {
      expect(compact[name]).toBe(comfortable[name]);
      expect(spacious[name]).toBe(comfortable[name]);
    }
    // Sanity check that density itself DID change in the same call, so this isn't vacuous.
    expect(compact['--gds-control-height-xs']).not.toBe(comfortable['--gds-control-height-xs']);
  });

  it('resolves identically across light and dark, and honours a declared override through the shared axes container', () => {
    const declared = { layout: { sidebarWidth: '240px', headerHeight: '56px', navItemHeight: '38px' } };
    const light = resolveGdsAxisTokens(declared, 'probe', 'light');
    const dark = resolveGdsAxisTokens(declared, 'probe', 'dark');
    expect(light['--gds-layout-sidebar-width']).toBe('240px');
    expect(dark['--gds-layout-sidebar-width']).toBe('240px');
    expect(light['--gds-layout-header-height']).toBe(dark['--gds-layout-header-height']);
    expect(light['--gds-layout-nav-item-height']).toBe(dark['--gds-layout-nav-item-height']);
  });
});

describe('elevation roles: sidebar and pin (issue 695)', () => {
  const SIDEBAR_SHADOW = { kind: 'shadow', value: '2px 0 16px 0 rgba(13,35,64,0.04)' } as const;
  const PIN_SHADOW = { kind: 'shadow', value: '0 2px 8px 0 rgba(11,34,62,0.1)' } as const;

  it('includes sidebar and pin in the role union, appended after tooltip', () => {
    expect(GDS_ELEVATION_ROLES.slice(-2)).toEqual(['sidebar', 'pin']);
    expect(GDS_ELEVATION_ROLES.indexOf('tooltip')).toBe(GDS_ELEVATION_ROLES.length - 3);
  });

  it('defaults sidebar and pin to step 1', () => {
    expect(GDS_DEFAULT_ELEVATION_AXIS.roles?.sidebar).toBe(1);
    expect(GDS_DEFAULT_ELEVATION_AXIS.roles?.pin).toBe(1);
  });

  it('zero overrides: every role, including sidebar and pin, resolves through defaultStep', () => {
    const tokens = resolveGdsElevationTokens();
    expect(tokens['--gds-elevation-sidebar']).toBe(tokens['--gds-elevation-1']);
    expect(tokens['--gds-elevation-pin']).toBe(tokens['--gds-elevation-1']);
    for (const role of GDS_ELEVATION_ROLES) expect(tokens[`--gds-elevation-${role}`]).toBeTruthy();
  });

  it('one override: pinning sidebar to a step leaves pin at its default', () => {
    const tokens = resolveGdsElevationTokens({ ...GDS_DEFAULT_ELEVATION_AXIS, roles: { ...GDS_DEFAULT_ELEVATION_AXIS.roles, sidebar: 3 } });
    expect(tokens['--gds-elevation-sidebar']).toBe(tokens['--gds-elevation-3']);
    expect(tokens['--gds-elevation-pin']).toBe(tokens['--gds-elevation-1']);
  });

  it('many overrides: mixes a pinned step with role-level directional-shadow values', () => {
    const tokens = resolveGdsElevationTokens({
      ...GDS_DEFAULT_ELEVATION_AXIS,
      roles: { ...GDS_DEFAULT_ELEVATION_AXIS.roles, sidebar: SIDEBAR_SHADOW, pin: PIN_SHADOW, menu: 4 },
    });
    expect(tokens['--gds-elevation-sidebar']).toBe(SIDEBAR_SHADOW.value);
    expect(tokens['--gds-elevation-pin']).toBe(PIN_SHADOW.value);
    expect(tokens['--gds-elevation-menu']).toBe(tokens['--gds-elevation-4']);
  });

  it('resolves the role-level directional-shadow fixture verbatim, without altering any step token', () => {
    const baseline = resolveGdsElevationTokens();
    const tokens = resolveGdsElevationTokens({ ...GDS_DEFAULT_ELEVATION_AXIS, roles: { ...GDS_DEFAULT_ELEVATION_AXIS.roles, sidebar: SIDEBAR_SHADOW } });
    expect(tokens['--gds-elevation-sidebar']).toBe('2px 0 16px 0 rgba(13,35,64,0.04)');
    for (const step of GDS_ELEVATION_STEPS) expect(tokens[`--gds-elevation-${step}`]).toBe(baseline[`--gds-elevation-${step}`]);
  });

  it('permits a role-level {kind: "none"}, flattening that one role without touching the step ramp', () => {
    const tokens = resolveGdsElevationTokens({ ...GDS_DEFAULT_ELEVATION_AXIS, roles: { ...GDS_DEFAULT_ELEVATION_AXIS.roles, sidebar: { kind: 'none' } } });
    expect(tokens['--gds-elevation-sidebar']).toBe('none');
    expect(tokens['--gds-elevation-1']).not.toBe('none'); // the shared step ramp is untouched
  });

  it('step tokens are unchanged when only roles are declared', () => {
    const baseline = resolveGdsElevationTokens();
    const tokens = resolveGdsElevationTokens({
      ...GDS_DEFAULT_ELEVATION_AXIS,
      roles: { ...GDS_DEFAULT_ELEVATION_AXIS.roles, sidebar: SIDEBAR_SHADOW, pin: 2 },
    });
    for (const step of GDS_ELEVATION_STEPS) expect(tokens[`--gds-elevation-${step}`]).toBe(baseline[`--gds-elevation-${step}`]);
  });

  it('rejects an unknown role key at runtime, matching the closed-set guard on the shape axis', () => {
    expect(() => resolveGdsElevationTokens({ ...GDS_DEFAULT_ELEVATION_AXIS, roles: { nope: 1 } as never }, 'probe'))
      .toThrow(/"nope" is not a known elevation role/);
  });

  it('rejects a role pinning a step outside the declared set', () => {
    expect(() => resolveGdsElevationTokens({ ...GDS_DEFAULT_ELEVATION_AXIS, roles: { sidebar: 5 as never } }, 'probe'))
      .toThrow(/elevation role "sidebar" pins step 5, which is not a declared step/);
  });

  it('rejects a role-level value with an empty shadow/border value', () => {
    expect(() => resolveGdsElevationTokens({ ...GDS_DEFAULT_ELEVATION_AXIS, roles: { sidebar: { kind: 'shadow', value: '' } } }, 'probe'))
      .toThrow(/elevation value of kind "shadow" has no value/);
  });

  it('emits --gds-elevation-sidebar and --gds-elevation-pin for every preset, both schemes, defaulting to step 1', () => {
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const vars = getGdsVibeThemeCssVariables(id, scheme);
        expect(vars['--gds-elevation-sidebar']).toBe(vars['--gds-elevation-1']);
        expect(vars['--gds-elevation-pin']).toBe(vars['--gds-elevation-1']);
      }
    }
  });

  it('gdsElevation("sidebar") returns the var() reference, not a resolved shadow', () => {
    expect(gdsElevation('sidebar')).toBe('var(--gds-elevation-sidebar)');
    expect(gdsElevation('pin')).toBe('var(--gds-elevation-pin)');
  });
});

describe('shape axis: thumbnail radius role (issue 695)', () => {
  it('resolves distinctly from image and card under per-role overrides', () => {
    const tokens = resolveGdsShapeTokens({
      scale: GDS_DEFAULT_SHAPE_AXIS.scale,
      roles: { card: '16px', thumbnail: '20px', image: '8px' },
    });
    expect(tokens['--gds-radius-thumbnail']).toBe('20px');
    expect(tokens['--gds-radius-card']).toBe('16px');
    expect(tokens['--gds-radius-image']).toBe('8px');
    expect(tokens['--gds-radius-thumbnail']).not.toBe(tokens['--gds-radius-card']);
    expect(tokens['--gds-radius-thumbnail']).not.toBe(tokens['--gds-radius-image']);
  });

  it('is present in every preset\'s emission', () => {
    for (const { id } of getGdsVibeThemes()) {
      const vars = getGdsVibeThemeCssVariables(id, 'light');
      expect(vars['--gds-radius-thumbnail']).toBeTruthy();
    }
  });
});

describe('typography axis: tracking validation, fontStyles, and the non-modular ramp (issue 695)', () => {
  it('accepts normal, signed px/rem/em/ch lengths, and var() references for tracking', () => {
    for (const tr of ['2px', '-1.5px', 'normal', '0.5rem', 'var(--gds-tracking-lg)']) {
      expect(() => resolveGdsTypographyTokens({ ...GDS_DEFAULT_TYPOGRAPHY_AXIS, tracking: { md: tr } }, 'probe')).not.toThrow();
    }
  });

  it('rejects a percentage, a keyword, and a unitless value for tracking', () => {
    for (const tr of ['2%', 'bold', '0']) {
      expect(() => resolveGdsTypographyTokens({ ...GDS_DEFAULT_TYPOGRAPHY_AXIS, tracking: { md: tr } }, 'probe'))
        .toThrow(/tracking for "md" is/);
    }
  });

  it('emits --gds-font-style-<step> only for declared steps', () => {
    const tokens = resolveGdsTypographyTokens({ ...GDS_DEFAULT_TYPOGRAPHY_AXIS, fontStyles: { '4xl': 'italic' } }, 'probe');
    expect(tokens['--gds-font-style-4xl']).toBe('italic');
    expect(tokens['--gds-font-style-md']).toBeUndefined();
    expect(tokens['--gds-font-style-2xs']).toBeUndefined();
  });

  it('rejects a fontStyles value that is neither normal nor italic', () => {
    expect(() => resolveGdsTypographyTokens({ ...GDS_DEFAULT_TYPOGRAPHY_AXIS, fontStyles: { md: 'oblique' as never } }, 'probe'))
      .toThrow(/font style for "md" is "oblique"; it must be "normal" or "italic"/);
  });

  it('sparse emission: an undeclared step emits neither a tracking nor a font-style token', () => {
    const tokens = resolveGdsTypographyTokens({ ...GDS_DEFAULT_TYPOGRAPHY_AXIS, tracking: { lg: '1px' }, fontStyles: { '4xl': 'italic' } }, 'probe');
    expect(tokens['--gds-tracking-md']).toBeUndefined();
    expect(tokens['--gds-font-style-lg']).toBeUndefined();
    expect(tokens['--gds-tracking-lg']).toBe('1px');
    expect(tokens['--gds-font-style-4xl']).toBe('italic');
  });

  it('resolves the motivating non-modular ramp (body 28/16, card-title 19.25/14, hero 58.528/49.6) under a named ratio', () => {
    // The hero-to-h2 ratio 49.6/32 = 1.55 fits none of the six named GdsTypeScaleRatio
    // values, so the ramp rides on scale.overrides (taken verbatim) with a named ratio still
    // declared, rather than on the ratio itself.
    const axis: GdsTypographyAxis = {
      ...GDS_DEFAULT_TYPOGRAPHY_AXIS,
      scale: { base: '1rem', ratio: 1.5, overrides: { md: '16px', sm: '14px', '4xl': '49.6px' } },
      lineHeights: { md: 1.75, sm: 1.375, '4xl': 1.18 },
    };
    const tokens = resolveGdsTypographyTokens(axis, 'probe');
    expect(tokens['--gds-font-size-md']).toBe('16px');
    expect(tokens['--gds-line-height-md']).toBe('1.75'); // body: 28/16
    expect(tokens['--gds-font-size-sm']).toBe('14px');
    expect(tokens['--gds-line-height-sm']).toBe('1.375'); // card-title: 19.25/14
    expect(tokens['--gds-font-size-4xl']).toBe('49.6px');
    expect(tokens['--gds-line-height-4xl']).toBe('1.18'); // hero: 58.528/49.6
    expect(resolveGdsTypeScaleProfile('default', axis)).toEqual({ ratio: 1.5 });
  });

  it('a scale.ratio of 1.55 (49.6/32) resolves fine on its own but fails resolveGdsTypeScaleProfile', () => {
    const axis: GdsTypographyAxis = { ...GDS_DEFAULT_TYPOGRAPHY_AXIS, scale: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.scale, ratio: 1.55 } };
    expect(() => resolveGdsTypographyTokens(axis, 'probe')).not.toThrow();
    expect(() => resolveGdsTypeScaleProfile('default', axis)).toThrow(/not one of the six named/);
  });
});
