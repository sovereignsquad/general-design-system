import type { MantineThemeOverride } from '@mantine/core';
import { createPublicBrandTheme, extendGdsTheme, gdsDarkPublicTheme, gdsEditorialPublicTheme, gdsFlatSurfaceTheme, gdsTheme } from './theme';
import { createVibrantPresetTheme } from './presets/vibrant';
import { createBrandTheme } from './brand-tokens';
import { gdsThemePresetRegistry } from './presets';
import type { GdsThemePresetCatalogEntry, GdsThemePresetMantineFactories } from './presets/define';

/** Identifier of a built-in GDS theme preset (accessibility, brand, and vibe lanes), derived from `gdsThemePresetRegistry`. */
export type GdsThemePresetId = (typeof gdsThemePresetRegistry)[number]['id'];

/** Catalog entry describing a theme preset for selection UIs and documentation. */
export interface GdsThemePreset extends GdsThemePresetCatalogEntry {
  id: GdsThemePresetId;
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

const resolvedMantineThemes = new Map<GdsThemePresetId, MantineThemeOverride>();

function resolveRegisteredMantineTheme(id: GdsThemePresetId): MantineThemeOverride {
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
export function resolveGdsThemePreset(id: GdsThemePresetId, options?: { brandPrimary?: string; brandFlatSurfaces?: boolean; brandEditorialSerif?: boolean }): MantineThemeOverride {
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

/** Mantine theme for the governed Class USA brand (ivory/navy/sage/terracotta). */
export const classUsaThemePreset = resolveGdsThemePreset('class-usa');

/** Mantine theme for the governed Gold Athlete brand (black-and-metallic-gold). */
export const goldAthleteThemePreset = resolveGdsThemePreset('gold-athlete');
