import type { ReactNode } from 'react';
import { Badge, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

/** Props for {@link MetricCard}. */
export interface MetricCardProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  /** Optional trend indicator rendered as a tone-colored badge. */
  trend?: {
    label: string;
    tone?: 'positive' | 'negative' | 'neutral';
  };
  icon?: ReactNode;
  footer?: ReactNode;
}

type MetricTrendTone = NonNullable<NonNullable<MetricCardProps['trend']>['tone']>;

const trendColors: Record<MetricTrendTone, string> = {
  positive: 'teal',
  negative: 'red',
  neutral: 'gray',
};

/**
 * Compact KPI card: a labelled headline `value` with an optional trend indicator
 * (`positive`/`negative`/`neutral`) and supporting description, icon, and footer.
 * Use it in dashboard metric rows to present a single number and its movement in
 * a consistent, accessible tile.
 */
export function MetricCard({ label, value, description, trend, icon, footer }: MetricCardProps) {
  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4}>
            <Text size="sm" c="dimmed" fw={600}>
              {label}
            </Text>
            <Title order={3}>{value}</Title>
          </Stack>
          {icon ? (
            <ThemeIcon variant="light" size="xl" radius="xl" aria-hidden>
              {icon}
            </ThemeIcon>
          ) : null}
        </Group>

        {(description || trend) ? (
          <Group justify="space-between" align="center" gap="sm">
            {description ? (
              <Text size="sm" c="dimmed" flex={1}>
                {description}
              </Text>
            ) : (
              <span />
            )}
            {trend ? (
              <Badge color={trendColors[trend.tone ?? 'neutral']} variant="light">
                {trend.label}
              </Badge>
            ) : null}
          </Group>
        ) : null}

        {footer}
      </Stack>
    </Card>
  );
}
