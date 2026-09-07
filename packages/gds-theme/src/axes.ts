// The theme-axis mechanism: a theme controls not just colours but sizing, shapes, margins,
// motion and reactions, through one mechanism rather than ad hoc fields per concern.
//
// An axis is a validated value object plus a token namespace. Adding an axis is a type, a
// default, a validator and an entry in `resolveAxisTokens`.

import type { GdsThemePresetId } from './theme-presets';
import { resolveGdsAccentTokens, type GdsAccentAxis } from './accent-axis';

/** Canonical radius steps. Fixed key set — a theme sets values, it never adds keys. */
export type GdsRadiusStep = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';

/**
 * Semantic surface families that may override the step scale.
 *
 * Lets a theme say "cards are softer than inputs" without a component knowing which step
 * that means; component source asks for `card`, not `lg`.
 */
export type GdsRadiusRole =
  | 'card' | 'panel' | 'surface'
  | 'button' | 'input' | 'chip'
  | 'badge' | 'pin'
  | 'modal' | 'drawer' | 'sheet'
  | 'image' | 'avatar' | 'thumbnail';

/** A theme's corner-geometry decisions. */
export interface GdsShapeAxis {
  /** The step scale. Values are CSS lengths; `pill` is conventionally a very large radius. */
  scale: Record<GdsRadiusStep, string>;
  /** Per-role overrides. A role resolves to its override, else to {@link GdsShapeAxis.defaultStep}. */
  roles?: Partial<Record<GdsRadiusRole, GdsRadiusStep | string>>;
  /** Step used by any role without an explicit override. Defaults to `md`. */
  defaultStep?: GdsRadiusStep;
}

/** Spacing steps. Fixed key set — a theme sets values, never keys. */
export type GdsSpaceStep = 'none' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

/** Control size names, matching Mantine's size vocabulary. */
export type GdsControlSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** How tightly a theme packs its layout. */
export type GdsDensityMode = 'compact' | 'comfortable' | 'spacious';

/** A theme's spacing and control-sizing decisions. */
export interface GdsDensityAxis {
  /** Base spacing scale at `comfortable`. */
  scale: Record<GdsSpaceStep, string>;
  /** Control heights at `comfortable`. */
  controlHeights: Record<GdsControlSize, string>;
  /** Resolved density. Defaults to `comfortable`. */
  mode?: GdsDensityMode;
  /** Multipliers applied to the scale when `mode` is not `comfortable`. */
  factors?: { compact: number; spacious: number };
}

/**
 * A theme's shell-geometry decisions: sidebar, header, footer and bottom-bar sizing, content
 * width, list-rail width, and how far content sits above a fixed bottom bar.
 *
 * Scheme-independent — geometry does not fork light/dark — and every field is a CSS length
 * string so `calc()`/`var()` stay expressible. A theme declares only the fields it wants to
 * change; the resolver merges the rest from {@link GDS_DEFAULT_LAYOUT_AXIS}.
 */
export interface GdsLayoutAxis {
  /** Desktop sidebar width. */
  sidebarWidth?: string;
  /** Shell header height. */
  headerHeight?: string;
  /** Shell footer height, used when a footer is rendered. */
  footerHeight?: string;
  /**
   * Sidebar nav-item row height. A value below {@link GDS_MIN_TARGET_PX} is legal only through
   * the recorded {@link GDS_LAYOUT_DIMENSION_EXCEPTIONS.navItemHeight} exception — read its
   * rationale, including the consumer hit-target obligation, before declaring one.
   */
  navItemHeight?: string;
  /** Max width of the main content column. */
  contentMaxWidth?: string;
  /** Width of the list rail in a list+map (or list+detail) browse split. */
  listRailWidth?: string;
  /** Mobile bottom-tab-bar height, excluding the safe-area inset. */
  bottomBarHeight?: string;
  /** Bottom padding owed to content stacked above a fixed bottom bar, so nothing hides behind it. */
  contentBottomPadding?: string;
  /**
   * A {@link GdsRadiusStep} name (resolved to that step's token) or a literal CSS value.
   * Defaults to the shape axis's `sheet` role, not a step, so a lane that repoints `sheet`
   * gets matching bottom-sheet geometry for free instead of declaring the radius twice.
   */
  sheetTopRadius?: GdsRadiusStep | string;
}

/** Font lane roles a theme assigns. */
export type GdsFontLaneRole = 'display' | 'body' | 'mono';

/** Text size steps. */
export type GdsTextSizeStep = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

/** Named font weights. */
export type GdsWeightName = 'regular' | 'medium' | 'semibold' | 'bold';

/** A per-step font-style treatment. Closed to the two values CSS `font-style` supports meaningfully for a variable-less lane. */
export type GdsFontStyle = 'normal' | 'italic';

/** A theme's typographic decisions. */
export interface GdsTypographyAxis {
  /** Registered font-lane id per role. */
  lanes: Record<GdsFontLaneRole, string>;
  /** Modular scale. Steps are DERIVED from base and ratio unless overridden. */
  scale: { base: string; ratio: number; overrides?: Partial<Record<GdsTextSizeStep, string>> };
  weights: Record<GdsWeightName, number>;
  lineHeights?: Partial<Record<GdsTextSizeStep, number>>;
  /** Per-step letter-spacing. Validated at resolution time — `normal`, a signed px/rem/em/ch length, or a `var()` reference. */
  tracking?: Partial<Record<GdsTextSizeStep, string>>;
  /** Per-step italic display treatment. Emitted only for steps a theme declares — a consumer reads `var(--gds-font-style-<step>, normal)`. */
  fontStyles?: Partial<Record<GdsTextSizeStep, GdsFontStyle>>;
}

/** Elevation steps, flat to highest. */
export type GdsElevationStep = 0 | 1 | 2 | 3 | 4;

/** How a step expresses elevation: nothing, a border, or a shadow. */
export type GdsElevationValue = { kind: 'none' } | { kind: 'border'; value: string } | { kind: 'shadow'; value: string };

/** Surface families that may pin a specific elevation step. */
export type GdsElevationRole = 'card' | 'panel' | 'modal' | 'drawer' | 'sheet' | 'menu' | 'tooltip' | 'sidebar' | 'pin';

/**
 * A theme's elevation decisions.
 *
 * A role may pin a shared {@link GdsElevationStep}, or declare its own {@link GdsElevationValue}
 * directly — mirroring how {@link GdsShapeAxis.roles} lets a radius role carry a literal value.
 * A directional shadow (a sidebar cast sideways onto the page canvas, a map pin's drop shadow)
 * expresses a kind, not a rank, so it lives on the role rather than corrupting the shared,
 * monotonic step ramp every other surface resolves through.
 */
export interface GdsElevationAxis {
  steps: Record<GdsElevationStep, GdsElevationValue>;
  defaultStep?: GdsElevationStep;
  roles?: Partial<Record<GdsElevationRole, GdsElevationStep | GdsElevationValue>>;
}

/**
 * A theme's motion decisions: partial overrides of the shipped scale.
 *
 * Uses the shipped token names (`base`/`entrance`/`emphasis` in `motion.ts`), not
 * `normal`/`enter`/`emphasized`. Renaming would break every consumer of
 * `--gds-motion-duration-base`; the axis changes these values, not their names.
 */
