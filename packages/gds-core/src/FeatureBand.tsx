import type { ReactNode } from 'react';
import { Box, Group, Paper, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { EmptyState } from './EmptyState';
import { GdsIcons } from './icons';

export interface FeatureBandItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  media?: ReactNode;
}

export interface FeatureBandProps {
  items: FeatureBandItem[];
  columns?: 2 | 3;
  bordered?: boolean;
  loading?: boolean;
  emptyState?: ReactNode;
}

function FeatureBandSkeleton({ columns = 3, bordered = true }: Pick<FeatureBandProps, 'columns' | 'bordered'>) {
  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg">
      {Array.from({ length: columns }).map((_, index) => (
        <Paper key={index} withBorder={bordered} radius="lg" p="lg">
          <Stack gap="md">
            <Skeleton height={42} width={42} radius="xl" />
            <Stack gap="xs">
              <Skeleton height={20} width="75%" radius="md" />
              <Skeleton height={14} width="100%" radius="md" />
              <Skeleton height={14} width="82%" radius="md" />
            </Stack>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

export function FeatureBand({
  items,
  columns = 3,
  bordered = true,
  loading = false,
  emptyState,
}: FeatureBandProps) {
  if (loading) {
    return <FeatureBandSkeleton columns={columns} bordered={bordered} />;
  }

  if (!items.length) {
    return emptyState ? (
      <>{emptyState}</>
    ) : (
      <EmptyState
        title="No supporting details available"
        description="Add shared feature-band items when this public surface needs trust, service, or location context."
      />
    );
  }

  return (
    <Box component="section" aria-label="Supporting features">
      <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg">
        {items.map((item) => (
          <Paper key={item.id} withBorder={bordered} radius="lg" p="lg">
            <Stack gap="md">
              {item.media ? (
                item.media
              ) : item.icon ? (
                <Group>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="violet">
                    {item.icon}
                  </ThemeIcon>
                </Group>
              ) : (
                <Group>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="gray" aria-hidden>
                    <GdsIcons.Info size="1.25rem" />
                  </ThemeIcon>
                </Group>
              )}
              <Stack gap="xs">
                <Title order={4}>{item.title}</Title>
                {item.description ? <Text c="dimmed">{item.description}</Text> : null}
                {item.meta ? (
                  <Text size="sm" c="dimmed">
                    {item.meta}
                  </Text>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Box>
  );
}
