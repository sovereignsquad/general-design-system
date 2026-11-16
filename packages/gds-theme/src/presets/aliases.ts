/**
 * Preset ids renamed to neutral names, mapped to the id that replaced them. An old id resolves
 * to the same preset everywhere a preset id is accepted.
 *
 * @deprecated Use the current ids. The old ids are removed in 8.0.0.
 */
export const GDS_THEME_PRESET_ALIASES = {
  'class-usa': 'harbor',
  'gold-athlete': 'ochre',
  'padel-africa': 'meadow',
  'your-field': 'linen',
  'athlete-gold': 'gilded',
} as const;

/** @deprecated An old preset id; see {@link GDS_THEME_PRESET_ALIASES}. Removed in 8.0.0. */
export type GdsDeprecatedThemePresetId = keyof typeof GDS_THEME_PRESET_ALIASES;

/** Returns the current id for a preset id, mapping a deprecated id to its replacement. */
export function normalizeGdsThemePresetId<T extends string>(id: T): Exclude<T, GdsDeprecatedThemePresetId> | (typeof GDS_THEME_PRESET_ALIASES)[GdsDeprecatedThemePresetId] {
  return (Object.prototype.hasOwnProperty.call(GDS_THEME_PRESET_ALIASES, id)
    ? GDS_THEME_PRESET_ALIASES[id as GdsDeprecatedThemePresetId]
    : id) as Exclude<T, GdsDeprecatedThemePresetId> | (typeof GDS_THEME_PRESET_ALIASES)[GdsDeprecatedThemePresetId];
}
