'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { MantineThemeOverride } from '@mantine/core';
import { MantineProvider, DirectionProvider, Box, useComputedColorScheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { gdsTheme, withGdsGovernedVariants } from './theme';
import { computeGdsThemeIdentity, gdsThemeIdentityChanged, type GdsThemeApplicationMode, type GdsThemeIdentity } from './theme-identity';
import { GdsI18nContext, isGdsRtlLocale } from './i18n';
import { GdsIconStyleContext, type GdsBadgeIconStyle } from './icon-style';
import { OverlayAdapterProvider, mantineOverlayAdapter, type OverlayAdapter } from './overlay-adapter';

/** Props for `GdsProvider`, the single required root provider. */
export interface GdsProviderProps {
  children: React.ReactNode;
  /** Active locale id; drives translations and text direction. Defaults to `'en'`. */
  locale?: string;
  /** Translation dictionary keyed by message id. */
  messages?: Record<string, string>;
  /** Mantine theme override to apply. Defaults to `gdsTheme`. */
  theme?: MantineThemeOverride;
  /** Initial color scheme. Defaults to `'light'`. */
  defaultColorScheme?: 'light' | 'dark' | 'auto';
  /** Pins the color scheme, overriding `defaultColorScheme` and any toggle. */
  forceColorScheme?: 'light' | 'dark';
  /** Returns the element the color-scheme attribute is written to. Defaults to `<html>`. */
  colorSchemeRootElement?: () => HTMLElement | undefined;
  /** CSS selector Mantine emits its theme variables under. Defaults to `':root'`. */
  cssVariablesSelector?: string;
  /** When `true` (default), sets `data-mantine-color-scheme` on the document root. */
  applyDocumentColorScheme?: boolean;
  /**
   * Overlay engine adapter. Defaults to the Mantine-backed adapter.
   * Provide a custom adapter to swap the overlay engine without changing any
   * consumer code or component API.
   */
  overlayAdapter?: OverlayAdapter;
  /**
   * Ambient badge glyph mode for `GdsBadge`/`GdsMapPinBadge`.
   * Defaults to `'tabler'`. Set to `'emoji'` to render an emoji icon for
   * badge categories that have one; categories without one fall back to
   * their Tabler icon. Individual badges can override via `iconStyle`.
   */
  defaultBadgeIconStyle?: GdsBadgeIconStyle;
  /**
   * How a theme change is applied. Defaults to `remount`: the themed subtree is
   * keyed on the theme identity, so values read outside the CSS cascade are re-created rather
   * than left holding the previous theme.
   */
  themeApplicationMode?: GdsThemeApplicationMode;
  /** Convenience alias for `themeApplicationMode: 'reload'`. */
  reloadOnThemeChange?: boolean;
  /** Called BEFORE re-application, so a consumer can persist state that would not survive it. */
  onBeforeThemeApply?: (next: GdsThemeIdentity, previous: GdsThemeIdentity) => void;
  /** Called after re-application completes. */
  onAfterThemeApply?: (identity: GdsThemeIdentity) => void;
}

type GdsMantineColorScheme = 'light' | 'dark' | 'auto';

interface GdsMantineColorSchemeManager {
  get: (defaultValue: GdsMantineColorScheme) => GdsMantineColorScheme;
  set: (value: GdsMantineColorScheme) => void;
  subscribe: (onUpdate: (colorScheme: GdsMantineColorScheme) => void) => void;
  unsubscribe: () => void;
  clear: () => void;
}

function resolveDocumentColorScheme(colorScheme: GdsMantineColorScheme) {
  if (colorScheme !== 'auto') {
    return colorScheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getThemeOwnedCssVariables(theme: MantineThemeOverride): Record<string, string> {
  const variables = (theme as { other?: { gdsCssVariables?: unknown } }).other?.gdsCssVariables;
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
    return {};
  }

  return Object.entries(variables as Record<string, unknown>).reduce<Record<string, string>>((acc, [property, value]) => {
    if (property.startsWith('--gds-') && typeof value === 'string') {
      acc[property] = value;
    }
    return acc;
  }, {});
}

/**
 * Collapses a flat `{ '--gds-foo': lightValue, '--gds-foo-dark': darkValue }`
 * pair (the shape `createBrandTheme`/`getThemeOwnedCssVariables` emit) onto a
 * single active value per base property name, for the given resolved scheme.
 *
 * Without this, both variants are set as literal inline-style properties and
 * neither shadows the other, so a rule reading the base name (e.g.
 * `color: var(--gds-text-body)`) always gets the light value regardless of
 * the active color scheme.
 */
function resolveSchemeCssVariables(variables: Record<string, string>, colorScheme: 'light' | 'dark'): Record<string, string> {
  if (colorScheme !== 'dark') {
    return variables;
  }

  const resolved: Record<string, string> = { ...variables };
  Object.entries(variables).forEach(([property, value]) => {
    if (property.endsWith('-dark')) {
      resolved[property.slice(0, -'-dark'.length)] = value;
    }
  });
  return resolved;
}

/**
 * Renders the themed wrapper `Box` with `variables` resolved against the
 * live color scheme via `useComputedColorScheme`. Must be nested under
 * `MantineProvider` for the hook's context, so it re-resolves on scheme change.
 */
function GdsThemeVariablesScope({ variables, dir, children }: { variables: Record<string, string>; dir: 'ltr' | 'rtl'; children: React.ReactNode }) {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const resolvedVariables = useMemo(() => resolveSchemeCssVariables(variables, computedColorScheme), [variables, computedColorScheme]);

  return (
    <Box
      dir={dir}
      mih="100vh"
      h="100%"
      bg="var(--mantine-color-body)"
      c="var(--mantine-color-text)"
      style={{ ...resolvedVariables, transition: 'background-color var(--gds-motion-duration-fast) var(--gds-motion-ease-standard), color var(--gds-motion-duration-fast) var(--gds-motion-ease-standard)' }}
    >
      {children}
    </Box>
  );
}

/**
 * GdsProvider is the single required root provider for any application
 * adopting the General Design System. It injects the strict Mantine theme.
 */
export function GdsProvider({
  children,
  locale = 'en',
  messages = {},
  theme = gdsTheme,
  defaultColorScheme = 'light',
  forceColorScheme,
  colorSchemeRootElement,
  cssVariablesSelector = ':root',
  applyDocumentColorScheme = true,
  overlayAdapter = mantineOverlayAdapter,
  defaultBadgeIconStyle = 'tabler',
  themeApplicationMode = 'remount',
  reloadOnThemeChange = false,
  onBeforeThemeApply,
  onAfterThemeApply,
}: GdsProviderProps) {
  // One identity over every themed input, hashed from the resolved tokens: two declarations
  // that render identically do not remount; a change to any axis does.
  const themeIdentity = useMemo(
    () => computeGdsThemeIdentity({
      preset: (theme as { other?: { gdsPresetId?: string } }).other?.gdsPresetId ?? 'default',
      colorScheme: resolveDocumentColorScheme(forceColorScheme ?? defaultColorScheme),
    }),
    [theme, forceColorScheme, defaultColorScheme],
  );
  const mode: GdsThemeApplicationMode = reloadOnThemeChange ? 'reload' : themeApplicationMode;
  const previousIdentity = useRef<string | undefined>(undefined);

  useEffect(() => {
    const previous = previousIdentity.current;
    previousIdentity.current = themeIdentity;
    if (!gdsThemeIdentityChanged(previous, themeIdentity)) return;

    // Runs before re-application so the consumer can persist state that would not survive it.
    onBeforeThemeApply?.(themeIdentity, previous as string);

    if (mode === 'reload' && typeof window !== 'undefined') {
      // Full reload: the only way to guarantee application on a surface that cannot re-read
      // a theme (third-party canvas, embedded engine).
      window.location.reload();
      return;
    }
    onAfterThemeApply?.(themeIdentity);
  }, [themeIdentity, mode, onBeforeThemeApply, onAfterThemeApply]);
  const isRtl = isGdsRtlLocale(locale);
  const dir = isRtl ? 'rtl' : 'ltr';
  const themeCssVariables = useMemo(() => getThemeOwnedCssVariables(theme), [theme]);
  const colorSchemeManager = useMemo<GdsMantineColorSchemeManager>(() => ({
    get: (fallback) => forceColorScheme ?? defaultColorScheme ?? fallback,
    set: (value) => {
      (colorSchemeRootElement?.() ?? document.documentElement).setAttribute('data-mantine-color-scheme', resolveDocumentColorScheme(value));
    },
    subscribe: () => {},
    unsubscribe: () => {},
    clear: () => {
      (colorSchemeRootElement?.() ?? document.documentElement).setAttribute('data-mantine-color-scheme', resolveDocumentColorScheme(defaultColorScheme));
    },
  }), [colorSchemeRootElement, defaultColorScheme, forceColorScheme]);

  useEffect(() => {
    if (!applyDocumentColorScheme) {
      return;
    }

    const requestedScheme = forceColorScheme ?? defaultColorScheme;
    document.documentElement.setAttribute('data-mantine-color-scheme', resolveDocumentColorScheme(requestedScheme));
  }, [applyDocumentColorScheme, defaultColorScheme, forceColorScheme]);

  useEffect(() => {
    const root = colorSchemeRootElement?.() ?? document.documentElement;
    const entries = Object.entries(themeCssVariables);
    entries.forEach(([property, value]) => root.style.setProperty(property, value));

    return () => {
      entries.forEach(([property]) => root.style.removeProperty(property));
    };
  }, [colorSchemeRootElement, themeCssVariables]);
  
  return (
    <DirectionProvider initialDirection={dir}>
      <GdsI18nContext.Provider value={{ locale, messages }}>
        {/*
          The remount does not wrap the whole provider subtree — keying everything under
          GdsProvider would reset the state of any theme control inside it. Full
          re-application is opt-in per subtree via `GdsThemeBoundary`; `reload` remains
          available when that is not enough.
        */}
        <GdsIconStyleContext.Provider value={{ badgeIconStyle: defaultBadgeIconStyle }}>
          <MantineProvider
            /* Light variant governed here, not on the theme object — a caller-supplied
               theme would otherwise drop it silently. */
            theme={withGdsGovernedVariants(theme)}
            withCssVariables
            withGlobalClasses
            colorSchemeManager={colorSchemeManager}
            defaultColorScheme={defaultColorScheme}
            forceColorScheme={forceColorScheme}
            getRootElement={colorSchemeRootElement}
            cssVariablesSelector={cssVariablesSelector}
          >
            <ModalsProvider>
              <OverlayAdapterProvider adapter={overlayAdapter}>
                <Notifications />
                <GdsThemeVariablesScope variables={themeCssVariables} dir={dir}>
                  {children}
                </GdsThemeVariablesScope>
              </OverlayAdapterProvider>
            </ModalsProvider>
          </MantineProvider>
        </GdsIconStyleContext.Provider>
      </GdsI18nContext.Provider>
    </DirectionProvider>
  );
}
