import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'sunset',
  catalog: {
    label: 'Sunset pulse',
    description: 'Warm orange-magenta vibrant lane.',
    runtimeLane: 'resolveGdsThemePreset(sunset)',
  },
  mantine: createVibrantPresetTheme('orange'),
  vibe: {
    ...neutralVibe,
    id: 'sunset',
    mutedLight: '#5f6d82',
    label: 'Sunset pulse',
    primary: '#f97316',
    accent: '#ec4899',
    glow: 'rgba(249, 115, 22, 0.3)',
    canvasLight: '#fff7ed',
    canvasDark: '#211106',
    shellLight: 'rgba(255, 247, 237, 0.9)',
    shellDark: 'rgba(44, 18, 10, 0.88)',
    surfaceLight: 'rgba(255, 250, 245, 0.9)',
    surfaceDark: 'rgba(68, 24, 12, 0.78)',
    borderLight: 'rgba(249, 115, 22, 0.3)',
    borderDark: 'rgba(251, 146, 60, 0.36)',
    gradient: 'radial-gradient(circle at 14% 8%, rgba(251, 146, 60, 0.38), transparent 28%), radial-gradient(circle at 88% 18%, rgba(236, 72, 153, 0.32), transparent 32%), linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(253, 242, 248, 0.86))',
    hero: 'linear-gradient(135deg, rgba(249, 115, 22, 0.26), rgba(236, 72, 153, 0.22))',
  },
});
