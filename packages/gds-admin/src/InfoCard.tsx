import { Card, Text, Group, ThemeIcon, Box } from '@mantine/core';

/** Props for {@link InfoCard}. */
export interface InfoCardProps {
  /** Uppercased label shown above the value. */
  title: string;
  /** Primary metric value. */
  value: string | number;
  /** Supporting description under the value. */
  description?: string;
  /** Icon rendered in a themed badge on the trailing edge. */
  icon?: React.ReactNode;
  /** Mantine color for the icon badge; defaults to `blue`. */
  color?: string;
}

/** Compact metric card pairing a labelled value with an optional description and themed icon. */
export function InfoCard({ title, value, description, icon, color = 'blue' }: InfoCardProps) {
  return (
    <Card p="xl">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box>
          <Text tt="uppercase" fw={700} c="dimmed" size="xs">
            {title}
          </Text>
          <Text fw={700} size="xl" mt="sm">
            {value}
          </Text>
          {description && (
            <Text c="dimmed" size="sm" mt="xs">
              {description}
            </Text>
          )}
        </Box>
        {icon && (
          <ThemeIcon size="xl" radius="md" variant="light" color={color}>
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Card>
  );
}
