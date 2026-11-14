import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'amber',
  catalog: {
    label: 'Amber glow',
    description: 'Golden yellow energetic lane.',
    runtimeLane: 'resolveGdsThemePreset(amber)',
  },
  mantine: createVibrantPresetTheme('yellow'),
  vibe: {
    ...neutralVibe,
    id: 'amber',
    label: 'Amber glow',
    primary: '#d97706',
    accent: '#eab308',
    canvasLight: '#fffbeb',
    canvasDark: '#1f1604',
    shellLight: 'rgba(255, 251, 235, 0.9)',
    shellDark: 'rgba(41, 29, 6, 0.88)',
    surfaceDark: 'rgba(69, 46, 10, 0.76)',
    borderLight: 'rgba(217, 119, 6, 0.28)',
    gradient: 'radial-gradient(circle at 14% 10%, rgba(251, 191, 36, 0.34), transparent 30%), radial-gradient(circle at 84% 12%, rgba(217, 119, 6, 0.22), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(217, 119, 6, 0.22), rgba(234, 179, 8, 0.2))',
  },
});
