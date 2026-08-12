import { describe, expect, it } from 'vitest';
import { computeGdsThemeIdentity, gdsThemeIdentityChanged } from './theme-identity';
import { getGdsVibeThemes } from './vibe-themes';

describe('theme identity (issue 561)', () => {
  it('is stable for the same inputs', () => {
    // An identity that varied between calls would remount on every render.
    expect(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' }))
      .toBe(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' }));
  });

  it('is unique across every preset and scheme GDS ships', () => {
    // A collision means a switch that does not remount — the exact failure this exists to
    // prevent, and one that would look like "the theme half-applied".
    const seen = new Map<string, string>();
    for (const { id } of getGdsVibeThemes()) {
      for (const scheme of ['light', 'dark'] as const) {
        const identity = computeGdsThemeIdentity({ preset: id, colorScheme: scheme });
        expect(seen.has(identity)).toBe(false);
        seen.set(identity, `${id}/${scheme}`);
      }
    }
    expect(seen.size).toBe(getGdsVibeThemes().length * 2);
  });

  it('changes when ANY axis value changes, not just preset and scheme', () => {
    // Keying on `preset + scheme` would miss a theme that changes only its radius scale.
    // The identity hashes the resolved token set, so an axis change moves it.
    const base = computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' });
    const withAxis = computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light', extra: { radiusScale: 'sharp' } });
    expect(withAxis).not.toBe(base);
  });

  it('does not change for a declaration that resolves identically', () => {
    // A remount that repaints the world to arrive at the same pixels is cost without benefit.
    expect(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light', extra: { unset: undefined } }))
      .toBe(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' }));
  });

  it('is order-independent', () => {
    // An identity depending on object iteration order would remount at random and,
    // worse, occasionally fail to.
    expect(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light', extra: { a: '1', b: '2' } }))
      .toBe(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light', extra: { b: '2', a: '1' } }));
  });

  it('gives an unknown preset a distinct identity rather than throwing', () => {
    // Throwing during render turns a bad preset id into a blank page; a distinct identity
    // turns it into a wrong-but-visible theme, which a developer can actually see and fix.
    const unknown = computeGdsThemeIdentity({ preset: 'not-a-preset', colorScheme: 'light' });
    expect(unknown).toMatch(/^not-a-preset:light:/);
    expect(unknown).not.toBe(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' }));
  });

  it('reports a change only against a known previous identity', () => {
    // First render has no previous identity; treating that as a change would remount on mount.
    expect(gdsThemeIdentityChanged(undefined, 'a')).toBe(false);
    expect(gdsThemeIdentityChanged('a', 'a')).toBe(false);
    expect(gdsThemeIdentityChanged('a', 'b')).toBe(true);
  });
});
