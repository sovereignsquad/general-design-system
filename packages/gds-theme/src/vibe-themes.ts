import type { GdsThemePresetId } from './theme-presets';
import { resolveGdsAxisTokens, type GdsThemeAxes } from './axes';
import { readableForeground } from './color-math';
import {
  classUsaDefaultColorRamps,
  deriveVibeSemanticCssVariables,
  emitClassUsaCssVariables,
  emitGoldAthleteCssVariables,
  goldAthleteDefaultColorRamps,
} from './semantic-token-source';

// Issue 554: re-exported, not defined here. The public surface is unchanged; the
// definition moved so that every semantic-role value lives in one module.
export { deriveVibeSemanticCssVariables };

// This file intentionally maintains its own hand-authored color values rather
// than deriving them from `theme-presets.ts`'s Mantine hue names (e.g.
// `createVibrantPresetTheme('orange')`): the two systems draw from genuinely
// different color sources by design (Mantine's functional color ramp vs. a
// bespoke, more saturated "vibe" atmosphere palette), so forcing one to derive
// from the other would be a real visual-design decision, not a mechanical
// refactor, and isn't safe to make unilaterally. `vibe-themes.test.ts` guards
// the drift risk that IS safe to eliminate mechanically: every preset id in
// `theme-presets.ts`'s catalog must have a matching entry here, and vice
// versa, so adding a new preset to one file without the other fails CI.

/** The saturated "vibe" atmosphere palette for one preset: brand hues plus light/dark surface, text, and decorative effect colors. */
export interface GdsVibeTheme {
  /** Preset id this vibe belongs to. */
  id: GdsThemePresetId;
  /** Human-readable theme name. */
  label: string;
  /** Primary brand color. */
  primary: string;
  /** Accent color. */
  accent: string;
  /** Translucent glow used for focus/hover atmosphere. */
  glow: string;
  /** Page canvas background, light mode. */
  canvasLight: string;
  /** Page canvas background, dark mode. */
  canvasDark: string;
  /** Shell/app-bar surface, light mode. */
  shellLight: string;
  /** Shell/app-bar surface, dark mode. */
  shellDark: string;
  /** Card surface, light mode. */
  surfaceLight: string;
  /** Card surface, dark mode. */
  surfaceDark: string;
  /** Border color, light mode. */
  borderLight: string;
  /** Border color, dark mode. */
  borderDark: string;
  /** Body text color, light mode. */
  textLight: string;
  /** Body text color, dark mode. */
  textDark: string;
  /** Muted/meta text color, light mode. */
  mutedLight: string;
  /** Muted/meta text color, dark mode. */
  mutedDark: string;
  /** Decorative background gradient. */
  gradient: string;
  /** Hero/banner gradient. */
  hero: string;
  /**
   * True for a lane backed by a real `createBrandTheme(...)` brand (Class USA,
   * Gold Athlete) whose own definition sets `flatSurfaces: true` and never
   * configures a gradient, glow, or colored shadow anywhere. Consumers that
   * preview this lane's atmosphere (gradient/glow fields above) must skip
   * those fields when this is true — showing them would fabricate a visual
   * treatment the real, governed brand doesn't have. Unset/false for the
   * generic vibe lanes, where the gradient/glow atmosphere IS the lane's own
   * real, intentional identity.
   */
  /**
   * Non-colour design decisions (issue 555): shape today, density/typography/motion to
   * follow. Optional — a preset that declares nothing gets the captured defaults, which
   * reproduce today's geometry exactly.
   */
  axes?: GdsThemeAxes;
  flatSurfaces?: boolean;
}

