import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { gdsEditorialPublicTheme } from '../theme';

export default defineGdsThemePreset({
  id: 'editorial',
  catalog: {
    label: 'Editorial serif theme',
    description: 'Reading-first, serif headline lane.',
    runtimeLane: 'gdsEditorialPublicTheme',
  },
  mantine: gdsEditorialPublicTheme,
  vibe: {
    ...neutralVibe,
    id: 'editorial',
    mutedLight: '#5f6d82',
    label: 'Editorial serif theme',
    primary: '#9a3412',
    accent: '#be123c',
    canvasLight: '#fff7ed',
    canvasDark: '#1c1917',
    shellLight: 'rgba(255, 247, 237, 0.9)',
    surfaceLight: 'rgba(255, 251, 247, 0.92)',
    borderLight: 'rgba(154, 52, 18, 0.22)',
    gradient: 'radial-gradient(circle at 12% 12%, rgba(251, 146, 60, 0.22), transparent 28%), radial-gradient(circle at 84% 10%, rgba(190, 18, 60, 0.12), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(251, 146, 60, 0.18), rgba(190, 18, 60, 0.12))',
  },
});
