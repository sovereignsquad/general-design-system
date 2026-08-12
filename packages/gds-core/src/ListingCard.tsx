import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { ActionIcon, AspectRatio, Badge, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { GdsVocabulary, getSemanticActionLabel, type SemanticAction } from './vocabulary';
import { resolveGdsCardContract, type GdsCardDensity, type GdsCardInteractiveMode, type GdsCardSize, type GdsCardVariant } from './CardContracts';

/** Aspect ratio for a `ListingCard`'s media slot. */
export type ListingCardMediaRatio = '1:1' | '4:3' | '16:9';

/** One key/value metadata row shown in a `ListingCard` (with an optional icon and tone). */
export interface ListingMetadataRow {
  id: string;
  label: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
}

/** A save/share-style affordance on a `ListingCard`, described by a semantic `action` and its handler/href. */
export interface ListingCardAffordance {
  action: SemanticAction;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  disabled?: boolean;
  active?: boolean;
}

/** Props for {@link ListingCard}. */
export interface ListingCardProps {
  title: ReactNode;
  href?: string;
  description?: ReactNode;
  image?: ReactNode;
  imageAlt?: string;
  mediaRatio?: ListingCardMediaRatio;
  metadata?: ListingMetadataRow[];
  featured?: boolean;
  sponsoredDisclosure?: ReactNode;
  price?: ReactNode;
  rating?: ReactNode;
  ratingLabel?: string;
  primaryAction?: ReactNode;
  /** "Why this fits" reason content (e.g. 2–4 reasons). Rendered as a labeled region. */
  reason?: ReactNode;
  /** Accessible label for the reason region. */
  reasonLabel?: string;
  /** Match-quality element, typically a `<FitScoreChip />`. */
  score?: ReactNode;
  /** Footer affordances (2–4). When present, replaces the default primaryAction footer slot. */
  actions?: ReactNode[];
  saveAction?: ListingCardAffordance;
  saved?: boolean;
  shareAction?: ListingCardAffordance;
  compact?: boolean;
  size?: GdsCardSize;
  density?: GdsCardDensity;
  variant?: GdsCardVariant;
  interactiveMode?: GdsCardInteractiveMode;
  revealContent?: ReactNode;
  onSurfaceActivate?: () => void;
  defaultFlipped?: boolean;
}

const ratioMap: Record<ListingCardMediaRatio, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
};

const toneColorMap: Record<NonNullable<ListingMetadataRow['tone']>, string | undefined> = {
  default: undefined,
  positive: 'teal',
  warning: 'orange',
  muted: 'gray',
};

/** Maximum footer affordances a `ListingCard` renders; extra `actions` are dropped past this cap. */
export const MAX_LISTING_CARD_ACTIONS = 4;

function resolveCardActions(actions?: ReactNode[]): ReactNode[] | null {
  if (!actions || actions.length === 0) {
    return null;
  }
  if (actions.length > MAX_LISTING_CARD_ACTIONS) {
    throw new Error(`ListingCard supports at most ${MAX_LISTING_CARD_ACTIONS} actions, received ${actions.length}.`);
  }
  return actions;
}

function isNestedInteractiveTarget(eventTarget: EventTarget | null, currentTarget: EventTarget | null) {
  if (!(eventTarget instanceof Element) || !(currentTarget instanceof Element)) {
    return false;
  }

  const nestedInteractive = eventTarget.closest('a, button, input, select, textarea, [role="button"], [role="link"]');
  return Boolean(nestedInteractive && nestedInteractive !== currentTarget);
}

function ListingImageFallback({ mediaRatio }: { mediaRatio: ListingCardMediaRatio }) {
  return (
    <AspectRatio ratio={ratioMap[mediaRatio]}>
      <ThemeIcon
        size="100%"
        radius="md"
        variant="light"
        color="gray"
        aria-label="No listing image available"
      >
        <GdsIcons.Gallery size="2rem" />
      </ThemeIcon>
    </AspectRatio>
  );
}

