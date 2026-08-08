'use client';

import React, { useEffect, useMemo } from 'react';
import type { MantineThemeOverride } from '@mantine/core';
import { MantineProvider, DirectionProvider, Box } from '@mantine/core';
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
                <Box
                  dir={dir}
                  mih="100vh"
                  h="100%"
                  bg="var(--mantine-color-body)"
                  c="var(--mantine-color-text)"
                  style={{ ...themeCssVariables, transition: 'background-color 120ms ease, color 120ms ease' }}
                >
                  {children}
                </Box>
              </OverlayAdapterProvider>
            </ModalsProvider>
          </MantineProvider>
        </GdsIconStyleContext.Provider>
      </GdsI18nContext.Provider>
    </DirectionProvider>
  );
}
