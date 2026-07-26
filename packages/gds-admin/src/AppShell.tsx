'use client';

import type { ReactNode } from 'react';
import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import { DiscoveryShell, ThemeToggle } from '@sovereignsquad/gds-core';

/** Props for {@link AppShell}. */
export interface AppShellProps {
  /** Brand text shown in the header; defaults to "GDS". */
  logoText?: string;
  /** Legacy alias for the primary sidebar navigation; used when `primaryNavigation` is absent. */
  navLinks?: ReactNode;
  /** Primary sidebar navigation. */
  primaryNavigation?: ReactNode;
  /** Secondary ("More") sidebar navigation. */
  secondaryNavigation?: ReactNode;
  /** Account panel pinned to the foot of the sidebar. */
  accountPanel?: ReactNode;
  /** Secondary line under the logo; also increases the header height. */
  headerContext?: ReactNode;
  /** Actions rendered on the trailing edge of the header. */
  headerActions?: ReactNode;
  /** Footer content for mobile navigation. */
  mobileNavigation?: ReactNode;
  /** Render the theme toggle in the header; defaults to `true`. */
  showThemeToggle?: boolean;
  /** Main content area. */
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
