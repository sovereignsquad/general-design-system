import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'neon-night',
  catalog: {
    label: 'Neon night',
    description: 'Lime-accented vibrant lane with explicit light and dark modes.',
    runtimeLane: 'resolveGdsThemePreset(neon-night)',
  },
  mantine: createVibrantPresetTheme('lime'),
  vibe: {
    ...neutralVibe,
    id: 'neon-night',
    label: 'Neon night',
    primary: '#84cc16',
    accent: '#22d3ee',
    glow: 'rgba(132, 204, 22, 0.34)',
    canvasLight: '#f7fee7',
    canvasDark: '#030712',
    shellLight: 'rgba(247, 254, 231, 0.88)',
    shellDark: 'rgba(5, 12, 24, 0.9)',
    surfaceDark: 'rgba(12, 23, 36, 0.86)',
    borderLight: 'rgba(132, 204, 22, 0.3)',
    borderDark: 'rgba(190, 242, 100, 0.34)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(132, 204, 22, 0.36), transparent 26%), radial-gradient(circle at 86% 12%, rgba(34, 211, 238, 0.28), transparent 30%), linear-gradient(135deg, rgba(3, 7, 18, 0.96), rgba(8, 47, 73, 0.74))',
    hero: 'linear-gradient(135deg, rgba(132, 204, 22, 0.28), rgba(34, 211, 238, 0.18))',
  },
});
