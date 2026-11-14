import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'warm',
  catalog: {
    label: 'Warm sand',
    description: 'Honey-amber warm lane for lifestyle, commerce, and community products.',
    runtimeLane: 'resolveGdsThemePreset(warm)',
  },
  mantine: createVibrantPresetTheme('orange'),
  vibe: {
    ...neutralVibe,
    id: 'warm',
    label: 'Warm sand',
    primary: '#b45309',
    accent: '#f97316',
    glow: 'rgba(180, 83, 9, 0.26)',
    canvasLight: '#fffbf0',
    canvasDark: '#1c1005',
    shellLight: 'rgba(255, 251, 240, 0.9)',
    shellDark: 'rgba(38, 24, 8, 0.88)',
    surfaceLight: 'rgba(255, 255, 255, 0.94)',
    surfaceDark: 'rgba(74, 42, 10, 0.76)',
    borderLight: 'rgba(180, 83, 9, 0.26)',
    borderDark: 'rgba(252, 176, 69, 0.32)',
    gradient: 'radial-gradient(circle at 16% 10%, rgba(251, 191, 36, 0.34), transparent 30%), radial-gradient(circle at 84% 14%, rgba(249, 115, 22, 0.26), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(180, 83, 9, 0.24), rgba(249, 115, 22, 0.18))',
  },
});
