import type { MantineThemeOverride } from '@mantine/core';
import { createPublicBrandTheme, extendGdsTheme, gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme } from './theme';
import { createBrandTheme } from './brand-tokens';

export type GdsThemePresetId =
  | 'default'
  | 'high-contrast'
  | 'colorblind-safe'
  | 'dark-public'
  | 'flat-surface'
  | 'editorial'
  | 'brand'
  | 'partner-discovery'
  | 'sunset'
  | 'oceanic'
  | 'forest'
  | 'ruby'
  | 'amber'
  | 'neon-night'
  | 'skyline'
  | 'aurora'
  | 'coral'
  | 'mint'
  | 'orchid'
  | 'royal'
  | 'cosmic'
  | 'warm'
  | 'athlete-gold'
  | 'class-usa'
  | 'gold-athlete';

export interface GdsThemePreset {
  id: GdsThemePresetId;
  label: string;
  description: string;
  runtimeLane: string;
}

function createVibrantPresetTheme(primaryColor: string): MantineThemeOverride {
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

export const partnerDiscoveryThemePreset = extendGdsTheme({
  primaryColor: 'teal',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Jost, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    sizes: {
      h1: { fontSize: '2rem', fontWeight: '500', lineHeight: '1.2' },
      h2: { fontSize: '1.5rem', fontWeight: '500', lineHeight: '1.25' },
      h3: { fontSize: '1.0625rem', fontWeight: '500', lineHeight: '1.2' },
    },
  },
  colors: {
    teal: ['#e8f5f2', '#cfe7e1', '#9bcfc3', '#67b5a5', '#3f9d8a', '#23816f', '#126858', '#08463b', '#06392f', '#03251f'],
    lime: ['#ecffe4', '#d4ffc2', '#a4f58c', '#75e653', '#4fd51f', '#2fc800', '#28a900', '#208700', '#196900', '#104500'],
  },
  defaultRadius: 'md',
  black: '#010800',
  white: '#ffffff',
  components: {
    AppShell: {
      styles: {
        main: {
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(linear-gradient(#ffffffcc, #ffffffcc), #071411)',
        },
        header: {
          color: 'light-dark(#08463b, #d4ffc2)',
          background: 'light-dark(#ffffffd9, #071411)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    Button: {
      defaultProps: {
        radius: 'xl',
        size: 'sm',
        fw: 600,
      },
      styles: {
        root: {
          minHeight: 38,
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
        shadow: undefined,
      },
      styles: {
        root: {
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(#ffffff, #0d211c)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
      styles: {
        root: {
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(#ffffff, #0d211c)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        input: {
          minHeight: 38,
          color: 'light-dark(#010800, #f4f7fb)',
          background: 'light-dark(#ffffff, #0d211c)',
          borderColor: 'light-dark(#dddddd, #204a2c)',
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
  other: {
    gdsPartnerDiscoveryTokens: {
      teal: '#08463b',
      lime: '#2fc800',
      dark: '#010800',
      gray: '#dddddd',
      warm: '#eedad0',
      cardRadius: 8,
      mapRadius: 16,
      pillRadius: 24,
    },
  },
});

export const classUsaThemePreset = createBrandTheme('class-usa').mantineTheme;

export const goldAthleteThemePreset = createBrandTheme('gold-athlete').mantineTheme;

// Accessibility lane (#453): a maximal-contrast, flat, undecorated preset built
// on the `high-contrast` VibeTheme tokens. `primaryColor: 'dark'` + autoContrast
// gives near-black filled controls with white labels (max legibility); shadows
// are removed and Card/Paper/AppShell surfaces read the pure `--gds-vibe-*`
// tokens with a solid 2px border. Text/meta clear WCAG AAA in both schemes.
const highContrastPresetTheme = extendGdsTheme({
  primaryColor: 'dark',
  autoContrast: true,
  luminanceThreshold: 0.4,
  defaultRadius: 'sm',
  shadows: { xs: 'none', sm: 'none', md: 'none', lg: 'none', xl: 'none' },
  components: {
    AppShell: {
      styles: {
        main: { color: 'var(--gds-vibe-text)', background: 'var(--gds-vibe-canvas)' },
        header: { color: 'var(--gds-vibe-text)', background: 'var(--gds-vibe-canvas)', borderColor: 'var(--gds-vibe-border)' },
        navbar: { color: 'var(--gds-vibe-text)', background: 'var(--gds-vibe-canvas)', borderColor: 'var(--gds-vibe-border)' },
      },
    },
    Card: {
      defaultProps: { withBorder: true, shadow: undefined },
      styles: { root: { color: 'var(--gds-vibe-text)', background: 'var(--gds-vibe-surface)', borderColor: 'var(--gds-vibe-border)', borderWidth: 2 } },
    },
    Paper: {
      defaultProps: { withBorder: true, shadow: undefined },
      styles: { root: { color: 'var(--gds-vibe-text)', background: 'var(--gds-vibe-surface)', borderColor: 'var(--gds-vibe-border)', borderWidth: 2 } },
    },
    Button: { defaultProps: { fw: 700 } },
  },
});

const colorblindSafePresetTheme = extendGdsTheme({
  primaryColor: 'blue',
  autoContrast: true,
  luminanceThreshold: 0.4,
});

const customPresetThemes: Record<Exclude<GdsThemePresetId, 'default' | 'dark-public' | 'flat-surface' | 'editorial' | 'brand' | 'partner-discovery'>, MantineThemeOverride> = {
  'high-contrast': highContrastPresetTheme,
  'colorblind-safe': colorblindSafePresetTheme,
  sunset: createVibrantPresetTheme('orange'),
  oceanic: createVibrantPresetTheme('cyan'),
  forest: createVibrantPresetTheme('green'),
  ruby: createVibrantPresetTheme('red'),
  amber: createVibrantPresetTheme('yellow'),
  'neon-night': createVibrantPresetTheme('lime'),
  skyline: createVibrantPresetTheme('indigo'),
  aurora: createVibrantPresetTheme('teal'),
  coral: createVibrantPresetTheme('pink'),
  mint: createVibrantPresetTheme('lime'),
  orchid: createVibrantPresetTheme('grape'),
  royal: createVibrantPresetTheme('violet'),
  cosmic: createVibrantPresetTheme('violet'),
  warm: createVibrantPresetTheme('orange'),
  'athlete-gold': createVibrantPresetTheme('yellow'),
  'class-usa': classUsaThemePreset,
  'gold-athlete': goldAthleteThemePreset,
};

const themePresetCatalog: GdsThemePreset[] = [
  { id: 'default', label: 'Default runtime theme', description: 'Balanced, neutral baseline lane.', runtimeLane: 'gdsTheme' },
  { id: 'high-contrast', label: 'High contrast', description: 'Maximal-contrast accessibility lane: pure black/white surfaces, WCAG AAA text and meta, solid borders, and no decorative gradients.', runtimeLane: 'resolveGdsThemePreset(high-contrast)' },
  { id: 'colorblind-safe', label: 'Colorblind safe', description: 'Accessibility lane using the Okabe-Ito colorblind-safe brand palette (blue/vermillion) that stays distinguishable across deuteranopia, protanopia, and tritanopia.', runtimeLane: 'resolveGdsThemePreset(colorblind-safe)' },
  { id: 'dark-public', label: 'Dark public theme', description: 'Dark public lane with explicit light and dark modes.', runtimeLane: 'gdsDarkPublicTheme' },
  { id: 'flat-surface', label: 'Flat surface theme', description: 'Lower-elevation operational lane.', runtimeLane: 'gdsFlatSurfaceTheme' },
  { id: 'editorial', label: 'Editorial serif theme', description: 'Reading-first, serif headline lane.', runtimeLane: 'gdsEditorialPublicTheme' },
  { id: 'brand', label: 'Brand theme generator', description: 'Governed brand composition lane.', runtimeLane: 'createPublicBrandTheme(...)' },
  { id: 'partner-discovery', label: 'Partner discovery theme', description: 'Compact family-friendly map/list discovery lane with teal/lime semantics and explicit dark-mode tokens.', runtimeLane: 'partnerDiscoveryThemePreset' },
  { id: 'sunset', label: 'Sunset pulse', description: 'Warm orange-magenta vibrant lane.', runtimeLane: 'resolveGdsThemePreset(sunset)' },
  { id: 'oceanic', label: 'Oceanic wave', description: 'Cool cyan-blue vibrant lane.', runtimeLane: 'resolveGdsThemePreset(oceanic)' },
  { id: 'forest', label: 'Forest signal', description: 'Natural emerald-driven vibrant lane.', runtimeLane: 'resolveGdsThemePreset(forest)' },
  { id: 'ruby', label: 'Ruby spark', description: 'Bold red high-contrast lane.', runtimeLane: 'resolveGdsThemePreset(ruby)' },
  { id: 'amber', label: 'Amber glow', description: 'Golden yellow energetic lane.', runtimeLane: 'resolveGdsThemePreset(amber)' },
  { id: 'neon-night', label: 'Neon night', description: 'Lime-accented vibrant lane with explicit light and dark modes.', runtimeLane: 'resolveGdsThemePreset(neon-night)' },
  { id: 'skyline', label: 'Skyline indigo', description: 'Indigo technology-forward lane.', runtimeLane: 'resolveGdsThemePreset(skyline)' },
  { id: 'aurora', label: 'Aurora teal', description: 'Fresh teal-cyan app lane for optimistic product surfaces.', runtimeLane: 'resolveGdsThemePreset(aurora)' },
  { id: 'coral', label: 'Coral bloom', description: 'Expressive pink-coral lane for creator, commerce, and social products.', runtimeLane: 'resolveGdsThemePreset(coral)' },
  { id: 'mint', label: 'Mint circuit', description: 'Clean green-mint lane for health, learning, and growth products.', runtimeLane: 'resolveGdsThemePreset(mint)' },
  { id: 'orchid', label: 'Orchid signal', description: 'Purple-grape lane for editorial, culture, and premium tools.', runtimeLane: 'resolveGdsThemePreset(orchid)' },
  { id: 'royal', label: 'Royal violet', description: 'Confident violet lane for SaaS dashboards and professional apps.', runtimeLane: 'resolveGdsThemePreset(royal)' },
  { id: 'cosmic', label: 'Cosmic burst', description: 'Highly saturated blue-violet-cyan-magenta showcase lane for bold public apps and launch surfaces.', runtimeLane: 'resolveGdsThemePreset(cosmic)' },
  { id: 'warm', label: 'Warm sand', description: 'Honey-amber warm lane for lifestyle, commerce, and community products.', runtimeLane: 'resolveGdsThemePreset(warm)' },
  { id: 'athlete-gold', label: 'Athlete Gold', description: 'Premium black-and-gold performance lane with stronger metallic gold accents and dark operator surfaces.', runtimeLane: 'resolveGdsThemePreset(athlete-gold)' },
  { id: 'class-usa', label: 'Class USA', description: 'Warm ivory, navy, sage, and terracotta family-discovery brand lane for ClassScout-style listings.', runtimeLane: 'resolveGdsThemePreset(class-usa)' },
  { id: 'gold-athlete', label: 'Gold Athlete', description: 'Governed black-and-metallic-gold performance brand lane for Habigoal, with charcoal body text on ivory in light mode and ivory text with gold accents in dark mode.', runtimeLane: 'resolveGdsThemePreset(gold-athlete)' },
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
    case 'partner-discovery':
      return partnerDiscoveryThemePreset;
    default:
      return customPresetThemes[id] ?? gdsTheme;
  }
}