export interface GdsMotionAxis {
  /** Millisecond overrides, keyed by shipped duration token. */
  durations?: Partial<Record<'instant' | 'fast' | 'base' | 'slow' | 'slower', number>>;
  /** CSS timing-function overrides, keyed by shipped easing token. */
  easings?: Partial<Record<'standard' | 'entrance' | 'exit' | 'emphasis' | 'linear', string>>;
  /**
   * `system` honours the OS setting; `reduce`/`no-motion` force reduction.
   *
   * There is deliberately NO value meaning "ignore the user's reduced-motion preference".
   * A theme may make motion calmer than the user asked for; it may never make it louder.
   */
  reducedMotionPolicy?: 'system' | 'reduce' | 'no-motion';
}

/** How strongly a surface responds to interaction. */
export type GdsReactionIntensity = 'none' | 'subtle' | 'standard' | 'pronounced';

/** Focus-ring geometry and colour role. */
export interface GdsFocusRingSpec {
  /** CSS length, validated >= 2px. */
  width: string;
  offset: string;
  style: 'solid' | 'dashed' | 'double';
  /** A semantic colour ROLE name, never a literal — resolved against the token set. */
  colorRole: string;
}

/** A theme's interaction-feedback decisions. */
export interface GdsReactionAxis {
  hover?: GdsReactionIntensity;
  active?: GdsReactionIntensity;
  pressed?: GdsReactionIntensity;
  focusRing?: Partial<GdsFocusRingSpec>;
  /** Which properties may transition. Restricting scope is a performance and a11y lever. */
  transitionScope?: Array<'color' | 'background' | 'border' | 'shadow' | 'transform' | 'opacity'>;
}

/**
 * The generic axis container on a theme.
 *
 * Each axis adds one optional key here and one branch in `resolveAxisTokens`; nothing else
 * in the theme pipeline changes.
 */
export interface GdsThemeAxes {
  shape?: GdsShapeAxis;
  density?: GdsDensityAxis;
  layout?: GdsLayoutAxis;
  type?: GdsTypographyAxis;
  elevation?: GdsElevationAxis;
  motion?: GdsMotionAxis;
  reaction?: GdsReactionAxis;
  accent?: GdsAccentAxis;
  designRuleProfile?: GdsDesignRuleProfile;
}

/** Emitted shape tokens: one per step, one per role. */
export type GdsResolvedShapeTokens = Record<string, string>;

