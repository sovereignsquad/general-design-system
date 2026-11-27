import type { MantineThemeOverride } from '@mantine/core';

function isPlainObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item) && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge<T extends object>(target: T, source: unknown): T {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (isPlainObject(value)) {
        result[key] = key in target ? deepMerge(result[key] as object, value) : value;
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

/**
 * Merges Mantine theme overrides left to right, with the semantics of Mantine's
 * `mergeThemeOverrides`: plain objects merge recursively; arrays and every other value are
 * replaced. Mantine's version lives in a `'use client'` module, so a Server Component bundle
 * cannot call it; GDS builds its themes when a module loads, including from the `/server`
 * entries, so it uses this one.
 */
export function mergeGdsThemeOverrides(...overrides: MantineThemeOverride[]): MantineThemeOverride {
  return overrides.reduce<MantineThemeOverride>((acc, override) => deepMerge(acc, override), {});
}
