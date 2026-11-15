import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'royal',
  catalog: {
    label: 'Royal violet',
    description: 'Confident violet lane for SaaS dashboards and professional apps.',
    runtimeLane: 'resolveGdsThemePreset(royal)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('violet'),
  vibe: {
    ...neutralVibe,
    id: 'royal',
    mutedLight: '#5f6d82',
    label: 'Royal violet',
    primary: '#7c3aed',
    accent: '#06b6d4',
    canvasLight: '#f5f3ff',
    canvasDark: '#100a2d',
    shellLight: 'rgba(245, 243, 255, 0.9)',
    shellDark: 'rgba(21, 13, 59, 0.88)',
    surfaceDark: 'rgba(46, 26, 104, 0.78)',
    borderLight: 'rgba(124, 58, 237, 0.3)',
    gradient: 'radial-gradient(circle at 15% 9%, rgba(124, 58, 237, 0.34), transparent 28%), radial-gradient(circle at 82% 12%, rgba(6, 182, 212, 0.28), transparent 30%), radial-gradient(circle at 92% 72%, rgba(236, 72, 153, 0.2), transparent 26%)',
    hero: 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(6, 182, 212, 0.18), rgba(236, 72, 153, 0.18))',
  },
});