/** Every radius step, in scale order. The key set is fixed; a theme sets values, not keys. */
export const GDS_RADIUS_STEPS: GdsRadiusStep[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill'];
/** Every semantic radius role. Closed by design, so a typo cannot become an unstyled surface. */
export const GDS_RADIUS_ROLES: GdsRadiusRole[] = [
  'card', 'panel', 'surface',
  'button', 'input', 'chip',
  'badge', 'pin',
  'modal', 'drawer', 'sheet',
  'image', 'avatar', 'thumbnail',
];

/**
 * The default shape axis.
 *
 * `xs`-`xl` are Mantine's `DEFAULT_THEME.radius` values verbatim, including the
 * `calc(... * var(--mantine-scale))` wrapper — substituting a plain rem value would drop
 * Mantine's scale factor.
 *
 * `none` and `pill` have no Mantine equivalent: `none` is an explicit square corner, `pill`
 * the fully-rounded end used by chips and avatars.
 */
export const GDS_DEFAULT_SHAPE_AXIS: GdsShapeAxis = {
  scale: {
    none: '0',
    xs: 'calc(0.125rem * var(--mantine-scale))',
    sm: 'calc(0.25rem * var(--mantine-scale))',
    md: 'calc(0.5rem * var(--mantine-scale))',
    lg: 'calc(1rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
    pill: '9999px',
  },
  defaultStep: 'md',
};

/** Every spacing step, tightest first. Fixed key set; a theme sets values, not keys. */
export const GDS_SPACE_STEPS: GdsSpaceStep[] = ['none', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
/** Every control size name, matching Mantine's size vocabulary so the two never disagree. */
export const GDS_CONTROL_SIZES: GdsControlSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * WCAG 2.2 Target Size (Minimum), 2.5.8: 24x24 CSS px. GDS holds the stricter AAA 2.5.5
 * figure of 44px instead (also published by Apple and Google).
 *
 * Sizes below this are permitted only with a recorded exception — see
 * {@link GDS_CONTROL_HEIGHT_EXCEPTIONS}.
 */
export const GDS_MIN_TARGET_PX = 44;

/**
 * Control sizes deliberately below the target floor.
 *
 * `xs` and `sm` exist for dense tabular and toolbar contexts where a 44px row would make a
 * data table unusable. WCAG 2.5.8 exempts inline targets; a dense grid is the practical
 * equivalent, recorded here rather than assumed.
 */
export const GDS_CONTROL_HEIGHT_EXCEPTIONS: Partial<Record<GdsControlSize, string>> = {
  xs: 'Dense tabular and toolbar controls; a 44px row makes a data grid unusable. Pair with a larger hit area via padding where the control stands alone.',
  sm: 'Compact forms and secondary toolbars. Same reasoning as xs, one step less dense.',
};

/**
 * The default density axis.
 *
 * `xs`-`xl` spacing is Mantine's `DEFAULT_THEME.spacing` verbatim, `var(--mantine-scale)`
 * included — flattening to plain rem would drop the scale factor.
 *
 * `none`, `3xs`, `2xs`, `2xl` and `3xl` are additions with no Mantine equivalent. Control
 * heights are also new: no prior GDS or Mantine theme field declared them.
 */
export const GDS_DEFAULT_DENSITY_AXIS: GdsDensityAxis = {
  scale: {
    none: '0',
    '3xs': 'calc(0.125rem * var(--mantine-scale))',
    '2xs': 'calc(0.25rem * var(--mantine-scale))',
    xs: 'calc(0.625rem * var(--mantine-scale))',
    sm: 'calc(0.75rem * var(--mantine-scale))',
    md: 'calc(1rem * var(--mantine-scale))',
    lg: 'calc(1.25rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
    '2xl': 'calc(3rem * var(--mantine-scale))',
    '3xl': 'calc(4rem * var(--mantine-scale))',
  },
  controlHeights: { xs: '32px', sm: '36px', md: '44px', lg: '52px', xl: '60px' },
  mode: 'comfortable',
  factors: { compact: 0.75, spacious: 1.25 },
};

/**
 * Layout dimensions deliberately below {@link GDS_MIN_TARGET_PX}.
 *
 * `navItemHeight` is the one recorded case: a dense sidebar nav row may render below 44px
 * visual height only where the interactive row still preserves a >= 44px effective hit target
 * — the full row width plus its vertical padding, not the visual text line. A consumer
 * adopting a sub-44px `navItemHeight` owns that obligation, the same way this exception says
 * the token itself may.
 */
export const GDS_LAYOUT_DIMENSION_EXCEPTIONS: Partial<Record<keyof GdsLayoutAxis, string>> = {
  navItemHeight: 'Dense sidebar nav rows may render below 44px visual height only where the interactive row (full row width plus vertical padding) preserves a 44px effective hit target. A consumer adopting a sub-44px navItemHeight owns that obligation.',
};

/**
 * The default layout axis: today's `DiscoveryShell`/`BottomTabBar` literals, captured as
 * tokens rather than component defaults, so a lane overriding one field keeps the other eight
 * unchanged.
 *
 * `contentBottomPadding` is derived rather than a literal — `bottomBarHeight + space-xl`,
 * resolving to 96px at defaults — so a lane that raises its bar height gets correct padding
 * without a second declaration. `sheetTopRadius` defaults to the shape axis's `sheet` ROLE
 * token, not a step, for the same reason: declared once, never twice.
 */
export const GDS_DEFAULT_LAYOUT_AXIS: Required<GdsLayoutAxis> = {
  sidebarWidth: '280px',
  headerHeight: '60px',
  footerHeight: '68px',
  navItemHeight: '44px',
  contentMaxWidth: '1400px',
  listRailWidth: '480px',
  bottomBarHeight: '64px',
  contentBottomPadding: 'calc(var(--gds-layout-bottom-bar-height) + var(--gds-space-xl))',
  sheetTopRadius: 'var(--gds-radius-sheet)',
};

/** Every text size step, smallest first. */
export const GDS_TEXT_STEPS: GdsTextSizeStep[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
/** Every named weight, lightest first. */
export const GDS_WEIGHT_NAMES: GdsWeightName[] = ['regular', 'medium', 'semibold', 'bold'];
/** Every elevation step, flattest first. */
export const GDS_ELEVATION_STEPS: GdsElevationStep[] = [0, 1, 2, 3, 4];
/** Every elevation role. `sidebar`/`pin` are appended after `tooltip` so existing enumeration order is preserved. */
export const GDS_ELEVATION_ROLES: GdsElevationRole[] = ['card', 'panel', 'modal', 'drawer', 'sheet', 'menu', 'tooltip', 'sidebar', 'pin'];

/**
 * The default typography axis.
 *
 * `xs`-`xl` are Mantine's `DEFAULT_THEME.fontSizes` verbatim, carried as overrides rather
 * than derived: Mantine's ramp is not a uniform ratio (0.875->1 is x1.1429, 1->1.125 is
 * x1.1250), so a single ratio would round to different numbers. The ratio governs only the
 * steps Mantine has no equivalent for (`2xs`, `2xl`, `3xl`, `4xl`).
 */
export const GDS_DEFAULT_TYPOGRAPHY_AXIS: GdsTypographyAxis = {
  lanes: { display: 'inter', body: 'inter', mono: 'inter' },
  scale: {
    base: '1rem',
    ratio: 1.125,
    overrides: {
      xs: 'calc(0.75rem * var(--mantine-scale))',
      sm: 'calc(0.875rem * var(--mantine-scale))',
      md: 'calc(1rem * var(--mantine-scale))',
      lg: 'calc(1.125rem * var(--mantine-scale))',
      xl: 'calc(1.25rem * var(--mantine-scale))',
    },
  },
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeights: { md: 1.55, lg: 1.45, xl: 1.35, '2xl': 1.25, '3xl': 1.2, '4xl': 1.15 },
};

/**
 * The default elevation axis, captured from what the theme already ships.
 *
 * Step 2 and 3 are GDS's own `shadows.md`/`shadows.lg` from theme.ts; 1 and 4 are Mantine's
 * `xs`/`xl`. Step 0 is `none`, which is what `flatSurfaces` presets render today.
 */
export const GDS_DEFAULT_ELEVATION_AXIS: GdsElevationAxis = {
  steps: {
    0: { kind: 'none' },
    1: { kind: 'shadow', value: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)' },
    2: { kind: 'shadow', value: '0 8px 24px rgba(15, 23, 42, 0.08)' },
    3: { kind: 'shadow', value: '0 16px 40px rgba(15, 23, 42, 0.12)' },
    4: { kind: 'shadow', value: '0 24px 56px rgba(15, 23, 42, 0.16)' },
  },
  defaultStep: 1,
  // sidebar/pin default to step 1, the resting-surface step card/panel already use: GdsMap
  // shadows pins with --gds-elevation-1 today, so a preset declaring nothing renders exactly
  // what it renders now once a consumer adopts the role token.
  roles: { card: 1, panel: 1, modal: 3, drawer: 3, sheet: 3, menu: 2, tooltip: 2, sidebar: 1, pin: 1 },
};

/** Thrown when a theme declares an axis value the contract cannot accept. */
export class GdsAxisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GdsAxisError';
  }
}

// A CSS length, a percentage, a `calc()`, or `0`. Not permissive: a loose pattern would let
// a bad value surface as a silently wrong corner instead of a build error.
const LENGTH = /^(0|(-?\d*\.?\d+)(px|rem|em|%|vh|vw|ch|ex)|calc\(.+\)|var\(--[a-zA-Z0-9-]+(,.*)?\))$/;

// `normal`, a signed px/rem/em/ch length (including `0px` etc — but not bare `0`, which has
// no unit and is not `normal`), or a `var()` reference. No percentage form: `letter-spacing`
// does not accept one, unlike LENGTH above.
const TRACKING = /^(normal|-?\d*\.?\d+(px|rem|em|ch)|var\(--[a-zA-Z0-9-]+(,.*)?\))$/;

/**
 * Validates a shape axis at theme-construction time, not render time: a bad radius fails
 * the build with the offending key, instead of shipping as a silent visual defect.
 */
export function validateGdsShapeAxis(axis: GdsShapeAxis, themeId = 'theme'): void {
  for (const step of GDS_RADIUS_STEPS) {
    const value = axis.scale?.[step];
    if (value === undefined) {
      throw new GdsAxisError(`${themeId}: shape axis is missing the "${step}" step. The step set is fixed; a theme sets values, never keys.`);
    }
    if (!LENGTH.test(String(value).trim())) {
      throw new GdsAxisError(`${themeId}: shape step "${step}" is "${value}", which is not a CSS length, percentage, calc() or var().`);
    }
  }

  if (axis.defaultStep && !GDS_RADIUS_STEPS.includes(axis.defaultStep)) {
    throw new GdsAxisError(`${themeId}: defaultStep "${axis.defaultStep}" is not a declared step.`);
  }

  for (const [role, value] of Object.entries(axis.roles ?? {})) {
    if (!GDS_RADIUS_ROLES.includes(role as GdsRadiusRole)) {
      throw new GdsAxisError(`${themeId}: "${role}" is not a known radius role. Roles are a closed set so a typo cannot become a silently unstyled surface.`);
    }
    const isStep = GDS_RADIUS_STEPS.includes(value as GdsRadiusStep);
    if (!isStep && !LENGTH.test(String(value).trim())) {
      throw new GdsAxisError(`${themeId}: role "${role}" resolves to "${value}", which is neither a declared step nor a CSS length.`);
    }
  }
}

/**
 * Resolves a shape axis into `--gds-radius-*` custom properties.
 *
 * Emits every step and every role, always. A role a theme did not override still gets a
 * token, resolved from `defaultStep`, so a consumer of `--gds-radius-pin` never lands on an
 * undefined variable.
 */
export function resolveGdsShapeTokens(axis: GdsShapeAxis = GDS_DEFAULT_SHAPE_AXIS, themeId = 'theme'): GdsResolvedShapeTokens {
  const merged: GdsShapeAxis = {
    ...GDS_DEFAULT_SHAPE_AXIS,
    ...axis,
    scale: { ...GDS_DEFAULT_SHAPE_AXIS.scale, ...(axis.scale ?? {}) },
    roles: { ...(axis.roles ?? {}) },
  };
  validateGdsShapeAxis(merged, themeId);

  const tokens: GdsResolvedShapeTokens = {};
  for (const step of GDS_RADIUS_STEPS) {
    tokens[`--gds-radius-${step}`] = merged.scale[step];
  }

  const fallback = merged.scale[merged.defaultStep ?? 'md'];
  for (const role of GDS_RADIUS_ROLES) {
    const declared = merged.roles?.[role];
    tokens[`--gds-radius-${role}`] = declared === undefined
      ? fallback
      : GDS_RADIUS_STEPS.includes(declared as GdsRadiusStep)
        ? merged.scale[declared as GdsRadiusStep]
        : String(declared);
  }
  return tokens;
}

/**
 * Validates a density axis at theme-construction time.
 *
 * The control-height floor is checked on the resolved value, after the density factor is
 * applied — a 44px control under `compact` x0.75 is 33px, so checking the declared value
 * would let the floor pass while the button shrank.
 */
export function validateGdsDensityAxis(axis: GdsDensityAxis, themeId = 'theme'): void {
  for (const step of GDS_SPACE_STEPS) {
    const value = axis.scale?.[step];
    if (value === undefined) throw new GdsAxisError(`${themeId}: density axis is missing the "${step}" step.`);
    if (!LENGTH.test(String(value).trim())) {
      throw new GdsAxisError(`${themeId}: space step "${step}" is "${value}", which is not a CSS length, calc() or var().`);
    }
  }
  for (const size of GDS_CONTROL_SIZES) {
    const value = axis.controlHeights?.[size];
    if (value === undefined) throw new GdsAxisError(`${themeId}: density axis is missing the "${size}" control height.`);
    if (!LENGTH.test(String(value).trim())) {
      throw new GdsAxisError(`${themeId}: control height "${size}" is "${value}", which is not a CSS length.`);
    }
  }
  const factors = axis.factors ?? GDS_DEFAULT_DENSITY_AXIS.factors!;
  for (const [name, f] of Object.entries(factors)) {
    if (!Number.isFinite(f) || f < 0.5 || f > 2) {
      throw new GdsAxisError(`${themeId}: density factor "${name}" is ${f}; it must be between 0.5 and 2. Outside that range a theme is not adjusting density, it is redesigning the layout.`);
    }
  }
  if (axis.mode && !['compact', 'comfortable', 'spacious'].includes(axis.mode)) {
    throw new GdsAxisError(`${themeId}: density mode "${axis.mode}" is not one of compact/comfortable/spacious.`);
  }
}

/** Scales a CSS length by a factor, preserving `calc()` and unit forms. */
function scaleLength(value: string, factor: number): string {
  const v = String(value).trim();
  if (factor === 1 || v === '0') return v;
  const plain = /^(-?\d*\.?\d+)(px|rem|em)$/.exec(v);
  if (plain) return `${Number((parseFloat(plain[1]) * factor).toFixed(4))}${plain[2]}`;
  // A calc() or var() cannot be multiplied numerically without losing its reference, so it
  // is wrapped rather than flattened; the browser resolves it.
  return `calc(${v} * ${factor})`;
}

/**
 * Resolves a density axis into `--gds-space-*`, `--gds-control-height-*` and `--gds-density`.
 *
 * The a11y floor is enforced on the resolved height; a control below it must be listed in
 * {@link GDS_CONTROL_HEIGHT_EXCEPTIONS} or it is a build error.
 */
export function resolveGdsDensityTokens(axis: GdsDensityAxis = GDS_DEFAULT_DENSITY_AXIS, themeId = 'theme'): Record<string, string> {
  const merged: GdsDensityAxis = {
    ...GDS_DEFAULT_DENSITY_AXIS,
    ...axis,
    scale: { ...GDS_DEFAULT_DENSITY_AXIS.scale, ...(axis.scale ?? {}) },
    controlHeights: { ...GDS_DEFAULT_DENSITY_AXIS.controlHeights, ...(axis.controlHeights ?? {}) },
    factors: { ...GDS_DEFAULT_DENSITY_AXIS.factors!, ...(axis.factors ?? {}) },
  };
  validateGdsDensityAxis(merged, themeId);

  const mode = merged.mode ?? 'comfortable';
  const factor = mode === 'comfortable' ? 1 : merged.factors![mode];

  const tokens: Record<string, string> = { '--gds-density': mode };
  for (const step of GDS_SPACE_STEPS) {
    tokens[`--gds-space-${step}`] = scaleLength(merged.scale[step], factor);
  }
  for (const size of GDS_CONTROL_SIZES) {
    const declared = merged.controlHeights[size];
    const declaredPx = /^(-?\d*\.?\d+)px$/.exec(String(declared).trim());
    const exempt = Boolean(GDS_CONTROL_HEIGHT_EXCEPTIONS[size]);

    // A theme DECLARING an inaccessible control is an error: it is stating an intent the
    // floor forbids.
    if (declaredPx && parseFloat(declaredPx[1]) < GDS_MIN_TARGET_PX && !exempt) {
      throw new GdsAxisError(
        `${themeId}: control height "${size}" is declared as ${declared}, below the ${GDS_MIN_TARGET_PX}px target floor, `
        + 'and has no recorded exception. Raise it, or record why this control may be smaller.',
      );
    }

    // Density scaling is clamped rather than rejected: throwing here would make `compact`
    // unusable with any accessible control set (44px x 0.75 is 33px). Spacing tightens; hit
    // targets hold their line. Sizes with a recorded exception scale freely.
    const scaled = scaleLength(declared, factor);
    const scaledPx = /^(-?\d*\.?\d+)px$/.exec(scaled.trim());
    tokens[`--gds-control-height-${size}`] = (!exempt && scaledPx && parseFloat(scaledPx[1]) < GDS_MIN_TARGET_PX)
      ? `${GDS_MIN_TARGET_PX}px`
      : scaled;
  }
  return tokens;
}

/** The `var()` reference for a spacing step — never a resolved literal. */
export function gdsSpace(step: GdsSpaceStep): string {
  return `var(--gds-space-${step})`;
}

/**
 * Shell/region heights (public-shell header variants) — fixed, not themed: nothing currently
 * varies these per brand, so this is a plain constant set rather than a full axis.
 *
 * Named and emitted as CSS custom properties rather than left as bare numbers inside
 * `PublicShell`'s ternary. These are the shipped values as-is, not rounded onto an existing
 * spacing step (`compact` coincidentally matches `--gds-space-3xl`; the others do not).
 *
 * Not to be confused with the `layout` axis's `--gds-layout-*` namespace below: that one is a
 * themeable axis covering `DiscoveryShell`/`BottomTabBar` shell geometry, this one is a fixed,
 * per-variant constant set for `PublicShell`'s header.
 */
export const GDS_SHELL_HEIGHTS: Record<string, number> = {
  'header-compact': 64,
  'header-default': 72,
  'header-branded-quiet': 88,
};

/** Resolves {@link GDS_SHELL_HEIGHTS} into `--gds-shell-height-*` custom properties. */
export function resolveGdsShellHeightTokens(): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [key, px] of Object.entries(GDS_SHELL_HEIGHTS)) {
    tokens[`--gds-shell-height-${key}`] = `${px}px`;
  }
  return tokens;
}

