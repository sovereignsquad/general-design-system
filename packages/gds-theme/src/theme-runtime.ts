'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MantineThemeOverride } from '@mantine/core';
import { applyGdsFontLane, isGdsFontLaneId, resolveGdsFontLane, type GdsFontLaneId } from './font-lanes';
import { getGdsThemePresets, resolveGdsThemePreset, type GdsThemePresetId } from './theme-presets';
import { getGdsVibeThemeCssVariables } from './vibe-themes';

/** Requested color scheme: fixed `'light'`/`'dark'`, or `'auto'` to follow the OS. */
export type GdsThemeScheme = 'light' | 'dark' | 'auto';

/** The serializable theme selection persisted to storage. */
export interface GdsStoredThemePresetState {
  /** Selected theme preset. */
  preset: GdsThemePresetId;
  /** Selected color scheme. */
  colorScheme: GdsThemeScheme;
  /** Selected font lane. */
  fontLane: GdsFontLaneId;
  /** Identity/cache key derived from the whole selection. */
  runtimeKey?: string;
  /** Primary color for the `'brand'` preset lane. */
  brandPrimary?: string;
  /** Flat-surfaces flag for the `'brand'` preset lane. */
  brandFlatSurfaces?: boolean;
  /** Editorial-serif flag for the `'brand'` preset lane. */
  brandEditorialSerif?: boolean;
}

/** A stored selection plus the resolved Mantine theme it produces. */
export interface GdsThemePresetSelection extends GdsStoredThemePresetState {
  /** Resolved Mantine theme override for the current selection. */
  theme: MantineThemeOverride;
}

/** Options for `useGdsThemePresetState`. */
export interface UseGdsThemePresetStateOptions {
  /** localStorage key used to persist the selection. */
  storageKey?: string;
  /** Initial selection applied when nothing is stored. */
  initialSelection?: Partial<GdsStoredThemePresetState>;
  /** When `true` (default), writes scheme/preset/font attributes and vibe CSS variables to `<html>`. */
  applyToDocument?: boolean;
}

/** Return value of `useGdsThemePresetState`: the current selection and setters for each facet. */
export interface UseGdsThemePresetStateResult {
  /** Current resolved selection. */
  selection: GdsThemePresetSelection;
  /** Replaces the selection from a partial stored state. */
  setSelection: (selection: Partial<GdsStoredThemePresetState>) => void;
  /** Updates the preset only. */
  setPreset: (preset: GdsThemePresetId) => void;
  /** Updates the color scheme only. */
  setScheme: (scheme: GdsThemeScheme) => void;
  /** Updates the font lane only. */
  setFontLane: (fontLane: GdsFontLaneId) => void;
  /** Updates the brand-lane options only. */
  setBrandOptions: (options: Pick<GdsStoredThemePresetState, 'brandPrimary' | 'brandFlatSurfaces' | 'brandEditorialSerif'>) => void;
  /** Resets to the initial selection. */
  reset: () => void;
}

const defaultStorageKey = 'gds-theme-preset-selection';

function isThemePresetId(value: unknown): value is GdsThemePresetId {
  return typeof value === 'string' && getGdsThemePresets().some((preset) => preset.id === value);
}

function isScheme(value: unknown): value is GdsThemeScheme {
  return value === 'light' || value === 'dark' || value === 'auto';
}

/**
 * Normalizes a partial stored selection into a full selection: each field is
 * validated and defaulted (`default` preset, `light` scheme, `inter` font,
 * `blue` brand primary, flat surfaces on, serif off), a `runtimeKey` is derived,
 * and the resolved Mantine theme (preset + font lane) is attached.
 */
export function createGdsThemePresetSelection(stored: Partial<GdsStoredThemePresetState> = {}): GdsThemePresetSelection {
  const preset = isThemePresetId(stored.preset) ? stored.preset : 'default';
  const colorScheme = isScheme(stored.colorScheme) ? stored.colorScheme : 'light';
  const fontLane = isGdsFontLaneId(stored.fontLane) ? stored.fontLane : 'inter';
  const brandPrimary = typeof stored.brandPrimary === 'string' ? stored.brandPrimary : 'blue';
  const brandFlatSurfaces = typeof stored.brandFlatSurfaces === 'boolean' ? stored.brandFlatSurfaces : true;
  const brandEditorialSerif = typeof stored.brandEditorialSerif === 'boolean' ? stored.brandEditorialSerif : false;
  const runtimeKey = `${preset}-${colorScheme}-${brandPrimary}-${brandFlatSurfaces}-${brandEditorialSerif}-${fontLane}`;

  return {
    preset,
    colorScheme,
    theme: applyGdsFontLane(resolveGdsThemePreset(preset, {
      brandPrimary,
      brandFlatSurfaces,
      brandEditorialSerif,
    }), fontLane),
    fontLane,
    runtimeKey,
    brandPrimary,
    brandFlatSurfaces,
    brandEditorialSerif,
  };
}

