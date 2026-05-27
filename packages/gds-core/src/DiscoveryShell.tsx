'use client';

import type { ReactNode } from 'react';
import { AppShell as MantineAppShell, Box, Burger, Group, ScrollArea } from '@mantine/core';
import type { MantineBreakpoint, MantineSpacing } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export interface DiscoveryShellProps {
  header?: ReactNode;
  sidebar: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  mobileNavigationLabel?: string;
  defaultSidebarOpen?: boolean;
  stickySidebar?: boolean;
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
  stickySidebar = true,
  sidebarWidth = 280,
  headerHeight = 60,
  shellPadding = 'md',
  collapseBreakpoint = 'sm',
}: DiscoveryShellProps) {
  const [opened, { toggle, close }] = useDisclosure(defaultSidebarOpen);

  return (
    <MantineAppShell
      header={{ height: headerHeight }}
      footer={footer ? { height: 68 } : undefined}
      navbar={{
        width: sidebarWidth,
        breakpoint: collapseBreakpoint,
        collapsed: { mobile: !opened },
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

      <MantineAppShell.Main onClick={() => close()}>
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
