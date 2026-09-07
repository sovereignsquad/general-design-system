import { createElement } from 'react';
import { gdsDevWarnOnce, useGdsTranslation } from '@sovereignsquad/gds-theme';

/**
 * Activity pictogram family (issue 708), patterned after the `GdsIcons` closed dictionary
 * in `icons.ts` but a deliberately separate mechanism: Tabler chrome icons and activity
 * pictograms are different families with different contracts (24×24 grid, contextual
 * treatments, scale-tuned stroke, and a token-only interaction-state contract).
 *
 * Source: Your Field v3 Design Guidelines, "Visual Language & Pictogram Guidelines" — every
 * activity is a single, consistent icon family; marks signal the activity rather than depict a
 * scene.
 *
 * Sourcing policy -- no hand-drawn or redrawn artwork, ever: every path below is the real,
 * unmodified data of a published icon-library glyph. Default source is `@tabler/icons-react`
 * (the same MIT-licensed dependency `GdsIcons` ships); when Tabler has no matching glyph, the
 * next real set is searched (via iconify.design's 200+ open, permissively-licensed
 * collections) for the best available match -- verbatim path data, rendered `stroke` by default
 * to match Tabler's line-icon grammar, or `fill` (see {@link GdsPictogramDefinition.fillMode})
 * on a glyph that exists only as a filled icon. Any future pictogram gap follows the same
 * order: Tabler first, then the wider Iconify catalogue, real source data only, never
 * hand-drawn -- see `docs/ICON_REGISTRY.md`.
 */

/** One pictogram: a single drawing on the 24x24 optical grid, sourced verbatim from a real icon library. */
export interface GdsPictogramDefinition {
  /** Stable kebab-case identity, e.g. 'flag-football'. Lookup key, never rendered. */
  key: string;
  /** Accessible default label, e.g. 'Flag football'. Routed through the i18n message mechanism for the shipped activity family; used verbatim for consumer-defined families. */
  label: string;
  /**
   * SVG path data for the drawing. Rendered exclusively as the `d`
   * attribute of a single <path>; validated at family
   * construction (see {@link createGdsPictogramFamily}). No markup, no raster -- always the
   * unmodified path data of a real icon-library glyph, never hand-drawn or traced.
   */
  path: string;
  /**
   * How the path is painted: `'stroke'` (default) draws it unfilled with the family's stroke
   * contract, matching every icon sourced from a line/outline icon set (Tabler and similar).
   * `'fill'` draws it as a solid `currentColor` shape with no stroke, for a glyph whose real,
   * unmodified source only exists as a filled icon (e.g. no line/outline set has a matching
   * mark) -- the shape is still the library's own path data, never redrawn to fit the other
   * mode.
   */
  fillMode?: 'stroke' | 'fill';
}

/** A named, validated collection of pictograms. */
export interface GdsPictogramFamily<K extends string = string> {
  /** Family identity, e.g. 'gds-activity'. */
  id: string;
  /** Pictogram definitions keyed by their own {@link GdsPictogramDefinition.key}. */
  pictograms: Record<K, GdsPictogramDefinition>;
  /** Optional key rendered for unknown lookups; unset = layout-stable empty slot + dev warning. */
  fallbackKey?: K;
}

/** Contextual surface a pictogram renders into: list/search result, provider/detail page, hero, or map pin. Each has a default {@link GdsPictogramScale} (see {@link GDS_PICTOGRAM_TREATMENT_SCALE}). */
export type GdsPictogramTreatment = 'list' | 'detail' | 'hero' | 'pin';

/** Rendered size step: `sm` 16px, `md` 32px, `lg` 72px (see {@link GDS_PICTOGRAM_SCALE_PX}). */
export type GdsPictogramScale = 'sm' | 'md' | 'lg';

/** Interaction/emphasis state, expressed only through existing color tokens — never a new hue. */
export type GdsPictogramState = 'default' | 'hover' | 'selected' | 'disabled';

/** The shipped activity family keys (the 11-entry reference set). */
export type GdsActivityPictogramKey =
  | 'soccer' | 'baseball' | 'basketball' | 'swimming' | 'tennis'
  | 'flag-football' | 'martial-arts' | 'camps' | 'lacrosse'
  | 'athletics' | 'hockey';

/** Optical grid every pictogram drawing is authored on (24×24 SVG user units). Every shipped path assumes this exact viewBox. */
export const GDS_PICTOGRAM_GRID = 24;

