'use client';

import type { ReactNode } from 'react';
import { AppShell as MantineAppShell, Burger, Group, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ThemeToggle } from '@gds/core';

export interface AppShellProps {
  logoText?: string;
  navLinks: ReactNode;
  headerActions?: ReactNode;
  mobileNavigation?: ReactNode;
  children: ReactNode;
}

/**
 * AppShell provides the standard GDS application layout.
 * It strictly controls the header, sidebar, and main content area.
 */
export function AppShell({ logoText = 'GDS', navLinks, headerActions, mobileNavigation, children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      footer={mobileNavigation ? { height: 68 } : undefined}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>{logoText}</Title>
          </Group>
          <Group>
            {headerActions}
            <ThemeToggle />
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <Stack gap="xs">
          {navLinks}
        </Stack>
      </MantineAppShell.Navbar>

      {mobileNavigation ? (
        <MantineAppShell.Footer>
          <Group h="100%" px="md" justify="space-around" wrap="nowrap">
            {mobileNavigation}
          </Group>
        </MantineAppShell.Footer>
      ) : null}

      <MantineAppShell.Main>
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
