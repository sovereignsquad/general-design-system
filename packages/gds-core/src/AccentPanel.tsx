import type { ReactNode } from 'react';
import { Badge, Box, Group, Paper, Stack, Text, Title } from '@mantine/core';

/** Color family for an `AccentPanel`. */
export type AccentTone = 'gray' | 'violet' | 'green' | 'red' | 'amber' | 'blue';
/** Fill style for an `AccentPanel`: tinted `subtle` background, or `soft-outline` (body background with a toned border). */
export type AccentPanelVariant = 'subtle' | 'soft-outline';

/** Props for `AccentPanel`. */
export interface AccentPanelProps {
  /** Color family; defaults to `violet`. */
  tone?: AccentTone;
  /** Fill style; defaults to `subtle`. */
  variant?: AccentPanelVariant;
  title?: ReactNode;
  /** Optional badge; a string renders as a filled badge in the panel tone, any other node is passed through. */
  badge?: ReactNode;
  children: ReactNode;
}

const toneStyles: Record<AccentTone, { bg: string; border: string; color: string }> = {
  gray: {
    bg: 'light-dark(var(--mantine-color-gray-0), color-mix(in srgb, var(--mantine-color-gray-7) 88%, black))',
    border: 'light-dark(var(--mantine-color-gray-2), color-mix(in srgb, var(--mantine-color-gray-4) 70%, transparent))',
    color: 'light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))',
  },
  violet: {
    bg: 'light-dark(var(--mantine-color-violet-0), color-mix(in srgb, var(--mantine-color-violet-9) 70%, black))',
    border: 'light-dark(var(--mantine-color-violet-2), color-mix(in srgb, var(--mantine-color-violet-4) 75%, transparent))',
    color: 'light-dark(var(--mantine-color-violet-9), var(--mantine-color-violet-0))',
  },
  green: {
    bg: 'light-dark(var(--mantine-color-green-0), color-mix(in srgb, var(--mantine-color-green-9) 72%, black))',
    border: 'light-dark(var(--mantine-color-green-2), color-mix(in srgb, var(--mantine-color-green-4) 78%, transparent))',
    color: 'light-dark(var(--mantine-color-green-9), var(--mantine-color-green-0))',
  },
  red: {
    bg: 'light-dark(var(--mantine-color-red-0), color-mix(in srgb, var(--mantine-color-red-9) 72%, black))',
    border: 'light-dark(var(--mantine-color-red-2), color-mix(in srgb, var(--mantine-color-red-4) 78%, transparent))',
    color: 'light-dark(var(--mantine-color-red-9), var(--mantine-color-red-0))',
  },
  amber: {
    bg: 'light-dark(var(--mantine-color-yellow-0), color-mix(in srgb, var(--mantine-color-yellow-8) 78%, black))',
    border: 'light-dark(var(--mantine-color-yellow-3), color-mix(in srgb, var(--mantine-color-yellow-5) 70%, transparent))',
    color: 'light-dark(var(--mantine-color-yellow-9), var(--mantine-color-yellow-0))',
  },
  blue: {
    bg: 'light-dark(var(--mantine-color-blue-0), color-mix(in srgb, var(--mantine-color-blue-9) 74%, black))',
    border: 'light-dark(var(--mantine-color-blue-2), color-mix(in srgb, var(--mantine-color-blue-4) 75%, transparent))',
    color: 'light-dark(var(--mantine-color-blue-9), var(--mantine-color-blue-0))',
  },
};

/** Resolves the background, border, and text CSS for the given tone and variant. */
export function resolveAccentPanelStyles(tone: AccentTone = 'violet', variant: AccentPanelVariant = 'subtle') {
  const token = toneStyles[tone];

  if (variant === 'soft-outline') {
    return {
      backgroundColor: 'light-dark(var(--mantine-color-body), color-mix(in srgb, var(--mantine-color-dark-7) 92%, black))',
      border: `1px solid ${token.border}`,
      color: token.color,
    };
  }

  return {
    backgroundColor: token.bg,
    border: `1px solid ${token.border}`,
    color: token.color,
  };
}

/** Rounded panel with a tone-driven accent surface, an optional title/badge header, and body content. */
export function AccentPanel({
  tone = 'violet',
  variant = 'subtle',
  title,
  badge,
  children,
}: AccentPanelProps) {
  const styles = resolveAccentPanelStyles(tone, variant);

  return (
    <Paper withBorder radius="lg" p="lg" style={styles}>
      <Stack gap="sm">
        {(title || badge) ? (
          <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
            {title ? (
              <Title order={4} c="inherit">
                {title}
              </Title>
            ) : (
              <Box />
            )}
            {badge ? (
              typeof badge === 'string' ? (
                <Badge color={tone === 'amber' ? 'yellow' : tone} variant="filled">
                  {badge}
                </Badge>
              ) : (
                badge
              )
            ) : null}
          </Group>
        ) : null}
        {typeof children === 'string' ? <Text c="inherit">{children}</Text> : <Box c="inherit">{children}</Box>}
      </Stack>
    </Paper>
  );
}