/** Base stroke width in grid units — the family's reference weight, applied verbatim at the `md` scale (see {@link GDS_PICTOGRAM_STROKE_BY_SCALE}). */
export const GDS_PICTOGRAM_BASE_STROKE = 1.75;

/** Rendered pixel size for each scale: `sm` 16, `md` 32, `lg` 72 — the source spec's own three sizes. */
export const GDS_PICTOGRAM_SCALE_PX: Record<GdsPictogramScale, number> = {
  sm: 16,
  md: 32,
  lg: 72,
};

/**
 * Grid-space stroke width per scale (SVG user units on the 24×24 grid, not device pixels).
 * A smaller render needs a relatively thicker line to stay legible once the shared 24-unit
 * drawing is scaled down to `GDS_PICTOGRAM_SCALE_PX[scale]`; a larger render can afford a
 * relatively thinner one. `md` keeps {@link GDS_PICTOGRAM_BASE_STROKE} verbatim; `sm`/`lg` are
 * tuned around it. Physical rendered stroke = value * sizePx / 24: sm -> 2.5*16/24 ≈ 1.67px,
 * md -> 1.75*32/24 ≈ 2.33px, lg -> 1.5*72/24 = 4.5px — increasing physical weight with size
 * while the grid-space value decreases, which is what keeps one shared drawing legible across
 * the whole range instead of thinning to a hairline at 16px or over-bolding at 72px.
 */
export const GDS_PICTOGRAM_STROKE_BY_SCALE: Record<GdsPictogramScale, number> = {
  sm: 2.5,
  md: GDS_PICTOGRAM_BASE_STROKE,
  lg: 1.5,
};

/** Each treatment's default scale, per the source spec: list and pin read small, detail reads medium, hero reads large. */
export const GDS_PICTOGRAM_TREATMENT_SCALE: Record<GdsPictogramTreatment, GdsPictogramScale> = {
  list: 'sm',
  detail: 'md',
  hero: 'lg',
  pin: 'sm',
};

/** One layer of the hero treatment: transforms of the same drawing only — no color, no blur. */
export interface GdsPictogramHeroLayer {
  /** Multiplier on the `lg` pixel size. */
  scale: number;
  /** Layer opacity, 0..1. */
  opacity: number;
  /** Horizontal offset from center, in grid units. */
  offsetX: number;
  /** Vertical offset from center, in grid units. */
  offsetY: number;
}

/**
 * Fixed, bounded recipe for the hero treatment's layered depth: the real mark at full opacity
 * (`scale` 1, `offsetX`/`offsetY` 0) plus two larger, fainter, offset echoes of the identical
 * drawing — depth from scale/opacity/position alone, never a second color. Layer count and
 * values are constant, so hero paint cost is fixed and known (Rule: performance).
 */
export const GDS_PICTOGRAM_HERO_LAYERS: readonly GdsPictogramHeroLayer[] = [
  { scale: 1, opacity: 1, offsetX: 0, offsetY: 0 },
  { scale: 1.6, opacity: 0.22, offsetX: 3, offsetY: -2 },
  { scale: 2.2, opacity: 0.1, offsetX: -4, offsetY: 3 },
];

/**
 * Disabled-state opacity. Matches the reduced-opacity value already used for disabled controls
 * elsewhere in gds-core (`ChoiceChip`, `GdsRemovableTag`) — the established disabled-control
 * treatment, not a value invented for pictograms specifically.
 */
export const GDS_PICTOGRAM_DISABLED_OPACITY = 0.55;

/**
 * `selected`-state stroke color: the semantic, un-specialised accent role (`--gds-accent`),
 * which resolves per theme preset (terracotta in the Your Field lane, that lane's own accent
 * elsewhere) — never a curated per-category accent like `GdsBadge`'s `accent` prop. The
 * fallback chain ends at Mantine's own primary-color token, mirroring `gdsIconToneColor.primary`
 * in `icons.ts`, so a pictogram never renders colorless before a GDS theme mounts.
 */
const GDS_PICTOGRAM_SELECTED_STROKE = 'var(--gds-accent, var(--mantine-primary-color-filled))';