/** Whether a string names one of the fixed {@link GDS_RADIUS_STEPS}, as opposed to a literal CSS value. */
function isGdsRadiusStep(value: string): value is GdsRadiusStep {
  return (GDS_RADIUS_STEPS as readonly string[]).includes(value);
}

/**
 * Validates a layout axis at theme-construction time, matching every sibling `validateGds*Axis`.
 *
 * `headerHeight`/`footerHeight`/`bottomBarHeight` enforce the {@link GDS_MIN_TARGET_PX} floor
 * with no exception path: these regions host interactive 44px targets (the burger toggle,
 * footer actions, tab items with a 44px min hit target) and cannot be shorter than the targets
 * they contain. `navItemHeight` enforces the same floor, exception-gated through
 * {@link GDS_LAYOUT_DIMENSION_EXCEPTIONS}. `calc()`/`var()` values pass through unchecked, as
 * in {@link validateGdsDensityAxis}.
 */
export function validateGdsLayoutAxis(axis: GdsLayoutAxis, themeId = 'theme'): void {
  for (const key of Object.keys(axis) as Array<keyof GdsLayoutAxis>) {
    const value = axis[key];
    if (value === undefined) continue;

    const trimmed = String(value).trim();
    if (!trimmed) {
      throw new GdsAxisError(`${themeId}: layout field "${key}" is empty. Every declared layout value must be a non-empty CSS value or radius step name.`);
    }
    if (key === 'sheetTopRadius') continue; // A step name or a literal CSS value; non-empty is the only rule.

    const pxMatch = /^(-?\d*\.?\d+)px$/.exec(trimmed);
    if (!pxMatch) continue; // calc()/var() pass through unchecked, as in the density resolver.

    const px = parseFloat(pxMatch[1]);
    if (px <= 0) {
      throw new GdsAxisError(`${themeId}: layout field "${key}" is "${value}", which is not a positive dimension.`);
    }
    if ((key === 'headerHeight' || key === 'footerHeight' || key === 'bottomBarHeight') && px < GDS_MIN_TARGET_PX) {
      throw new GdsAxisError(
        `${themeId}: layout field "${key}" is ${value}, below the ${GDS_MIN_TARGET_PX}px target floor. This region hosts an `
        + 'interactive target that cannot be shorter than the target it contains.',
      );
    }
    if (key === 'navItemHeight' && px < GDS_MIN_TARGET_PX && !GDS_LAYOUT_DIMENSION_EXCEPTIONS.navItemHeight) {
      throw new GdsAxisError(
        `${themeId}: layout field "navItemHeight" is declared as ${value}, below the ${GDS_MIN_TARGET_PX}px target floor, `
        + 'and has no recorded exception. Raise it, or record why this control may be smaller.',
      );
    }
  }
}

