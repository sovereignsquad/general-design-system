import { useRef } from 'react';
import type { ReactNode } from 'react';
import { AppShell, Box, Burger, Container, Group, Stack, Text } from '@mantine/core';
import { PublicNav, type PublicNavItem } from './PublicNav';
import { BOTTOM_TAB_HEIGHT, BottomTabBar } from './BottomTabBar';

/** Header presentation variant for {@link PublicShell}. */
export type PublicShellHeaderVariant = 'default' | 'branded-quiet' | 'compact';
/** How mobile navigation is presented: bottom sheet, inline collapse, drawer, or bottom tab bar. */
export type PublicShellMobileNavigationMode = 'sheet' | 'inline-collapse' | 'drawer' | 'bottom-tab';

/** Options for the `bottom-tab` mobile navigation mode. */
export interface PublicShellBottomTabOptions {
  /** Item id rendered as a raised center action (e.g. an assistant entry). */
  emphasizedItemId?: string;
  /** Hard cap on rendered tabs (max 5). */
  maxItems?: 3 | 4 | 5;
  /** Analytics hook fired when a tab is selected. */
  onNavItemSelect?: (id: string) => void;
}

/** Optional class-name overrides for the shell's structural regions. */
export interface PublicShellClassNames {
  root?: string;
  header?: string;
  brand?: string;
  navigation?: string;
  actions?: string;
  content?: string;
  mobileNavigation?: string;
}

/** Props for {@link PublicShell}. */
export interface PublicShellProps {
  brand: ReactNode;
  /** Nav items rendered by the built-in {@link PublicNav} when no `navigation` node is provided. */
  navItems?: PublicNavItem[];
  activeNavId?: string;
  /** Custom desktop navigation node; overrides `navItems` when set. */
  navigation?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  mobileNavigation?: ReactNode;
  children: ReactNode;
  headerBordered?: boolean;
  compact?: boolean;
  /** Max content width: a Mantine container size or an explicit pixel width. */
  maxContentWidth?: number | 'sm' | 'md' | 'lg';
  headerVariant?: PublicShellHeaderVariant;
  mobileNavigationMode?: PublicShellMobileNavigationMode;
  /** Options applied when `mobileNavigationMode` is `bottom-tab`. */
  bottomTab?: PublicShellBottomTabOptions;
  classNames?: PublicShellClassNames;
}

const navigationActivationSelector = 'a[href], button, [role="menuitem"], [data-gds-nav-close]';

function isNavigationActivationTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(navigationActivationSelector));
}

function InlineMobileNavigation({
  mobileNavigation,
  className,
  mode,
}: {
  mobileNavigation: ReactNode;
  className?: string;
  mode: Extract<PublicShellMobileNavigationMode, 'inline-collapse' | 'drawer'>;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <Box component="details" hiddenFrom="sm" className={className} ref={detailsRef}>
      <Box
        component="summary"
        aria-label={mode === 'drawer' ? 'Open site navigation drawer' : 'Open site navigation'}
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Burger opened={false} aria-hidden />
        <Text size="sm" fw={600}>
          Menu
        </Text>
      </Box>
      <Box
        mt="sm"
        p="sm"
        onClickCapture={(event) => {
          if (isNavigationActivationTarget(event.target) && detailsRef.current) {
            detailsRef.current.open = false;
          }
        }}
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          border: '1px solid var(--mantine-color-default-border)',
          background:
            mode === 'drawer'
              ? 'light-dark(var(--mantine-color-white), color-mix(in srgb, var(--mantine-color-dark-7) 92%, black))'
              : 'var(--mantine-color-body)',
        }}
      >
        <Stack gap="sm">{mobileNavigation}</Stack>
      </Box>
    </Box>
  );
}

/**
 * The governed page frame for public-facing surfaces: a Mantine `AppShell` with a
 * branded header, desktop navigation, an actions slot, main content, an optional
 * footer, and one of several mobile-navigation modes (sheet, inline-collapse,
 * drawer, or bottom-tab). Compose page content as its children.
 */
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
  headerVariant = 'default',
  mobileNavigationMode = 'sheet',
  bottomTab,
  classNames,
}: PublicShellProps) {
  const resolvedNavigation = navigation ?? (navItems ? <PublicNav items={navItems} activeId={activeNavId} /> : null);
  const containerSize = maxContentWidth ?? (compact ? 'md' : 'lg');
  const headerHeight = headerVariant === 'compact' ? 64 : headerVariant === 'branded-quiet' ? 88 : 72;
  const mainPadding = headerVariant === 'compact' ? 'lg' : 'xl';
  const usesBottomTabNavigation = mobileNavigationMode === 'bottom-tab' && Boolean(navItems?.length);
  const usesInlineMobileNavigation =
    Boolean(mobileNavigation) && mobileNavigationMode !== 'sheet' && mobileNavigationMode !== 'bottom-tab';
  const usesSheetMobileNavigation = Boolean(mobileNavigation) && mobileNavigationMode === 'sheet';

  return (
    <AppShell
      className={classNames?.root}
      header={{ height: headerHeight }}
      footer={usesSheetMobileNavigation ? { height: 68 } : undefined}
      padding={0}
    >
      <AppShell.Header withBorder={headerBordered} className={classNames?.header} data-header-variant={headerVariant}>
        <Container size={containerSize} h="100%" py={headerVariant === 'branded-quiet' ? 'sm' : 0}>
          <Group
            h="100%"
            justify="space-between"
            wrap="nowrap"
            gap={headerVariant === 'compact' ? 'sm' : 'lg'}
          >
            <Group wrap="nowrap" gap={headerVariant === 'compact' ? 'xs' : 'sm'} className={classNames?.brand}>
              {usesInlineMobileNavigation ? (
                <InlineMobileNavigation
                  mobileNavigation={mobileNavigation}
                  className={classNames?.mobileNavigation}
                  mode={mobileNavigationMode}
                />
              ) : null}
              <Box>{brand}</Box>
            </Group>
            <Group visibleFrom="sm" gap={headerVariant === 'compact' ? 'md' : 'lg'} className={classNames?.navigation}>
              {resolvedNavigation}
            </Group>
            <Group gap="sm" className={classNames?.actions}>
              {actions}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      {usesSheetMobileNavigation ? (
        <AppShell.Footer withBorder>
          <Container size={containerSize} h="100%">
            <Group h="100%" justify="space-around" wrap="nowrap">
              {mobileNavigation}
            </Group>
          </Container>
        </AppShell.Footer>
      ) : null}

      <AppShell.Main>
        <Container
          size={containerSize}
          py={mainPadding}
          className={classNames?.content}
          style={
            usesBottomTabNavigation
              ? { paddingBottom: `calc(${BOTTOM_TAB_HEIGHT}px + env(safe-area-inset-bottom, 0px) + var(--mantine-spacing-xl))` }
              : undefined
          }
        >
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

      {usesBottomTabNavigation && navItems ? (
        <BottomTabBar
          items={navItems}
          activeId={activeNavId}
          emphasizedItemId={bottomTab?.emphasizedItemId}
          maxItems={bottomTab?.maxItems}
          onNavItemSelect={bottomTab?.onNavItemSelect}
          className={classNames?.mobileNavigation}
        />
      ) : null}
    </AppShell>
  );
}
