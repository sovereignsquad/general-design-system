import type { MantineThemeOverride } from '@mantine/core';
import type { createBrandTheme } from '../brand-tokens';
import type { GdsVibeThemeFields } from '../vibe-themes';

/** Selection-UI and documentation entry of a preset. */
export interface GdsThemePresetCatalogEntry {
  /** Human-readable preset name. */
  label: string;
  /** Short summary of the preset's look and intended use. */
  description: string;
  /** Name of the runtime source that produces this preset (e.g. `resolveGdsThemePreset(...)`). */
  runtimeLane: string;
}

/**
 * Factories handed to a preset's `mantine` function. A preset module never imports
 * `brand-tokens` itself, because that module reads the vibe map built from this registry.
 */
export interface GdsThemePresetMantineFactories {
  /** Builds a governed brand theme from a brand id. */
  createBrandTheme: typeof createBrandTheme;
}

/** One built-in theme preset: the single entry a new theme adds. */
export interface GdsThemePresetDefinition<Id extends string = string> {
  /** Stable preset id; becomes a member of `GdsThemePresetId`. */
  id: Id;
  /** Catalog entry returned by `getGdsThemePresets()`. */
  catalog: GdsThemePresetCatalogEntry;
  /** CSS atmosphere returned by `getGdsVibeThemes()`; its `id` equals the preset id. */
  vibe: GdsVibeThemeFields & { id: Id };
  /**
   * Mantine theme returned by `resolveGdsThemePreset(id)`. A function is called once, on first
   * resolve. Omitted only for `brand`, which is composed per call from its options; any other
   * preset without one resolves to the default theme.
   */
  mantine?: MantineThemeOverride | ((factories: GdsThemePresetMantineFactories) => MantineThemeOverride);
  /**
   * Hand-authored semantic roles layered over the derived set (`--gds-*`, `-dark` suffix for the
   * dark scheme). Values come from `semantic-token-source.ts` emitters, never a literal table.
   */
  semanticOverrides?: Record<string, string>;
}

/**
 * Declares a built-in theme preset. Add the result to `gdsThemePresetRegistry`; the id union,
 * the catalog, the Mantine lane map and the vibe map are derived from that list.
 */
export function defineGdsThemePreset<const Id extends string>(definition: GdsThemePresetDefinition<Id>): GdsThemePresetDefinition<Id> {
  if (definition.vibe.id !== definition.id) {
    throw new Error(`Theme preset "${definition.id}" declares vibe id "${definition.vibe.id}".`);
  }
  return definition;
}
