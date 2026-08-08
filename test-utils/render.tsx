import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GdsProvider } from '@sovereignsquad/gds-theme';
import type { GdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import { en, GdsTourProvider } from '@sovereignsquad/gds-core';

interface TestProvidersProps {
  children: React.ReactNode;
  route?: string;
  locale?: string;
  messages?: Record<string, string>;
  defaultBadgeIconStyle?: GdsBadgeIconStyle;
}

function TestProviders({
  children,
  route = '/',
  locale = 'en',
  messages = en,
  defaultBadgeIconStyle,
}: TestProvidersProps) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <GdsProvider locale={locale} messages={messages} defaultBadgeIconStyle={defaultBadgeIconStyle}>
        <GdsTourProvider>{children}</GdsTourProvider>
      </GdsProvider>
    </MemoryRouter>
  );
}

interface RenderWithGdsOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  locale?: string;
  messages?: Record<string, string>;
  /** Passed through to `GdsProvider` — set `'emoji'` to test the ambient badge glyph mode (issue #525). */
  defaultBadgeIconStyle?: GdsBadgeIconStyle;
}

export function renderWithGds(ui: React.ReactElement, options: RenderWithGdsOptions = {}) {
  const { route, locale, messages, defaultBadgeIconStyle, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route} locale={locale} messages={messages} defaultBadgeIconStyle={defaultBadgeIconStyle}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}
