import type { ReactNode } from 'react';
import { Box, Divider, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';

/** Layout preset controlling the relative column widths of the brand footer. */
export type PublicBrandFooterLayoutVariant = 'default' | 'immersive-media' | 'balanced-quote';

/** Per-slot class-name overrides for {@link PublicBrandFooter}. */
export interface PublicBrandFooterClassNames {
  root?: string;
  media?: string;
  primary?: string;
  secondary?: string;
  legal?: string;
}

/** Props for {@link PublicBrandFooter}. */
export interface PublicBrandFooterProps {
  /** Media/visual column content. */
  media?: ReactNode;
  brandTitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Secondary column content (links, quote, etc.). */
  secondary?: ReactNode;
  /** Legal/fine-print row shown below a divider. */
  legal?: ReactNode;
  /** Reduce padding and internal spacing. */
  compact?: boolean;
  layoutVariant?: PublicBrandFooterLayoutVariant;
  classNames?: PublicBrandFooterClassNames;
}

/**
 * Governed public brand footer: a responsive `<footer>` panel with optional
 * media, primary (brand/description/actions), and secondary columns whose spans
 * adapt to `layoutVariant`, plus an optional divided legal row.
 */
export function PublicBrandFooter({
  media,
  brandTitle,
  description,
  actions,
  secondary,
  legal,
  compact = false,
  layoutVariant = 'default',
  classNames,
}: PublicBrandFooterProps) {
  const mediaSpan = layoutVariant === 'immersive-media' ? 5 : 4;
  const primarySpan = media ? (layoutVariant === 'balanced-quote' ? 4 : 4) : secondary ? 6 : 12;
  const secondarySpan = media ? Math.max(3, 12 - mediaSpan - primarySpan) : Math.max(4, 12 - primarySpan);

  return (
    <Paper
      component="footer"
      withBorder
      radius="xl"
      p={compact ? 'lg' : 'xl'}
      className={classNames?.root}
      data-layout-variant={layoutVariant}
    >
      <Stack gap="lg">
        <Grid style={{ gap: compact ? 'var(--mantine-spacing-lg)' : 'var(--mantine-spacing-xl)', alignItems: 'flex-start' }}>
          {media ? (
            <Grid.Col span={{ base: 12, md: mediaSpan }}>
              <Box className={classNames?.media}>{media}</Box>
            </Grid.Col>
          ) : null}
          <Grid.Col span={{ base: 12, md: primarySpan }}>
            <Stack gap={compact ? 'xs' : 'sm'} className={classNames?.primary}>
              {brandTitle ? <Title order={4}>{brandTitle}</Title> : null}
              {description ? <Text c="dimmed">{description}</Text> : null}
              {actions ? <Box>{actions}</Box> : null}
            </Stack>
          </Grid.Col>
          {secondary ? (
            <Grid.Col span={{ base: 12, md: secondarySpan }}>
              <Stack gap={compact ? 'xs' : 'sm'} className={classNames?.secondary}>
                {secondary}
              </Stack>
            </Grid.Col>
          ) : null}
        </Grid>
        {legal ? (
          <>
            <Divider />
            <Group justify="space-between" gap="sm" wrap="wrap" className={classNames?.legal}>
              {typeof legal === 'string' ? (
                <Text size="sm" c="dimmed">
                  {legal}
                </Text>
              ) : (
                legal
              )}
            </Group>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
}
