import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { gdsDarkPublicTheme } from '../theme';

export default defineGdsThemePreset({
  id: 'dark-public',
  catalog: {
    label: 'Dark public theme',
    description: 'Dark public lane with explicit light and dark modes.',
    runtimeLane: 'gdsDarkPublicTheme',
  },
  mantine: gdsDarkPublicTheme,
  vibe: {
    ...neutralVibe,
    id: 'dark-public',
    mutedLight: '#5f6d82',
    label: 'Dark public theme',
    primary: '#8b5cf6',
    accent: '#22d3ee',
    canvasLight: '#f5f3ff',
    canvasDark: '#050816',
    shellDark: 'rgba(8, 13, 32, 0.88)',
    surfaceDark: 'rgba(18, 24, 52, 0.86)',
    gradient: 'radial-gradient(circle at 20% 12%, rgba(139, 92, 246, 0.34), transparent 30%), radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.2), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(34, 211, 238, 0.14))',
  },
});
