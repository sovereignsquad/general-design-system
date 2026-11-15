import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'athlete-gold',
  catalog: {
    label: 'Athlete Gold',
    description: 'Premium black-and-gold performance lane with stronger metallic gold accents and dark operator surfaces.',
    runtimeLane: 'resolveGdsThemePreset(athlete-gold)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('yellow'),
  vibe: {
    ...neutralVibe,
    id: 'athlete-gold',
    label: 'Athlete Gold',
    primary: '#e4a623',
    accent: '#ffd76a',
    glow: 'rgba(228, 166, 35, 0.34)',
    canvasLight: '#fff8e6',
    canvasDark: '#03080f',
    shellLight: 'rgba(255, 248, 230, 0.92)',
    shellDark: 'rgba(5, 11, 20, 0.92)',
    surfaceLight: 'rgba(255, 252, 242, 0.94)',
    surfaceDark: 'rgba(21, 24, 31, 0.88)',
    borderLight: 'rgba(176, 118, 24, 0.32)',
    borderDark: 'rgba(240, 182, 66, 0.38)',
    textLight: '#17130a',
    textDark: '#fff9e8',
    mutedLight: '#58442a',
    mutedDark: '#d8c8a8',
    gradient: 'radial-gradient(circle at 12% 8%, rgba(255, 215, 106, 0.28), transparent 24%), radial-gradient(circle at 86% 18%, rgba(240, 182, 66, 0.18), transparent 30%), linear-gradient(135deg, #03080f 0%, #070d17 48%, #0b101a 100%)',
    hero: 'linear-gradient(135deg, rgba(255, 215, 106, 0.34), rgba(240, 182, 66, 0.24), rgba(5, 11, 20, 0.92))',
  },
});
