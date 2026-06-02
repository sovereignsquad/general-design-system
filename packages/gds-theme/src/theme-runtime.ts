'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MantineThemeOverride } from '@mantine/core';
import { applyGdsFontLane, isGdsFontLaneId, type GdsFontLaneId } from './font-lanes';
import { getGdsThemePresets, resolveGdsThemePreset, type GdsThemePresetId } from './theme-presets';
import { getGdsVibeThemeCssVariables } from './vibe-themes';

export type GdsThemeScheme = 'light' | 'dark' | 'auto';

export interface GdsStoredThemePresetState {
  preset: GdsThemePresetId;
  colorScheme: GdsThemeScheme;
  fontLane: GdsFontLaneId;
  runtimeKey?: string;
  brandPrimary?: string;
  brandFlatSurfaces?: boolean;
  brandEditorialSerif?: boolean;
}

export interface GdsThemePresetSelection extends GdsStoredThemePresetState {
  theme: MantineThemeOverride;
}

export interface UseGdsThemePresetStateOptions {
  storageKey?: string;
  initialSelection?: Partial<GdsStoredThemePresetState>;
  applyToDocument?: boolean;
}

export interface UseGdsThemePresetStateResult {
  selection: GdsThemePresetSelection;
  setSelection: (selection: Partial<GdsStoredThemePresetState>) => void;
  setPreset: (preset: GdsThemePresetId) => void;
  setScheme: (scheme: GdsThemeScheme) => void;
  setFontLane: (fontLane: GdsFontLaneId) => void;
  setBrandOptions: (options: Pick<GdsStoredThemePresetState, 'brandPrimary' | 'brandFlatSurfaces' | 'brandEditorialSerif'>) => void;
  reset: () => void;
}

const defaultStorageKey = 'gds-theme-preset-selection';

function isThemePresetId(value: unknown): value is GdsThemePresetId {
  return typeof value === 'string' && getGdsThemePresets().some((preset) => preset.id === value);
}

function isScheme(value: unknown): value is GdsThemeScheme {
  return value === 'light' || value === 'dark' || value === 'auto';
}

function resolveEffectiveScheme(preset: GdsThemePresetId, colorScheme: GdsThemeScheme): GdsThemeScheme {
  if (preset === 'dark-public' || preset === 'neon-night' || preset === 'cosmic') {
    return 'dark';
  }

  return colorScheme;
}

export function createGdsThemePresetSelection(stored: Partial<GdsStoredThemePresetState> = {}): GdsThemePresetSelection {
  const preset = isThemePresetId(stored.preset) ? stored.preset : 'default';
  const requestedColorScheme = isScheme(stored.colorScheme) ? stored.colorScheme : 'light';
  const colorScheme = resolveEffectiveScheme(preset, requestedColorScheme);
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

function applyDocumentRuntime(selection: GdsThemePresetSelection) {
  const documentScheme = resolveDocumentScheme(selection);
  const vibeVariables = getGdsVibeThemeCssVariables(selection.preset, documentScheme);

  document.documentElement.setAttribute('data-mantine-color-scheme', documentScheme);
  document.documentElement.setAttribute('data-gds-theme-preset', selection.preset);
  document.documentElement.setAttribute('data-gds-theme-runtime', selection.runtimeKey ?? `${selection.preset}-${selection.colorScheme}`);
  document.documentElement.setAttribute('data-gds-font-lane', selection.fontLane);

  Object.entries(vibeVariables).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
}

export function useGdsThemePresetState({
  storageKey = defaultStorageKey,
  initialSelection,
  applyToDocument = true,
}: UseGdsThemePresetStateOptions = {}): UseGdsThemePresetStateResult {
  const [selection, setSelection] = useState<GdsThemePresetSelection>(() => readStoredSelection(storageKey, initialSelection));

  useEffect(() => {
    if (applyToDocument) {
      applyDocumentRuntime(selection);
    }

    persistSelection(storageKey, selection);

    if (!applyToDocument || selection.colorScheme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyDocumentRuntime(selection);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
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
