import { defineGdsThemePreset } from './define';
import { extendGdsTheme } from '../theme';

const colorblindSafeMantineTheme = extendGdsTheme({
  primaryColor: 'blue',
  autoContrast: true,
  luminanceThreshold: 0.4,
});

// Accessibility lane: colorblind-safe brand palette drawn from the Okabe-Ito qualitative
// set — colors distinguishable across deuteranopia, protanopia, and tritanopia. `primary`
// = Okabe-Ito blue (#0072b2), `accent` = Okabe-Ito vermillion (#d55e00). Text/meta stay
// dark on light (AA/AAA). GDS never signals state by hue alone (MeaningBadge et al. carry
// a label + icon), so this lane targets the brand/categorical palette, not state colors.
export default defineGdsThemePreset({
  id: 'colorblind-safe',
  catalog: {
    label: 'Colorblind safe',
    description: 'Accessibility lane using the Okabe-Ito colorblind-safe brand palette (blue/vermillion) that stays distinguishable across deuteranopia, protanopia, and tritanopia.',
    runtimeLane: 'resolveGdsThemePreset(colorblind-safe)',
  },
  mantine: colorblindSafeMantineTheme,
  vibe: {
    id: 'colorblind-safe',
    label: 'Colorblind safe',
    primary: '#0072b2',
    accent: '#d55e00',
    glow: 'rgba(0, 114, 178, 0.2)',
    canvasLight: '#f6f8fb',
    canvasDark: '#0a1420',
    shellLight: 'rgba(255, 255, 255, 0.85)',
    shellDark: 'rgba(10, 20, 32, 0.85)',
    surfaceLight: '#ffffff',
    surfaceDark: '#101b28',
    borderLight: 'rgba(0, 114, 178, 0.28)',
    borderDark: 'rgba(86, 180, 233, 0.32)',
    textLight: '#12181f',
    textDark: '#f2f6fa',
    mutedLight: '#475569',
    mutedDark: '#c3ccd6',
    gradient: 'radial-gradient(circle at 18% 12%, rgba(0, 114, 178, 0.16), transparent 30%), radial-gradient(circle at 82% 10%, rgba(213, 94, 0, 0.14), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(0, 114, 178, 0.16), rgba(213, 94, 0, 0.12))',
  },
});
