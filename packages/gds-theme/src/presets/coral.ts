import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'coral',
  catalog: {
    label: 'Coral bloom',
    description: 'Expressive pink-coral lane for creator, commerce, and social products.',
    runtimeLane: 'resolveGdsThemePreset(coral)',
  },
  mantine: ({ createVibrantPresetTheme }) => createVibrantPresetTheme('pink'),
  vibe: {
    ...neutralVibe,
    id: 'coral',
    mutedLight: '#5f6d82',
    label: 'Coral bloom',
    primary: '#db2777',
    accent: '#fb7185',
    canvasLight: '#fdf2f8',
    canvasDark: '#251021',
    shellLight: 'rgba(253, 242, 248, 0.9)',
    shellDark: 'rgba(50, 18, 43, 0.88)',
    surfaceDark: 'rgba(80, 28, 66, 0.76)',
    borderLight: 'rgba(219, 39, 119, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(219, 39, 119, 0.3), transparent 28%), radial-gradient(circle at 84% 14%, rgba(251, 113, 133, 0.24), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(219, 39, 119, 0.22), rgba(251, 113, 133, 0.18))',
  },
});
