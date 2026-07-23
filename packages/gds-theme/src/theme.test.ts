import { describe, expect, it } from 'vitest';
import { gdsTheme } from './theme';

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