function readStoredSelection(storageKey: string, initialSelection?: Partial<GdsStoredThemePresetState>) {
  if (typeof window === 'undefined') {
    return createGdsThemePresetSelection(initialSelection);
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return createGdsThemePresetSelection(stored ? JSON.parse(stored) as Partial<GdsStoredThemePresetState> : initialSelection);
  } catch {
    return createGdsThemePresetSelection(initialSelection);
  }
}

function persistSelection(storageKey: string, selection: GdsThemePresetSelection) {
  if (typeof window === 'undefined') {
    return;
  }

  const stored: GdsStoredThemePresetState = {
    preset: selection.preset,
    colorScheme: selection.colorScheme,
    fontLane: selection.fontLane,
    runtimeKey: selection.runtimeKey,
    brandPrimary: selection.brandPrimary,
    brandFlatSurfaces: selection.brandFlatSurfaces,
    brandEditorialSerif: selection.brandEditorialSerif,
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch {
    // Runtime theme application must continue when preference storage is blocked.
  }
}

function resolveDocumentScheme(selection: GdsThemePresetSelection) {
  if (selection.colorScheme !== 'auto') {
    return selection.colorScheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const FONT_LANE_LINK_ID = 'gds-font-lane-stylesheet';
/** The only lane whose font is loaded statically by `packages/gds-theme/styles.css`. */
const STATICALLY_LOADED_LANE: GdsFontLaneId = 'inter';

/**
 * Ensures exactly one non-blocking `<link rel="stylesheet">` is present for
 * the active font lane's web font, matching each lane's declared
 * `loadStrategy: 'non-blocking-stylesheet'` (see font-lanes.ts) — added,
 * swapped, or removed as the lane changes. The default `'inter'` lane is
 * already loaded statically by the package stylesheet, so no duplicate link
 * is created for it; lanes with no `cssImportUrl` (a `'system'` source) need
 * no link at all.
 */
function applyFontLaneStylesheet(fontLaneId: GdsFontLaneId) {
  const existing = document.getElementById(FONT_LANE_LINK_ID) as HTMLLinkElement | null;

  if (fontLaneId === STATICALLY_LOADED_LANE) {
    existing?.remove();
    return;
  }

  if (existing?.getAttribute('data-gds-font-lane') === fontLaneId) {
    return;
  }

  const lane = resolveGdsFontLane(fontLaneId);
  if (!lane.cssImportUrl) {
    existing?.remove();
    return;
  }

  existing?.remove();
  const link = document.createElement('link');
  link.id = FONT_LANE_LINK_ID;
  link.rel = 'stylesheet';
  link.href = lane.cssImportUrl;
  link.setAttribute('data-gds-font-lane', lane.id);
  document.head.appendChild(link);
}

function applyDocumentRuntime(selection: GdsThemePresetSelection) {
  const documentScheme = resolveDocumentScheme(selection);
  const vibeVariables = getGdsVibeThemeCssVariables(selection.preset, documentScheme);

  document.documentElement.setAttribute('data-mantine-color-scheme', documentScheme);
  document.documentElement.setAttribute('data-gds-theme-preset', selection.preset);
  document.documentElement.setAttribute('data-gds-theme-runtime', selection.runtimeKey ?? `${selection.preset}-${selection.colorScheme}`);
  document.documentElement.setAttribute('data-gds-font-lane', selection.fontLane);
  applyFontLaneStylesheet(selection.fontLane);

  Object.entries(vibeVariables).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });

  return documentScheme;
}


/** What {@link useGdsAmbientTheme} resolves: the preset and scheme the document is actually themed by. */
export interface GdsAmbientTheme {
  preset: string;
  colorScheme: 'light' | 'dark';
}

/**
 * The ambient theme, for components that must bake resolved values.
 *
 * Most components read `var(--gds-*)` and the cascade re-resolves them on a theme switch for
 * free. A component whose output leaves the cascade — engine-injected markup (Leaflet
 * markers), SVG data URIs — must resolve concrete values, which requires knowing which theme
 * is active.
 *
 * Source of truth is the pair of attributes the runtime writes to `<html>`
 * (`data-gds-theme-preset`, `data-mantine-color-scheme`), readable under any provider that
 * owns theming. A MutationObserver keeps the value live, so a baked-value component keyed on
 * it re-renders on a theme switch. Before hydration this returns default/light, matching the
 * pre-hydration paint.
 */
function readAmbientTheme(): GdsAmbientTheme {
  if (typeof document === 'undefined') return { preset: 'default', colorScheme: 'light' };
  const html = document.documentElement;
  return {
    preset: html.getAttribute('data-gds-theme-preset') ?? 'default',
    colorScheme: html.getAttribute('data-mantine-color-scheme') === 'dark' ? 'dark' : 'light',
  };
}

export function useGdsAmbientTheme(): GdsAmbientTheme {
  const [ambient, setAmbient] = useState<GdsAmbientTheme>(readAmbientTheme);

  useEffect(() => {
    const update = () => {
      const next = readAmbientTheme();
      setAmbient((current) => (current.preset === next.preset && current.colorScheme === next.colorScheme ? current : next));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-gds-theme-preset', 'data-mantine-color-scheme'],
    });
    return () => observer.disconnect();
  }, []);

  return ambient;
}

