import { describe, expect, it } from 'vitest';
import { mergeThemeOverrides } from '@mantine/core';
import type { MantineThemeOverride } from '@mantine/core';
import { mergeGdsThemeOverrides } from './merge-theme-overrides';
import { gdsTheme, withGdsMotion } from './theme';

const cases: MantineThemeOverride[][] = [
  [],
  [{ primaryColor: 'violet' }],
  [{ primaryColor: 'violet' }, { primaryColor: 'teal', fontFamily: 'Inter' }],
  [{ components: { Button: { defaultProps: { size: 'sm' } } } }, { components: { Button: { defaultProps: { radius: 'md' } }, Card: { defaultProps: { withBorder: true } } } }],
  [{ colors: { brand: ['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999'] } }, { colors: { brand: ['#fff', '#eee', '#ddd', '#ccc', '#bbb', '#aaa', '#a1a1a1', '#a2a2a2', '#a3a3a3', '#a4a4a4'] } }],
  [{ other: { list: [1, 2, 3], nested: { a: 1 } } }, { other: { list: [4], nested: { b: 2 } } }],
  [{ other: { value: { a: 1 } } }, { other: { value: null } }],
];

describe('mergeGdsThemeOverrides (#1002)', () => {
  it('produces exactly what Mantine’s mergeThemeOverrides produces', () => {
    for (const overrides of cases) {
      expect(mergeGdsThemeOverrides(...overrides)).toEqual(mergeThemeOverrides(...overrides));
    }
  });

  it('replaces arrays instead of merging them, and does not mutate its inputs', () => {
    const first: MantineThemeOverride = { other: { list: [1, 2] } };
    const second: MantineThemeOverride = { other: { list: [3] } };
    expect(mergeGdsThemeOverrides(first, second)).toEqual({ other: { list: [3] } });
    expect(first).toEqual({ other: { list: [1, 2] } });
  });

  it('builds the same composed themes as before', () => {
    expect(withGdsMotion()).toEqual(mergeThemeOverrides(gdsTheme, withGdsMotion()));
  });
});