function ListingAffordance({ affordance }: { affordance: ListingCardAffordance }) {
  const config = GdsVocabulary[affordance.action];
  const Icon = config.icon;
  const label = affordance.ariaLabel ?? getSemanticActionLabel(affordance.action);
  const activeStyle = affordance.active
    ? {
        color: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
        background: 'var(--gds-brand-accent-tint, var(--mantine-color-default-hover))',
      }
    : undefined;

  if (affordance.href) {
    return (
      <ActionIcon
        component="a"
        href={affordance.href}
        variant="subtle"
        size="lg"
        aria-label={label}
        data-gds-active={affordance.active ? 'true' : undefined}
        style={activeStyle}
        disabled={affordance.disabled}
      >
        <Icon size="1rem" stroke={1.75} />
      </ActionIcon>
    );
  }

  return (
    <ActionIcon
      variant="subtle"
      size="lg"
      aria-label={label}
      onClick={affordance.onClick}
      data-gds-active={affordance.active ? 'true' : undefined}
      style={activeStyle}
      disabled={affordance.disabled}
    >
      <Icon size="1rem" stroke={1.75} />
    </ActionIcon>
  );
}

/**
 * Governed listing/result card for search, catalog, and recommendation surfaces:
 * media, title, description, metadata rows, price/rating, an optional match
 * `score` and "why this fits" `reason` region, and up to
 * {@link MAX_LISTING_CARD_ACTIONS} footer affordances plus save/share actions.
 * Honors the shared card contract (`size`/`density`/`variant`/`interactiveMode`)
 * and supports an optional flip-to-reveal back face via `revealContent`.
 */
