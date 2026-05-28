'use client';

import type { ReactNode } from 'react';
import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import { DiscoveryShell, ThemeToggle } from '@doneisbetter/gds-core';

export interface AppShellProps {
  logoText?: string;
  navLinks?: ReactNode;
  primaryNavigation?: ReactNode;
  secondaryNavigation?: ReactNode;
  accountPanel?: ReactNode;
  headerContext?: ReactNode;
  headerActions?: ReactNode;
  mobileNavigation?: ReactNode;
  showThemeToggle?: boolean;
  children: ReactNode;
}

/**
 * AppShell provides the standard GDS application layout.
 * It strictly controls the header, sidebar, and main content area.
 */
export function AppShell({
  logoText = 'GDS',
  navLinks,
  primaryNavigation,
  secondaryNavigation,
  accountPanel,
  headerContext,
  headerActions,
  mobileNavigation,
  showThemeToggle = true,
  children,
}: AppShellProps) {
  const primaryNav = primaryNavigation ?? navLinks;

  return (
    <DiscoveryShell
      headerHeight={headerContext ? 72 : 60}
      header={(
        <Group h="100%" justify="space-between" align="center" wrap="nowrap">
          <Group wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Title order={3} lineClamp={1}>
                {logoText}
              </Title>
              {headerContext ? (
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {headerContext}
                </Text>
              ) : null}
            </Stack>
          </Group>
          <Group wrap="nowrap">
            {headerActions}
            {showThemeToggle ? <ThemeToggle /> : null}
          </Group>
        </Group>
      )}
      sidebar={(
        <Stack gap="md" h="100%">
            {primaryNav ? (
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed">
                  Primary
                </Text>
                {primaryNav}
              </Stack>
            ) : null}
            {secondaryNavigation ? (
              <>
                <Divider />
                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    More
                  </Text>
                  {secondaryNavigation}
                </Stack>
              </>
            ) : null}
          {accountPanel ? (
              <>
                <Divider mt="auto" />
                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    Account
                  </Text>
                  {accountPanel}
                </Stack>
              </>
            ) : null}
        </Stack>
      )}
      footer={mobileNavigation}
    >
      {children}
    </DiscoveryShell>
  );
}
