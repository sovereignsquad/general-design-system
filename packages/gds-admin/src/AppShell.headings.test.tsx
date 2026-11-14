import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { de } from '@sovereignsquad/gds-core';
import { renderWithGds } from '../../../test-utils/render';
import { AppShell } from './AppShell';

const nav = <span>nav</span>;

describe('AppShell section headings (#955)', () => {
  it('come from GDS messages in the active locale', () => {
    renderWithGds(
      <AppShell primaryNavigation={nav} secondaryNavigation={nav} accountPanel={nav}>content</AppShell>,
      { locale: 'de', messages: de as Record<string, string> },
    );
    expect(screen.getByText(de['gds.appShell.primaryHeading' as keyof typeof de] as string)).toBeTruthy();
    expect(screen.getByText(de['gds.appShell.secondaryHeading' as keyof typeof de] as string)).toBeTruthy();
    expect(screen.getByText(de['gds.appShell.accountHeading' as keyof typeof de] as string)).toBeTruthy();
    expect(screen.queryByText('Primary')).toBeNull();
  });

  it('accept prop overrides', () => {
    renderWithGds(
      <AppShell primaryNavigation={nav} secondaryNavigation={nav} accountPanel={nav} primaryHeading="Workspace" secondaryHeading="Tools" accountHeading="You">content</AppShell>,
    );
    expect(screen.getByText('Workspace')).toBeTruthy();
    expect(screen.getByText('Tools')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
  });
});
