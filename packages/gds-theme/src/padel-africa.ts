/**
 * Padel Africa — brand preset.
 *
 * Transcribed from the brand's own Website Colour Theme Guide, which is the authority for every
 * value here. Nothing is sampled, estimated or derived: if a value disagrees with the guide, the
 * guide is right.
 *
 * ## Why the ramps are explicit
 *
 * `createBrandTheme`'s five-ramp form interpolates between the values it is given. For this palette
 * that produced `#b56e57` — a muddy brick present in no brand asset — and Mantine's default
 * `primaryShade: 6` then painted it on every link, button and active nav item. So each colour is
 * registered as a full ten-step ramp with the brand's own value written in **verbatim** at the
 * index the theme actually paints with. Generated steps exist for hover, borders and tints; the
 * brand colour itself is never generated.
 *
 * ## Accessibility, stated rather than hidden
 *
 * The guide names Emerald as the primary CTA. White text on Emerald measures 3.62:1 — above the 3:1
 * large-text floor, below WCAG AA's 4.5:1 for normal text. The preset follows the guide, because the
 * palette is the brand's decision, and exports {@link PADEL_AFRICA_ACCESSIBLE_CTA} for consumers who
 * need AA on that surface: Forest Green (9.55:1), which the guide already designates as the CTA
 * hover colour — so choosing accessibility never means leaving the palette. Issue 680 adds the floor
 * rule that makes this tradeoff measurable instead of invisible.
 */
import type { MantineThemeOverride } from '@mantine/core';

/** Deepest brand tone. Primary headings, dark nav bar, footer, and dark nav text. */
export const PADEL_AFRICA_DEEP_JUNGLE = '#062018';
/** Primary CTA hover, strong brand areas, secondary headings. */
export const PADEL_AFRICA_FOREST_GREEN = '#035033';
/** The signature green. Primary CTA, active states, success/highlight, map pins. */
export const PADEL_AFRICA_EMERALD = '#0B9B4A';
/** Mid green for supporting fills and gradients. */
export const PADEL_AFRICA_LEAF_GREEN = '#2B9332';
/** Energetic highlight. Focus rings, motion, micro-interactions — used sparingly by design. */
export const PADEL_AFRICA_LIME_ACCENT = '#B8CE1B';
/** Price badges, emphasis, featured states. Half of the signature green+gold pairing. */
export const PADEL_AFRICA_GOLD = '#F3A806';
/** Optimistic CTAs and emphasis, alongside Gold. */
export const PADEL_AFRICA_SUN_YELLOW = '#F7D10B';
/** Controlled highlight and link/text accent. Never the dominant UI colour. */
export const PADEL_AFRICA_ORANGE_ACCENT = '#F1510A';
/** Warning accent. */
export const PADEL_AFRICA_BURNT_AMBER = '#A35110';
/** Default page background — warmer than pure white, which the guide explicitly rules out. */
export const PADEL_AFRICA_SOFT_IVORY = '#F2F8EC';
/** Card background. The one place pure white is correct. */
export const PADEL_AFRICA_CARD_WHITE = '#FFFFFF';

/**
 * The AA-safe substitute for Emerald wherever white text sits on the CTA: Forest Green, 9.55:1.
 * The guide already names it as the CTA hover, so the accessible variant stays inside the palette.
 */
export const PADEL_AFRICA_ACCESSIBLE_CTA = PADEL_AFRICA_FOREST_GREEN;

/** Every core colour, for tooling that enumerates the palette (docs, tests, pickers). */
export const PADEL_AFRICA_CORE_PALETTE = {
  deepJungle: PADEL_AFRICA_DEEP_JUNGLE,
  forestGreen: PADEL_AFRICA_FOREST_GREEN,
  emerald: PADEL_AFRICA_EMERALD,
  leafGreen: PADEL_AFRICA_LEAF_GREEN,
  limeAccent: PADEL_AFRICA_LIME_ACCENT,
  gold: PADEL_AFRICA_GOLD,
  sunYellow: PADEL_AFRICA_SUN_YELLOW,
  orangeAccent: PADEL_AFRICA_ORANGE_ACCENT,
  burntAmber: PADEL_AFRICA_BURNT_AMBER,
  softIvory: PADEL_AFRICA_SOFT_IVORY,
} as const;

/** The index the brand's own value occupies. Mantine's default light `primaryShade`. */
export const PADEL_AFRICA_BASE_INDEX = 6;

type Rgb = [number, number, number];
export type PadelAfricaRamp = readonly [string, string, string, string, string, string, string, string, string, string];

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toRgb = (hex: string): Rgb => [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16)) as Rgb;
const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const mix = (hex: string, target: Rgb, amount: number) => {
  const [r, g, b] = toRgb(hex);
  return toHex([r + (target[0] - r) * amount, g + (target[1] - g) * amount, b + (target[2] - b) * amount]);
};

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

/**
 * A Mantine ten-step ramp with `base` placed verbatim at {@link PADEL_AFRICA_BASE_INDEX}.
 *
 * Steps 0-5 mix toward white (tints, for backgrounds and hover surfaces) and 7-9 toward black
 * (shades, for pressed states and borders). The dark end is deliberately gentle: a brand green
 * driven to near-black stops reading as the brand at all.
 */
