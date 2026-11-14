import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'ruby',
  catalog: {
    label: 'Ruby spark',
    description: 'Bold red high-contrast lane.',
    runtimeLane: 'resolveGdsThemePreset(ruby)',
  },
  mantine: createVibrantPresetTheme('red'),
  vibe: {
    ...neutralVibe,
    id: 'ruby',
    mutedLight: '#5f6d82',
    label: 'Ruby spark',
    primary: '#e11d48',
    accent: '#f97316',
    canvasLight: '#fff1f2',
    canvasDark: '#22050c',
    shellLight: 'rgba(255, 241, 242, 0.9)',
    shellDark: 'rgba(50, 8, 18, 0.88)',
    surfaceDark: 'rgba(76, 20, 32, 0.76)',
    borderLight: 'rgba(225, 29, 72, 0.28)',
    gradient: 'radial-gradient(circle at 18% 8%, rgba(225, 29, 72, 0.32), transparent 28%), radial-gradient(circle at 86% 18%, rgba(249, 115, 22, 0.22), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(225, 29, 72, 0.24), rgba(249, 115, 22, 0.18))',
  },
});
