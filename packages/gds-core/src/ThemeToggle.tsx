'use client';

import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useGdsTranslation } from '@gds/theme';
import { GdsIcons } from './icons';

export interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Standardized ThemeToggle component for switching between Light and Dark mode.
 * Should be placed in the main application header/shell.
 */
export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const { t } = useGdsTranslation();

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
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
