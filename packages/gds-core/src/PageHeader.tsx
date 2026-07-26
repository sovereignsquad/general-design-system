import React from 'react';
import { Box, Group, Stack, Text, Title } from '@mantine/core';

/** Eyebrow styling: plain `neutral` text, or `ornamental` uppercase with wider letter-spacing. */
export type PageHeaderEyebrowVariant = 'neutral' | 'ornamental';

/** Props for {@link PageHeader}. */
export interface PageHeaderProps {
  title: string;
  /** Supporting copy under the title; falls back to `subtitle` when omitted. */
  description?: string;
  /** Alias for `description`, used when `description` is not set. */
  subtitle?: string;
  /** Small kicker label above the title. */
  eyebrow?: string;
  /** Right-aligned actions slot. */
  actions?: React.ReactNode;
  /** Visual treatment for the eyebrow; defaults to `'neutral'`. */
  eyebrowVariant?: PageHeaderEyebrowVariant;
}

/**
 * The standard page header: an optional eyebrow, the page `title` (with optional
 * subtitle/description), and a right-aligned `actions` slot. Use it at the top of
 * a route to answer "where am I, what is this surface, and what can I do here" in
 * one governed, accessible header.
 */
export function PageHeader({
  title,
  description,
  subtitle,
  eyebrow,
  actions,
  eyebrowVariant = 'neutral',
}: PageHeaderProps) {
  const resolvedDescription = description ?? subtitle;

  const eyebrowProps =
    eyebrowVariant === 'ornamental'
      ? { tt: 'uppercase' as const, style: { letterSpacing: '0.12em' } }
      : {};

  return (
    <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
      <Stack gap="xs">
        {eyebrow && (
          <Text size="xs" fw={700} c="dimmed" {...eyebrowProps}>
            {eyebrow}
          </Text>
        )}
        <Title order={1}>{title}</Title>
        {resolvedDescription && (
          <Text c="dimmed" maw={720}>
            {resolvedDescription}
          </Text>
        )}
      </Stack>
      {actions ? <Box>{actions}</Box> : null}
    </Group>
  );
}
