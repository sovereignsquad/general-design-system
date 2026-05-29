'use client';

import { type ReactNode, useState } from 'react';
import { Box, Burger, Container, Divider, Group, Stack, Text, Transition } from '@mantine/core';
import { DiscoveryShell } from './DiscoveryShell';

export interface DocsShellProps {
  brand: ReactNode;
  primaryNavigation?: ReactNode;
  secondaryNavigation?: ReactNode;
  headerContext?: ReactNode;
  actions?: ReactNode;
  mobileNavigation?: ReactNode;
  mobileNavigationMode?: 'inline-collapse' | 'drawer';
  footer?: ReactNode;
  children: ReactNode;
  contentWidth?: number | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface DocsShellSidebarProps {
  primaryNavigation?: ReactNode;
  secondaryNavigation?: ReactNode;
}

function DocsShellSidebar({ primaryNavigation, secondaryNavigation }: DocsShellSidebarProps) {
  return (
    <Stack gap="md" h="100%">
      {primaryNavigation ? (
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed">
            Primary
          </Text>
          {primaryNavigation}
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
    </Stack>
  );
}

function resolveContentContainerSize(value: DocsShellProps['contentWidth']) {
  if (value === 'full') {
    return '100%';
  }

  return value ?? 'lg';
}

export function DocsShell({
  brand,
  primaryNavigation,
  secondaryNavigation,
  headerContext,
  actions,
  mobileNavigation,
  mobileNavigationMode = 'drawer',
  footer,
  children,
  contentWidth = 'full',
}: DocsShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DiscoveryShell
      header={(
        <Group h="100%" justify="space-between" align="center" wrap="nowrap" gap="md">
          <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            {mobileNavigationMode === 'inline-collapse' && mobileNavigation ? (
              <>
                <Burger
                  opened={mobileNavOpen}
                  onClick={() => setMobileNavOpen((value) => !value)}
                  hiddenFrom="sm"
                  size="sm"
                  aria-label="Toggle docs navigation"
                />
                <Transition mounted={mobileNavOpen} transition="pop" duration={120}>
                  {(styles) => (
                    <Box style={styles}>
                      <Box mt="xs" p="sm" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}>
                        {mobileNavigation}
                      </Box>
                    </Box>
                  )}
                </Transition>
              </>
            ) : null}
            <Box style={{ minWidth: 0 }}>
              {brand}
            </Box>
            {headerContext ? (
              <Text size="sm" c="dimmed" lineClamp={1}>
                {headerContext}
              </Text>
            ) : null}
          </Group>
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            {actions}
          </Group>
        </Group>
      )}
      sidebar={(
        <DocsShellSidebar
          primaryNavigation={primaryNavigation}
          secondaryNavigation={secondaryNavigation}
        />
      )}
      footer={footer}
      mobileNavigationLabel="Open docs navigation"
      headerHeight={72}
    >
      <Container size={resolveContentContainerSize(contentWidth)} px="md" py="lg" w="100%">
        {children}
      </Container>
    </DiscoveryShell>
  );
}
