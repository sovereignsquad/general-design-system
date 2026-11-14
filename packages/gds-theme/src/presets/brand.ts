import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';

export default defineGdsThemePreset({
  id: 'brand',
  catalog: {
    label: 'Brand theme generator',
    description: 'Governed brand composition lane.',
    runtimeLane: 'createPublicBrandTheme(...)',
  },
  vibe: {
    ...neutralVibe,
    id: 'brand',
    label: 'Brand theme generator',
  },
});
