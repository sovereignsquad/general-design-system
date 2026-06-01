'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AppShell as MantineAppShell, Box, Burger, Group, ScrollArea } from '@mantine/core';
import type { MantineBreakpoint, MantineSpacing } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export interface DiscoveryShellState {
  opened: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpened: (next: boolean) => void;
}

export interface UseDiscoveryShellStateOptions {
  defaultSidebarOpen?: boolean;
  sidebarStorageKey?: string;
  onSidebarOpenedChange?: (opened: boolean) => void;
}

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

export interface DiscoveryShellProps {
  header?: ReactNode;
  sidebar: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  mobileNavigationLabel?: string;
  defaultSidebarOpen?: boolean;
  sidebarStorageKey?: string;
  sidebarOpened?: boolean;
  onSidebarOpenedChange?: (opened: boolean) => void;
  stickySidebar?: boolean;
  desktopCollapsible?: boolean;
  desktopNavigationLabel?: string;
  sidebarWidth?: number | string;
  headerHeight?: number | string;
  shellPadding?: MantineSpacing | number;
  collapseBreakpoint?: MantineBreakpoint;
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
}: DiscoveryShellProps) {
  const breakpointByAlias: Record<MantineBreakpoint, string> = {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  };
  const isMobile = useMediaQuery(`(max-width: ${breakpointByAlias[collapseBreakpoint]})`);
  const shellState = useDiscoveryShellState({ defaultSidebarOpen, sidebarStorageKey, onSidebarOpenedChange });
  const opened = sidebarOpened ?? shellState.opened;
  const close = onSidebarOpenedChange ? () => onSidebarOpenedChange(false) : shellState.close;
  const toggle = onSidebarOpenedChange ? () => onSidebarOpenedChange(!opened) : shellState.toggle;

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

      <MantineAppShell.Navbar p="md" data-sticky-sidebar={stickySidebar || undefined}>
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
