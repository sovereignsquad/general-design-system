import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'aurora',
  catalog: {
    label: 'Aurora teal',
    description: 'Fresh teal-cyan app lane for optimistic product surfaces.',
    runtimeLane: 'resolveGdsThemePreset(aurora)',
  },
  mantine: createVibrantPresetTheme('teal'),
  vibe: {
    ...neutralVibe,
    id: 'aurora',
    label: 'Aurora teal',
    primary: '#0d9488',
    accent: '#a3e635',
    canvasLight: '#f0fdfa',
    canvasDark: '#04211f',
    shellLight: 'rgba(240, 253, 250, 0.9)',
    shellDark: 'rgba(5, 44, 42, 0.88)',
    surfaceDark: 'rgba(19, 78, 74, 0.76)',
    borderLight: 'rgba(13, 148, 136, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(45, 212, 191, 0.32), transparent 28%), radial-gradient(circle at 84% 14%, rgba(163, 230, 53, 0.22), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(13, 148, 136, 0.24), rgba(163, 230, 53, 0.16))',
  },
});