/** Usage rule scoped to one treatment, or `'family'` for a rule that applies to every drawing regardless of context. */
export interface GdsPictogramUsageRule {
  /** Stable identity for the rule. */
  id: string;
  /** Treatment the rule governs, or `'family'` for a family-wide rule. */
  treatment: GdsPictogramTreatment | 'family';
  /** The rule itself, quoted from the source guidelines. */
  rule: string;
}

/**
 * The source guidelines' usage rules, shipped as data so documentation derives them (Rule 14)
 * instead of retyping prose that could drift from what the guidelines actually say.
 */
export const gdsPictogramUsageRules: readonly GdsPictogramUsageRule[] = [
  {
    id: 'family-drawing-never-changes',
    treatment: 'family',
    rule: 'The drawing never changes — only its scale, weight, and color emphasis shift with the role the visual plays on the page.',
  },
  {
    id: 'family-no-new-hues-for-state',
    treatment: 'family',
    rule: 'Interactive states are expressed with the existing color tokens only — no new hues are introduced for state alone.',
  },
  {
    id: 'list-one-per-card',
    treatment: 'list',
    rule: 'Use the small, neutral icon variant. Keep it secondary to the program title. One icon per card — no decorative repetition.',
  },
  {
    id: 'detail-accent-allowed',
    treatment: 'detail',
    rule: 'Use the larger, stronger variant. Brand accent is allowed for emphasis. Pair with the activity name, never a stock photo.',
  },
  {
    id: 'hero-scale-opacity-only',
    treatment: 'hero',
    rule: 'May be expressive and layered, but stays non-figurative. Keep contrast soft so text remains readable on top. Use scale and opacity — not new colors — for depth.',
  },
  {
    id: 'pin-no-labels',
    treatment: 'pin',
    rule: 'Use the smallest, most simplified form. Selected state uses the brand accent; default stays neutral. Never add labels inside the pin — icon only.',
  },
];