/**
 * Resolves a layout axis into `--gds-layout-*` custom properties.
 *
 * Emitted unconditionally, like shape and density: every preset gets the full nine-token
 * namespace whether or not it declares `layout`, so a component's
 * `var(--gds-layout-*, <literal>)` fallback is a safety net for token-less renders (no GDS
 * theme runtime present), not the normal path. Density mode does not scale these values —
 * shell geometry does not compress at `compact`, unlike spacing.
 */
export function resolveGdsLayoutTokens(axis: GdsLayoutAxis = {}, themeId = 'theme'): Record<string, string> {
  const merged: Required<GdsLayoutAxis> = { ...GDS_DEFAULT_LAYOUT_AXIS, ...axis };
  validateGdsLayoutAxis(merged, themeId);

  const sheetTopRadius = isGdsRadiusStep(merged.sheetTopRadius)
    ? `var(--gds-radius-${merged.sheetTopRadius})`
    : merged.sheetTopRadius;

  return {
    '--gds-layout-sidebar-width': merged.sidebarWidth,
    '--gds-layout-header-height': merged.headerHeight,
    '--gds-layout-footer-height': merged.footerHeight,
    '--gds-layout-nav-item-height': merged.navItemHeight,
    '--gds-layout-content-max-width': merged.contentMaxWidth,
    '--gds-layout-list-rail-width': merged.listRailWidth,
    '--gds-layout-bottom-bar-height': merged.bottomBarHeight,
    '--gds-layout-content-bottom-padding': merged.contentBottomPadding,
    '--gds-layout-sheet-top-radius': sheetTopRadius,
  };
}

/**
 * Validates and resolves the typography axis.
 *
 * Weights must ascend (a lighter `semibold` than `medium` looks broken, not styled), the
 * ratio must be a real ratio, and every lane must name a registered font lane — an
 * unregistered lane silently falls back to the browser default. `tracking` is validated as
 * `normal`, a signed px/rem/em/ch length, or a `var()` reference (a malformed value used to
 * pass straight through to CSS unchecked); `fontStyles` is validated to `'normal' | 'italic'`
 * and emitted only for the steps a theme declares.
 */
