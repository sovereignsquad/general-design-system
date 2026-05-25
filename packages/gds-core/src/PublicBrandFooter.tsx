import type { ReactNode } from 'react';
import { Box, Divider, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';

export interface PublicBrandFooterProps {
  media?: ReactNode;
  brandTitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  secondary?: ReactNode;
  legal?: ReactNode;
  compact?: boolean;
}

export function PublicBrandFooter({
  media,
  brandTitle,
  description,
  actions,
  secondary,
  legal,
  compact = false,
}: PublicBrandFooterProps) {
  return (
    <Paper component="footer" withBorder radius="xl" p={compact ? 'lg' : 'xl'}>
      <Stack gap="lg">
        <Grid gutter={compact ? 'lg' : 'xl'} align="flex-start">
          {media ? (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box>{media}</Box>
            </Grid.Col>
          ) : null}
          <Grid.Col span={{ base: 12, md: media ? 4 : 6 }}>
            <Stack gap="sm">
              {brandTitle ? (
                <Title order={4}>
                  {brandTitle}
                </Title>
              ) : null}
              {description ? <Text c="dimmed">{description}</Text> : null}
              {actions ? <Box>{actions}</Box> : null}
            </Stack>
          </Grid.Col>
          {secondary ? (
            <Grid.Col span={{ base: 12, md: media ? 4 : 6 }}>
              <Stack gap="sm">
                {secondary}
              </Stack>
            </Grid.Col>
          ) : null}
        </Grid>
        {legal ? (
          <>
            <Divider />
            <Group justify="space-between" gap="sm" wrap="wrap">
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
