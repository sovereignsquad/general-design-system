import type { MantineThemeOverride } from '@mantine/core';
import { createPublicBrandTheme, extendGdsTheme, gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme } from './theme';

export type GdsThemePresetId =
  | 'default'
  | 'dark-public'
  | 'flat-surface'
  | 'editorial'
  | 'brand'
  | 'sunset'
  | 'oceanic'
  | 'forest'
  | 'ruby'
  | 'amber'
  | 'neon-night'
  | 'skyline';

export interface GdsThemePreset {
  id: GdsThemePresetId;
  label: string;
  description: string;
  runtimeLane: string;
}

function createVibrantPresetTheme(primaryColor: string, options: { darkForward?: boolean } = {}): MantineThemeOverride {
  const darkSurface = options.darkForward
    ? `color-mix(in srgb, var(--mantine-color-${primaryColor}-9) 18%, var(--mantine-color-dark-8))`
    : 'var(--mantine-color-dark-8)';

  return extendGdsTheme({
    primaryColor,
    components: {
      AppShell: {
        styles: {
          main: {
            background: `light-dark(color-mix(in srgb, var(--mantine-color-${primaryColor}-0) 58%, var(--mantine-color-white)), ${darkSurface})`,
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

const customPresetThemes: Record<Exclude<GdsThemePresetId, 'default' | 'dark-public' | 'flat-surface' | 'editorial' | 'brand'>, MantineThemeOverride> = {
  sunset: createVibrantPresetTheme('orange'),
  oceanic: createVibrantPresetTheme('cyan'),
  forest: createVibrantPresetTheme('green'),
  ruby: createVibrantPresetTheme('red'),
  amber: createVibrantPresetTheme('yellow'),
  'neon-night': createVibrantPresetTheme('lime', { darkForward: true }),
  skyline: createVibrantPresetTheme('indigo'),
};

const themePresetCatalog: GdsThemePreset[] = [
  { id: 'default', label: 'Default runtime theme', description: 'Balanced, neutral baseline lane.', runtimeLane: 'gdsTheme' },
  { id: 'dark-public', label: 'Dark public theme', description: 'Dark-first public lane.', runtimeLane: 'gdsDarkPublicTheme' },
  { id: 'flat-surface', label: 'Flat surface theme', description: 'Lower-elevation operational lane.', runtimeLane: 'gdsFlatSurfaceTheme' },
  { id: 'editorial', label: 'Editorial serif theme', description: 'Reading-first, serif headline lane.', runtimeLane: 'gdsEditorialPublicTheme' },
  { id: 'brand', label: 'Brand theme generator', description: 'Governed brand composition lane.', runtimeLane: 'createPublicBrandTheme(...)' },
  { id: 'sunset', label: 'Sunset pulse', description: 'Warm orange-magenta vibrant lane.', runtimeLane: 'extendGdsTheme(primary=orange)' },
  { id: 'oceanic', label: 'Oceanic wave', description: 'Cool cyan-blue vibrant lane.', runtimeLane: 'extendGdsTheme(primary=cyan)' },
  { id: 'forest', label: 'Forest signal', description: 'Natural emerald-driven vibrant lane.', runtimeLane: 'extendGdsTheme(primary=green)' },
  { id: 'ruby', label: 'Ruby spark', description: 'Bold red high-contrast lane.', runtimeLane: 'extendGdsTheme(primary=red)' },
  { id: 'amber', label: 'Amber glow', description: 'Golden yellow energetic lane.', runtimeLane: 'extendGdsTheme(primary=yellow)' },
  { id: 'neon-night', label: 'Neon night', description: 'Lime-accented dark-forward lane.', runtimeLane: 'extendGdsTheme(primary=lime)' },
  { id: 'skyline', label: 'Skyline indigo', description: 'Indigo technology-forward lane.', runtimeLane: 'extendGdsTheme(primary=indigo)' },
];

export function getGdsThemePresets() {
  return themePresetCatalog;
}

export function resolveGdsThemePreset(id: GdsThemePresetId, options?: { brandPrimary?: string; brandFlatSurfaces?: boolean; brandEditorialSerif?: boolean }): MantineThemeOverride {
  switch (id) {
    case 'default':
      return gdsTheme;
    case 'dark-public':
      return gdsDarkPublicTheme;
    case 'flat-surface':
      return gdsFlatSurfaceTheme;
    case 'editorial':
      return gdsEditorialPublicTheme;
    case 'brand':
      return createPublicBrandTheme({
        editorialSerif: options?.brandEditorialSerif ?? false,
        flatSurfaces: options?.brandFlatSurfaces ?? true,
        overrides: { primaryColor: options?.brandPrimary ?? 'blue' },
      });
    default:
      return customPresetThemes[id] ?? gdsTheme;
  }
}