// Size steps are `--gds-font-size-*`, not `--gds-text-*` — the latter is already the
// semantic colour namespace (`--gds-text-body`, `--gds-text-primary`), and the token graph's
// category inference keys off this prefix.
export function resolveGdsTypographyTokens(
  axis: GdsTypographyAxis = GDS_DEFAULT_TYPOGRAPHY_AXIS,
  themeId = 'theme',
  knownLaneIds?: readonly string[],
): Record<string, string> {
  const merged: GdsTypographyAxis = {
    ...GDS_DEFAULT_TYPOGRAPHY_AXIS,
    ...axis,
    lanes: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.lanes, ...(axis.lanes ?? {}) },
    scale: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.scale, ...(axis.scale ?? {}) },
    weights: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.weights, ...(axis.weights ?? {}) },
    lineHeights: { ...GDS_DEFAULT_TYPOGRAPHY_AXIS.lineHeights, ...(axis.lineHeights ?? {}) },
    tracking: { ...(GDS_DEFAULT_TYPOGRAPHY_AXIS.tracking ?? {}), ...(axis.tracking ?? {}) },
    fontStyles: { ...(GDS_DEFAULT_TYPOGRAPHY_AXIS.fontStyles ?? {}), ...(axis.fontStyles ?? {}) },
  };

  const { ratio } = merged.scale;
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 2) {
    throw new GdsAxisError(`${themeId}: type ratio is ${ratio}; it must be between 1.0 and 2.0. Outside that a "scale" is not a scale.`);
  }
  let previous = -Infinity;
  for (const name of GDS_WEIGHT_NAMES) {
    const w = merged.weights[name];
    if (!Number.isFinite(w) || w < 100 || w > 900) throw new GdsAxisError(`${themeId}: weight "${name}" is ${w}; CSS weights run 100-900.`);
    if (w <= previous) {
      throw new GdsAxisError(`${themeId}: weight "${name}" (${w}) is not heavier than the previous step. A scale that does not ascend renders as broken text rather than as a style.`);
    }
    previous = w;
  }
  for (const [step, lh] of Object.entries(merged.lineHeights ?? {})) {
    if (!Number.isFinite(lh) || lh < 1 || lh > 2.5) throw new GdsAxisError(`${themeId}: line height for "${step}" is ${lh}; it must be between 1.0 and 2.5.`);
  }
  // Percentages are deliberately excluded, unlike the shared LENGTH pattern: letter-spacing
  // does not accept percentage values, and this validator exists to fail the build rather
  // than ship invalid CSS.
  for (const [step, tr] of Object.entries(merged.tracking ?? {})) {
    if (!TRACKING.test(String(tr).trim())) {
      throw new GdsAxisError(`${themeId}: tracking for "${step}" is "${tr}", which is not "normal", a signed px/rem/em/ch length, or a var() reference.`);
    }
  }
  for (const [step, fs] of Object.entries(merged.fontStyles ?? {})) {
    if (fs !== 'normal' && fs !== 'italic') {
      throw new GdsAxisError(`${themeId}: font style for "${step}" is "${fs}"; it must be "normal" or "italic".`);
    }
  }
  if (knownLaneIds) {
    for (const [role, laneId] of Object.entries(merged.lanes)) {
      if (!knownLaneIds.includes(laneId)) {
        throw new GdsAxisError(`${themeId}: font lane "${laneId}" for role "${role}" is not registered. An unregistered lane falls back to the browser default, which reads as the theme failing to load.`);
      }
    }
  }

  const tokens: Record<string, string> = {};
  const mdIndex = GDS_TEXT_STEPS.indexOf('md');
  GDS_TEXT_STEPS.forEach((step, i) => {
    const override = merged.scale.overrides?.[step];
    // Derived steps are computed from the base by the ratio; overridden steps are taken
    // verbatim, which is how Mantine's non-uniform ramp survives intact.
    tokens[`--gds-font-size-${step}`] = override
      ?? `calc(${merged.scale.base} * ${Number(Math.pow(ratio, i - mdIndex).toFixed(4))})`;
    const lh = merged.lineHeights?.[step];
    if (lh !== undefined) tokens[`--gds-line-height-${step}`] = String(lh);
    const tr = merged.tracking?.[step];
    if (tr !== undefined) tokens[`--gds-tracking-${step}`] = tr;
    const fs = merged.fontStyles?.[step];
    if (fs !== undefined) tokens[`--gds-font-style-${step}`] = fs;
  });
  for (const name of GDS_WEIGHT_NAMES) tokens[`--gds-weight-${name}`] = String(merged.weights[name]);
  for (const role of ['display', 'body', 'mono'] as GdsFontLaneRole[]) tokens[`--gds-font-lane-${role}`] = merged.lanes[role];
  return tokens;
}

/**
 * Validates and resolves the elevation axis.
 *
 * Steps must not decrease in visual weight: a modal flatter than the card behind it reads
 * as a rendering bug, not a design choice. That monotonicity rule governs the shared step
 * ramp only — a role may instead pin one of the declared steps, or carry its own
 * {@link GdsElevationValue} (a directional shadow, or `{ kind: 'none' }`), which is exempt
 * from it by design because it expresses a kind, not a rank. Every role in
 * {@link GDS_ELEVATION_ROLES} always emits a token, falling back to `defaultStep` when
 * undeclared, so no consumer of `--gds-elevation-<role>` ever lands on an undefined variable.
 */
export function resolveGdsElevationTokens(axis: GdsElevationAxis = GDS_DEFAULT_ELEVATION_AXIS, themeId = 'theme'): Record<string, string> {
  const merged: GdsElevationAxis = {
    ...GDS_DEFAULT_ELEVATION_AXIS,
    ...axis,
    steps: { ...GDS_DEFAULT_ELEVATION_AXIS.steps, ...(axis.steps ?? {}) },
    roles: { ...GDS_DEFAULT_ELEVATION_AXIS.roles, ...(axis.roles ?? {}) },
  };

  const render = (v: GdsElevationValue): string => {
    if (v.kind === 'none') return 'none';
    if (!v.value?.trim()) throw new GdsAxisError(`${themeId}: elevation value of kind "${v.kind}" has no value.`);
    return v.value;
  };

  let seenNonNone = false;
  for (const step of GDS_ELEVATION_STEPS) {
    const value = merged.steps[step];
    if (!value) throw new GdsAxisError(`${themeId}: elevation axis is missing step ${step}.`);
    if (value.kind === 'none' && seenNonNone) {
      throw new GdsAxisError(
        `${themeId}: elevation step ${step} is "none" after a raised step. Elevation must not decrease — a modal flatter than the card behind it reads as a rendering bug.`,
      );
    }
    if (value.kind !== 'none') seenNonNone = true;
  }

  // Role keys are a closed set at runtime too (JSON-derived themes bypass TS), matching
  // validateGdsShapeAxis's typo guard.
  for (const role of Object.keys(merged.roles ?? {})) {
    if (!GDS_ELEVATION_ROLES.includes(role as GdsElevationRole)) {
      throw new GdsAxisError(`${themeId}: "${role}" is not a known elevation role. Roles are a closed set so a typo cannot become a silently unstyled surface.`);
    }
  }

  const tokens: Record<string, string> = {};
  for (const step of GDS_ELEVATION_STEPS) tokens[`--gds-elevation-${step}`] = render(merged.steps[step]);

  const fallback = merged.defaultStep ?? 1;
  for (const role of GDS_ELEVATION_ROLES) {
    const declared = merged.roles?.[role];
    if (declared === undefined) {
      tokens[`--gds-elevation-${role}`] = render(merged.steps[fallback]);
    } else if (typeof declared === 'number') {
      if (!GDS_ELEVATION_STEPS.includes(declared)) {
        throw new GdsAxisError(`${themeId}: elevation role "${role}" pins step ${declared}, which is not a declared step.`);
      }
      tokens[`--gds-elevation-${role}`] = render(merged.steps[declared]);
    } else {
      // Role-level value: validated by render(); exempt from the step monotonicity rule,
      // which orders the shared ramp, not per-role kinds.
      tokens[`--gds-elevation-${role}`] = render(declared);
    }
  }
  return tokens;
}

/** The `var()` reference for an elevation role — never a resolved shadow. */
export function gdsElevation(role: GdsElevationRole | GdsElevationStep): string {
  return `var(--gds-elevation-${role})`;
}

