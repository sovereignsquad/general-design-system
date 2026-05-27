import type { ReactNode } from 'react';
import { Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { EmptyState } from './EmptyState';
import { PublicFoodCard } from './PublicFoodCard';
import type { PublicFoodCardProps } from './PublicFoodCard';

export type FoodMenuItem = PublicFoodCardProps & { id: string };

export type FoodMenuCategory = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  helperNote?: ReactNode;
  items: FoodMenuItem[];
};

export interface FoodMenuSectionProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  categories: FoodMenuCategory[];
  sectionNote?: ReactNode;
  action?: ReactNode;
  emptyState?: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  showEmptyCategories?: boolean;
}

export function FoodMenuSection({
  title,
  description,
  eyebrow,
  categories,
  sectionNote,
  action,
  emptyState,
  columns = 3,
  showEmptyCategories = false,
}: FoodMenuSectionProps) {
  const normalizedCategories = (categories ?? []).filter(Boolean);
  const visibleCategories = showEmptyCategories
    ? normalizedCategories
    : normalizedCategories.filter((category) => category.items.length > 0);

  if (!visibleCategories.length) {
    return emptyState ? (
      <>{emptyState}</>
    ) : (
      <EmptyState
        title="No active menu available"
        description="Publish grouped menu categories here when the current weekly or seasonal menu is ready."
      />
    );
  }

  return (
    <Box component="section" aria-label={typeof title === 'string' ? title : 'Food menu section'}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={4}>
            {eyebrow ? (
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                {eyebrow}
              </Text>
            ) : null}
            <Title order={2}>{title}</Title>
            {description ? (
              <Text size="sm" c="dimmed" maw={760}>
                {description}
              </Text>
            ) : null}
            {sectionNote ? (
              <Text size="sm" c="dimmed">
                {sectionNote}
              </Text>
            ) : null}
          </Stack>
          {action}
        </Group>

        <Stack gap="xl">
          {visibleCategories.map((category) => (
            <Stack key={category.id} gap="md">
              <Stack gap={4}>
                <Title order={3}>{category.title}</Title>
                {category.description ? (
                  <Text size="sm" c="dimmed">
                    {category.description}
                  </Text>
                ) : null}
                {category.helperNote ? (
                  <Text size="sm" c="dimmed">
                    {category.helperNote}
                  </Text>
                ) : null}
              </Stack>

              {category.items.length ? (
                <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg">
                  {category.items.map((item) => (
                    <PublicFoodCard key={item.id} {...item} />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  title="No items in this category"
                  description="This category is defined, but it does not currently have any visible dishes or bundles."
                />
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
