import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'mint',
  catalog: {
    label: 'Mint circuit',
    description: 'Clean green-mint lane for health, learning, and growth products.',
    runtimeLane: 'resolveGdsThemePreset(mint)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('lime'),
  vibe: {
    ...neutralVibe,
    id: 'mint',
    label: 'Mint circuit',
    primary: '#059669',
    accent: '#14b8a6',
    canvasLight: '#ecfdf5',
    canvasDark: '#031c16',
    shellLight: 'rgba(236, 253, 245, 0.9)',
    shellDark: 'rgba(5, 42, 34, 0.88)',
    surfaceDark: 'rgba(6, 78, 59, 0.74)',
    borderLight: 'rgba(5, 150, 105, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(16, 185, 129, 0.3), transparent 28%), radial-gradient(circle at 84% 14%, rgba(20, 184, 166, 0.22), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(5, 150, 105, 0.24), rgba(20, 184, 166, 0.16))',
  },
});
