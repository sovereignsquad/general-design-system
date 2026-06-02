import type { ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import { AspectRatio, Badge, Card, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { resolveGdsCardContract, type GdsCardDensity, type GdsCardSize, type GdsCardVariant } from './CardContracts';

export type FoodCardAvailabilityState = 'available' | 'preorder' | 'limited' | 'sold-out' | 'coming-soon';
export type FoodCardMediaRatio = 'square' | 'dish' | 'landscape';

export interface FoodCardMarker {
  id: string;
  label: string;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
}

export interface FoodCardMetadata {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
}

export interface PublicFoodCardProps {
  title: ReactNode;
  description?: ReactNode;
  image?: ReactNode;
  imageAlt?: string;
  price?: ReactNode;
  priceNote?: ReactNode;
  state: FoodCardAvailabilityState;
  helperText?: ReactNode;
  pickupNote?: ReactNode;
  freshnessNote?: ReactNode;
  markers?: FoodCardMarker[];
  metadata?: FoodCardMetadata[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  quantityHint?: ReactNode;
  mediaRatio?: FoodCardMediaRatio;
  size?: GdsCardSize;
  density?: GdsCardDensity;
  variant?: GdsCardVariant;
  loading?: boolean;
  disabled?: boolean;
}

const ratioMap: Record<FoodCardMediaRatio, number> = {
  square: 1,
  dish: 4 / 3,
  landscape: 16 / 9,
};

const stateConfig: Record<FoodCardAvailabilityState, { label: string; color: string }> = {
  available: { label: 'Available', color: 'teal' },
  preorder: { label: 'Preorder', color: 'violet' },
  limited: { label: 'Limited batch', color: 'yellow' },
  'sold-out': { label: 'Sold out', color: 'red' },
  'coming-soon': { label: 'Coming soon', color: 'gray' },
};

const markerToneMap: Record<NonNullable<FoodCardMarker['tone']>, string> = {
  default: 'gray',
  positive: 'teal',
  warning: 'orange',
  muted: 'dark',
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

function FoodImageFallback({ mediaRatio }: { mediaRatio: FoodCardMediaRatio }) {
  return (
    <AspectRatio ratio={ratioMap[mediaRatio]}>
      <ThemeIcon size="100%" radius="md" variant="light" color="gray" aria-label="No food image available">
        <GdsIcons.Gallery size="2rem" />
      </ThemeIcon>
    </AspectRatio>
  );
}

function LoadingFoodCard({ mediaRatio, size, density, variant }: { mediaRatio: FoodCardMediaRatio; size: GdsCardSize; density: GdsCardDensity; variant: GdsCardVariant }) {
  const contract = resolveGdsCardContract({ size, density, variant });

  return (
    <Card withBorder radius="lg" padding={contract.padding} {...contract.dataAttributes}>
      <Stack gap={contract.gap}>
        <AspectRatio ratio={ratioMap[mediaRatio]}>
          <Skeleton radius="md" />
        </AspectRatio>
        <Stack gap="xs">
          <Skeleton height={20} radius="sm" width="72%" />
          <Skeleton height={14} radius="sm" width="96%" />
          <Skeleton height={14} radius="sm" width="78%" />
        </Stack>
        <Group justify="space-between" align="center">
          <Skeleton height={18} radius="sm" width={96} />
          <Skeleton height={36} radius="md" width={112} />
        </Group>
      </Stack>
    </Card>
  );
}

export function PublicFoodCard({
  title,
  description,
  image,
  price,
  priceNote,
  state,
  helperText,
  pickupNote,
  freshnessNote,
  markers = [],
  metadata = [],
  primaryAction,
  secondaryAction,
  quantityHint,
  mediaRatio = 'dish',
  size = 'md',
  density = 'comfortable',
  variant = 'default',
  loading = false,
  disabled = false,
}: PublicFoodCardProps) {
  const contract = resolveGdsCardContract({ size, density, variant });

  if (loading) {
    return <LoadingFoodCard mediaRatio={mediaRatio} size={size} density={density} variant={variant} />;
  }

  const stateBadge = stateConfig[state];
  const isActionDisabled = disabled || state === 'sold-out' || state === 'coming-soon';
  const resolvedPrimaryAction = enhanceAction(primaryAction, isActionDisabled);
  const resolvedSecondaryAction = enhanceAction(secondaryAction, disabled);

  return (
    <Card withBorder radius="lg" padding={contract.padding} {...contract.dataAttributes}>
      <Stack gap={contract.gap}>
        {image ?? <FoodImageFallback mediaRatio={mediaRatio} />}

        {(markers.length > 0 || quantityHint) ? (
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group gap="xs" wrap="wrap">
              {markers.map((marker) => (
                <Badge key={marker.id} variant="light" color={markerToneMap[marker.tone ?? 'default']}>
                  {marker.label}
                </Badge>
              ))}
            </Group>
            {quantityHint ? (
              <Text size="xs" fw={600} c="dimmed">
                {quantityHint}
              </Text>
            ) : null}
          </Group>
        ) : null}

        <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Title order={contract.titleOrder} lineClamp={2}>
              {title}
            </Title>
            {description ? (
              <Text size="sm" c="dimmed" lineClamp={contract.descriptionClamp}>
                {description}
              </Text>
            ) : null}
          </Stack>
          <Badge variant="light" color={stateBadge.color}>
            {stateBadge.label}
          </Badge>
        </Group>

        <Group justify="space-between" align="flex-end" gap="sm" wrap="nowrap">
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            {price ? (
              <Text fw={800} size={contract.size === 'xs' || contract.size === 'sm' ? 'md' : 'lg'}>
                {price}
              </Text>
            ) : null}
            {priceNote ? (
              <Text size="xs" c="dimmed">
                {priceNote}
              </Text>
            ) : null}
            {helperText ? (
              <Text size="sm" c="dimmed">
                {helperText}
              </Text>
            ) : null}
          </Stack>
          {resolvedPrimaryAction}
        </Group>

        {(pickupNote || freshnessNote || metadata.length > 0) ? (
          <Stack gap={6}>
            {pickupNote ? (
              <Group justify="space-between" align="flex-start" gap="sm">
                <Text size="sm" c="dimmed">
                  Pickup
                </Text>
                <Text size="sm" fw={500} ta="right">
                  {pickupNote}
                </Text>
              </Group>
            ) : null}
            {freshnessNote ? (
              <Group justify="space-between" align="flex-start" gap="sm">
                <Text size="sm" c="dimmed">
                  Freshness
                </Text>
                <Text size="sm" fw={500} ta="right">
                  {freshnessNote}
                </Text>
              </Group>
            ) : null}
            {metadata.map((item) => (
              <Group key={item.id} justify="space-between" align="flex-start" gap="sm">
                <Group gap="xs" wrap="nowrap">
                  {item.icon}
                  <Text size="sm" c="dimmed">
                    {item.label}
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        ) : null}

        {resolvedSecondaryAction ? <Group justify="flex-end">{resolvedSecondaryAction}</Group> : null}
      </Stack>
    </Card>
  );
}
