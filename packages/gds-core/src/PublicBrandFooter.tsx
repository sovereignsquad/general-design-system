import type { ReactNode } from 'react';
import { Box, Divider, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';

export type PublicBrandFooterLayoutVariant = 'default' | 'immersive-media' | 'balanced-quote';

export interface PublicBrandFooterClassNames {
  root?: string;
  media?: string;
  primary?: string;
  secondary?: string;
  legal?: string;
}

export interface PublicBrandFooterProps {
  media?: ReactNode;
  brandTitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  secondary?: ReactNode;
  legal?: ReactNode;
  compact?: boolean;
  layoutVariant?: PublicBrandFooterLayoutVariant;
  classNames?: PublicBrandFooterClassNames;
}

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
        <Grid gutter={compact ? 'lg' : 'xl'} align="flex-start">
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
