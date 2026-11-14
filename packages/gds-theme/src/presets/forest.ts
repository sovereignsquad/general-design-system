import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'forest',
  catalog: {
    label: 'Forest signal',
    description: 'Natural emerald-driven vibrant lane.',
    runtimeLane: 'resolveGdsThemePreset(forest)',
  },
  mantine: createVibrantPresetTheme('green'),
  vibe: {
    ...neutralVibe,
    id: 'forest',
    label: 'Forest signal',
    primary: '#16a34a',
    accent: '#84cc16',
    glow: 'rgba(22, 163, 74, 0.28)',
    canvasLight: '#f0fdf4',
    canvasDark: '#06180d',
    shellLight: 'rgba(240, 253, 244, 0.9)',
    shellDark: 'rgba(8, 35, 19, 0.88)',
    surfaceLight: 'rgba(250, 255, 251, 0.9)',
    surfaceDark: 'rgba(20, 83, 45, 0.72)',
    borderLight: 'rgba(22, 163, 74, 0.26)',
    borderDark: 'rgba(134, 239, 172, 0.28)',
    gradient: 'radial-gradient(circle at 18% 10%, rgba(34, 197, 94, 0.28), transparent 28%), radial-gradient(circle at 84% 14%, rgba(132, 204, 22, 0.24), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(22, 163, 74, 0.22), rgba(132, 204, 22, 0.18))',
  },
});
