import type { ReactNode } from 'react';
import { Badge, Card, Group, Menu, Stack, Text, ThemeIcon, Title, ActionIcon } from '@mantine/core';
import { GdsIcons } from './icons';
import { gdsCardSizePaddingMap, gdsCardTitleOrderMap, type GdsCardSize } from './CardContracts';

export interface ProductCardMetaItem {
  label: string;
  value: ReactNode;
}

export interface ProductCardAction {
  label: string;
  onClick?: () => void;
  href?: string;
  color?: string;
}

export interface ProductCardProps {
  title: string;
  description?: ReactNode;
  media?: ReactNode;
  icon?: ReactNode;
  status?: ReactNode;
  metadata?: ProductCardMetaItem[];
  primaryAction?: ReactNode;
  secondaryActions?: ProductCardAction[];
  footer?: ReactNode;
  size?: GdsCardSize;
}

export function ProductCard({
  title,
  description,
  media,
  icon,
  status,
  metadata = [],
  primaryAction,
  secondaryActions = [],
  footer,
  size = 'md',
}: ProductCardProps) {
  const MoreIcon = GdsIcons.Menu;

  return (
    <Card withBorder radius="lg" padding={gdsCardSizePaddingMap[size]}>
      <Stack gap="md">
        {media}

        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group align="flex-start" gap="sm" wrap="nowrap">
            {icon ? (
              <ThemeIcon variant="light" size="xl" radius="xl" aria-hidden>
                {icon}
              </ThemeIcon>
            ) : null}
            <Stack gap={4}>
              <Title order={gdsCardTitleOrderMap[size]}>{title}</Title>
              {description ? (
                <Text size="sm" c="dimmed" lineClamp={3}>
                  {description}
                </Text>
              ) : null}
            </Stack>
          </Group>

          <Group gap="xs" align="center" wrap="nowrap">
            {typeof status === 'string' ? (
              <Badge variant="light">{status}</Badge>
            ) : (
              status
            )}
            {secondaryActions.length ? (
              <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon variant="subtle" aria-label="More actions">
                    <MoreIcon size="1rem" />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {secondaryActions.map((action) =>
                    action.href ? (
                      <Menu.Item key={action.label} component="a" href={action.href} color={action.color}>
                        {action.label}
                      </Menu.Item>
                    ) : (
                      <Menu.Item key={action.label} onClick={action.onClick} color={action.color}>
                        {action.label}
                      </Menu.Item>
                    ),
                  )}
                </Menu.Dropdown>
              </Menu>
            ) : null}
          </Group>
        </Group>

        {metadata.length ? (
          <Stack gap={6}>
            {metadata.map((item) => (
              <Group key={item.label} justify="space-between" gap="sm">
                <Text size="sm" c="dimmed">
                  {item.label}
                </Text>
                <Text size="sm" fw={500} ta="right">
                  {item.value}
                </Text>
              </Group>
            ))}
          </Stack>
        ) : null}

        {primaryAction ? <Group justify="space-between">{primaryAction}</Group> : null}
        {footer}
      </Stack>
    </Card>
  );
}
