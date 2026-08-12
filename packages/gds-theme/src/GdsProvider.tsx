'use client';

import React, { useEffect, useMemo } from 'react';
import type { MantineThemeOverride } from '@mantine/core';
import { MantineProvider, DirectionProvider, Box, useComputedColorScheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { gdsTheme } from './theme';
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
   * Overlay engine adapter (issue #349). Defaults to the Mantine-backed adapter.
   * Provide a custom adapter to swap the overlay engine without changing any
   * consumer code or component API.
   */
  overlayAdapter?: OverlayAdapter;
  /**
   * Ambient badge glyph mode for `GdsBadge`/`GdsMapPinBadge` (issue #525).
   * Defaults to `'tabler'` — every existing consumer's current behavior,
   * unchanged. Set to `'emoji'` to switch every badge whose category has
   * an emoji to render it, with badges lacking one falling back to their
   * Tabler icon automatically. Individual badges can still override this
   * locally via their own `iconStyle` prop.
   */
  defaultBadgeIconStyle?: GdsBadgeIconStyle;
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
 * Fixes a real bug (issue 533): the theme object's own CSS variables were
 * applied to `GdsProvider`'s wrapper as an inline style with BOTH the light
 * and `-dark` variants set as literal, unrelated custom properties — nothing
 * ever picked the dark one. Any CSS rule referencing the base name (e.g.
 * `color: var(--gds-text-body)`) always got the light-mode value, baked in
 * as an inline style that beats any external stylesheet rule — even when
 * `defaultColorScheme="dark"` (or a live scheme toggle) was active. That was
 * invisible for the default theme (its `other.gdsCssVariables` doesn't
 * define these semantic-role tokens, so CSS's own `light-dark()` default in
 * styles.css took over correctly) but broke every brand theme with a
 * hand-authored dark variant — Class USA and Gold Athlete — producing
 * near-invisible navy-on-navy / near-black-on-near-black text on cards,
 * badges, and links in dark mode.
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
 * LIVE, reactive color scheme (via `useComputedColorScheme`, same hook
 * `ThemeToggle` uses) — must be a separate component nested under
 * `MantineProvider` so the hook has its context, and so it re-resolves
 * whenever the scheme changes (a toggle click, not just a fresh page load).
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
}: GdsProviderProps) {
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
        <GdsIconStyleContext.Provider value={{ badgeIconStyle: defaultBadgeIconStyle }}>
          <MantineProvider
            theme={theme}
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
