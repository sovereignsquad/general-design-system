import type { ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import { AspectRatio, Badge, Card, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { resolveGdsCardContract, type GdsCardDensity, type GdsCardInteractiveMode, type GdsCardSize, type GdsCardVariant } from './CardContracts';

/** Availability state driving the product card's status badge and action gating. */
export type PublicProductCardState = 'available' | 'limited' | 'sold-out' | 'preorder';
/** Which supporting region the `helperText` targets: general supporting copy, pickup, or inventory. */
export type PublicProductCardHelperKind = 'supporting' | 'pickup' | 'inventory';

/** A labeled metadata row shown in the product card's detail list. */
export interface PublicProductCardMetaItem {
  label: string;
  value: ReactNode;
}

/** Props for {@link PublicProductCard}. */
export interface PublicProductCardProps {
  title: string;
  description?: ReactNode;
  /** Media node; an icon placeholder is shown when omitted. */
  image?: ReactNode;
  imageAlt?: string;
  price?: ReactNode;
  /** Supporting copy routed to the region named by `helperKind`. */
  helperText?: ReactNode;
  /** Which region `helperText` fills; defaults to `'supporting'`. */
  helperKind?: PublicProductCardHelperKind;
  /** Pickup detail row; also the fallback when `helperKind` is not `'pickup'`. */
  pickupNote?: ReactNode;
  /** Availability detail row; also the fallback when `helperKind` is not `'inventory'`. */
  inventoryNote?: ReactNode;
  /** Availability state; defaults to `'available'`. */
  state?: PublicProductCardState;
  /** Per-state overrides for the status badge label. */
  stateLabels?: Partial<Record<PublicProductCardState, string>>;
  /** Primary CTA; auto-disabled when the card is disabled or sold out. */
  primaryAction?: ReactNode;
  /** Secondary action; disabled when the card is disabled. */
  secondaryAction?: ReactNode;
  metadata?: PublicProductCardMetaItem[];
  compact?: boolean;
  size?: GdsCardSize;
  density?: GdsCardDensity;
  variant?: GdsCardVariant;
  /** When true, renders a skeleton loading card. */
  loading?: boolean;
  disabled?: boolean;
  /** Whether the whole surface is interactive; `'surface-button'` makes the card a button. */
  interactiveMode?: GdsCardInteractiveMode;
  /** Called when the surface is activated in `'surface-button'` mode. */
  onSurfaceActivate?: () => void;
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

function LoadingCard({ compact, size, density, variant }: { compact: boolean; size: GdsCardSize; density: GdsCardDensity; variant: GdsCardVariant }) {
  const contract = resolveGdsCardContract({ compact, size, density, variant });

  return (
    <Card withBorder radius="lg" padding={contract.padding} {...contract.dataAttributes}>
      <Stack gap={contract.gap}>
        <AspectRatio ratio={contract.mediaRatio}>
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

/**
 * Public-facing product card: media (or placeholder), title/description, an
 * availability badge, price with supporting/pickup/inventory helper rows, metadata,
 * and primary/secondary actions. Actions are auto-disabled when disabled or sold out,
 * a skeleton renders while `loading`, and the whole surface can act as a button via
 * `interactiveMode`. Sizing derives from the resolved card contract.
 */
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
  size = 'md',
  density = 'comfortable',
  variant = 'default',
  loading = false,
  disabled = false,
  interactiveMode = 'none',
  onSurfaceActivate,
}: PublicProductCardProps) {
  const contract = resolveGdsCardContract({ compact, size, density, variant });

  if (loading) {
    return <LoadingCard compact={compact} size={size} density={density} variant={variant} />;
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

  const interactiveProps = interactiveMode === 'surface-button'
    ? { component: 'button' as const, type: 'button' as const, onClick: onSurfaceActivate }
    : {};

  return (
    <Card withBorder radius="lg" padding={contract.padding} {...contract.dataAttributes} {...interactiveProps}>
      <Stack gap={contract.gap}>
        {image ?? <ImageFallback compact={compact} />}

        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
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

        {hasSupportingRegion ? (
          <Group justify="space-between" align="flex-end" gap="sm" wrap="nowrap">
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              {price ? (
                <Text fw={700} size={contract.size === 'xs' || contract.size === 'sm' ? 'md' : 'lg'}>
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
