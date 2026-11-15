import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'oceanic',
  catalog: {
    label: 'Oceanic wave',
    description: 'Cool cyan-blue vibrant lane.',
    runtimeLane: 'resolveGdsThemePreset(oceanic)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('cyan'),
  vibe: {
    ...neutralVibe,
    id: 'oceanic',
    label: 'Oceanic wave',
    primary: '#0891b2',
    accent: '#2563eb',
    glow: 'rgba(8, 145, 178, 0.28)',
    canvasLight: '#ecfeff',
    canvasDark: '#04131f',
    shellLight: 'rgba(236, 254, 255, 0.88)',
    shellDark: 'rgba(5, 26, 44, 0.88)',
    surfaceLight: 'rgba(248, 253, 255, 0.9)',
    surfaceDark: 'rgba(8, 47, 73, 0.78)',
    borderLight: 'rgba(8, 145, 178, 0.28)',
    borderDark: 'rgba(103, 232, 249, 0.28)',
    gradient: 'radial-gradient(circle at 18% 8%, rgba(34, 211, 238, 0.32), transparent 30%), radial-gradient(circle at 86% 14%, rgba(37, 99, 235, 0.28), transparent 32%), linear-gradient(135deg, rgba(236, 254, 255, 0.96), rgba(239, 246, 255, 0.9))',
    hero: 'linear-gradient(135deg, rgba(8, 145, 178, 0.24), rgba(37, 99, 235, 0.2))',
  },
});
