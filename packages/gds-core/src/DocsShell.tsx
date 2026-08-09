'use client';

import { type ReactNode, useState } from 'react';
import { Box, Burger, Container, Divider, Group, NativeSelect, Paper, Stack, Text, Transition } from '@mantine/core';
import type { NativeSelectProps } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { DiscoveryShell } from './DiscoveryShell';

/** Props for {@link DocsShell}. */
export interface DocsShellProps {
  brand: ReactNode;
  /** Main navigation shown in the sidebar under a "Primary" heading. */
  primaryNavigation?: ReactNode;
  /** Secondary navigation shown in the sidebar under a "More" heading. */
  secondaryNavigation?: ReactNode;
  /** Contextual text shown next to the brand on wider viewports. */
  headerContext?: ReactNode;
  actions?: ReactNode;
  /** Navigation surfaced on small viewports. */
  mobileNavigation?: ReactNode;
  /** Whether mobile navigation collapses inline under the header or opens in a drawer. Defaults to `'drawer'`. */
  mobileNavigationMode?: 'inline-collapse' | 'drawer';
  footer?: ReactNode;
  children: ReactNode;
  /** Content container width; `'full'` spans the viewport. Defaults to `'full'`. */
  contentWidth?: number | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface DocsShellSidebarProps {
  primaryNavigation?: ReactNode;
  secondaryNavigation?: ReactNode;
}

/** A single option in a {@link DocsHeaderActionSelect}. */
export interface DocsHeaderActionSelectOption {
  value: string;
  label: string;
}

/** Props for {@link DocsHeaderActionSelect}. */
export interface DocsHeaderActionSelectProps extends Omit<NativeSelectProps, 'data' | 'onChange'> {
  /** Accessible label for the select (rendered as `aria-label`). */
  label: string;
  options: DocsHeaderActionSelectOption[];
  /** Called with the selected option's value. */
  onChange: (value: string) => void;
}

const navigationActivationSelector = 'a[href], button, [role="menuitem"], [data-gds-nav-close]';

function isNavigationActivationTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(navigationActivationSelector));
}

function DocsShellSidebar({ primaryNavigation, secondaryNavigation }: DocsShellSidebarProps) {
  const { t } = useGdsTranslation();

  return (
    <Stack gap="md" h="100%">
      {primaryNavigation ? (
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed">
            {t('gds.navigation.primary', 'Primary')}
          </Text>
          {primaryNavigation}
        </Stack>
      ) : null}
      {secondaryNavigation ? (
        <>
          <Divider />
          <Stack gap="xs">
            <Text size="xs" fw={700} c="dimmed">
              {t('gds.navigation.more', 'More')}
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

/** Compact, width-clamped native select for the docs header action row (e.g. version/language pickers). */
export function DocsHeaderActionSelect({
  label,
  options,
  value,
  onChange,
  ...props
}: DocsHeaderActionSelectProps) {
  return (
    <NativeSelect
      aria-label={label}
      data={options}
      value={value}
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      size="sm"
      miw={0}
      w={{ base: 'clamp(6rem, 31vw, 8.75rem)', sm: '10rem' }}
      data-gds-docs-shell-action-select
      {...props}
    />
  );
}

/**
 * Documentation app shell built on {@link DiscoveryShell}: a brand/context header
 * with actions, a primary/secondary sidebar, optional inline-collapse or drawer
 * mobile navigation, and a width-constrained content container.
 */
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
  const { t } = useGdsTranslation();

  return (
    <DiscoveryShell
      header={(
        <Box
          data-gds-docs-shell-header
          h="100%"
          w="100%"
          miw={0}
          style={{
            alignItems: 'center',
            columnGap: 'var(--mantine-spacing-xs)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            overflow: 'hidden',
          }}
        >
          <Group
            data-gds-docs-shell-brand-row
            gap="sm"
            align="center"
            wrap="nowrap"
            miw={0}
            style={{ overflow: 'hidden' }}
          >
            {mobileNavigationMode === 'inline-collapse' && mobileNavigation ? (
              <>
                <Burger
                  opened={mobileNavOpen}
                  onClick={() => setMobileNavOpen((value) => !value)}
                  hiddenFrom="sm"
                  size="sm"
                  aria-label={t('gds.navigation.openMobile', 'Open docs navigation')}
                />
                <Transition mounted={mobileNavOpen} transition="pop" duration={120}>
                  {(styles) => (
                    <Box style={styles}>
                      <Paper
                        mt="xs"
                        p="sm"
                        radius="sm"
                        withBorder
                        onClickCapture={(event) => {
                          if (isNavigationActivationTarget(event.target)) {
                            setMobileNavOpen(false);
                          }
                        }}
                      >
                        {mobileNavigation}
                      </Paper>
                    </Box>
                  )}
                </Transition>
              </>
            ) : null}
            <Box
              data-gds-docs-shell-brand
              flex="1 1 auto"
              miw={0}
              maw="100%"
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {brand}
            </Box>
            {headerContext ? (
              <Text visibleFrom="sm" size="sm" c="dimmed" lineClamp={1} miw={0} flex="0 1 auto">
                {headerContext}
              </Text>
            ) : null}
          </Group>
          <Group
            data-gds-docs-shell-actions
            gap="xs"
            wrap="nowrap"
            justify="flex-end"
            miw={0}
            maw={{ base: '46vw', sm: '40vw' }}
            style={{ overflow: 'hidden' }}
          >
            {actions}
          </Group>
        </Box>
      )}
      sidebar={(
        <DocsShellSidebar
          primaryNavigation={primaryNavigation}
          secondaryNavigation={secondaryNavigation}
        />
      )}
      footer={footer}
      mobileNavigationLabel={t('gds.navigation.openMobile', 'Open docs navigation')}
      hideMobileNavigationToggle={mobileNavigationMode === 'inline-collapse' && Boolean(mobileNavigation)}
      headerHeight={72}
    >
      <Container size={resolveContentContainerSize(contentWidth)} px="md" py="lg" w="100%">
        {children}
      </Container>
    </DiscoveryShell>
  );
}
