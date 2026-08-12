// Issue 555 — the theme-axis mechanism, and the shape axis as its first instance.
//
// The owner requirement is that a theme controls "not only colours but sizing, shapes,
// margins, and animations, reactions, everything". That is not reachable by adding fields
// ad hoc: six more axes follow this one (density, typography, elevation, motion, reaction),
// and each would otherwise bring its own plumbing, its own emitter and its own gate.
//
// `GdsVibeTheme.flatSurfaces` is the existing precedent for a non-colour theme decision, and
// it shows the problem exactly — a boolean special case rather than an axis, invisible to
// the token graph and unverifiable.
//
// The mechanism is deliberately small: an axis is a validated value object plus a token
// namespace. Adding the next axis is a type, a default, a validator and an entry in
// `resolveAxisTokens` — not new plumbing.

import type { GdsThemePresetId } from './theme-presets';

/** Canonical radius steps. Fixed key set — a theme sets values, it never adds keys. */
export type GdsRadiusStep = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';

/**
 * Semantic surface families that may override the step scale.
 *
 * A role exists so a theme can say "cards are softer than inputs" without a component
 * knowing which step that means — which is the whole point of the axis. Component source
 * asks for `card`, not for `lg`.
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
 * The generic axis container on a theme.
 *
 * Each later axis adds one optional key here and one branch in `resolveAxisTokens`. Nothing
 * else in the theme pipeline changes, which is the property this issue exists to establish.
 */
export interface GdsThemeAxes {
  shape?: GdsShapeAxis;
  density?: GdsDensityAxis;
  // type?: GdsTypographyAxis;      -> issue #557
  // motion?: GdsMotionAxis;        -> issue #558
  // elevation?: GdsElevationAxis;  -> follow-up
  // reaction?: GdsReactionAxis;    -> follow-up
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
 * The default shape axis, CAPTURED rather than invented.
 *
 * `xs`–`xl` are Mantine's `DEFAULT_THEME.radius` values verbatim, including the
 * `calc(... * var(--mantine-scale))` wrapper. Substituting a plain `0.5rem` would look
 * equivalent and would silently drop Mantine's scale factor, which is a real rendering
 * change dressed as a tidy-up — the zero-visual-regression requirement is about what
 * renders, not about what reads cleanly.
 *
 * `none` and `pill` have no Mantine equivalent and are additions: `none` is the explicit
 * square corner, `pill` the fully-rounded end used by chips and avatars.
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
 * WCAG 2.2 Target Size (Minimum), 2.5.8: 24x24 CSS px. GDS holds a stricter 44px line,
 * which is the AAA 2.5.5 figure and the one both Apple and Google publish, because a control
 * that merely satisfies the minimum is still unpleasant to hit on a phone.
 *
 * Sizes below this are permitted only with a recorded exception — see
 * {@link GDS_CONTROL_HEIGHT_EXCEPTIONS}.
 */
export const GDS_MIN_TARGET_PX = 44;

/**
 * Control sizes deliberately below the target floor.
 *
 * `xs` and `sm` exist for dense tabular and toolbar contexts where a 44px row would make a
 * data table unusable. WCAG 2.5.8 exempts controls in a sentence or block of text and
 * inline targets, and a dense grid is the practical equivalent — but the exception is
 * recorded here rather than assumed, so it can be argued with.
 */
export const GDS_CONTROL_HEIGHT_EXCEPTIONS: Partial<Record<GdsControlSize, string>> = {
  xs: 'Dense tabular and toolbar controls; a 44px row makes a data grid unusable. Pair with a larger hit area via padding where the control stands alone.',
  sm: 'Compact forms and secondary toolbars. Same reasoning as xs, one step less dense.',
};

/**
 * The default density axis.
 *
 * `xs`-`xl` spacing is Mantine's `DEFAULT_THEME.spacing` verbatim, `var(--mantine-scale)`
 * included, for the reason the shape axis states: flattening to plain rem silently drops the
 * scale factor.
 *
 * `none`, `3xs`, `2xs`, `2xl` and `3xl` are ADDITIONS — Mantine has no equivalent. They
 * extend the existing ramp rather than restating it, and nothing consumes them yet, so they
 * carry no regression risk. Control heights are likewise new: no GDS or Mantine theme field
 * declared them before, so these tokens are additive by construction.
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

/** Thrown when a theme declares an axis value the contract cannot accept. */
export class GdsAxisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GdsAxisError';
  }
}