const neutralVibe: GdsVibeTheme = {
  id: 'default',
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

const vibeThemes: Record<GdsThemePresetId, GdsVibeTheme> = {
  default: neutralVibe,
  // Accessibility lane (#453): maximal-contrast, flat, undecorated. Pure
  // white/black canvases, black/white body text, near-pure dark-gray/light-gray
  // meta text (all AAA), and solid black/white borders. No gradients or glows —
  // `flatSurfaces: true` neutralizes --gds-vibe-glow/--gds-vibe-gradient/
  // --gds-vibe-atmosphere at the source (see getGdsVibeThemeCssVariables below),
  // the same mechanism class-usa/gold-athlete rely on, so the shell reads as a
  // plain high-contrast surface everywhere a component composes its own
  // gradient/glow from those variables — not just the fields on this object.
  // Text/meta on canvas/surface clear WCAG AAA in both schemes (verified in
  // verify:token-contrast-scoring / theme-accessibility).
  'high-contrast': {
    id: 'high-contrast',
    label: 'High contrast',
    primary: '#0b3d91',
    accent: '#7a1fa2',
    glow: 'rgba(0, 0, 0, 0.25)',
    canvasLight: '#ffffff',
    canvasDark: '#000000',
    shellLight: '#ffffff',
    shellDark: '#000000',
    surfaceLight: '#ffffff',
    surfaceDark: '#000000',
    borderLight: '#000000',
    borderDark: '#ffffff',
    textLight: '#000000',
    textDark: '#ffffff',
    mutedLight: '#3a3a3a',
    mutedDark: '#d6d6d6',
    gradient: 'linear-gradient(transparent, transparent)',
    hero: 'linear-gradient(transparent, transparent)',
    flatSurfaces: true,
  },
  // Accessibility lane (#453): colorblind-safe brand palette drawn from the
  // Okabe-Ito qualitative set (Okabe & Ito, 2008) — the validated colors that
  // stay distinguishable across deuteranopia, protanopia, and tritanopia.
  // `primary` = Okabe-Ito blue (#0072b2), `accent` = Okabe-Ito vermillion
  // (#d55e00): the classic CVD-safe categorical pairing. Text/meta stay dark on
  // light (AA/AAA). GDS never signals state by hue alone (MeaningBadge et al.
  // carry a label + icon per WCAG 1.4.1), so this lane targets the brand/
  // categorical palette rather than the state colors.
  'colorblind-safe': {
    id: 'colorblind-safe',
    label: 'Colorblind safe',
    primary: '#0072b2',
    accent: '#d55e00',
    glow: 'rgba(0, 114, 178, 0.2)',
    canvasLight: '#f6f8fb',
    canvasDark: '#0a1420',
    shellLight: 'rgba(255, 255, 255, 0.85)',
    shellDark: 'rgba(10, 20, 32, 0.85)',
    surfaceLight: '#ffffff',
    surfaceDark: '#101b28',
    borderLight: 'rgba(0, 114, 178, 0.28)',
    borderDark: 'rgba(86, 180, 233, 0.32)',
    textLight: '#12181f',
    textDark: '#f2f6fa',
    mutedLight: '#475569',
    mutedDark: '#c3ccd6',
    gradient: 'radial-gradient(circle at 18% 12%, rgba(0, 114, 178, 0.16), transparent 30%), radial-gradient(circle at 82% 10%, rgba(213, 94, 0, 0.14), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(0, 114, 178, 0.16), rgba(213, 94, 0, 0.12))',
  },
  'dark-public': {
    ...neutralVibe,
    id: 'dark-public',
    mutedLight: '#5f6d82',
    label: 'Dark public theme',
    primary: '#8b5cf6',
    accent: '#22d3ee',
    canvasLight: '#f5f3ff',
    canvasDark: '#050816',
    shellDark: 'rgba(8, 13, 32, 0.88)',
    surfaceDark: 'rgba(18, 24, 52, 0.86)',
    gradient: 'radial-gradient(circle at 20% 12%, rgba(139, 92, 246, 0.34), transparent 30%), radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.2), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(34, 211, 238, 0.14))',
  },
  'flat-surface': {
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
  editorial: {
    ...neutralVibe,
    id: 'editorial',
    mutedLight: '#5f6d82',
    label: 'Editorial serif theme',
    primary: '#9a3412',
    accent: '#be123c',
    canvasLight: '#fff7ed',
    canvasDark: '#1c1917',
    shellLight: 'rgba(255, 247, 237, 0.9)',
    surfaceLight: 'rgba(255, 251, 247, 0.92)',
    borderLight: 'rgba(154, 52, 18, 0.22)',
    gradient: 'radial-gradient(circle at 12% 12%, rgba(251, 146, 60, 0.22), transparent 28%), radial-gradient(circle at 84% 10%, rgba(190, 18, 60, 0.12), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(251, 146, 60, 0.18), rgba(190, 18, 60, 0.12))',
  },
  brand: {
    ...neutralVibe,
    id: 'brand',
    label: 'Brand theme generator',
  },
  'partner-discovery': {
    ...neutralVibe,
    id: 'partner-discovery',
    label: 'Partner discovery theme',
    primary: '#08463b',
    accent: '#2fc800',
    glow: 'rgba(47, 200, 0, 0.2)',
    canvasLight: '#ffffff',
    canvasDark: '#071411',
    shellLight: 'rgba(255, 255, 255, 0.88)',
    shellDark: 'rgba(7, 20, 17, 0.9)',
    surfaceLight: 'rgba(255, 255, 255, 0.94)',
    surfaceDark: 'rgba(13, 33, 28, 0.88)',
    borderLight: 'rgba(8, 70, 59, 0.18)',
    borderDark: 'rgba(212, 255, 194, 0.26)',
    textLight: '#010800',
    textDark: '#f4f7fb',
    mutedLight: '#333333',
    mutedDark: '#c9d8d3',
    gradient: 'linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.78)), radial-gradient(circle at 20% 10%, rgba(47,200,0,0.14), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(8, 70, 59, 0.12), rgba(47, 200, 0, 0.16))',
  },
  'class-usa': {
    ...neutralVibe,
    id: 'class-usa',
    label: 'Class USA',
    // v2 re-base (issue 536). `accent` stays the single-scheme-invariant
    // `GdsVibeTheme` field it's always been, so it's anchored to `action[6]`
    // (#c24a0a) — the ONE of the two new oranges that clears WCAG non-text
    // contrast (3:1) in both its actual consumers here: the light-mode
    // button border trim (styles.css) and, blended, the dark-mode badge
    // tint. `brand[5]` (#f5793b) was verified NOT to (2.56:1/2.73:1 on
    // cream/white) — using it here would silently fail the light-mode
    // border. The full light/dark accent split the spec actually wants
    // lives in the scheme-aware `--gds-*` semantic-role tokens below
    // (`classUsaSemanticCssVariables`), not in this single-value field.
    primary: '#0f2c4a',
    accent: '#c24a0a',
    glow: 'rgba(194, 74, 10, 0.2)',
    canvasLight: '#faf7f1',
    // Dark canvas is neutral charcoal, not a navy-dark tint (v2 re-base
    // ruling): navy is reserved for accents and the inverse shell only.
    canvasDark: '#14171c',
    shellLight: 'rgba(255, 255, 255, 0.9)',
    shellDark: 'rgba(15, 44, 74, 0.9)',
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
  'gold-athlete': {
    ...neutralVibe,
    id: 'gold-athlete',
    label: 'Gold Athlete',
    primary: '#8a5a00',
    accent: '#f0b642',
    glow: 'rgba(240, 182, 66, 0.24)',
    canvasLight: '#fbf7ee',
    canvasDark: '#0a0d12',
    shellLight: 'rgba(255, 255, 255, 0.92)',
    shellDark: 'rgba(18, 21, 27, 0.92)',
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
  sunset: {
    ...neutralVibe,
    id: 'sunset',
    mutedLight: '#5f6d82',
    label: 'Sunset pulse',
    primary: '#f97316',
    accent: '#ec4899',
    glow: 'rgba(249, 115, 22, 0.3)',
    canvasLight: '#fff7ed',
    canvasDark: '#211106',
    shellLight: 'rgba(255, 247, 237, 0.9)',
    shellDark: 'rgba(44, 18, 10, 0.88)',
    surfaceLight: 'rgba(255, 250, 245, 0.9)',
    surfaceDark: 'rgba(68, 24, 12, 0.78)',
    borderLight: 'rgba(249, 115, 22, 0.3)',
    borderDark: 'rgba(251, 146, 60, 0.36)',
    gradient: 'radial-gradient(circle at 14% 8%, rgba(251, 146, 60, 0.38), transparent 28%), radial-gradient(circle at 88% 18%, rgba(236, 72, 153, 0.32), transparent 32%), linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(253, 242, 248, 0.86))',
    hero: 'linear-gradient(135deg, rgba(249, 115, 22, 0.26), rgba(236, 72, 153, 0.22))',
  },
  oceanic: {
    ...neutralVibe,
    id: 'oceanic',
    label: 'Oceanic wave',
    primary: '#0891b2',
    accent: '#2563eb',
    glow: 'rgba(8, 145, 178, 0.28)',
    canvasLight: '#ecfeff',
    canvasDark: '#04131f',
    shellLight: 'rgba(236, 254, 255, 0.88)',
    shellDark: 'rgba(5, 26, 44, 0.88)',
    surfaceLight: 'rgba(248, 253, 255, 0.9)',
    surfaceDark: 'rgba(8, 47, 73, 0.78)',
    borderLight: 'rgba(8, 145, 178, 0.28)',
    borderDark: 'rgba(103, 232, 249, 0.28)',
    gradient: 'radial-gradient(circle at 18% 8%, rgba(34, 211, 238, 0.32), transparent 30%), radial-gradient(circle at 86% 14%, rgba(37, 99, 235, 0.28), transparent 32%), linear-gradient(135deg, rgba(236, 254, 255, 0.96), rgba(239, 246, 255, 0.9))',
    hero: 'linear-gradient(135deg, rgba(8, 145, 178, 0.24), rgba(37, 99, 235, 0.2))',
  },
  forest: {
    ...neutralVibe,
    id: 'forest',
    label: 'Forest signal',
    primary: '#16a34a',
    accent: '#84cc16',
    glow: 'rgba(22, 163, 74, 0.28)',
    canvasLight: '#f0fdf4',
    canvasDark: '#06180d',
    shellLight: 'rgba(240, 253, 244, 0.9)',
    shellDark: 'rgba(8, 35, 19, 0.88)',
    surfaceLight: 'rgba(250, 255, 251, 0.9)',
    surfaceDark: 'rgba(20, 83, 45, 0.72)',
    borderLight: 'rgba(22, 163, 74, 0.26)',
    borderDark: 'rgba(134, 239, 172, 0.28)',
    gradient: 'radial-gradient(circle at 18% 10%, rgba(34, 197, 94, 0.28), transparent 28%), radial-gradient(circle at 84% 14%, rgba(132, 204, 22, 0.24), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(22, 163, 74, 0.22), rgba(132, 204, 22, 0.18))',
  },
  ruby: {
    ...neutralVibe,
    id: 'ruby',
    mutedLight: '#5f6d82',
    label: 'Ruby spark',
    primary: '#e11d48',
    accent: '#f97316',
    canvasLight: '#fff1f2',
    canvasDark: '#22050c',
    shellLight: 'rgba(255, 241, 242, 0.9)',
    shellDark: 'rgba(50, 8, 18, 0.88)',
    surfaceDark: 'rgba(76, 20, 32, 0.76)',
    borderLight: 'rgba(225, 29, 72, 0.28)',
    gradient: 'radial-gradient(circle at 18% 8%, rgba(225, 29, 72, 0.32), transparent 28%), radial-gradient(circle at 86% 18%, rgba(249, 115, 22, 0.22), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(225, 29, 72, 0.24), rgba(249, 115, 22, 0.18))',
  },
  amber: {
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
  'neon-night': {
    ...neutralVibe,
    id: 'neon-night',
    label: 'Neon night',
    primary: '#84cc16',
    accent: '#22d3ee',
    glow: 'rgba(132, 204, 22, 0.34)',
    canvasLight: '#f7fee7',
    canvasDark: '#030712',
    shellLight: 'rgba(247, 254, 231, 0.88)',
    shellDark: 'rgba(5, 12, 24, 0.9)',
    surfaceDark: 'rgba(12, 23, 36, 0.86)',
    borderLight: 'rgba(132, 204, 22, 0.3)',
    borderDark: 'rgba(190, 242, 100, 0.34)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(132, 204, 22, 0.36), transparent 26%), radial-gradient(circle at 86% 12%, rgba(34, 211, 238, 0.28), transparent 30%), linear-gradient(135deg, rgba(3, 7, 18, 0.96), rgba(8, 47, 73, 0.74))',
    hero: 'linear-gradient(135deg, rgba(132, 204, 22, 0.28), rgba(34, 211, 238, 0.18))',
  },
  skyline: {
    ...neutralVibe,
    id: 'skyline',
    mutedLight: '#5f6d82',
    label: 'Skyline indigo',
    primary: '#4f46e5',
    accent: '#0ea5e9',
    canvasLight: '#eef2ff',
    canvasDark: '#0b1026',
    shellLight: 'rgba(238, 242, 255, 0.9)',
    shellDark: 'rgba(13, 20, 52, 0.88)',
    surfaceDark: 'rgba(30, 41, 86, 0.78)',
    borderLight: 'rgba(79, 70, 229, 0.28)',
    gradient: 'radial-gradient(circle at 18% 8%, rgba(79, 70, 229, 0.32), transparent 28%), radial-gradient(circle at 84% 12%, rgba(14, 165, 233, 0.28), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(79, 70, 229, 0.24), rgba(14, 165, 233, 0.18))',
  },
  aurora: {
    ...neutralVibe,
    id: 'aurora',
    label: 'Aurora teal',
    primary: '#0d9488',
    accent: '#a3e635',
    canvasLight: '#f0fdfa',
    canvasDark: '#04211f',
    shellLight: 'rgba(240, 253, 250, 0.9)',
    shellDark: 'rgba(5, 44, 42, 0.88)',
    surfaceDark: 'rgba(19, 78, 74, 0.76)',
    borderLight: 'rgba(13, 148, 136, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(45, 212, 191, 0.32), transparent 28%), radial-gradient(circle at 84% 14%, rgba(163, 230, 53, 0.22), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(13, 148, 136, 0.24), rgba(163, 230, 53, 0.16))',
  },
  coral: {
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
  mint: {
    ...neutralVibe,
    id: 'mint',
    label: 'Mint circuit',
    primary: '#059669',
    accent: '#14b8a6',
    canvasLight: '#ecfdf5',
    canvasDark: '#031c16',
    shellLight: 'rgba(236, 253, 245, 0.9)',
    shellDark: 'rgba(5, 42, 34, 0.88)',
    surfaceDark: 'rgba(6, 78, 59, 0.74)',
    borderLight: 'rgba(5, 150, 105, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(16, 185, 129, 0.3), transparent 28%), radial-gradient(circle at 84% 14%, rgba(20, 184, 166, 0.22), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(5, 150, 105, 0.24), rgba(20, 184, 166, 0.16))',
  },
  orchid: {
    ...neutralVibe,
    id: 'orchid',
    mutedLight: '#5f6d82',
    label: 'Orchid signal',
    primary: '#9333ea',
    accent: '#ec4899',
    canvasLight: '#faf5ff',
    canvasDark: '#1d0b2f',
    shellLight: 'rgba(250, 245, 255, 0.9)',
    shellDark: 'rgba(39, 15, 63, 0.88)',
    surfaceDark: 'rgba(59, 25, 94, 0.78)',
    borderLight: 'rgba(147, 51, 234, 0.28)',
    gradient: 'radial-gradient(circle at 16% 8%, rgba(147, 51, 234, 0.32), transparent 28%), radial-gradient(circle at 84% 14%, rgba(236, 72, 153, 0.24), transparent 30%)',
    hero: 'linear-gradient(135deg, rgba(147, 51, 234, 0.24), rgba(236, 72, 153, 0.18))',
  },
  royal: {
    ...neutralVibe,
    id: 'royal',
    mutedLight: '#5f6d82',
    label: 'Royal violet',
    primary: '#7c3aed',
    accent: '#06b6d4',
    canvasLight: '#f5f3ff',
    canvasDark: '#100a2d',
    shellLight: 'rgba(245, 243, 255, 0.9)',
    shellDark: 'rgba(21, 13, 59, 0.88)',
    surfaceDark: 'rgba(46, 26, 104, 0.78)',
    borderLight: 'rgba(124, 58, 237, 0.3)',
    gradient: 'radial-gradient(circle at 15% 9%, rgba(124, 58, 237, 0.34), transparent 28%), radial-gradient(circle at 82% 12%, rgba(6, 182, 212, 0.28), transparent 30%), radial-gradient(circle at 92% 72%, rgba(236, 72, 153, 0.2), transparent 26%)',
    hero: 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(6, 182, 212, 0.18), rgba(236, 72, 153, 0.18))',
  },
  warm: {
    ...neutralVibe,
    id: 'warm',
    label: 'Warm sand',
    primary: '#b45309',
    accent: '#f97316',
    glow: 'rgba(180, 83, 9, 0.26)',
    canvasLight: '#fffbf0',
    canvasDark: '#1c1005',
    shellLight: 'rgba(255, 251, 240, 0.9)',
    shellDark: 'rgba(38, 24, 8, 0.88)',
    surfaceLight: 'rgba(255, 255, 255, 0.94)',
    surfaceDark: 'rgba(74, 42, 10, 0.76)',
    borderLight: 'rgba(180, 83, 9, 0.26)',
    borderDark: 'rgba(252, 176, 69, 0.32)',
    gradient: 'radial-gradient(circle at 16% 10%, rgba(251, 191, 36, 0.34), transparent 30%), radial-gradient(circle at 84% 14%, rgba(249, 115, 22, 0.26), transparent 28%)',
    hero: 'linear-gradient(135deg, rgba(180, 83, 9, 0.24), rgba(249, 115, 22, 0.18))',
  },
  'athlete-gold': {
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
  cosmic: {
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
};

/** Returns every vibe theme. */
export function getGdsVibeThemes() {
  return Object.values(vibeThemes);
}

/** Resolves the vibe theme for a preset id, falling back to the neutral default. */
export function resolveGdsVibeTheme(id: GdsThemePresetId) {
  return vibeThemes[id] ?? neutralVibe;
}

// Issue 554. These two lanes' semantic values are GENERATED from the single source in
// `semantic-token-source.ts` — the same table `createBrandTheme` emits from — so the two
// paths cannot disagree. Previously both were hand-authored from the same spec document
// and a comment here asked a human to keep them byte-identical. That instruction is what
// `verify:token-single-source` now enforces mechanically instead.
const classUsaSemanticCssVariables = emitClassUsaCssVariables(classUsaDefaultColorRamps);
const goldAthleteSemanticCssVariables = emitGoldAthleteCssVariables(goldAthleteDefaultColorRamps);

const brandSemanticCssVariablesByPreset: Partial<Record<GdsThemePresetId, Record<string, string>>> = {
  'class-usa': classUsaSemanticCssVariables,
  'gold-athlete': goldAthleteSemanticCssVariables,
};

const derivedSemanticCssVariablesCache = new Map<GdsThemePresetId, Record<string, string>>();

function resolveVibeSemanticCssVariables(id: GdsThemePresetId, vibe: GdsVibeTheme): Record<string, string> {
  const handAuthored = brandSemanticCssVariablesByPreset[id];
  if (handAuthored) {
    // The hand-authored table OVERRIDES derivation; it does not REPLACE it (issue #537).
    //
    // Returning it wholesale meant any role it happened not to list simply vanished for
    // the brand lanes, while every generic lane had one. That is precisely how
    // `--gds-text-on-support` came to be absent here and present everywhere else, and
    // why ChoiceChip reached for `text.onInverse` - a role designed for a different
    // background - and rendered at 1.89:1 in class-usa dark.
    //
    // Deriving first and layering the hand-authored values on top preserves every
    // deliberate brand decision while making an omission fall back to a
    // contrast-derived default rather than to nothing. It also means a role added in
    // future cannot silently disappear from these two lanes.
    const merged = { ...deriveVibeSemanticCssVariables(vibe), ...handAuthored };

    // Roles DERIVED FROM another role must be recomputed after the override layer is
    // applied, or the pair is mismatched: the derived foreground was computed against
    // the derived `support`, while the hand-authored `support` is what actually wins.
    // That mismatch measured 4.1:1 for class-usa light - a real failure introduced by
    // the fix itself, caught only because every preset x scheme pair is verified rather
    // than sampled.
    merged['--gds-text-on-support'] = readableForeground(merged['--gds-support'], 4.5, merged['--gds-bg-page'] ?? vibe.canvasLight);
    merged['--gds-text-on-support-dark'] = readableForeground(merged['--gds-support-dark'], 4.5, merged['--gds-bg-page-dark'] ?? vibe.canvasDark);

    return merged;
  }

  const cached = derivedSemanticCssVariablesCache.get(id);
  if (cached) {
    return cached;
  }

  const derived = deriveVibeSemanticCssVariables(vibe);
  derivedSemanticCssVariablesCache.set(id, derived);
  return derived;
}

/**
 * Builds the `--gds-vibe-*` CSS variables for a preset and color scheme (mode is
 * resolved to the light or dark value of each token), plus the full `--gds-*`
 * semantic role set (hand-authored for `class-usa`/`gold-athlete`,
 * {@link deriveVibeSemanticCssVariables} for every other preset), with `-dark`
 * values collapsed onto their base names in dark mode.
 *
 * Return type is explicitly `Record<string, string>`, not the narrower
 * object-literal shape TS would otherwise infer from the `--gds-vibe-*`
 * properties alone: the semantic role set (`--gds-brand-primary`,
 * `--gds-state-success`, etc.) is merged in via `...semanticVariables` below
 * and is real at runtime, but a plain object-literal return type doesn't
 * carry that merge across a package's compiled `.d.ts` boundary. Annotating
 * the true shape here (rather than each caller re-deriving or casting
 * around the gap) is the fix at the source.
 */
export function getGdsVibeThemeCssVariables(id: GdsThemePresetId, colorScheme: 'light' | 'dark'): Record<string, string> {
  const vibe = resolveGdsVibeTheme(id);
  const dark = colorScheme === 'dark';

  // A flatSurfaces lane (Class USA, Gold Athlete) is backed by a real
  // `createBrandTheme(...)` that never configures a gradient, glow, or
  // colored shadow anywhere in its own definition. Every CSS rule below
  // reads `--gds-vibe-glow`/`--gds-vibe-gradient` to paint atmospheric
  // effects (page background wash, header/card/button glows) across the
  // WHOLE site whenever that lane is the active theme, not just inside a
  // Theme Lab preview — so neutralizing them here, once, at the source, is
  // what keeps every one of those consumers honest instead of fabricating
  // an atmosphere the real brand doesn't have.
  const glow = vibe.flatSurfaces ? 'transparent' : vibe.glow;
  const gradient = vibe.flatSurfaces ? 'none' : vibe.gradient;

  const variables = {
    '--gds-vibe-primary': vibe.primary,
    '--gds-vibe-accent': vibe.accent,
    '--gds-vibe-glow': glow,
    '--gds-vibe-canvas': dark ? vibe.canvasDark : vibe.canvasLight,
    '--gds-vibe-shell': dark ? vibe.shellDark : vibe.shellLight,
    '--gds-vibe-surface': dark ? vibe.surfaceDark : vibe.surfaceLight,
    '--gds-vibe-border': dark ? vibe.borderDark : vibe.borderLight,
    '--gds-vibe-text': dark ? vibe.textDark : vibe.textLight,
    '--gds-vibe-muted': dark ? vibe.mutedDark : vibe.mutedLight,
    '--gds-vibe-focus': dark ? vibe.textDark : vibe.textLight,
    '--gds-vibe-gradient': gradient,
    '--gds-vibe-hero': vibe.hero,
    // Issue 618 — the preset's atmosphere at SMALL-SURFACE scale.
    //
    // `--gds-vibe-hero` is composed for a full-width band. Reused as a 40px fill its 135° ramp
    // stops being a wash and becomes a hard diagonal: `gold-athlete`'s hero is imperceptible
    // across a hero band and reads as a metallic split inside a swatch. That is a SCALE
    // mismatch, and it had no token to fix it with — anything needing the atmosphere small (a
    // swatch, a chip, a legend dot, a preview tile, a consumer's own theme picker) had to
    // borrow the hero and inherit its geometry.
    //
    // Scale-independent by construction: a radial from the centre reads the same at 40px and at
    // 400px, because there is no axis along which a small box can crop the ramp differently.
    // DERIVED from the same `primary`/`accent` the rest of the vibe is built from, and mixed
    // against the scheme's own surface, so it cannot drift from the preset and needs no
    // per-preset authoring — all 25 get it, in both schemes, for free.
    //
    // A `flatSurfaces` brand lane has no atmosphere by definition, so it gets an honest flat
    // tint rather than a gradient GDS invented for it — the same reasoning that neutralises
    // `glow` and `gradient` above.
    '--gds-vibe-swatch': vibe.flatSurfaces
      ? `color-mix(in srgb, ${vibe.primary} 18%, ${dark ? vibe.surfaceDark : vibe.surfaceLight})`
      : `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${vibe.accent} 34%, ${dark ? vibe.surfaceDark : vibe.surfaceLight}) 0%, color-mix(in srgb, ${vibe.primary} 22%, ${dark ? vibe.surfaceDark : vibe.surfaceLight}) 100%)`,
    '--gds-vibe-atmosphere': vibe.flatSurfaces ? '0' : '1',
  };

  const brandSemanticCssVariables = resolveVibeSemanticCssVariables(id, vibe);
  // Issue 555: axis tokens are scheme-independent — a corner radius does not change between
  // light and dark — so they are merged in once rather than resolved per scheme.
  const axisVariables = resolveGdsAxisTokens(vibe.axes, id, colorScheme);

  const semanticVariables: Record<string, string> = { ...brandSemanticCssVariables };
  if (dark) {
    Object.entries(brandSemanticCssVariables).forEach(([property, value]) => {
      if (property.endsWith('-dark')) {
        semanticVariables[property.replace(/-dark$/, '')] = value;
      }
    });
  }

  return { ...variables, ...axisVariables, ...semanticVariables };
}
