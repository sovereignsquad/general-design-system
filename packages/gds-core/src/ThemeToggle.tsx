'use client';

import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsIcons } from './icons';

/** Props for the `ThemeToggle` component. */
export interface ThemeToggleProps {
  /** Icon button size. Defaults to `xl` (44px — GDS's own touch-target floor, GDS_MIN_TARGET_PX). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Called with the newly selected scheme after each toggle. */
  onColorSchemeChange?: (nextScheme: 'light' | 'dark') => void;
}

/**
 * Standardized ThemeToggle component for switching between Light and Dark mode.
 * Should be placed in the main application header/shell.
 */
export function ThemeToggle({ size = 'xl', onColorSchemeChange }: ThemeToggleProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const { t } = useGdsTranslation();

  const toggleColorScheme = () => {
    const nextScheme = computedColorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(nextScheme);
    onColorSchemeChange?.(nextScheme);
  };

  const isDark = computedColorScheme === 'dark';

  return (
    <ActionIcon
      onClick={toggleColorScheme}
      variant="default"
      size={size}
      aria-label={t('gds.aria.themeToggle', 'Toggle color scheme')}
    >
      {isDark ? <GdsIcons.Sun size="1.2rem" /> : <GdsIcons.Moon size="1.2rem" />}
    </ActionIcon>
  );
}
