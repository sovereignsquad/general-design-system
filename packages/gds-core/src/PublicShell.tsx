import type { ReactNode } from 'react';
import { AppShell, Box, Burger, Container, Group, Stack, Text } from '@mantine/core';
import { PublicNav, type PublicNavItem } from './PublicNav';

export interface PublicShellProps {
  brand: ReactNode;
  navItems?: PublicNavItem[];
  activeNavId?: string;
  navigation?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  mobileNavigation?: ReactNode;
  children: ReactNode;
  headerBordered?: boolean;
  compact?: boolean;
  maxContentWidth?: number | 'sm' | 'md' | 'lg';
}

export function PublicShell({
  brand,
  navItems,
  activeNavId,
  navigation,
  actions,
  footer,
  mobileNavigation,
  children,
  headerBordered = true,
  compact = false,
  maxContentWidth,
}: PublicShellProps) {
  const resolvedNavigation = navigation ?? (navItems ? <PublicNav items={navItems} activeId={activeNavId} /> : null);
  const containerSize = maxContentWidth ?? (compact ? 'md' : 'lg');

  return (
    <AppShell header={{ height: 72 }} footer={mobileNavigation ? { height: 68 } : undefined} padding={0}>
      <AppShell.Header withBorder={headerBordered}>
        <Container size={containerSize} h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group wrap="nowrap" gap="sm">
              {mobileNavigation ? <Burger hiddenFrom="sm" disabled opened={false} aria-hidden /> : null}
              <Box>{brand}</Box>
            </Group>
            <Group visibleFrom="sm" gap="lg">
              {resolvedNavigation}
            </Group>
            <Group gap="sm">{actions}</Group>
          </Group>
        </Container>
      </AppShell.Header>

      {mobileNavigation ? (
        <AppShell.Footer withBorder>
          <Container size={containerSize} h="100%">
            <Group h="100%" justify="space-around" wrap="nowrap">
              {mobileNavigation}
            </Group>
          </Container>
        </AppShell.Footer>
      ) : null}

      <AppShell.Main>
        <Container size={containerSize} py="xl">
          <Stack gap="xl">{children}</Stack>
        </Container>
        {footer ? (
          <Box component={typeof footer === 'string' ? 'footer' : 'div'} py="xl">
            <Container size={containerSize}>
              {typeof footer === 'string' ? (
                <Text size="sm" c="dimmed">
                  {footer}
                </Text>
              ) : (
                footer
              )}
            </Container>
          </Box>
        ) : null}
      </AppShell.Main>
    </AppShell>
  );
}
