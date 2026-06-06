import type { ReactNode } from 'react';
import { Anchor, Badge, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';

export interface ReferenceLinkGridItem {
  id: string;
  title: ReactNode;
  description: ReactNode;
  href: string;
  badge?: ReactNode;
  meta?: ReactNode;
}

export interface ReferenceLinkGridProps {
  items: ReferenceLinkGridItem[];
  columns?: 2 | 3 | 4;
}

export function ReferenceLinkGrid({
  items,
  columns = 3,
}: ReferenceLinkGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), xl: columns }} spacing="lg" miw={0}>
      {items.map((item) => (
        <Paper key={item.id} withBorder radius="xl" p="lg" miw={0}>
          <Stack gap="md" miw={0}>
            <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
              <Stack gap={6} maw={540} miw={0}>
                <Title order={4}>
                  <Anchor href={item.href} underline="never">
                    {item.title}
                  </Anchor>
                </Title>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
              {item.badge ? (
                typeof item.badge === 'string' ? (
                  <Badge variant="light" color="violet">
                    {item.badge}
                  </Badge>
                ) : (
                  item.badge
                )
              ) : null}
            </Group>
            {item.meta ? (
              <Text size="sm" c="dimmed">
                {item.meta}
              </Text>
            ) : null}
            <Anchor href={item.href} fw={600}>
              Open section
            </Anchor>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
