import type { MantineThemeOverride } from '@mantine/core';
import { extendGdsTheme } from '../theme';

/** Mantine theme for a vibrant colour lane: the GDS theme with tinted shell surfaces from one Mantine colour. */
export function createVibrantPresetTheme(primaryColor: string): MantineThemeOverride {
  return extendGdsTheme({
    primaryColor,
    components: {
      AppShell: {
        styles: {
          main: {
            background: `light-dark(color-mix(in srgb, var(--mantine-color-${primaryColor}-0) 58%, var(--mantine-color-white)), var(--mantine-color-dark-8))`,
          },
          header: {
            background: `light-dark(color-mix(in srgb, var(--mantine-color-${primaryColor}-0) 68%, var(--mantine-color-white)), var(--mantine-color-dark-8))`,
            borderColor: `light-dark(var(--mantine-color-${primaryColor}-2), var(--mantine-color-dark-5))`,
          },
          navbar: {
            background: `light-dark(color-mix(in srgb, var(--mantine-color-${primaryColor}-0) 48%, var(--mantine-color-white)), var(--mantine-color-dark-8))`,
            borderColor: `light-dark(var(--mantine-color-${primaryColor}-2), var(--mantine-color-dark-5))`,
          },
        },
      },
      Card: {
        styles: {
          root: {
            background: `light-dark(var(--mantine-color-white), color-mix(in srgb, var(--mantine-color-${primaryColor}-9) 10%, var(--mantine-color-dark-7)))`,
            borderColor: `light-dark(var(--mantine-color-${primaryColor}-2), var(--mantine-color-dark-4))`,
          },
        },
      },
      Paper: {
        styles: {
          root: {
            background: `light-dark(color-mix(in srgb, var(--mantine-color-${primaryColor}-0) 16%, var(--mantine-color-white)), color-mix(in srgb, var(--mantine-color-${primaryColor}-9) 8%, var(--mantine-color-dark-7)))`,
            borderColor: `light-dark(var(--mantine-color-${primaryColor}-2), var(--mantine-color-dark-4))`,
          },
        },
      },
    },
  });
}