/** `true` for a non-empty kebab-case string (lowercase letters/digits, hyphen-separated). */
function isGdsPictogramKebabKey(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/**
 * `true` when `value` is safe, well-formed SVG path data: a leading moveto command followed
 * only by path commands, numbers, decimals, minus signs, commas, and whitespace — never markup
 * or script text. This is the injection guard: the render path only ever assigns a validated
 * string to a `<path d>` attribute, never `dangerouslySetInnerHTML`.
 */
function isGdsPictogramPathData(value: string): boolean {
  if (!value || !value.trim()) {
    return false;
  }
  if (!/^\s*[Mm]/.test(value)) {
    return false;
  }
  return /^[MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]+$/.test(value);
}

function validateGdsPictogramFamily<K extends string>(family: GdsPictogramFamily<K>): void {
  const keys = Object.keys(family.pictograms);
  if (keys.length === 0) {
    throw new Error(`pictogram family "${family.id}" must define at least one pictogram`);
  }
  for (const key of keys) {
    const definition = family.pictograms[key as K];
    if (definition.key !== key) {
      throw new Error(`pictogram family "${family.id}": definition key "${definition.key}" must match map key "${key}"`);
    }
    if (!isGdsPictogramKebabKey(key)) {
      throw new Error(`pictogram family "${family.id}": pictogram key "${key}" must be kebab-case`);
    }
    if (!definition.label.trim()) {
      throw new Error(`pictogram family "${family.id}": pictogram "${key}" needs a non-empty label`);
    }
    if (!isGdsPictogramPathData(definition.path)) {
      throw new Error(`pictogram family "${family.id}": pictogram "${key}" path is not valid SVG path data`);
    }
  }
  if (family.fallbackKey && !(family.fallbackKey in family.pictograms)) {
    throw new Error(`pictogram family "${family.id}": fallbackKey "${family.fallbackKey}" must exist in the family`);
  }
}

/**
 * Validates a pictogram family and returns it unchanged. Throws a precise, actionable error
 * for each violation: an empty family, a key that is not kebab-case, a definition whose own
 * `key` disagrees with its map key, a blank label, path data that fails the injection guard, or
 * a `fallbackKey` that does not exist in the family.
 */
export function createGdsPictogramFamily<K extends string>(input: GdsPictogramFamily<K>): GdsPictogramFamily<K> {
  validateGdsPictogramFamily(input);
  return input;
}

/**
 * The shipped 11-entry activity family: soccer, baseball, basketball, swimming, tennis, flag
 * football, martial arts, camps, lacrosse, athletics, and hockey. Every drawing is the real,
 * unmodified path data of a published icon-library glyph on the {@link GDS_PICTOGRAM_GRID}
 * grid — never hand-drawn, never redrawn or traced from a reference. No `fallbackKey`: an
 * unknown key in this family renders the layout-stable empty slot.
 *
 * Per-entry source (all real, verbatim path data — see each entry's own comment for the exact
 * glyph and license):
 * - `@tabler/icons-react` (MIT, the same dependency {@link GdsIcons} already ships), `stroke`
 *   mode: soccer, baseball, basketball, tennis, flag-football, camps.
 * - Iconify (iconify.design, 200+ open collections, searched when Tabler had no matching
 *   glyph), `stroke` mode: swimming (icon-park-outline), athletics (streamline-ultimate),
 *   hockey (lucide-lab).
 * - Iconify, `fill` mode (the glyph exists only as a filled icon in every set checked, so it
 *   ships in its real, unmodified filled form rather than being redrawn into a stroke it was
 *   never drawn as): lacrosse, martial-arts (mdi, both Apache-2.0).
 *
 * Any future pictogram follows the same order — Tabler first, then the wider Iconify catalogue,
 * always the library's real path data, never hand-drawn (see `docs/ICON_REGISTRY.md`).
 */
export const gdsActivityPictograms: GdsPictogramFamily<GdsActivityPictogramKey> = createGdsPictogramFamily({
  id: 'gds-activity',
  pictograms: {
    // @tabler/icons-react's IconBallFootball (ball-football), verbatim.
    soccer: {
      key: 'soccer',
      label: 'Soccer',
      path: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55l4.76 -3.45 M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45',
    },
    // @tabler/icons-react's IconBallBaseball (ball-baseball), verbatim.
    baseball: {
      key: 'baseball',
      label: 'Baseball',
      path: 'M5.636 18.364a9 9 0 1 0 12.728 -12.728a9 9 0 0 0 -12.728 12.728 M12.495 3.02a9 9 0 0 1 -9.475 9.475 M20.98 11.505a9 9 0 0 0 -9.475 9.475 M9 9l2 2 M13 13l2 2 M11 7l2 1 M7 11l1 2 M16 11l1 2 M11 16l2 1',
    },
    // @tabler/icons-react's IconBallBasketball (ball-basketball), verbatim.
    basketball: {
      key: 'basketball',
      label: 'Basketball',
      path: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M5.65 5.65l12.7 12.7 M5.65 18.35l12.7 -12.7 M12 3a9 9 0 0 0 9 9 M3 12a9 9 0 0 1 9 9',
    },
    // icon-park-outline:swimming-ring (Iconify, Apache-2.0), path coordinates halved from its
    // native 48x48 grid to this family's fixed 24x24 grid -- a life-ring/pool-float, chosen over
    // every "swimming" icon in Tabler and Iconoir because both depict a literal swimmer figure.
    swimming: {
      key: 'swimming',
      label: 'Swimming',
      path: 'M14 16.584A5.02 5.02 0 0 0 16.584 14m-9.168 0A5.02 5.02 0 0 0 10 16.584m0 -9.168A5.02 5.02 0 0 0 7.416 10M14 7.416A5.02 5.02 0 0 1 16.584 10 M15 20.488A9.025 9.025 0 0 0 20.488 15M3.512 15A9.025 9.025 0 0 0 9 20.488m0 -16.976A9.025 9.025 0 0 0 3.512 9M15 3.512A9.025 9.025 0 0 1 20.488 9 M13.5 8.5h-3L9 3.5l1 -1.5h4l1 1.5zm-5 2v3L3.5 15l-1.5 -1v-4l1.5 -1zm2 5h3l1.5 5l-1 1.5h-4l-1 -1.5zm5 -2v-3l5 -1.5c0.54 0.4 0.96 0.6 1.5 1v4c-0.54 0.4 -0.96 0.6 -1.5 1z',
    },
    // @tabler/icons-react's IconBallTennis (ball-tennis), verbatim.
    tennis: {
      key: 'tennis',
      label: 'Tennis',
      path: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M6 5.3a9 9 0 0 1 0 13.4 M18 5.3a9 9 0 0 0 0 13.4',
    },
    // @tabler/icons-react's IconBallAmericanFootball (ball-american-football), verbatim.
    'flag-football': {
      key: 'flag-football',
      label: 'Flag football',
      path: 'M15 9l-6 6 M10 12l2 2 M12 10l2 2 M8 21a5 5 0 0 0 -5 -5 M16 3c-7.18 0 -13 5.82 -13 13a5 5 0 0 0 5 5c7.18 0 13 -5.82 13 -13a5 5 0 0 0 -5 -5 M16 3a5 5 0 0 0 5 5',
    },
    // mdi:martial-arts (Iconify / Material Design Icons, Apache-2.0), verbatim, in its real,
    // unmodified fill form -- not force-rendered or redrawn into the stroke contract.
    'martial-arts': {
      key: 'martial-arts',
      label: 'Martial arts',
      path: 'm19.8 2l-8.2 6.7l-1.21-1.04L14 5.58L9.41 1L8 2.41l2.74 2.74L5 8.46l-1.19 4.29L6.27 17L8 16l-2.03-3.5l.35-1.32L9.5 13l.5 9h2l.5-10L21 3.4z M5 3a2 2 0 1 1 0 4c-1.11 0-2-.89-2-2s.9-2 2-2',
      fillMode: 'fill',
    },
    // @tabler/icons-react's IconTent (tent), verbatim.
    camps: {
      key: 'camps',
      label: 'Camps',
      path: 'M11 14l4 6h6l-9 -16l-9 16h6l4 -6',
    },
    // mdi:lacrosse (Iconify / Material Design Icons, Apache-2.0), verbatim -- no stroke-set
    // equivalent exists anywhere searched (Tabler and the wider Iconify catalogue), so this
    // ships in its real, unmodified fill form rather than being force-rendered or redrawn.
    lacrosse: {
      key: 'lacrosse',
      label: 'Lacrosse',
      path: 'M18.5 16c1.4 0 2.5 1.1 2.5 2.5S19.9 21 18.5 21S16 19.9 16 18.5s1.1-2.5 2.5-2.5m-8-15C3 1 3 3.7 3 9.8c0 3.4 3.4 7.1 6 8.3V23h3v-4.9c2.6-1.2 6-4.9 6-8.3C18 3.6 18 1 10.5 1m4.9 3.2c.3.4.4 1 .5 1.8H15V3.8c.2.1.3.3.4.4m.6 5.6v.2h-1V7h1zM14 14h-3v-3h3zm-7 0v-3h3v3zM5 9.8V7h1v3H5zM7 7h3v3H7zm4-4c1.4 0 2.4.2 3 .3V6h-3zm-1 3H7V3.4c.6-.2 1.6-.4 3-.4zm1 4V7h3v3zM6 3.8V6h-.9c.1-.8.2-1.4.5-1.8zM5.2 11H6v1.7c-.3-.6-.6-1.1-.8-1.7M8 15h2v1.3l-.2-.1C9.2 16 8.6 15.5 8 15m3.2 1.3H11V15h2c-.6.5-1.2 1-1.8 1.3m3.8-3.6V11h.8c-.2.5-.5 1.1-.8 1.7',
      fillMode: 'fill',
    },
    // streamline-ultimate:athletics-running-1 (Iconify, MIT), verbatim: a curved track lane
    // with a finish/checkpoint flag and a direction arrow -- non-figurative, no runner depicted.
    athletics: {
      key: 'athletics',
      label: 'Athletics',
      path: 'M14.25 11.25V.75l4.5 3.75l-4.5 3 M11.25 3.75h-.75a9.75 9.75 0 0 0 0 19.5h12.75m0-19.5H21 M23.25 11.25H10.5a2.25 2.25 0 0 0 0 4.5h12.75M20.786 7.5H18.75m-10.106.3a6.1 6.1 0 0 0-2.436 1.512M4.68 12.066a5.85 5.85 0 0 0 0 2.868m1.528 2.754A6.1 6.1 0 0 0 8.644 19.2m3.158.3H14.7m3.188 0h2.898',
    },
    // lucide-lab:hockey (Iconify, ISC), verbatim: a hockey stick with the puck as a filled
    // circle plus two short motion ticks -- the puck circle is drawn as a small-radius arc pair
    // so it still renders as an unfilled ring under this family's stroke-only contract.
    hockey: {
      key: 'hockey',
      label: 'Hockey',
      path: 'M17 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M2.8 13a5.95 5.95 0 1 0 10.4 6l8.5-14a1.94 1.94 0 1 0-3.4-2L9.7 17a1.88 1.88 0 1 1-3.4-2a1.94 1.94 0 1 0-3.5-2m17.8-6.2l-3.3-2.1m-2.1 3.4l3.3 2.1',
    },
  },
});

/** Returns every canonical key in the shipped activity family, in declaration order. */
export function getGdsActivityPictogramKeys(): GdsActivityPictogramKey[] {
  return Object.keys(gdsActivityPictograms.pictograms) as GdsActivityPictogramKey[];
}

/** Type guard: whether a string is a canonical {@link gdsActivityPictograms} key. */
export function isGdsActivityPictogramKey(value: string): value is GdsActivityPictogramKey {
  return value in gdsActivityPictograms.pictograms;
}

/**
 * Resolves the localized default label for a shipped activity pictogram key through the
 * governed i18n message mechanism (`useGdsTranslation`'s `t`). Each shipped key is a literal
 * `t(id, defaultMessage)` call site so the locale-parity tooling can discover it; a key outside
 * the shipped family returns `fallback` (a consumer family's own English `label`) unchanged.
 */
export function resolveGdsActivityPictogramLabel(
  key: string,
  t: (id: string, defaultMessage: string) => string,
  fallback: string = key,
): string {
  switch (key as GdsActivityPictogramKey) {
    case 'soccer': return t('gds.pictogram.soccer', 'Soccer');
    case 'baseball': return t('gds.pictogram.baseball', 'Baseball');
    case 'basketball': return t('gds.pictogram.basketball', 'Basketball');
    case 'swimming': return t('gds.pictogram.swimming', 'Swimming');
    case 'tennis': return t('gds.pictogram.tennis', 'Tennis');
    case 'flag-football': return t('gds.pictogram.flagFootball', 'Flag football');
    case 'martial-arts': return t('gds.pictogram.martialArts', 'Martial arts');
    case 'camps': return t('gds.pictogram.camps', 'Camps');
    case 'lacrosse': return t('gds.pictogram.lacrosse', 'Lacrosse');
    case 'athletics': return t('gds.pictogram.athletics', 'Athletics');
    case 'hockey': return t('gds.pictogram.hockey', 'Hockey');
    default: return fallback;
  }
}

interface GdsPictogramRenderOptions {
  sizePx: number;
  strokeWidth: number;
  state: GdsPictogramState;
  treatment: GdsPictogramTreatment;
  isDecorative: boolean;
  ariaLabel: string | undefined;
}

/** Renders a layout-stable empty slot for an unresolvable lookup with no `fallbackKey` — same box size, no `<path>`, always decorative. */
function renderGdsPictogramEmptySlot(sizePx: number) {
  return createElement('svg', {
    viewBox: `0 0 ${GDS_PICTOGRAM_GRID} ${GDS_PICTOGRAM_GRID}`,
    width: sizePx,
    height: sizePx,
    'aria-hidden': true,
    'data-gds-pictogram-fallback': 'empty',
  });
}

/** Renders one pictogram definition to a single inline `<svg>` (or, for `hero`, the bounded layered recipe of the same drawing). */
function renderGdsPictogramSvg(definition: GdsPictogramDefinition, options: GdsPictogramRenderOptions) {
  const { sizePx, strokeWidth, state, treatment, isDecorative, ariaLabel } = options;
  const iconColor = state === 'selected' ? GDS_PICTOGRAM_SELECTED_STROKE : 'currentColor';
  const opacity = state === 'disabled' ? GDS_PICTOGRAM_DISABLED_OPACITY : undefined;
  const isFill = definition.fillMode === 'fill';

  const svgProps: Record<string, unknown> = {
    viewBox: `0 0 ${GDS_PICTOGRAM_GRID} ${GDS_PICTOGRAM_GRID}`,
    width: sizePx,
    height: sizePx,
    fill: isFill ? iconColor : 'none',
    stroke: isFill ? 'none' : iconColor,
    ...(isFill ? {} : { strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    'aria-hidden': isDecorative || undefined,
    role: !isDecorative ? 'img' : undefined,
    'aria-label': !isDecorative ? ariaLabel : undefined,
    'data-gds-pictogram': definition.key,
    'data-gds-pictogram-treatment': treatment,
    'data-gds-pictogram-state': state,
    'data-gds-pictogram-fill-mode': definition.fillMode ?? 'stroke',
  };

  if (treatment !== 'hero') {
    return createElement(
      'svg',
      { ...svgProps, style: opacity !== undefined ? { opacity } : undefined },
      createElement('path', { d: definition.path }),
    );
  }

  // Hero: the bounded layer recipe, each a transform (translate + scale, recentered on the
  // grid midpoint) of the identical drawing — never a second color or a second path shape.
  return createElement(
    'svg',
    { ...svgProps, style: { overflow: 'visible', ...(opacity !== undefined ? { opacity } : {}) } },
    GDS_PICTOGRAM_HERO_LAYERS.map((layer, index) => {
      const center = GDS_PICTOGRAM_GRID / 2;
      return createElement(
        'g',
        {
          key: index,
          opacity: layer.opacity,
          transform: `translate(${center + layer.offsetX} ${center + layer.offsetY}) scale(${layer.scale}) translate(${-center} ${-center})`,
        },
        createElement('path', { d: definition.path }),
      );
    }),
  );
}

/** Props for {@link GdsPictogram}. */
export interface GdsPictogramProps {
  /** Family to draw from. Defaults to the shipped activity family. */
  family?: GdsPictogramFamily;
  /** Pictogram key within the family (typed to `GdsActivityPictogramKey` for the default family). */
  pictogram: string;
  /** Contextual treatment. Defaults to 'list'. */
  treatment?: GdsPictogramTreatment;
  /** Explicit scale override; defaults to the treatment's default scale. */
  scale?: GdsPictogramScale;
  /** Interaction state expressed through existing tokens. Defaults to 'default'. */
  state?: GdsPictogramState;
  /** Accessible label; supplying it makes the pictogram informative (role img). */
  label?: string;
  /** Forces decorative (aria-hidden) rendering. Defaults to true when no label is given. */
  decorative?: boolean;
}

/**
 * Renders a governed activity pictogram: a deterministic, synchronous, SSR-safe inline SVG
 * resolved from a validated {@link GdsPictogramFamily} by key, contextual treatment, scale, and
 * interaction state. One drawing per pictogram — treatment and scale never swap geometry, only
 * size, stroke weight, and (for `hero`) layered scale/opacity copies of the same path. An
 * unresolvable key renders the family's `fallbackKey` if set, otherwise a layout-stable empty
 * slot, and warns once in development — it never throws at render time.
 *
 * Accessibility mirrors `GdsIcon` exactly: no `label` renders `aria-hidden`; supplying `label`
 * (or `decorative={false}`) renders `role="img"` with an `aria-label`, using the shipped
 * family's localized default label when the caller supplies none.
 */
export function GdsPictogram(props: GdsPictogramProps) {
  const { t } = useGdsTranslation();
  const family: GdsPictogramFamily<string> = props.family ?? gdsActivityPictograms;
  const definition = family.pictograms[props.pictogram];
  const treatment = props.treatment ?? 'list';
  const scale = props.scale ?? GDS_PICTOGRAM_TREATMENT_SCALE[treatment];
  const sizePx = GDS_PICTOGRAM_SCALE_PX[scale];
  const strokeWidth = GDS_PICTOGRAM_STROKE_BY_SCALE[scale];
  const state = props.state ?? 'default';
  const isDecorative = props.decorative ?? !props.label;

  if (!definition) {
    gdsDevWarnOnce(
      `GdsPictogram:unknown-key:${family.id}`,
      `GdsPictogram received pictogram key "${props.pictogram}" not present in family "${family.id}". `
      + 'Rendering the family\'s fallbackKey if set, otherwise a layout-stable empty slot.',
    );
    const fallbackDefinition = family.fallbackKey ? family.pictograms[family.fallbackKey] : undefined;
    if (!fallbackDefinition) {
      return renderGdsPictogramEmptySlot(sizePx);
    }
    const fallbackAriaLabel = isDecorative ? undefined : (props.label ?? fallbackDefinition.label);
    return renderGdsPictogramSvg(fallbackDefinition, { sizePx, strokeWidth, state, treatment, isDecorative, ariaLabel: fallbackAriaLabel });
  }

  const isDefaultFamily = family === gdsActivityPictograms;
  const defaultLabel = isDefaultFamily
    ? resolveGdsActivityPictogramLabel(props.pictogram, t, definition.label)
    : definition.label;
  const ariaLabel = isDecorative ? undefined : (props.label ?? defaultLabel);

  return renderGdsPictogramSvg(definition, { sizePx, strokeWidth, state, treatment, isDecorative, ariaLabel });
}