/**
 * Reaction intensity expressed as concrete, governed values.
 *
 * Components read the resolved tokens rather than branching on the keyword. `none` is
 * genuinely none, not a small value — a theme asking for no reaction gets none.
 */
const REACTION_VALUES: Record<GdsReactionIntensity, { lift: string; scale: string }> = {
  none: { lift: '0', scale: '1' },
  subtle: { lift: '-1px', scale: '1.01' },
  standard: { lift: '-2px', scale: '1.02' },
  pronounced: { lift: '-4px', scale: '1.04' },
};

/** The default focus ring: 2px is the floor, not a preference. */
export const GDS_DEFAULT_FOCUS_RING: GdsFocusRingSpec = {
  width: '2px',
  offset: '2px',
  style: 'solid',
  colorRole: 'focus-ring',
};

/** The default reaction axis, matching what components render today. */
export const GDS_DEFAULT_REACTION_AXIS: GdsReactionAxis = {
  hover: 'standard',
  active: 'subtle',
  pressed: 'subtle',
  focusRing: GDS_DEFAULT_FOCUS_RING,
  transitionScope: ['color', 'background', 'border', 'shadow', 'transform'],
};

/**
 * Resolves the motion axis into `--gds-motion-*` overrides for this preset.
 *
 * Only declared overrides are emitted. The global scale in `styles.css`, generated from
 * `motion.ts`, remains the default; a preset that declares nothing inherits it rather than
 * duplicating the global block 25 times.
 */
export function resolveGdsMotionTokens(axis: GdsMotionAxis | undefined, themeId = 'theme'): Record<string, string> {
  if (!axis) return {};
  const tokens: Record<string, string> = {};

  for (const [name, ms] of Object.entries(axis.durations ?? {})) {
    if (!Number.isFinite(ms) || ms < 0 || ms > 2000) {
      throw new GdsAxisError(`${themeId}: motion duration "${name}" is ${ms}ms; it must be between 0 and 2000. Beyond that a transition is an animation the user cannot skip.`);
    }
    tokens[`--gds-motion-duration-${name}`] = `${ms}ms`;
  }
  for (const [name, easing] of Object.entries(axis.easings ?? {})) {
    if (!/^(cubic-bezier\([^)]*\)|linear|ease|ease-in|ease-out|ease-in-out|steps\([^)]*\))$/.test(String(easing).trim())) {
      throw new GdsAxisError(`${themeId}: motion easing "${name}" is "${easing}", which is not a CSS timing function.`);
    }
    tokens[`--gds-motion-ease-${name}`] = String(easing);
  }
  if (axis.reducedMotionPolicy) tokens['--gds-motion-policy'] = axis.reducedMotionPolicy;
  return tokens;
}

/**
 * Resolves the reaction axis into interaction-feedback tokens.
 *
 * The focus ring is validated hard, because it is the one piece of interaction feedback a
 * keyboard user cannot do without: below 2px it is not reliably visible, and a colour given
 * as a literal cannot be checked for contrast against the surface it lands on.
 */
export function resolveGdsReactionTokens(axis: GdsReactionAxis = GDS_DEFAULT_REACTION_AXIS, themeId = 'theme'): Record<string, string> {
  const merged: GdsReactionAxis = {
    ...GDS_DEFAULT_REACTION_AXIS,
    ...axis,
    focusRing: { ...GDS_DEFAULT_FOCUS_RING, ...(axis.focusRing ?? {}) },
    transitionScope: axis.transitionScope ?? GDS_DEFAULT_REACTION_AXIS.transitionScope,
  };

  const ring = merged.focusRing as GdsFocusRingSpec;
  const widthPx = /^(\d*\.?\d+)px$/.exec(String(ring.width).trim());
  if (!widthPx || parseFloat(widthPx[1]) < 2) {
    throw new GdsAxisError(
      `${themeId}: focus-ring width is "${ring.width}". It must be at least 2px — below that the ring is not reliably visible, `
      + 'and a keyboard user has no other indication of where they are.',
    );
  }
  if (!['solid', 'dashed', 'double'].includes(ring.style)) {
    throw new GdsAxisError(`${themeId}: focus-ring style "${ring.style}" is not solid, dashed or double.`);
  }
  if (/^#|^rgb|^hsl/.test(String(ring.colorRole).trim())) {
    throw new GdsAxisError(
      `${themeId}: focus-ring colorRole is "${ring.colorRole}", a literal colour. It must be a ROLE name so the ring follows the theme `
      + 'and its contrast can be checked against the surface it lands on.',
    );
  }

  const tokens: Record<string, string> = {
    '--gds-focus-ring-width': ring.width,
    '--gds-focus-ring-offset': ring.offset,
    '--gds-focus-ring-style': ring.style,
    '--gds-focus-ring-color': `var(--gds-${ring.colorRole})`,
    '--gds-transition-scope': (merged.transitionScope ?? []).join(', ') || 'none',
  };
  for (const state of ['hover', 'active', 'pressed'] as const) {
    const intensity = merged[state] ?? 'standard';
    if (!REACTION_VALUES[intensity]) throw new GdsAxisError(`${themeId}: reaction intensity "${intensity}" for "${state}" is not none/subtle/standard/pronounced.`);
    tokens[`--gds-reaction-${state}`] = intensity;
    tokens[`--gds-reaction-${state}-lift`] = REACTION_VALUES[intensity].lift;
    tokens[`--gds-reaction-${state}-scale`] = REACTION_VALUES[intensity].scale;
  }
  return tokens;
}

/**
 * All axis tokens for a theme's axis declarations.
 *
 * The single place a new axis is wired in. Kept separate from the shape resolver so the next
 * axis does not have to touch shape code to exist.
 */
export function resolveGdsAxisTokens(
  axes: GdsThemeAxes | undefined,
  themeId: GdsThemePresetId | string = 'theme',
  scheme: 'light' | 'dark' = 'light',
): Record<string, string> {
  return {
    ...resolveGdsShapeTokens(axes?.shape ?? GDS_DEFAULT_SHAPE_AXIS, String(themeId)),
    ...resolveGdsDensityTokens(axes?.density ?? GDS_DEFAULT_DENSITY_AXIS, String(themeId)),
    // Fixed, not per-theme — see resolveGdsShellHeightTokens.
    ...resolveGdsShellHeightTokens(),
    // Shell geometry (issue 698): unconditional, like shape/density above — every preset gets
    // the full nine-token namespace even with no layout axis declared.
    ...resolveGdsLayoutTokens(axes?.layout ?? GDS_DEFAULT_LAYOUT_AXIS, String(themeId)),
    ...resolveGdsTypographyTokens(axes?.type ?? GDS_DEFAULT_TYPOGRAPHY_AXIS, String(themeId)),
    ...resolveGdsElevationTokens(axes?.elevation ?? GDS_DEFAULT_ELEVATION_AXIS, String(themeId)),
    ...resolveGdsReactionTokens(axes?.reaction ?? GDS_DEFAULT_REACTION_AXIS, String(themeId)),
    // Motion last and conditional: it overrides the generated global scale, so a preset that
    // declares nothing must emit nothing rather than restating the default 25 times.
    ...resolveGdsMotionTokens(axes?.motion, String(themeId)),
    // Accents are the one axis that resolves per scheme: a theme may declare a distinct
    // dark base.
    ...resolveGdsAccentTokens(axes?.accent, scheme, themeId),
  };
}