export function buildPadelAfricaRamp(base: string): PadelAfricaRamp {
  const [t0, t1, t2, t3, t4, t5] = [0.92, 0.8, 0.64, 0.46, 0.28, 0.12].map((a) => mix(base, WHITE, a));
  const [s7, s8, s9] = [0.15, 0.3, 0.45].map((a) => mix(base, BLACK, a));
  // A fixed tuple, not a spread: Mantine's MantineColorsTuple is a ten-element tuple type and a
  // spread widens to string[], which does not satisfy it.
  return [t0, t1, t2, t3, t4, t5, base.toUpperCase(), s7, s8, s9] as const;
}

/** Ramp keys this preset registers. Prefixed so they cannot collide with another brand's ramps. */
export const PADEL_AFRICA_RAMPS = {
  jungle: 'padelAfricaJungle',
  forest: 'padelAfricaForest',
  emerald: 'padelAfricaEmerald',
  leaf: 'padelAfricaLeaf',
  lime: 'padelAfricaLime',
  gold: 'padelAfricaGold',
  sun: 'padelAfricaSun',
  orange: 'padelAfricaOrange',
  amber: 'padelAfricaAmber',
  ivory: 'padelAfricaIvory',
} as const;

const padelAfricaColors: Record<string, PadelAfricaRamp> = {
  [PADEL_AFRICA_RAMPS.jungle]: buildPadelAfricaRamp(PADEL_AFRICA_DEEP_JUNGLE),
  [PADEL_AFRICA_RAMPS.forest]: buildPadelAfricaRamp(PADEL_AFRICA_FOREST_GREEN),
  [PADEL_AFRICA_RAMPS.emerald]: buildPadelAfricaRamp(PADEL_AFRICA_EMERALD),
  [PADEL_AFRICA_RAMPS.leaf]: buildPadelAfricaRamp(PADEL_AFRICA_LEAF_GREEN),
  [PADEL_AFRICA_RAMPS.lime]: buildPadelAfricaRamp(PADEL_AFRICA_LIME_ACCENT),
  [PADEL_AFRICA_RAMPS.gold]: buildPadelAfricaRamp(PADEL_AFRICA_GOLD),
  [PADEL_AFRICA_RAMPS.sun]: buildPadelAfricaRamp(PADEL_AFRICA_SUN_YELLOW),
  [PADEL_AFRICA_RAMPS.orange]: buildPadelAfricaRamp(PADEL_AFRICA_ORANGE_ACCENT),
  [PADEL_AFRICA_RAMPS.amber]: buildPadelAfricaRamp(PADEL_AFRICA_BURNT_AMBER),
  [PADEL_AFRICA_RAMPS.ivory]: buildPadelAfricaRamp(PADEL_AFRICA_SOFT_IVORY),
};

/**
 * The roles the guide's "Best variations" table names. Consumers read these rather than the raw
 * colours, so a role can be re-pointed centrally — which is why the guide states roles ("price
 * badge") rather than only colours ("gold").
 *
 * One documented departure: the table lists `#B8CE1B` (Lime) for "Active tab / pill", but every
 * rendered example in the same guide — the nav's "Browse", the category row's "All" — shows an
 * Emerald-filled active pill, and both the Application Guidelines and the DO list assign Lime to
 * focus, rings, micro-interactions and motion. The rendered UI and the written guidance agree with
 * each other against that one cell, so `activePill` is Emerald and Lime carries focus (issue 678).
 */
export const PADEL_AFRICA_ROLES = {
  primaryCta: PADEL_AFRICA_EMERALD,
  primaryCtaHover: PADEL_AFRICA_FOREST_GREEN,
  secondaryCta: PADEL_AFRICA_FOREST_GREEN,
  activePill: PADEL_AFRICA_EMERALD,
  focusRing: PADEL_AFRICA_LIME_ACCENT,
  cardBackground: PADEL_AFRICA_CARD_WHITE,
  surfaceBackground: PADEL_AFRICA_SOFT_IVORY,
  priceBadge: PADEL_AFRICA_GOLD,
  linkAccent: PADEL_AFRICA_ORANGE_ACCENT,
  successHighlight: PADEL_AFRICA_EMERALD,
  warningAccent: PADEL_AFRICA_BURNT_AMBER,
  heading: PADEL_AFRICA_DEEP_JUNGLE,
  navBackground: PADEL_AFRICA_DEEP_JUNGLE,
  navLink: 'rgba(255, 255, 255, 0.86)',
  accessibleCta: PADEL_AFRICA_FOREST_GREEN,
} as const;

/**
 * The preset. Colour is re-pointed and the brand's own layout defaults are carried; every other GDS
 * token, spacing and elevation decision is inherited from the governed base theme.
 */
export const padelAfricaThemePreset: MantineThemeOverride = {
  colors: padelAfricaColors,
  primaryColor: PADEL_AFRICA_RAMPS.emerald,
  // Both schemes sit at the guide's own value. Mantine's dark default (8) would paint a darkened
  // Emerald the brand never specified.
  primaryShade: { light: PADEL_AFRICA_BASE_INDEX, dark: PADEL_AFRICA_BASE_INDEX },
  other: {
    padelAfrica: PADEL_AFRICA_ROLES,
  },
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    Badge: {
      // Price badges are Gold with Deep Jungle text, bold, and never uppercased.
      defaultProps: { radius: 'md' },
      styles: { root: { textTransform: 'none' } },
    },
    Card: {
      defaultProps: { radius: 'lg', padding: 'md', withBorder: false },
      styles: { root: { background: PADEL_AFRICA_CARD_WHITE } },
    },
    Chip: {
      defaultProps: { radius: 'xl', size: 'lg' },
      styles: { label: { textTransform: 'none' } },
    },
  },
};
