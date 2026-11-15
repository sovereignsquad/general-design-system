import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'flat-surface',
  catalog: {
    label: 'Flat surface theme',
    description: 'Lower-elevation operational lane.',
    runtimeLane: 'gdsFlatSurfaceTheme',
  },
  mantine: ({ gdsFlatSurfaceTheme }) => gdsFlatSurfaceTheme,
  vibe: {
    ...neutralVibe,
    id: 'flat-surface',
    label: 'Flat surface theme',
    primary: '#2563eb',
    accent: '#14b8a6',
    canvasLight: '#f8fafc',
    canvasDark: '#111827',
    shellLight: 'rgba(248, 250, 252, 0.94)',
    surfaceLight: 'rgba(255, 255, 255, 0.94)',
    gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(20, 184, 166, 0.08))',
    hero: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(20, 184, 166, 0.1))',
  },
});
