import type { ReactNode } from 'react';
import { ActionIcon, Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { resolveGdsCardContract, type GdsCardDensity, type GdsCardSize, type GdsCardVariant } from './CardContracts';

export interface MediaCardAction {
  label: string;
  onClick?: () => void;
}

export interface MediaCardProps {
  title: string;
  image: ReactNode;
  description?: ReactNode;
  status?: string;
  overlay?: ReactNode;
  actions?: MediaCardAction[];
  size?: GdsCardSize;
  density?: GdsCardDensity;
  variant?: GdsCardVariant;
}

export function MediaCard({
  title,
  image,
  description,
  status,
  overlay,
  actions = [],
  size = 'md',
  density = 'comfortable',
  variant = 'media-top',
}: MediaCardProps) {
  const EyeIcon = GdsIcons.Eye;
  const contract = resolveGdsCardContract({ size, density, variant });

  return (
    <Card withBorder radius="lg" padding={contract.padding} {...contract.dataAttributes}>
      <Card.Section pos="relative">
        {image}
        {overlay ? (
          <div style={{ position: 'absolute', inset: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            {overlay}
          </div>
        ) : null}
      </Card.Section>
      <Stack gap={contract.gap} mt={contract.gap}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={contract.titleOrder}>{title}</Title>
            {description ? (
              <Text size="sm" c="dimmed" lineClamp={contract.descriptionClamp}>
                {description}
              </Text>
            ) : null}
          </Stack>
          {status ? <Badge variant="light">{status}</Badge> : null}
        </Group>

        {actions.length ? (
          <Group justify="flex-end" gap="xs">
            {actions.map((action) => (
              <ActionIcon key={action.label} variant="light" aria-label={action.label} onClick={action.onClick}>
                <EyeIcon size="1rem" />
              </ActionIcon>
            ))}
          </Group>
        ) : null}
      </Stack>
    </Card>
  );
}
