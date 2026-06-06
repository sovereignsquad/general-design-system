'use client';

import React from 'react';
import type { MantineThemeOverride } from '@mantine/core';
import { MantineProvider, DirectionProvider, Box } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { gdsTheme } from './theme';
import { GdsI18nContext, isGdsRtlLocale } from './i18n';

export interface GdsProviderProps {
  children: React.ReactNode;
  locale?: string;
  messages?: Record<string, string>;
  theme?: MantineThemeOverride;
  defaultColorScheme?: 'light' | 'dark' | 'auto';
  forceColorScheme?: 'light' | 'dark';
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
}: GdsProviderProps) {
  const isRtl = isGdsRtlLocale(locale);
  const dir = isRtl ? 'rtl' : 'ltr';
  
  return (
    <DirectionProvider initialDirection={dir}>
      <GdsI18nContext.Provider value={{ locale, messages }}>
        <MantineProvider
          theme={theme}
          withCssVariables
          withGlobalClasses
          defaultColorScheme={defaultColorScheme}
          forceColorScheme={forceColorScheme}
        >
          <ModalsProvider>
            <>
              <Notifications />
              <Box
                dir={dir}
                mih="100vh"
                h="100%"
                bg="var(--mantine-color-body)"
                c="var(--mantine-color-text)"
                style={{ transition: 'background-color 120ms ease, color 120ms ease' }}
              >
                {children}
              </Box>
            </>
          </ModalsProvider>
        </MantineProvider>
      </GdsI18nContext.Provider>
    </DirectionProvider>
  );
}
