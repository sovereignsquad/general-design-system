import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'orchid',
  catalog: {
    label: 'Orchid signal',
    description: 'Purple-grape lane for editorial, culture, and premium tools.',
    runtimeLane: 'resolveGdsThemePreset(orchid)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('grape'),
  vibe: {
    ...neutralVibe,
    id: 'orchid',
    mutedLight: '#5f6d82',
    label: 'Orchid signal',
    primary: '#9333ea',
    accent: '#ec4899',
    canvasLight: '#faf5ff',
    canvasDark: '#1d0b2f',
    shellLight: 'rgba(250, 245, 255, 0.9)',
    shellDark: 'rgba(39, 15, 63, 0.88)',
    surfaceDark: 'rgba(59, 25, 94, 0.78)',
    borderLight: 'rgba(147, 51, 234, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(147, 51, 234, 0.32), transparent 28%), radial-gradient(circle at 84% 14%, rgba(236, 72, 153, 0.24), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(147, 51, 234, 0.24), rgba(236, 72, 153, 0.18))',
  },
});