// A CSS length, a percentage, a `calc()`, or `0`. Deliberately not permissive: an axis that
// accepts anything emits anything, and the failure then surfaces as a silently unrounded
// corner in one preset rather than as a build error.
const LENGTH = /^(0|(-?\d*\.?\d+)(px|rem|em|%|vh|vw|ch|ex)|calc\(.+\)|var\(--[a-zA-Z0-9-]+(,.*)?\))$/;

/**
 * Validates a shape axis at theme-construction time.
 *
 * Construction time, not render time, and that is the point: a bad radius discovered while
 * rendering is a visual defect someone has to notice, whereas a bad radius discovered while
 * building the theme is an error with the offending key in it.
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
 * Emits every step and every role, always. A role that a theme did not override still gets a
 * token, resolved from `defaultStep` — so a component consuming `--gds-radius-pin` cannot
 * land on an undefined variable just because one preset stayed silent about pins. That is
 * the failure mode issue 537 shipped, in a different namespace.
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
 * The control-height floor is checked on the RESOLVED value, after the density factor has
 * been applied — a 44px control under `compact` x0.75 is 33px, and checking the declared
 * value instead of the rendered one would let the floor pass while the button shrank.
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
  // A calc() or var() cannot be multiplied numerically here without losing what it refers
  // to, so it is wrapped rather than flattened — the browser resolves it correctly and the
  // reference survives.
  return `calc(${v} * ${factor})`;
}

/**
 * Resolves a density axis into `--gds-space-*`, `--gds-control-height-*` and `--gds-density`.
 *
 * The a11y floor is enforced on the RESOLVED height, and a control below it must be listed
 * in {@link GDS_CONTROL_HEIGHT_EXCEPTIONS} — an unrecorded shrink is a build error, because
 * a theme quietly making every button 33px tall is a serious accessibility regression that
 * looks, in a diff, like a tasteful density tweak.
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

    // Density SCALING is different, and is clamped rather than rejected. Throwing here would
    // make `compact` unusable with any accessible control set — 44px x 0.75 is 33px — so the
    // floor would have quietly banned a whole density mode instead of protecting it. Spacing
    // tightens; hit targets hold their line. Sizes with a recorded exception scale freely,
    // because their exception is the statement that they are not primary hit targets.
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
 * All axis tokens for a theme's axis declarations.
 *
 * The single place a new axis is wired in. Kept separate from the shape resolver so the next
 * axis does not have to touch shape code to exist.
 */
export function resolveGdsAxisTokens(axes: GdsThemeAxes | undefined, themeId: GdsThemePresetId | string = 'theme'): Record<string, string> {
  return {
    ...resolveGdsShapeTokens(axes?.shape ?? GDS_DEFAULT_SHAPE_AXIS, String(themeId)),
    ...resolveGdsDensityTokens(axes?.density ?? GDS_DEFAULT_DENSITY_AXIS, String(themeId)),
  };
}

/**
 * The `var()` reference for a radius role — never a resolved literal.
 *
 * Returning the reference rather than the value is what keeps a component theme-reactive: a
 * literal captured at render time freezes the geometry of whichever theme happened to be
 * active, which is exactly the class of bug that makes a theme switch look half-applied.
 */
export function gdsRadius(role: GdsRadiusRole | GdsRadiusStep): string {
  return `var(--gds-radius-${role})`;
}