export function ListingCard({
  title,
  href,
  description,
  image,
  mediaRatio = '4:3',
  metadata = [],
  featured = false,
  sponsoredDisclosure,
  price,
  rating,
  ratingLabel = 'Rating',
  primaryAction,
  reason,
  reasonLabel = 'Why this fits',
  score,
  actions,
  saveAction,
  saved = false,
  shareAction,
  compact = false,
  size = 'md',
  density = 'comfortable',
  variant = 'default',
  interactiveMode = 'none',
  revealContent,
  onSurfaceActivate,
  defaultFlipped = false,
}: ListingCardProps) {
  const [flipped, setFlipped] = useState(defaultFlipped);
  const resolvedActions = resolveCardActions(actions);
  const contract = resolveGdsCardContract({ compact, size, density, variant });
  const resolvedSaveAction = saveAction ? { ...saveAction, active: saveAction.active ?? saved } : undefined;
  const cardPadding = contract.padding;
  const isInteractive = interactiveMode !== 'none';
  const isFlipMode = interactiveMode === 'flip' && Boolean(revealContent);
  const titleContent =
    href && typeof title === 'string' && interactiveMode === 'none' ? (
      <Text component="a" href={href} inherit td="none">
        {title}
      </Text>
    ) : (
      title
    );

  const activateSurface = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    if (isNestedInteractiveTarget(event.target, event.currentTarget)) {
      return;
    }

    if (isFlipMode) {
      setFlipped((current) => !current);
      onSurfaceActivate?.();
      return;
    }

    if (interactiveMode === 'surface-button') {
      onSurfaceActivate?.();
      return;
    }

    if (interactiveMode === 'surface-link' && href) {
      onSurfaceActivate?.();
      if (typeof window !== 'undefined') {
        window.location.assign(href);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isInteractive || isNestedInteractiveTarget(event.target, event.currentTarget)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateSurface(event);
    }
  };

  const surfaceLabel = typeof title === 'string' ? title : 'listing';
  const interactiveProps = isInteractive
    ? {
        role: interactiveMode === 'surface-link' ? 'link' : 'button',
        tabIndex: 0,
        onClick: activateSurface,
        onKeyDown: handleKeyDown,
        'aria-expanded': isFlipMode ? flipped : undefined,
        'aria-label': isFlipMode ? `Toggle details for ${surfaceLabel}` : surfaceLabel,
      }
    : {};

  return (
    <Card
      withBorder
      radius="lg"
      padding={cardPadding}
      {...contract.dataAttributes}
      data-gds-listing-card
      data-gds-card-interactive-mode={interactiveMode}
      data-gds-card-flipped={isFlipMode ? String(flipped) : undefined}
      style={{
        background: 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-body)))',
        borderColor: 'var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-default-border)))',
        ...(isInteractive ? { cursor: 'pointer', transition: 'transform var(--gds-motion-duration-fast) var(--gds-motion-ease-standard), box-shadow var(--gds-motion-duration-fast) var(--gds-motion-ease-standard)' } : {}),
      }}
      {...interactiveProps}
    >
      <Stack gap={contract.gap}>
        {isFlipMode && flipped ? (
          revealContent
        ) : (
          <>
            {image ?? <ListingImageFallback mediaRatio={mediaRatio} />}

            {(featured || sponsoredDisclosure) ? (
              <Group justify="space-between" gap="sm" wrap="wrap">
                {featured ? (
                  <Badge variant="light" color="violet">
                    Featured
                  </Badge>
                ) : (
                  <span />
                )}
                {sponsoredDisclosure ? (
                  <Text size="xs" c="dimmed">
                    {sponsoredDisclosure}
                  </Text>
                ) : null}
              </Group>
            ) : null}

            <Stack gap={4}>
              <Title order={contract.titleOrder} lineClamp={2}>
                {titleContent}
              </Title>
              {description ? (
                <Text size="sm" c="dimmed" lineClamp={contract.descriptionClamp}>
                  {description}
                </Text>
              ) : null}
            </Stack>

            {metadata.length ? (
              <Stack gap="xs">
                {metadata.map((item) => (
                  <Group key={item.id} justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                      {item.icon}
                      <Text size="sm" c={item.tone ? toneColorMap[item.tone] : 'dimmed'} lineClamp={1}>
                        {item.label}
                      </Text>
                    </Group>
                    {item.value ? (
                      <Text size="sm" fw={500} ta="right">
                        {item.value}
                      </Text>
                    ) : null}
                  </Group>
                ))}
              </Stack>
            ) : null}

            {reason ? (
              <Stack gap={4} role="group" aria-label={reasonLabel}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {reasonLabel}
                </Text>
                {reason}
              </Stack>
            ) : null}

            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                {price ? (
                  <Text
                    fw={700}
                    size={contract.size === 'xs' || contract.size === 'sm' ? 'md' : 'lg'}
                    style={{ color: 'var(--gds-price, var(--gds-brand-accent-action, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))' }}
                  >
                    {price}
                  </Text>
                ) : null}
                {rating ? (
                  <Group gap={4} wrap="nowrap" aria-label={ratingLabel}>
                    <GdsIcons.Star
                      size="1rem"
                      stroke={1.75}
                      fill="currentColor"
                      style={{ color: 'var(--gds-star, var(--gds-brand-accent-action, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))' }}
                    />
                    <Text size="sm" fw={600} style={{ color: 'var(--gds-star, var(--gds-brand-accent-action, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))' }}>
                      {rating}
                    </Text>
                  </Group>
                ) : null}
              </Stack>

              {score ? <Group gap="xs" wrap="nowrap">{score}</Group> : null}

              <Group gap="xs" wrap="nowrap" justify="flex-end" style={{ marginInlineStart: 'auto' }}>
                {resolvedSaveAction ? <ListingAffordance affordance={resolvedSaveAction} /> : null}
                {shareAction ? <ListingAffordance affordance={shareAction} /> : null}
                {resolvedActions ? null : primaryAction}
                {isFlipMode ? <Text size="xs" c="dimmed">Press Enter or Space to reveal details.</Text> : null}
              </Group>
            </Group>

            {resolvedActions ? (
              <Group gap="sm" wrap="wrap" role="group" aria-label="Listing actions">
                {resolvedActions.map((action, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={index}>{action}</span>
                ))}
              </Group>
            ) : null}
          </>
        )}
      </Stack>
    </Card>
  );
}
