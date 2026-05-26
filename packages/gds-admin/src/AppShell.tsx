'use client';

import type { ReactNode } from 'react';
import { AppShell as MantineAppShell, Burger, Divider, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ThemeToggle } from '@doneisbetter/gds-core';

export interface AppShellProps {
  logoText?: string;
  navLinks?: ReactNode;
  primaryNavigation?: ReactNode;
  secondaryNavigation?: ReactNode;
  accountPanel?: ReactNode;
  headerContext?: ReactNode;
  headerActions?: ReactNode;
  mobileNavigation?: ReactNode;
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
  children,
}: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const primaryNav = primaryNavigation ?? navLinks;

  return (
    <MantineAppShell
      header={{ height: headerContext ? 72 : 60 }}
      footer={mobileNavigation ? { height: 68 } : undefined}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between" align="center" wrap="nowrap">
          <Group wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
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
            <ThemeToggle />
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <ScrollArea h="100%" type="auto">
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
        </ScrollArea>
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
