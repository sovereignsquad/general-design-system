import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { padelAfricaThemePreset } from '../padel-africa';

export default defineGdsThemePreset({
  id: 'meadow',
  catalog: {
    label: 'Meadow',
    description: 'Deep green foundation with an emerald primary, lime accents and a green-and-gold pairing on a warm ivory ground.',
    runtimeLane: 'resolveGdsThemePreset(meadow)',
  },
  mantine: padelAfricaThemePreset,
  vibe: {
    ...neutralVibe,
    id: 'meadow',
    label: 'Meadow',
    // `primary` is what the governed Button rule paints with, so it carries the guide's primary
    // CTA (Emerald) rather than the darkest brand tone.
    primary: '#0b9b4a',
    // `accent` is a functional GDS role -- trim, focus rings, badge tints -- and its consumers
    // require WCAG non-text contrast (3:1). The brand's decorative accents (Gold #f3a806, Lime
    // #b8ce1b) clear ~2:1 on the ivory canvas and cannot carry it, so this is Forest Green, the
    // guide's own CTA-hover and "strong brand areas" colour. Gold and Lime remain addressable as
    // named roles on `theme.other.padelAfrica` (priceBadge, focusRing), which is where the guide
    // actually places them.
    accent: '#035033',
    glow: 'rgba(11, 155, 74, 0.22)',
    canvasLight: '#f2f8ec',
    canvasDark: '#051a14',
    shellLight: 'rgba(255, 255, 255, 0.92)',
    shellDark: 'rgba(6, 32, 24, 0.92)',
    surfaceLight: 'rgba(255, 255, 255, 0.96)',
    surfaceDark: 'rgba(9, 38, 29, 0.9)',
    borderLight: '#dde8d2',
    borderDark: '#123528',
    textLight: '#062018',
    textDark: '#f2f8ec',
    mutedLight: '#3f5148',
    mutedDark: '#b9cbbf',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(11, 155, 74, 0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(243, 168, 6, 0.16), transparent 30%), linear-gradient(135deg, #f2f8ec, #e8f2dc)',
    hero: 'linear-gradient(135deg, rgba(6, 32, 24, 0.14), rgba(11, 155, 74, 0.2))',
    flatSurfaces: true,
  },
});
