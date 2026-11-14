'use client';

import type { ReactNode } from 'react';
import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import { DiscoveryShell, ThemeToggle } from '@sovereignsquad/gds-core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** Props for {@link AppShell}. */
export interface AppShellProps {
  /** Brand text shown in the header; defaults to "GDS". */
  logoText?: string;
  /** Legacy alias for `primaryNavigation`; used only when `primaryNavigation` is absent. */
  navLinks?: ReactNode;
  /**
   * Primary sidebar navigation: a `SidebarNav` with `SidebarNavSection`s and `SidebarNavItem`s.
   * Each item takes `href` for a route or `component="button"` for a view-state switch. It renders
   * under the `primaryHeading` (default: the `gds.appShell.primaryHeading` message, "Primary")
   * inside the shell's unlabelled navbar `<nav>`, so the
   * `SidebarNav` is a second, labelled `<nav>`; set its `ariaLabel` when the default label does not
   * describe the region.
   */
  primaryNavigation?: ReactNode;
  /**
   * Secondary sidebar navigation under the `secondaryHeading` (default: the
   * `gds.appShell.secondaryHeading` message, "More"): a `SidebarNav` whose `ariaLabel` differs
   * from the primary one.
   */
  secondaryNavigation?: ReactNode;
  /** Account panel pinned to the foot of the sidebar, under the `accountHeading` (default: the `gds.appShell.accountHeading` message, "Account"). */
  accountPanel?: ReactNode;
  /** Heading over `primaryNavigation`; defaults to the localized `gds.appShell.primaryHeading` message. */
  primaryHeading?: ReactNode;
  /** Heading over `secondaryNavigation`; defaults to the localized `gds.appShell.secondaryHeading` message. */
  secondaryHeading?: ReactNode;
  /** Heading over `accountPanel`; defaults to the localized `gds.appShell.accountHeading` message. */
  accountHeading?: ReactNode;
  /** Secondary line under the logo; also increases the header height. */
  headerContext?: ReactNode;
  /** Actions rendered on the trailing edge of the header. */
  headerActions?: ReactNode;
  /** Footer content for mobile navigation. */
  mobileNavigation?: ReactNode;
  /**
   * Render the built-in theme toggle in the header; defaults to `true`. The built-in toggle passes
   * no `onColorSchemeChange`, so the user's choice is lost on reload, and under `GdsProvider`
   * `forceColorScheme` it renders but does nothing. Set `false` for a single-scheme or OS-following
   * product; for a persisted choice, set `false` and put `<ThemeToggle onColorSchemeChange={…} />`
   * in `headerActions`. See THEME_GOVERNANCE.md, "Colour scheme".
   */
  showThemeToggle?: boolean;
  /** Main content area. */
  children: ReactNode;
}

/**
 * AppShell provides the standard GDS application layout.
 * It strictly controls the header, sidebar, and main content area.
 *
 * Built on `DiscoveryShell`. Below the collapse breakpoint the sidebar is a drawer that closes
 * when a click lands on, or inside, a link with `href`, a `button`, a `role="menuitem"` element or
 * an element marked `data-gds-nav-close` (`navigationActivationSelector` in `DiscoveryShell.tsx`).
 * `closeMobileNavigationOnItemSelect` is not forwarded, so the drawer always closes on select.
 * `data-gds-nav-close` is for custom non-navigating controls; it does not make an `<a>` without
 * `href` keyboard-reachable.
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
  primaryHeading,
  secondaryHeading,
  accountHeading,
  children,
}: AppShellProps) {
  const { t } = useGdsTranslation();
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
                  {primaryHeading ?? t('gds.appShell.primaryHeading', 'Primary')}
                </Text>
                {primaryNav}
              </Stack>
            ) : null}
            {secondaryNavigation ? (
              <>
                <Divider />
                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    {secondaryHeading ?? t('gds.appShell.secondaryHeading', 'More')}
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
                    {accountHeading ?? t('gds.appShell.accountHeading', 'Account')}
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
