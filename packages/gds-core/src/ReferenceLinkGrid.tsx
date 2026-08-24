import type { ReactNode } from 'react';
import { Anchor, Badge, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** One card in a {@link ReferenceLinkGrid}: a linked title and description with optional badge and meta. */
export interface ReferenceLinkGridItem {
  id: string;
  title: ReactNode;
  description: ReactNode;
  href: string;
  badge?: ReactNode;
  meta?: ReactNode;
}

/** Props for {@link ReferenceLinkGrid}. */
export interface ReferenceLinkGridProps {
  items: ReferenceLinkGridItem[];
  columns?: 2 | 3 | 4;
}

/** Renders a responsive grid of reference link cards, each ending with a governed "Open section" link. */
export function ReferenceLinkGrid({
  items,
  columns = 3,
}: ReferenceLinkGridProps) {
  const { t } = useGdsTranslation();

  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg" miw={0}>
      {items.map((item) => (
        <Paper key={item.id} withBorder radius="xl" p="lg" miw={0}>
          <Stack gap="md" miw={0}>
            <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
              <Stack gap={6} maw={540} miw={0}>
                <Title order={4}>
                  <Anchor
                    href={item.href}
                    underline="never"
                    className="gds-touch-target-pad-link"
                    data-gds-target-exception="reference-link-grid-card"
                  >
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
            <Anchor
              href={item.href}
              fw={600}
              className="gds-touch-target-pad-link"
              data-gds-target-exception="reference-link-grid-card"
            >
              {t('gds.reference.openSection', 'Open section')}
            </Anchor>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
