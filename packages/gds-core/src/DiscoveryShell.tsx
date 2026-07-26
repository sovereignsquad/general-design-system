'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AppShell as MantineAppShell, Box, Burger, Group, ScrollArea } from '@mantine/core';
import type { MantineBreakpoint, MantineSpacing } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { gdsBreakpointByAlias } from './breakpoints';

/** Sidebar open/close state plus imperative controls returned by `useDiscoveryShellState`. */
export interface DiscoveryShellState {
  opened: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpened: (next: boolean) => void;
}

/** Options for `useDiscoveryShellState`. */
export interface UseDiscoveryShellStateOptions {
  /** Initial open state before any stored value is read; defaults to false. */
  defaultSidebarOpen?: boolean;
  /** localStorage key used to persist and restore the sidebar open state. */
  sidebarStorageKey?: string;
  /** Called whenever the open state changes. */
  onSidebarOpenedChange?: (opened: boolean) => void;
}

/**
 * Manages sidebar open/close state for `DiscoveryShell`, optionally persisting it
 * to `localStorage` under `sidebarStorageKey` and notifying `onSidebarOpenedChange`.
 */
export function useDiscoveryShellState({
  defaultSidebarOpen = false,
  sidebarStorageKey,
  onSidebarOpenedChange,
}: UseDiscoveryShellStateOptions = {}): DiscoveryShellState {
  const [opened, setOpenedState] = useState(defaultSidebarOpen);

  useEffect(() => {
    if (!sidebarStorageKey || typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(sidebarStorageKey);
    if (stored === 'open') {
      setOpenedState(true);
    }
    if (stored === 'closed') {
      setOpenedState(false);
    }
  }, [sidebarStorageKey]);

  const persistAndNotify = (next: boolean) => {
    if (sidebarStorageKey && typeof window !== 'undefined') {
      window.localStorage.setItem(sidebarStorageKey, next ? 'open' : 'closed');
    }
    onSidebarOpenedChange?.(next);
  };

  const setOpened = (next: boolean) => {
    setOpenedState(next);
    persistAndNotify(next);
  };

  const open = () => setOpened(true);
  const close = () => setOpened(false);
  const toggle = () => {
    setOpenedState((current) => {
      const next = !current;
      persistAndNotify(next);
      return next;
    });
  };

  return { opened, open, close, toggle, setOpened };
}

/** Props for `DiscoveryShell`. */
export interface DiscoveryShellProps {
  header?: ReactNode;
  sidebar: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Accessible label for the mobile navigation toggle; defaults to "Toggle navigation". */
  mobileNavigationLabel?: string;
  defaultSidebarOpen?: boolean;
  sidebarStorageKey?: string;
  /** Controlled sidebar open state; when set, the shell defers to the caller instead of its own state. */
  sidebarOpened?: boolean;
  onSidebarOpenedChange?: (opened: boolean) => void;
  /** Keeps the sidebar sticky within the viewport; defaults to true. */
  stickySidebar?: boolean;
  /** Allows collapsing the sidebar on desktop via a burger; defaults to false. */
  desktopCollapsible?: boolean;
  /** Accessible label for the desktop sidebar toggle; defaults to "Toggle sidebar". */
  desktopNavigationLabel?: string;
  /** Sidebar width; defaults to 280. */
  sidebarWidth?: number | string;
  /** Header height; defaults to 60. */
  headerHeight?: number | string;
  /** Main-content padding; defaults to "md". */
  shellPadding?: MantineSpacing | number;
  /** Breakpoint at which the sidebar collapses into the mobile drawer; defaults to "sm". */
  collapseBreakpoint?: MantineBreakpoint;
  /** Closes the mobile drawer when a nav item is activated; defaults to true. */
  closeMobileNavigationOnItemSelect?: boolean;
}

const navigationActivationSelector = 'a[href], button, [role="menuitem"], [data-gds-nav-close]';

function isNavigationActivationTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(navigationActivationSelector));
}

/**
 * DiscoveryShell is the canonical sidebar-first application shell for GDS.
 * It owns the responsive header, sidebar, and main-content layout contract.
 */
export function DiscoveryShell({
  header,
  sidebar,
  footer,
  children,
  mobileNavigationLabel = 'Toggle navigation',
  defaultSidebarOpen = false,
  sidebarStorageKey,
  sidebarOpened,
  onSidebarOpenedChange,
  stickySidebar = true,
  desktopCollapsible = false,
  desktopNavigationLabel = 'Toggle sidebar',
  sidebarWidth = 280,
  headerHeight = 60,
  shellPadding = 'md',
  collapseBreakpoint = 'sm',
  closeMobileNavigationOnItemSelect = true,
}: DiscoveryShellProps) {
  const isMobile = useMediaQuery(`(max-width: ${gdsBreakpointByAlias[collapseBreakpoint as keyof typeof gdsBreakpointByAlias]})`);
  const shellState = useDiscoveryShellState({ defaultSidebarOpen, sidebarStorageKey, onSidebarOpenedChange });
  const opened = sidebarOpened ?? shellState.opened;
  const close = onSidebarOpenedChange ? () => onSidebarOpenedChange(false) : shellState.close;
  const toggle = onSidebarOpenedChange ? () => onSidebarOpenedChange(!opened) : shellState.toggle;
  const openMobileNavbarStyle = isMobile && opened
    ? ({
        '--app-shell-navbar-transform': 'translateX(0)',
        '--app-shell-navbar-transform-rtl': 'translateX(0)',
      } as CSSProperties)
    : undefined;

  return (
    <MantineAppShell
      header={{ height: headerHeight }}
      footer={footer ? { height: 68 } : undefined}
      navbar={{
        width: sidebarWidth,
        breakpoint: collapseBreakpoint,
        collapsed: {
          mobile: !opened,
          desktop: desktopCollapsible ? !opened : false,
        },
      }}
      padding={shellPadding}
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom={collapseBreakpoint}
            size="sm"
            aria-label={mobileNavigationLabel}
          />
          {desktopCollapsible ? (
            <Burger
              opened={opened}
              onClick={toggle}
              visibleFrom={collapseBreakpoint}
              size="sm"
              aria-label={desktopNavigationLabel}
            />
          ) : null}
          <Box style={{ flex: 1, minWidth: 0 }}>
            {header}
          </Box>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        p="md"
        data-sticky-sidebar={stickySidebar || undefined}
        data-gds-mobile-navbar-open={isMobile && opened ? 'true' : undefined}
        style={openMobileNavbarStyle}
        onClickCapture={(event) => {
          if (closeMobileNavigationOnItemSelect && opened && isMobile && isNavigationActivationTarget(event.target)) {
            close();
          }
        }}
      >
        <ScrollArea h="100%" type="auto">
          <Box
            h="100%"
            style={
              stickySidebar
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                  }
                : undefined
            }
          >
            {sidebar}
          </Box>
        </ScrollArea>
      </MantineAppShell.Navbar>

      {footer ? (
        <MantineAppShell.Footer>
          <Group h="100%" px="md" justify="space-around" wrap="nowrap">
            {footer}
          </Group>
        </MantineAppShell.Footer>
      ) : null}

      <MantineAppShell.Main onClick={() => {
        if (isMobile) {
          close();
        }
      }}
      >
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
