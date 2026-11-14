import { defineGdsThemePreset } from './define';
import { neutralVibe } from './default';
import { GDS_CLASS_USA_SHAPE_AXIS, GDS_CLASS_USA_SHELL, classUsaDefaultColorRamps, emitClassUsaCssVariables } from '../semantic-token-source';

export default defineGdsThemePreset({
  id: 'class-usa',
  catalog: {
    label: 'Class USA',
    description: 'Warm cream, ink navy, and action-orange family-discovery brand lane for ClassScout-style listings, with a trust-green source/freshness accent and Playfair Display headings.',
    runtimeLane: 'resolveGdsThemePreset(class-usa)',
  },
  mantine: ({ createBrandTheme }) => createBrandTheme('class-usa').mantineTheme,
  semanticOverrides: emitClassUsaCssVariables(classUsaDefaultColorRamps),
  vibe: {
    ...neutralVibe,
    id: 'class-usa',
    label: 'Class USA',
    // v2 re-base. `accent` stays the single-scheme-invariant `GdsVibeTheme` field, anchored
    // to `action[6]` (#c24a0a): the one of the two new oranges that clears WCAG non-text
    // contrast (3:1) in its actual consumers (light-mode button border trim, blended
    // dark-mode badge tint). `brand[5]` (#f5793b) does not (2.56:1/2.73:1 on cream/white).
    // The full light/dark accent split lives in the scheme-aware `--gds-*` semantic-role
    // tokens (this preset's `semanticOverrides`), not in this single-value field.
    axes: { shape: GDS_CLASS_USA_SHAPE_AXIS },
    primary: '#0f2c4a',
    accent: '#c24a0a',
    glow: 'rgba(194, 74, 10, 0.2)',
    canvasLight: '#faf7f1',
    // Dark canvas is neutral charcoal, not a navy-dark tint: navy is reserved for accents
    // and the inverse shell only.
    canvasDark: '#14171c',
    shellLight: GDS_CLASS_USA_SHELL.light,
    shellDark: GDS_CLASS_USA_SHELL.dark,
    surfaceLight: 'rgba(255, 255, 255, 0.96)',
    surfaceDark: 'rgba(28, 32, 39, 0.9)',
    borderLight: '#e6e1d8',
    borderDark: '#2c323b',
    textLight: '#1f3a5c',
    textDark: '#f2ede4',
    mutedLight: '#5b6573',
    mutedDark: '#b8bfc9',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(194, 74, 10, 0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(79, 138, 91, 0.16), transparent 30%), linear-gradient(135deg, #faf7f1, #f4eee2)',
    hero: 'linear-gradient(135deg, rgba(15, 44, 74, 0.12), rgba(194, 74, 10, 0.16))',
    flatSurfaces: true,
  },
});
