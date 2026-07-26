import { SimpleGrid, Paper, Text, Group, Box } from '@mantine/core';

/** A single stat rendered by {@link StatsStrip}. */
export interface StatItem {
  /** Uppercased stat label. */
  label: string;
  /** Stat value. */
  value: string | number;
  /** Percentage delta; positive renders teal with a `+`, negative renders red. */
  diff?: number;
}

/** Props for {@link StatsStrip}. */
export interface StatsStripProps {
  /** Stats to render as cards. */
  stats: StatItem[];
}

/** Responsive 1/2/3-column grid of stat cards, each showing a label, value, and optional signed delta. */
export function StatsStrip({ stats }: StatsStripProps) {
  const items = stats.map((stat, index) => (
    <Paper key={index} p="lg" withBorder radius="md">
      <Group justify="space-between" align="flex-end" gap="xs">
        <Box>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs">
            {stat.label}
          </Text>
          <Text fw={700} size="xl" mt="sm">
            {stat.value}
          </Text>
        </Box>
        {stat.diff !== undefined && (
          <Text c={stat.diff > 0 ? 'teal' : 'red'} size="sm" fw={600}>
            {stat.diff > 0 ? '+' : ''}{stat.diff}%
          </Text>
        )}
      </Group>
    </Paper>
  ));

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
      {items}
    </SimpleGrid>
  );
}