/**
 * The `var()` reference for a radius role — never a resolved literal.
 *
 * Returning the reference keeps a component theme-reactive: a literal captured at render
 * time freezes the geometry of whichever theme was active, so a later switch looks
 * half-applied.
 */
export function gdsRadius(role: GdsRadiusRole | GdsRadiusStep): string {
  return `var(--gds-radius-${role})`;
}

// ── Design rule profile (issue 643) ──────────────────────────────────────

/** A theme's color-proportion rule. `'none'` is a truthful default: no proportion claim made. */
export type GdsColorProportionRule = '60-30-10' | 'none';

/** Named hue-relationship classification a theme's brand/accent ramps are built on. */
export type GdsColorHarmony = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic' | 'custom';

/** Named modular type-scale ratios (musical-interval-derived): Minor Second through the Golden Ratio. */
export type GdsTypeScaleRatio = 1.125 | 1.2 | 1.25 | 1.333 | 1.5 | 1.618;

/** Which WCAG conformance level a theme's contrast pairs are declared to target. */
export type GdsContrastTarget = 'AA' | 'AAA';

/**
 * Which semantic token roles (the role-name strings `emitCssVariables`/`resolveGdsAccentTokens`
 * emit, e.g. `'bg.page'`, `'brand.accent'`) a theme classifies into each proportion class. A
 * role belongs to exactly one class — the three arrays are a partition, not overlapping tags.
 */
export interface GdsColorProportionClassification {
  dominant: string[];
  secondary: string[];
  accent: string[];
}

/** A theme's declared design-quality claims: color proportion, color harmony, type scale, contrast target. */
export interface GdsDesignRuleProfile {
  colorProportion: {
    rule: GdsColorProportionRule;
    classification: GdsColorProportionClassification;
  };
  colorHarmony: GdsColorHarmony;
  typeScale: {
    ratio: GdsTypeScaleRatio;
  };
  contrastTarget: GdsContrastTarget;
  /**
   * Roles a theme reserves for a named, closed set of consuming surfaces (issue 697) — e.g.
   * the Scout AI sub-brand lane's `ai.gradient`/`ai.panel`/`ai.accent`. Validated non-empty:
   * a reservation nothing may consume is a contradiction. Enforced mechanically by a
   * repository gate, not just declared here as a claim.
   */
  reservedAccents?: Array<{
    /** The emitted role name the reservation covers, e.g. `'ai.gradient'`. */
    role: string;
    /** Sanctioned consumer identifiers, e.g. `'AISearchCard'`. */
    surfaces: string[];
  }>;
}

/** The default design rule profile: no proportion claim, no harmony claim, Major Second type scale, WCAG AA. */
export const GDS_DEFAULT_DESIGN_RULE_PROFILE: GdsDesignRuleProfile = {
  colorProportion: { rule: 'none', classification: { dominant: [], secondary: [], accent: [] } },
  colorHarmony: 'custom',
  typeScale: { ratio: 1.25 },
  contrastTarget: 'AA',
};

const GDS_COLOR_PROPORTION_RULES: GdsColorProportionRule[] = ['60-30-10', 'none'];
const GDS_COLOR_HARMONIES: GdsColorHarmony[] = ['complementary', 'analogous', 'triadic', 'split-complementary', 'monochromatic', 'custom'];
const GDS_TYPE_SCALE_RATIOS: GdsTypeScaleRatio[] = [1.125, 1.2, 1.25, 1.333, 1.5, 1.618];
const GDS_CONTRAST_TARGETS: GdsContrastTarget[] = ['AA', 'AAA'];

/**
 * Validates a design rule profile at theme-construction time, not render time: an invalid
 * value fails the build with the offending field, instead of shipping as a silently wrong
 * claim. Throws on the first violation found, matching every sibling `validateGds*Axis`.
 */
export function validateGdsDesignRuleProfile(profile: GdsDesignRuleProfile, themeId = 'theme'): void {
  if (!GDS_COLOR_PROPORTION_RULES.includes(profile.colorProportion.rule)) {
    throw new GdsAxisError(`${themeId}: colorProportion.rule "${profile.colorProportion.rule}" is not one of ${GDS_COLOR_PROPORTION_RULES.join(', ')}.`);
  }
  if (!GDS_COLOR_HARMONIES.includes(profile.colorHarmony)) {
    throw new GdsAxisError(`${themeId}: colorHarmony "${profile.colorHarmony}" is not one of ${GDS_COLOR_HARMONIES.join(', ')}.`);
  }
  if (!GDS_TYPE_SCALE_RATIOS.includes(profile.typeScale.ratio)) {
    throw new GdsAxisError(`${themeId}: typeScale.ratio ${profile.typeScale.ratio} is not one of ${GDS_TYPE_SCALE_RATIOS.join(', ')}.`);
  }
  if (!GDS_CONTRAST_TARGETS.includes(profile.contrastTarget)) {
    throw new GdsAxisError(`${themeId}: contrastTarget "${profile.contrastTarget}" is not one of ${GDS_CONTRAST_TARGETS.join(', ')}.`);
  }

  // A rule of 'none' asserting a non-empty classification is a contradiction: it claims no
  // proportion rule while still stating role assignments. Either state the rule or leave the
  // classification empty — not both.
  const { rule, classification } = profile.colorProportion;
  const classifiedCount = classification.dominant.length + classification.secondary.length + classification.accent.length;
  if (rule === 'none' && classifiedCount > 0) {
    throw new GdsAxisError(`${themeId}: colorProportion.rule is "none" but classification lists ${classifiedCount} role(s) — either declare a rule or clear the classification.`);
  }

  // A role reserved twice, or reserved for no surface at all, is a contradiction (issue 697):
  // the whole point of a reservation is a singular, enforceable claim.
  if (profile.reservedAccents) {
    const seenRoles = new Set<string>();
    for (const reservation of profile.reservedAccents) {
      if (seenRoles.has(reservation.role)) {
        throw new GdsAxisError(`${themeId}: reservedAccents declares role "${reservation.role}" more than once.`);
      }
      seenRoles.add(reservation.role);
      if (reservation.surfaces.length === 0) {
        throw new GdsAxisError(`${themeId}: reservedAccents role "${reservation.role}" has no surfaces — a reservation nothing may consume is a contradiction.`);
      }
    }
  }

  // A role must not appear in more than one class — 60/30/10 is a partition, not an
  // overlapping tag set. Downstream percentage math assumes this invariant.
  const seen = new Map<string, keyof GdsColorProportionClassification>();
  for (const cls of ['dominant', 'secondary', 'accent'] as const) {
    for (const role of classification[cls]) {
      const existing = seen.get(role);
      if (existing && existing !== cls) {
        throw new GdsAxisError(`${themeId}: role "${role}" is classified as both "${existing}" and "${cls}" — a role may belong to exactly one proportion class.`);
      }
      seen.set(role, cls);
    }
  }
}
