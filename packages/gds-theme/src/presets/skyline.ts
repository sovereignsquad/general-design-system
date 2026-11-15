import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'skyline',
  catalog: {
    label: 'Skyline indigo',
    description: 'Indigo technology-forward lane.',
    runtimeLane: 'resolveGdsThemePreset(skyline)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('indigo'),
  vibe: {
    ...neutralVibe,
    id: 'skyline',
    mutedLight: '#5f6d82',
    label: 'Skyline indigo',
    primary: '#4f46e5',
    accent: '#0ea5e9',
    canvasLight: '#eef2ff',
    canvasDark: '#0b1026',
    shellLight: 'rgba(238, 242, 255, 0.9)',
    shellDark: 'rgba(13, 20, 52, 0.88)',
    surfaceDark: 'rgba(30, 41, 86, 0.78)',
    borderLight: 'rgba(79, 70, 229, 0.28)',
    gradient: 'radial-gradient(circle at 18% 8%, rgba(79, 70, 229, 0.32), transparent 28%), radial-gradient(circle at 84% 12%, rgba(14, 165, 233, 0.28), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(79, 70, 229, 0.24), rgba(14, 165, 233, 0.18))',
  },
});
