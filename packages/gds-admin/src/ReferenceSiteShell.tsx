'use client';

import type { ReactNode } from 'react';
import { Button, Group, Menu, Stack } from '@mantine/core';
import { IconChevronDown, IconLanguage } from '@tabler/icons-react';
import { AccentPanel, ThemeToggle } from '@sovereignsquad/gds-core';
import { AppShell } from './AppShell';

/** A selectable locale in the {@link ReferenceSiteShell} language menu. */
export interface ReferenceSiteLocaleOption {
  /** Locale identifier (e.g. a BCP-47 tag). */
  id: string;
  /** Human-readable locale label. */
  label: string;
}

/** Props for {@link ReferenceSiteShell}. */
export interface ReferenceSiteShellProps {
  /** Brand text; defaults to "General Design System". */
  logoText?: string;
  /** Secondary header line under the logo. */
  headerContext: ReactNode;
  /** Primary sidebar navigation. */
  primaryNavigation: ReactNode;
  /** Secondary sidebar navigation. */
  secondaryNavigation?: ReactNode;
  /** Currently active locale id. */
  locale: string;
  /** Available locales for the language menu. */
  localeOptions: ReferenceSiteLocaleOption[];
  /** Called with the chosen locale id when a menu item is selected. */
  onLocaleChange: (locale: string) => void;
  /** Localization status notice; strings render inside an amber `AccentPanel`. */
  localizationNotice?: ReactNode;
  /** Main content area. */
  children: ReactNode;
}

/**
 * Reference-site variant of {@link AppShell} that swaps the theme toggle for a
 * language menu (driving `onLocaleChange`) and can surface a localization
 * status notice above the content.
 */
export function ReferenceSiteShell({
  logoText = 'General Design System',
  headerContext,
  primaryNavigation,
  secondaryNavigation,
  locale,
  localeOptions,
  onLocaleChange,
  localizationNotice,
  children,
}: ReferenceSiteShellProps) {
  const activeLocale = localeOptions.find((option) => option.id === locale) ?? localeOptions[0];

  return (
    <AppShell
      logoText={logoText}
      primaryNavigation={primaryNavigation}
      secondaryNavigation={secondaryNavigation}
      headerContext={headerContext}
      showThemeToggle={false}
      headerActions={(
        <Group gap="sm">
          <Menu position="bottom-end" withArrow>
            <Menu.Target>
              <Button
                variant="light"
                radius="md"
                leftSection={<IconLanguage size="1.1rem" />}
                rightSection={<IconChevronDown size="0.95rem" />}
              >
                {activeLocale?.label ?? 'Language'}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {localeOptions.map((option) => (
                <Menu.Item key={option.id} onClick={() => onLocaleChange(option.id)}>
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <ThemeToggle />
        </Group>
      )}
    >
      <Stack gap="md">
        {localizationNotice ? (
          typeof localizationNotice === 'string' ? (
            <AccentPanel tone="amber" variant="soft-outline" title="Localization status" badge={activeLocale?.label ?? locale}>
              {localizationNotice}
            </AccentPanel>
          ) : (
            localizationNotice
          )
        ) : null}
        {children}
      </Stack>
    </AppShell>
  );
}
