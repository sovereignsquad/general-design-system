import { defineGdsThemePreset } from './define';
import { createVibrantPresetTheme } from './vibrant';

export default defineGdsThemePreset({
  id: 'cosmic',
  catalog: {
    label: 'Cosmic burst',
    description: 'Highly saturated blue-violet-cyan-magenta showcase lane for bold public apps and launch surfaces.',
    runtimeLane: 'resolveGdsThemePreset(cosmic)',
  },
  mantine: createVibrantPresetTheme('violet'),
  vibe: {
    id: 'cosmic',
    label: 'Cosmic burst',
    primary: '#7c3cff',
    accent: '#e018ff',
    glow: 'rgba(224, 24, 255, 0.36)',
    canvasLight: '#f7f3ff',
    canvasDark: '#030018',
    shellLight: 'rgba(255, 255, 255, 0.9)',
    shellDark: 'rgba(8, 10, 42, 0.84)',
    surfaceLight: 'rgba(255, 255, 255, 0.92)',
    surfaceDark: 'rgba(9, 14, 54, 0.76)',
    borderLight: 'rgba(124, 60, 255, 0.26)',
    borderDark: 'rgba(190, 160, 255, 0.52)',
    textLight: '#170f35',
    textDark: '#ffffff',
    mutedLight: '#4f4476',
    mutedDark: 'rgba(235, 238, 255, 0.78)',
    gradient: 'radial-gradient(circle at 92% 20%, rgba(255, 180, 70, 0.26) 0 8%, transparent 24%), radial-gradient(circle at 84% 42%, rgba(255, 45, 190, 0.2) 0 12%, transparent 30%), radial-gradient(circle at 72% 18%, rgba(0, 180, 255, 0.18) 0 11%, transparent 30%), linear-gradient(135deg, #ffffff 0%, #f7f3ff 42%, #edf6ff 100%)',
    hero: 'linear-gradient(135deg, rgba(124, 60, 255, 0.84), rgba(224, 24, 255, 0.62), rgba(255, 155, 61, 0.72))',
  },
});
