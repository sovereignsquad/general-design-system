import type { ReactNode } from 'react';
import { Badge, Card, Group, Menu, Stack, Text, ThemeIcon, Title, ActionIcon } from '@mantine/core';
import { GdsIcons } from './icons';
import { resolveGdsCardContract, type GdsCardDensity, type GdsCardSize, type GdsCardVariant } from './CardContracts';

/** A label/value pair shown in the card's metadata list. */
export interface ProductCardMetaItem {
  label: string;
  value: ReactNode;
}

/** A secondary action rendered in the card's overflow menu. */
export interface ProductCardAction {
  label: string;
  onClick?: () => void;
  /** Renders the item as a link when set, instead of a button. */
  href?: string;
  color?: string;
}

/** Props for {@link ProductCard}. */
export interface ProductCardProps {
  title: string;
  description?: ReactNode;
  /** Optional media rendered at the top of the card. */
  media?: ReactNode;
  /** Optional leading icon shown in a theme-icon badge. */
  icon?: ReactNode;
  /** Status indicator; strings render as a light badge, otherwise rendered as-is. */
  status?: ReactNode;
  /** Label/value pairs listed in the card body. */
  metadata?: ProductCardMetaItem[];
  /** Primary action rendered in the card footer. */
  primaryAction?: ReactNode;
  /** Actions collapsed into an overflow ("More actions") menu. */
  secondaryActions?: ProductCardAction[];
  footer?: ReactNode;
  /** Card size token from the GDS card contract. Defaults to "md". */
  size?: GdsCardSize;
  /** Card density token from the GDS card contract. Defaults to "comfortable". */
  density?: GdsCardDensity;
  /** Card variant token from the GDS card contract. Defaults to "default". */
  variant?: GdsCardVariant;
}

/**
 * Governed product card composing media, an optional icon, title/description, a
 * status badge, a metadata list, a primary action, and secondary actions collapsed
 * into an overflow menu. Padding, gap, and title level come from the card contract.
 */
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
  density = 'comfortable',
  variant = 'default',
}: ProductCardProps) {
  const MoreIcon = GdsIcons.Menu;
  const contract = resolveGdsCardContract({ size, density, variant });

  return (
    <Card withBorder radius="lg" padding={contract.padding} {...contract.dataAttributes}>
      <Stack gap={contract.gap}>
        {media}

        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group align="flex-start" gap="sm" wrap="nowrap">
            {icon ? (
              <ThemeIcon variant="light" size="xl" radius="xl" aria-hidden>
                {icon}
              </ThemeIcon>
            ) : null}
            <Stack gap={4}>
              <Title order={contract.titleOrder}>{title}</Title>
              {description ? (
                <Text size="sm" c="dimmed" lineClamp={contract.descriptionClamp}>
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
                  <ActionIcon variant="subtle" size="xl" aria-label="More actions">
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
