import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GdsProvider } from '@doneisbetter/gds-theme';
import { en } from '@doneisbetter/gds-core';

interface TestProvidersProps {
  children: React.ReactNode;
  route?: string;
  locale?: string;
  messages?: Record<string, string>;
}

function TestProviders({
  children,
  route = '/',
  locale = 'en',
  messages = en,
}: TestProvidersProps) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <GdsProvider locale={locale} messages={messages}>
        {children}
      </GdsProvider>
    </MemoryRouter>
  );
}

interface RenderWithGdsOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  locale?: string;
  messages?: Record<string, string>;
}

export function renderWithGds(ui: React.ReactElement, options: RenderWithGdsOptions = {}) {
  const { route, locale, messages, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route} locale={locale} messages={messages}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}
