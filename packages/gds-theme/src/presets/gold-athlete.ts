import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { GDS_GOLD_ATHLETE_SHAPE_AXIS, GDS_GOLD_ATHLETE_SHELL, emitGoldAthleteCssVariables, goldAthleteDefaultColorRamps } from '../semantic-token-source';

export default defineGdsThemePreset({
  id: 'gold-athlete',
  catalog: {
    label: 'Gold Athlete',
    description: 'Governed black-and-metallic-gold performance brand lane for Habigoal, with charcoal body text on ivory in light mode and ivory text with gold accents in dark mode.',
    runtimeLane: 'resolveGdsThemePreset(gold-athlete)',
  },
  mantine: ({ createBrandTheme }) => createBrandTheme('gold-athlete').mantineTheme,
  semanticOverrides: emitGoldAthleteCssVariables(goldAthleteDefaultColorRamps),
  vibe: {
    ...neutralVibe,
    id: 'gold-athlete',
    label: 'Gold Athlete',
    axes: { shape: GDS_GOLD_ATHLETE_SHAPE_AXIS },
    primary: '#8a5a00',
    accent: '#f0b642',
    glow: 'rgba(240, 182, 66, 0.24)',
    canvasLight: '#fbf7ee',
    canvasDark: '#0a0d12',
    shellLight: GDS_GOLD_ATHLETE_SHELL.light,
    shellDark: GDS_GOLD_ATHLETE_SHELL.dark,
    surfaceLight: 'rgba(255, 255, 255, 0.96)',
    surfaceDark: 'rgba(22, 25, 32, 0.9)',
    borderLight: '#ede2c6',
    borderDark: '#2b303a',
    textLight: '#12161c',
    textDark: '#fbf7ee',
    mutedLight: '#414b57',
    mutedDark: '#d6c8a6',
    gradient: 'radial-gradient(circle at 14% 8%, rgba(240, 182, 66, 0.18), transparent 26%), radial-gradient(circle at 86% 18%, rgba(192, 138, 18, 0.16), transparent 30%), linear-gradient(135deg, #fbf7ee, #f5eeda)',
    hero: 'linear-gradient(135deg, rgba(18, 22, 28, 0.14), rgba(240, 182, 66, 0.2))',
    flatSurfaces: true,
  },
});
