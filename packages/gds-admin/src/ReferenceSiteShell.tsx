'use client';

import type { ReactNode } from 'react';
import { Button, Group, Menu, Stack } from '@mantine/core';
import { IconChevronDown, IconLanguage } from '@tabler/icons-react';
import { AccentPanel, ThemeToggle } from '@doneisbetter/gds-core';
import { AppShell } from './AppShell';

export interface ReferenceSiteLocaleOption {
  id: string;
  label: string;
}

export interface ReferenceSiteShellProps {
  logoText?: string;
  headerContext: ReactNode;
  primaryNavigation: ReactNode;
  secondaryNavigation?: ReactNode;
  locale: string;
  localeOptions: ReferenceSiteLocaleOption[];
  onLocaleChange: (locale: string) => void;
  localizationNotice?: ReactNode;
  children: ReactNode;
}

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
