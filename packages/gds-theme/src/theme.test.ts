import { describe, expect, it } from 'vitest';
import { gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme } from './theme';

describe('gdsTheme Input.vars mobile input-zoom guard', () => {
  const resolveInputFz = (size?: string) =>
    gdsTheme.components.Input.vars(gdsTheme, { size }).wrapper['--input-fz'];

  it('floors the effective font-size to at least 16px for the implicit default and xs/sm sizes', () => {
    expect(resolveInputFz(undefined)).toBe('max(1rem, var(--mantine-font-size-sm))');
    expect(resolveInputFz('xs')).toBe('max(1rem, var(--mantine-font-size-sm))');
    expect(resolveInputFz('sm')).toBe('max(1rem, var(--mantine-font-size-sm))');
  });

  it('leaves md/lg/xl sizes untouched (already >=16px), falling through to the Mantine default', () => {
    expect(resolveInputFz('md')).toBeUndefined();
    expect(resolveInputFz('lg')).toBeUndefined();
    expect(resolveInputFz('xl')).toBeUndefined();
  });
});

describe('gdsTheme overlay elevation scale (#395)', () => {
  it('gives Popover (and everything built on it — Menu, HoverCard, Select/Combobox dropdowns) an explicit documented shadow tier', () => {
    expect(gdsTheme.components.Popover.defaultProps).toEqual({ shadow: 'md' });
  });

  it('does not touch shadows.sm, which Card already depends on for its own established default', () => {
    expect(gdsTheme.components.Card.defaultProps).toMatchObject({ shadow: 'sm' });
  });

  it('publishes explicit md/lg overlay shadow values rather than leaving them at silent Mantine defaults', () => {
    expect(gdsTheme.shadows.md).toBe('0 8px 24px rgba(15, 23, 42, 0.08)');
    expect(gdsTheme.shadows.lg).toBe('0 16px 40px rgba(15, 23, 42, 0.12)');
  });
});

describe('gdsTheme NavLink touch-target floor (#629)', () => {
  it('resolves NavLink row height from the governed control-height token, not a restated number', () => {
    expect(gdsTheme.components.NavLink.styles.root.minHeight).toBe('var(--gds-control-height-md)');
  });

  it('keeps the floor on every shipped lane, since a lane that dropped it would reintroduce the defect site-wide', () => {
    for (const lane of [gdsDarkPublicTheme, gdsFlatSurfaceTheme, gdsEditorialPublicTheme]) {
      expect(lane.components.NavLink.styles.root.minHeight).toBe('var(--gds-control-height-md)');
    }
  });
});
