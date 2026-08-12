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

/**
 * The generic axis container on a theme.
 *
 * Each later axis adds one optional key here and one branch in `resolveAxisTokens`. Nothing
 * else in the theme pipeline changes, which is the property this issue exists to establish.
 */
export interface GdsThemeAxes {
  shape?: GdsShapeAxis;
  // density?: GdsDensityAxis;      -> issue #556
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
 * All axis tokens for a theme's axis declarations.
 *
 * The single place a new axis is wired in. Kept separate from the shape resolver so the next
 * axis does not have to touch shape code to exist.
 */
export function resolveGdsAxisTokens(axes: GdsThemeAxes | undefined, themeId: GdsThemePresetId | string = 'theme'): Record<string, string> {
  return { ...resolveGdsShapeTokens(axes?.shape ?? GDS_DEFAULT_SHAPE_AXIS, String(themeId)) };
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
