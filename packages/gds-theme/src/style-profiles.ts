import type { GdsElevationRole, GdsElevationStep, GdsDensityMode, GdsRadiusRole, GdsRadiusStep, GdsThemeAxes } from './axes';
import { GDS_DEFAULT_DENSITY_AXIS, GDS_DEFAULT_ELEVATION_AXIS, GDS_DEFAULT_SHAPE_AXIS } from './axes';

/**
 * A coherent visual personality built from the shape, density and elevation axes, independent of
 * the colour preset. `default` leaves the preset's own axes unchanged.
 */
export type GdsStyleProfile = 'default' | 'minimal' | 'soft' | 'structured';

/** Every style profile, in display order. */
export const GDS_STYLE_PROFILE_IDS: readonly GdsStyleProfile[] = ['default', 'minimal', 'soft', 'structured'];

/** What a style profile sets on the axes. */
export interface GdsStyleProfileDefinition {
  /** Radius step per role. Each preset keeps its own step scale; only the role map changes. */
  radius: Partial<Record<GdsRadiusRole, GdsRadiusStep>>;
  density: GdsDensityMode;
  /** Elevation step per role. Overlays (modal, drawer, sheet, menu, tooltip) keep their elevation. */
  elevation: Partial<Record<GdsElevationRole, GdsElevationStep>>;
}

/**
 * Radius roles for dense utility surfaces (inputs and shared surfaces such as tables, lists,
 * sidebars and toolbars). No profile rounds them past {@link GDS_UTILITY_RADIUS_CAP}.
 */
export const GDS_UTILITY_RADIUS_ROLES: readonly GdsRadiusRole[] = ['surface', 'input'];

/** The largest radius step a utility role takes in any profile. */
export const GDS_UTILITY_RADIUS_CAP: GdsRadiusStep = 'md';

/** Profile definitions. `default` is empty: the preset's axes apply as declared. */
export const GDS_STYLE_PROFILES: Record<Exclude<GdsStyleProfile, 'default'>, GdsStyleProfileDefinition> = {
  // Crisp corners and flat resting surfaces; separation comes from borders.
  minimal: {
    radius: { card: 'sm', panel: 'sm', surface: 'sm', button: 'sm', input: 'sm', chip: 'sm', badge: 'sm', image: 'sm', thumbnail: 'sm' },
    density: 'comfortable',
    elevation: { card: 0, panel: 0, sidebar: 0 },
  },
  // Generous corners and spacing with soft resting elevation.
  soft: {
    radius: { card: 'xl', panel: 'xl', surface: 'md', button: 'lg', input: 'md', chip: 'pill', badge: 'pill', image: 'xl', thumbnail: 'lg', modal: 'xl', drawer: 'xl', sheet: 'xl' },
    density: 'spacious',
    elevation: { card: 1, panel: 1, sidebar: 0 },
  },
  // Near-square geometry, compact spacing and flat framed surfaces.
  structured: {
    radius: { card: 'xs', panel: 'xs', surface: 'xs', button: 'xs', input: 'xs', chip: 'xs', badge: 'xs', image: 'none', thumbnail: 'none', modal: 'sm', drawer: 'none', sheet: 'sm' },
    density: 'compact',
    elevation: { card: 0, panel: 0, sidebar: 0 },
  },
};

const RADIUS_ORDER: readonly GdsRadiusStep[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill'];

function capped(step: GdsRadiusStep): GdsRadiusStep {
  return RADIUS_ORDER.indexOf(step) > RADIUS_ORDER.indexOf(GDS_UTILITY_RADIUS_CAP) ? GDS_UTILITY_RADIUS_CAP : step;
}

/** Narrows an arbitrary value to a style profile, falling back to `default`. */
export function normalizeGdsStyleProfile(value: unknown): GdsStyleProfile {
  return GDS_STYLE_PROFILE_IDS.includes(value as GdsStyleProfile) ? (value as GdsStyleProfile) : 'default';
}

/**
 * The preset's axes with a style profile applied. The profile replaces the radius role map, the
 * density mode and the resting elevation roles; the preset's radius scale, spacing scale, shadow
 * values, typography and colours are kept. Utility radius roles are capped at
 * {@link GDS_UTILITY_RADIUS_CAP}.
 */
export function applyGdsStyleProfile(axes: GdsThemeAxes | undefined, profile: GdsStyleProfile = 'default'): GdsThemeAxes | undefined {
  if (profile === 'default') return axes;
  const definition = GDS_STYLE_PROFILES[profile];
  const shape = axes?.shape ?? GDS_DEFAULT_SHAPE_AXIS;
  const roles: Partial<Record<GdsRadiusRole, GdsRadiusStep>> = { ...definition.radius };
  for (const role of GDS_UTILITY_RADIUS_ROLES) {
    if (roles[role]) roles[role] = capped(roles[role]!);
  }
  const density = axes?.density ?? GDS_DEFAULT_DENSITY_AXIS;
  const elevation = axes?.elevation ?? GDS_DEFAULT_ELEVATION_AXIS;
  return {
    ...axes,
    shape: { ...shape, profile: 'default', roles },
    density: { ...density, mode: definition.density },
    elevation: { ...elevation, roles: { ...elevation.roles, ...definition.elevation } },
  };
}
