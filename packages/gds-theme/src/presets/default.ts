import { defineGdsThemePreset } from './define';
import type { GdsVibeThemeFields } from '../vibe-themes';

/** Atmosphere of the default lane; other presets spread it and override what differs. */
export const neutralVibe: GdsVibeThemeFields & { id: 'default' } = {
    id: 'default' as const,
    label: 'Default runtime theme',
    primary: '#7c3aed',
    accent: '#06b6d4',
    glow: 'rgba(124, 58, 237, 0.2)',
    canvasLight: '#f8fafc',
    canvasDark: '#0f172a',
    shellLight: 'rgba(255, 255, 255, 0.82)',
    shellDark: 'rgba(15, 23, 42, 0.84)',
    surfaceLight: 'rgba(255, 255, 255, 0.9)',
    surfaceDark: 'rgba(30, 41, 59, 0.82)',
    borderLight: 'rgba(124, 58, 237, 0.22)',
    borderDark: 'rgba(167, 139, 250, 0.28)',
    textLight: '#111827',
    textDark: '#f8fafc',
    mutedLight: '#64748b',
    mutedDark: '#cbd5e1',
    gradient: 'radial-gradient(circle at 18% 12%, rgba(124, 58, 237, 0.18), transparent 28%), radial-gradient(circle at 82% 8%, rgba(6, 182, 212, 0.16), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(6, 182, 212, 0.12))',
};

export default defineGdsThemePreset({
  id: 'default',
  catalog: {
    label: 'Default runtime theme',
    description: 'Balanced, neutral baseline lane.',
    runtimeLane: 'gdsTheme',
  },
  mantine: ({ gdsTheme }) => gdsTheme,
  vibe: neutralVibe,
});
