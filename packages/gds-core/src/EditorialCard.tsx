import type { ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { Anchor, Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { GdsGeneratedThumbnail } from './GdsGeneratedThumbnail';
import { resolveGdsCardContract, type GdsCardDensity, type GdsCardSize, type GdsCardVariant } from './CardContracts';

/** Visual variant of an editorial card: standard, featured, or a base GDS card variant. */
export type EditorialCardVariant = 'standard' | 'featured' | GdsCardVariant;

/** Props for {@link EditorialCard}. */
export interface EditorialCardProps {
  /** Media rendered in the card's top section; falls back to a gallery-icon placeholder. */
  media?: ReactNode;
  /** Accessible label used on the CTA anchor when set. */
  mediaAlt?: string;
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  /** Badge; strings render as a toned light badge, otherwise rendered as-is. */
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Supplementary meta line beneath the description. */
  meta?: ReactNode;
  /** Call-to-action label. Defaults to "Explore". */
  ctaLabel?: ReactNode;
  /** Renders the whole card as a link when set. */
  href?: string;
  /** Renders the whole card as a button when set (and `href` is absent). */
  onClick?: () => void;
  /** Color tone applied to accents and the featured background. Defaults to "default". */
  tone?: 'default' | 'warm' | 'cool' | 'muted';
  /** Card variant; "featured" tints the background. Defaults to "standard". */
  variant?: EditorialCardVariant;
  /** Card size token from the GDS card contract. Defaults to "md". */
  size?: GdsCardSize;
  /** Card density token from the GDS card contract. Defaults to "comfortable". */
  density?: GdsCardDensity;
  /** Optional per-slot class-name overrides. */
  classNames?: {
    root?: string;
    media?: string;
    body?: string;
    title?: string;
    meta?: string;
    action?: string;
  };
}

const tonePalette = {
  default: {
    accent: 'violet',
    background: 'var(--mantine-color-body)',
  },
  warm: {
    accent: 'orange',
    background:
      'light-dark(var(--mantine-color-orange-0), color-mix(in srgb, var(--mantine-color-orange-9) 16%, var(--mantine-color-body)))',
  },
  cool: {
    accent: 'blue',
    background:
      'light-dark(var(--mantine-color-blue-0), color-mix(in srgb, var(--mantine-color-blue-9) 16%, var(--mantine-color-body)))',
  },
  muted: {
    accent: 'gray',
    background:
      'light-dark(var(--mantine-color-gray-0), color-mix(in srgb, var(--mantine-color-dark-7) 92%, black))',
  },
} as const;

/**
 * Fallback media: deterministic generated thumbnail, seeded from the card's identity.
 * badges="none" avoids duplicating the title the card prints beneath it.
 */
function EditorialMediaFallback({ compact, seed, label }: { compact: boolean; seed: string; label: string }) {
  return (
    <GdsGeneratedThumbnail
      seed={seed}
      categories={[{ key: 'editorial', label, icon: 'Gallery' }]}
      aspectRatio={compact ? '16:9' : '4:3'}
      badges="none"
    />
  );
}

/**
 * Governed editorial/marketing card: media (with an icon fallback), eyebrow, badge,
 * title, description, meta, and a call-to-action. Tinted by `tone`, and rendered as
 * a link or button when `href`/`onClick` is provided.
 */
export function EditorialCard({
  media,
  mediaAlt,
  eyebrow,
  badge,
  title,
  description,
  meta,
  ctaLabel: ctaLabelProp,
  href,
  onClick,
  tone = 'default',
  variant = 'standard',
  size = 'md',
  density = 'comfortable',
  classNames,
}: EditorialCardProps) {
  const { t } = useGdsTranslation();
  const ctaLabel = ctaLabelProp ?? t('gds.editorialCard.ctaLabel', "Explore");

  const compact = variant === 'compact';
  const featured = variant === 'featured';
  const contractVariant: GdsCardVariant = variant === 'standard' || variant === 'featured' ? 'default' : variant;
  const contract = resolveGdsCardContract({ compact, size, density, variant: contractVariant });
  const palette = tonePalette[tone];
  const interactiveProps = href
    ? { component: 'a' as const, href }
    : onClick
      ? { component: 'button' as const, onClick, type: 'button' as const }
      : {};

  return (
    <Card
      className={classNames?.root}
      withBorder
      radius="xl"
      padding={0}
      {...contract.dataAttributes}
      {...interactiveProps}
      style={{
        overflow: 'hidden',
        textAlign: 'left',
        background: featured ? palette.background : 'var(--mantine-color-body)',
        cursor: href || onClick ? 'pointer' : 'default',
      }}
    >
      <Card.Section className={classNames?.media}>{media ?? <EditorialMediaFallback compact={compact} seed={mediaAlt ?? (typeof title === 'string' ? title : 'gds-editorial')} label={typeof title === 'string' ? title : (mediaAlt ?? 'Editorial')} />}</Card.Section>

      <Stack gap={contract.gap} p={contract.padding} className={classNames?.body}>
        <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
          <Stack gap={4} flex={1}>
            {eyebrow ? (
              <Text size="xs" fw={700} c="dimmed">
                {eyebrow}
              </Text>
            ) : null}
            <Title order={contract.titleOrder} className={classNames?.title}>
              {title}
            </Title>
          </Stack>
          {badge ? (
            typeof badge === 'string' ? (
              <Badge color={palette.accent} variant="light">
                {badge}
              </Badge>
            ) : (
              badge
            )
          ) : null}
        </Group>

        {description ? (
          <Text size="sm" c="dimmed" lineClamp={contract.descriptionClamp}>
            {description}
          </Text>
        ) : null}

        {meta ? (
          <Text size="sm" c="dimmed" className={classNames?.meta}>
            {meta}
          </Text>
        ) : null}

        {(href || onClick || ctaLabel) ? (
          <Group
            gap={6}
            c={`light-dark(var(--mantine-color-${palette.accent}-7), var(--mantine-color-${palette.accent}-3))`}
            className={classNames?.action}
          >
            <Text fw={600} size="sm">
              {ctaLabel}
            </Text>
            <Anchor
              component="span"
              underline="never"
              c="inherit"
              aria-label={typeof mediaAlt === 'string' ? mediaAlt : undefined}
            >
              →
            </Anchor>
          </Group>
        ) : null}
      </Stack>
    </Card>
  );
}
