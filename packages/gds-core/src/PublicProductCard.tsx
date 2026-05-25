import type { ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import { AspectRatio, Badge, Card, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { GdsIcons } from './icons';

export type PublicProductCardState = 'available' | 'limited' | 'sold-out' | 'preorder';
export type PublicProductCardHelperKind = 'supporting' | 'pickup' | 'inventory';

export interface PublicProductCardMetaItem {
  label: string;
  value: ReactNode;
}

export interface PublicProductCardProps {
  title: string;
  description?: ReactNode;
  image?: ReactNode;
  imageAlt?: string;
  price?: ReactNode;
  helperText?: ReactNode;
  helperKind?: PublicProductCardHelperKind;
  pickupNote?: ReactNode;
  inventoryNote?: ReactNode;
  state?: PublicProductCardState;
  stateLabels?: Partial<Record<PublicProductCardState, string>>;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  metadata?: PublicProductCardMetaItem[];
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const stateConfig: Record<PublicProductCardState, { label: string; color: string }> = {
  available: { label: 'Available', color: 'teal' },
  limited: { label: 'Limited', color: 'yellow' },
  'sold-out': { label: 'Sold out', color: 'red' },
  preorder: { label: 'Preorder', color: 'violet' },
};

function enhanceAction(action: ReactNode, disabled: boolean) {
  if (!isValidElement(action)) {
    return action;
  }

  return cloneElement(action as ReactElement<Record<string, unknown>>, {
    disabled: disabled || Boolean((action.props as { disabled?: boolean }).disabled),
    'aria-disabled': disabled || undefined,
  });
}

function ImageFallback({ compact }: { compact: boolean }) {
  return (
    <AspectRatio ratio={compact ? 16 / 9 : 4 / 3}>
      <ThemeIcon
        size="100%"
        radius="md"
        variant="light"
        color="gray"
        aria-label="No product image available"
      >
        <GdsIcons.Gallery size={compact ? '1.5rem' : '2rem'} />
      </ThemeIcon>
    </AspectRatio>
  );
}

function LoadingCard({ compact }: { compact: boolean }) {
  return (
    <Card withBorder radius="lg" padding={compact ? 'md' : 'lg'}>
      <Stack gap="md">
        <AspectRatio ratio={compact ? 16 / 9 : 4 / 3}>
          <Skeleton radius="md" />
        </AspectRatio>
        <Stack gap="xs">
          <Skeleton height={20} radius="sm" width="70%" />
          <Skeleton height={14} radius="sm" width="100%" />
          <Skeleton height={14} radius="sm" width="85%" />
        </Stack>
        <Group justify="space-between" align="center">
          <Skeleton height={18} radius="sm" width={72} />
          <Skeleton height={36} radius="md" width={120} />
        </Group>
      </Stack>
    </Card>
  );
}

export function PublicProductCard({
  title,
  description,
  image,
  price,
  helperText,
  helperKind = 'supporting',
  pickupNote,
  inventoryNote,
  state = 'available',
  stateLabels,
  primaryAction,
  secondaryAction,
  metadata = [],
  compact = false,
  loading = false,
  disabled = false,
}: PublicProductCardProps) {
  if (loading) {
    return <LoadingCard compact={compact} />;
  }

  const isActionDisabled = disabled || state === 'sold-out';
  const resolvedPrimaryAction = enhanceAction(primaryAction, isActionDisabled);
  const resolvedSecondaryAction = enhanceAction(secondaryAction, disabled);
  const stateBadge = {
    ...stateConfig[state],
    label: stateLabels?.[state] ?? stateConfig[state].label,
  };
  const supportingHelper = helperKind === 'supporting' ? helperText : null;
  const pickupHelper = helperKind === 'pickup' ? helperText : pickupNote;
  const inventoryHelper = helperKind === 'inventory' ? helperText : inventoryNote;
  const hasSupportingRegion = Boolean(price || supportingHelper || pickupHelper || inventoryHelper);

  return (
    <Card withBorder radius="lg" padding={compact ? 'md' : 'lg'}>
      <Stack gap={compact ? 'sm' : 'md'}>
        {image ?? <ImageFallback compact={compact} />}

        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Title order={compact ? 5 : 4} lineClamp={2}>
              {title}
            </Title>
            {description ? (
              <Text size="sm" c="dimmed" lineClamp={compact ? 2 : 3}>
                {description}
              </Text>
            ) : null}
          </Stack>
          <Badge variant="light" color={stateBadge.color}>
            {stateBadge.label}
          </Badge>
        </Group>

        {hasSupportingRegion ? (
          <Group justify="space-between" align="flex-end" gap="sm" wrap="nowrap">
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              {price ? (
                <Text fw={700} size={compact ? 'md' : 'lg'}>
                  {price}
                </Text>
              ) : null}
              {supportingHelper ? (
                <Text size="xs" c="dimmed">
                  {supportingHelper}
                </Text>
              ) : null}
            </Stack>
            {resolvedPrimaryAction}
          </Group>
        ) : resolvedPrimaryAction ? (
          <Group justify="flex-end">{resolvedPrimaryAction}</Group>
        ) : null}

        {(pickupHelper || inventoryHelper || metadata.length) ? (
          <Stack gap={6}>
            {pickupHelper ? (
              <Group justify="space-between" gap="sm">
                <Text size="sm" c="dimmed">
                  Pickup
                </Text>
                <Text size="sm" fw={500} ta="right">
                  {pickupHelper}
                </Text>
              </Group>
            ) : null}
            {inventoryHelper ? (
              <Group justify="space-between" gap="sm">
                <Text size="sm" c="dimmed">
                  Availability
                </Text>
                <Text size="sm" fw={500} ta="right">
                  {inventoryHelper}
                </Text>
              </Group>
            ) : null}
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

        {resolvedSecondaryAction ? <Group justify="flex-end">{resolvedSecondaryAction}</Group> : null}
      </Stack>
    </Card>
  );
}