/**
 * Client hook managing theme-preset selection: hydrates from localStorage,
 * persists changes, and (when `applyToDocument`) writes the scheme/preset/font
 * attributes and vibe CSS variables to `<html>` — reconciling `'auto'` scheme
 * with the OS preference and guarding the color-scheme attribute against
 * external mutation. Returns the selection and per-facet setters.
 */
export function useGdsThemePresetState({
  storageKey = defaultStorageKey,
  initialSelection,
  applyToDocument = true,
}: UseGdsThemePresetStateOptions = {}): UseGdsThemePresetStateResult {
  const [selection, setSelection] = useState<GdsThemePresetSelection>(() => readStoredSelection(storageKey, initialSelection));

  useEffect(() => {
    let expectedDocumentScheme: 'light' | 'dark' | undefined;
    let schemeObserver: MutationObserver | undefined;

    if (applyToDocument) {
      expectedDocumentScheme = applyDocumentRuntime(selection);

      schemeObserver = new MutationObserver(() => {
        if (
          expectedDocumentScheme
          && document.documentElement.getAttribute('data-mantine-color-scheme') !== expectedDocumentScheme
        ) {
          document.documentElement.setAttribute('data-mantine-color-scheme', expectedDocumentScheme);
        }
      });
      schemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-mantine-color-scheme'],
      });
    }

    persistSelection(storageKey, selection);

    if (!applyToDocument || selection.colorScheme !== 'auto') {
      return () => {
        schemeObserver?.disconnect();
      };
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      expectedDocumentScheme = applyDocumentRuntime(selection);
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      schemeObserver?.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [applyToDocument, selection, storageKey]);

  const setRuntimeSelection = useCallback((nextSelection: Partial<GdsStoredThemePresetState>) => {
    setSelection(createGdsThemePresetSelection(nextSelection));
  }, []);

  const setPreset = useCallback((preset: GdsThemePresetId) => {
    setSelection((current) => createGdsThemePresetSelection({ ...current, preset }));
  }, []);

  const setScheme = useCallback((colorScheme: GdsThemeScheme) => {
    setSelection((current) => createGdsThemePresetSelection({ ...current, colorScheme }));
  }, []);

  const setFontLane = useCallback((fontLane: GdsFontLaneId) => {
    setSelection((current) => createGdsThemePresetSelection({ ...current, fontLane }));
  }, []);

  const setBrandOptions = useCallback((options: Pick<GdsStoredThemePresetState, 'brandPrimary' | 'brandFlatSurfaces' | 'brandEditorialSerif'>) => {
    setSelection((current) => createGdsThemePresetSelection({ ...current, ...options }));
  }, []);

  const reset = useCallback(() => {
    setSelection(createGdsThemePresetSelection(initialSelection));
  }, [initialSelection]);

  return {
    selection,
    setSelection: setRuntimeSelection,
    setPreset,
    setScheme,
    setFontLane,
    setBrandOptions,
    reset,
  };
}
