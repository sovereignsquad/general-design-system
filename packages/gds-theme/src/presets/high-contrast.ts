import type { MantineThemeOverride } from '@mantine/core';
import { defineGdsThemePreset } from './define';
import { GDS_DEFAULT_SHAPE_AXIS } from '../axes';

// Accessibility lane (#453): a maximal-contrast, flat, undecorated preset built
// on the `high-contrast` VibeTheme tokens. `primaryColor: 'dark'` + autoContrast
// gives near-black filled controls with white labels (max legibility); shadows
// are removed and Card/Paper/AppShell surfaces read the pure `--gds-vibe-*`
// tokens with a solid 2px border. Text/meta clear WCAG AAA in both schemes.
const highContrastMantineOverride: MantineThemeOverride = {
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
};

// Accessibility lane: maximal-contrast, flat, undecorated. Pure white/black canvases,
// black/white body text, near-pure dark-gray/light-gray meta text (all AAA), and solid
// black/white borders. No gradients or glows — `flatSurfaces: true` neutralizes
// --gds-vibe-glow/--gds-vibe-gradient/--gds-vibe-atmosphere at the source (see
// getGdsVibeThemeCssVariables in vibe-themes.ts), so the shell reads as a plain high-contrast surface
// everywhere a component composes its own gradient/glow from those variables. Text/meta
// on canvas/surface clear WCAG AAA in both schemes.
export default defineGdsThemePreset({
  id: 'high-contrast',
  catalog: {
    label: 'High contrast',
    description: 'Maximal-contrast accessibility lane: pure black/white surfaces, WCAG AAA text and meta, solid borders, and no decorative gradients.',
    runtimeLane: 'resolveGdsThemePreset(high-contrast)',
  },
  mantine: ({ extendGdsTheme }) => extendGdsTheme(highContrastMantineOverride),
  vibe: {
    id: 'high-contrast',
    label: 'High contrast',
    // Modals on `sm`, matching the preset's Mantine `defaultRadius: 'sm'`.
    axes: { shape: { scale: GDS_DEFAULT_SHAPE_AXIS.scale, roles: { modal: 'sm' } } },
    primary: '#0b3d91',
    accent: '#7a1fa2',
    glow: 'rgba(0, 0, 0, 0.25)',
    canvasLight: '#ffffff',
    canvasDark: '#000000',
    shellLight: '#ffffff',
    shellDark: '#000000',
    surfaceLight: '#ffffff',
    surfaceDark: '#000000',
    borderLight: '#000000',
    borderDark: '#ffffff',
    textLight: '#000000',
    textDark: '#ffffff',
    mutedLight: '#3a3a3a',
    mutedDark: '#d6d6d6',
    gradient: 'linear-gradient(transparent, transparent)',
    hero: 'linear-gradient(transparent, transparent)',
    flatSurfaces: true,
  },
});
