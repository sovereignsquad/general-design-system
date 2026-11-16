import type { MantineThemeOverride } from '@mantine/core';
import { createPublicBrandTheme, extendGdsTheme, gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme } from './theme';
import { createVibrantPresetTheme } from './presets/vibrant';
import { createBrandTheme } from './brand-tokens';
import { gdsThemePresetRegistry } from './presets';
import type { GdsThemePresetCatalogEntry, GdsThemePresetMantineFactories } from './presets/define';
import { normalizeGdsThemePresetId, type GdsDeprecatedThemePresetId } from './presets/aliases';

/** Identifier of a registered GDS theme preset, derived from `gdsThemePresetRegistry`. */
export type GdsCurrentThemePresetId = (typeof gdsThemePresetRegistry)[number]['id'];

/**
 * Identifier a preset can be selected by: a registered id, or a deprecated id that resolves to
 * its replacement (see `GDS_THEME_PRESET_ALIASES`).
 */
export type GdsThemePresetId = GdsCurrentThemePresetId | GdsDeprecatedThemePresetId;

/** Catalog entry describing a theme preset for selection UIs and documentation. */
export interface GdsThemePreset extends GdsThemePresetCatalogEntry {
  id: GdsCurrentThemePresetId;
}

const themePresetCatalog: GdsThemePreset[] = gdsThemePresetRegistry.map((preset) => ({ id: preset.id, ...preset.catalog }));

const mantineFactories: GdsThemePresetMantineFactories = {
  createBrandTheme,
  extendGdsTheme,
  createVibrantPresetTheme,
  gdsTheme,
  gdsDarkPublicTheme,
  gdsFlatSurfaceTheme,
  gdsEditorialPublicTheme,
};

const resolvedMantineThemes = new Map<GdsCurrentThemePresetId, MantineThemeOverride>();

function resolveRegisteredMantineTheme(id: GdsCurrentThemePresetId): MantineThemeOverride {
  const cached = resolvedMantineThemes.get(id);
  if (cached) return cached;
  const mantine = gdsThemePresetRegistry.find((preset) => preset.id === id)?.mantine;
  const theme = typeof mantine === 'function' ? mantine(mantineFactories) : (mantine ?? gdsTheme);
  resolvedMantineThemes.set(id, theme);
  return theme;
}

/** Returns the full catalog of theme presets (id, label, description, runtime lane). */
export function getGdsThemePresets() {
  return themePresetCatalog;
}

/**
 * Resolves a preset id to its Mantine theme override. The `'brand'` lane is
 * composed on demand from the optional brand options; all other ids map to the
 * registered preset's lane, falling back to the default theme for unknown ids.
 */
export function resolveGdsThemePreset(presetId: GdsThemePresetId, options?: { brandPrimary?: string; brandFlatSurfaces?: boolean; brandEditorialSerif?: boolean }): MantineThemeOverride {
  const id = normalizeGdsThemePresetId(presetId);
  if (id === 'brand') {
    return createPublicBrandTheme({
      editorialSerif: options?.brandEditorialSerif ?? false,
      flatSurfaces: options?.brandFlatSurfaces ?? true,
      overrides: { primaryColor: options?.brandPrimary ?? 'blue' },
    });
  }
  return resolveRegisteredMantineTheme(id);
}

/** Compact, family-friendly teal/lime map-and-list discovery theme with explicit dark-mode tokens. */
export const partnerDiscoveryThemePreset = resolveGdsThemePreset('partner-discovery');

/** Mantine theme for the Harbor brand lane (warm cream, ink navy and action orange). */
export const harborThemePreset = resolveGdsThemePreset('harbor');

/** Mantine theme for the Ochre brand lane (deep gold on cream). */
export const ochreThemePreset = resolveGdsThemePreset('ochre');

/** @deprecated Use `harborThemePreset`. Removed in 8.0.0. */
export const classUsaThemePreset = harborThemePreset;

/** @deprecated Use `ochreThemePreset`. Removed in 8.0.0. */
export const goldAthleteThemePreset = ochreThemePreset;
