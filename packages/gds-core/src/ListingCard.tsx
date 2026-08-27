import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { ActionIcon, Badge, Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { GdsGeneratedThumbnail } from './GdsGeneratedThumbnail';
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
  /**
   * `contained` (default) keeps the usual subtle disc. `outline-on-media` drops the disc entirely
   * and carries a shadow instead, so the glyph stays legible directly over a photograph — the
   * presentation a save control needs when it sits on the media rather than in the footer
   * (issue 679).
   */
  presentation?: 'contained' | 'outline-on-media';
}

/** Props for {@link ListingCard}. */
export interface ListingCardProps {
  title: ReactNode;
  href?: string;
  description?: ReactNode;
  image?: ReactNode;
  imageAlt?: string;
  /**
   * Stable identity seeding the generated thumbnail shown when no `image` is supplied — same
   * seed, same composition, every render. Defaults to `href`, then `imageAlt`, then the title
   * when it is a plain string. Supply it explicitly when a listing's title or URL can change
   * while the listing itself does not, so its art stays put.
   */
  mediaSeed?: string;
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
  /**
   * Content overlaid on the media's top-left corner — typically a category pill. A theme cannot
   * express this (it is composition, not a default), and absolute positioning it consumer-side
   * would be a page-local reimplementation, so the card owns it (issue 679).
   */
  mediaOverlay?: ReactNode;
  /**
   * Affordance overlaid on the media's top-right corner, e.g. a save control that sits on the
   * photo rather than in the footer. Pass `presentation: 'outline-on-media'` for the no-disc form.
   */
  mediaAffordance?: ListingCardAffordance;
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

/**
 * Fallback when no image is supplied: deterministic branded art from the listing's identity
 * (same seed, same composition every render), themed by the active preset.
 */
function ListingImageFallback({
  mediaRatio,
  seed,
  title,
}: {
  mediaRatio: ListingCardMediaRatio;
  seed: string;
  title: string;
}) {
  return (
    <GdsGeneratedThumbnail
      seed={seed}
      // Title used as the category label; no invented taxonomy.
      categories={[{ key: 'listing', label: title, icon: 'Gallery' }]}
      // Title already renders below; avoids duplicate text.
      badges="none"
      aspectRatio={mediaRatio === '1:1' ? '1:1' : mediaRatio === '16:9' ? '16:9' : '4:3'}
    />
  );
}

function ListingAffordance({ affordance }: { affordance: ListingCardAffordance }) {
  const config = GdsVocabulary[affordance.action];
  const Icon = config.icon;
  const label = affordance.ariaLabel ?? getSemanticActionLabel(affordance.action);
  const onMedia = affordance.presentation === 'outline-on-media';
  // No disc: the glyph reads directly against the photograph, so it carries its own shadow
  // rather than relying on a container for separation. Tokens, not literals, so any preset
  // can recolour it.
  const mediaStyle = onMedia
    ? {
        background: 'transparent',
        color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55))',
      }
    : undefined;
  const activeStyle = affordance.active
    ? {
        // Accent on its own tint is 1.60:1 in high-contrast dark; use the tint's derived foreground.
        color: 'var(--gds-brand-accent-tint-fg, var(--gds-brand-accent-action, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
        background: 'var(--gds-brand-accent-tint, var(--mantine-color-default-hover))',
      }
    : undefined;

  if (affordance.href) {
    return (
      <ActionIcon
        component="a"
        href={affordance.href}
        variant={onMedia ? 'transparent' : 'subtle'}
        size="xl"
        aria-label={label}
        data-gds-active={affordance.active ? 'true' : undefined}
        style={{ ...mediaStyle, ...activeStyle }}
        disabled={affordance.disabled}
      >
        <Icon size="1rem" stroke={1.75} />
      </ActionIcon>
    );
  }

  return (
    <ActionIcon
      variant={onMedia ? 'transparent' : 'subtle'}
      size="xl"
      aria-label={label}
      onClick={affordance.onClick}
      data-gds-active={affordance.active ? 'true' : undefined}
      style={{ ...mediaStyle, ...activeStyle }}
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
  imageAlt,
  mediaSeed,
  mediaRatio = '4:3',
  metadata = [],
  featured = false,
  sponsoredDisclosure,
  price,
  rating,
  ratingLabel: ratingLabelProp,
  primaryAction,
  reason,
  reasonLabel: reasonLabelProp,
  score,
  actions,
  mediaOverlay,
  mediaAffordance,
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
  const { t } = useGdsTranslation();
  const ratingLabel = ratingLabelProp ?? t('gds.listingCard.ratingLabel', "Rating");
  const reasonLabel = reasonLabelProp ?? t('gds.listingCard.reasonLabel', "Why this fits");

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
            {(mediaOverlay || mediaAffordance) ? (
              // Positioned wrapper only when something is actually overlaid, so a card without
              // overlays keeps its previous DOM exactly (issue 679).
              <Box style={{ position: 'relative' }}>
                {image ?? (
                  <ListingImageFallback
                    mediaRatio={mediaRatio}
                    seed={mediaSeed ?? href ?? imageAlt ?? (typeof title === 'string' ? title : 'gds-listing')}
                    title={typeof title === 'string' ? title : (imageAlt ?? 'Listing')}
                  />
                )}
                {mediaOverlay ? (
                  <Box style={{ position: 'absolute', top: 'var(--mantine-spacing-xs)', left: 'var(--mantine-spacing-xs)', zIndex: 1 }}>
                    {mediaOverlay}
                  </Box>
                ) : null}
                {mediaAffordance ? (
                  <Box style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
                    <ListingAffordance affordance={mediaAffordance} />
                  </Box>
                ) : null}
              </Box>
            ) : (
              image ?? (
                <ListingImageFallback
                  mediaRatio={mediaRatio}
                  seed={mediaSeed ?? href ?? imageAlt ?? (typeof title === 'string' ? title : 'gds-listing')}
                  title={typeof title === 'string' ? title : (imageAlt ?? 'Listing')}
                />
              )
            )}

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
