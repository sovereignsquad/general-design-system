import type { ReactNode } from 'react';
import { Anchor, AspectRatio, Badge, Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { GdsIcons } from './icons';

export interface EditorialCardProps {
  media?: ReactNode;
  mediaAlt?: string;
  eyebrow?: ReactNode;
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  ctaLabel?: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: 'default' | 'warm' | 'cool' | 'muted';
  variant?: 'standard' | 'compact' | 'featured';
}

const tonePalette = {
  default: { accent: 'violet', background: 'var(--mantine-color-body)' },
  warm: { accent: 'orange', background: 'var(--mantine-color-orange-0)' },
  cool: { accent: 'blue', background: 'var(--mantine-color-blue-0)' },
  muted: { accent: 'gray', background: 'var(--mantine-color-gray-0)' },
} as const;

function EditorialMediaFallback({ compact }: { compact: boolean }) {
  return (
    <AspectRatio ratio={compact ? 16 / 10 : 4 / 3}>
      <Box
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100%',
          background: 'var(--mantine-color-gray-0)',
          borderRadius: 'var(--mantine-radius-md)',
        }}
      >
        <GdsIcons.Gallery size={compact ? '1.5rem' : '2rem'} />
      </Box>
    </AspectRatio>
  );
}

export function EditorialCard({
  media,
  mediaAlt,
  eyebrow,
  badge,
  title,
  description,
  meta,
  ctaLabel = 'Explore',
  href,
  onClick,
  tone = 'default',
  variant = 'standard',
}: EditorialCardProps) {
  const compact = variant === 'compact';
  const featured = variant === 'featured';
  const palette = tonePalette[tone];
  const interactiveProps = href
    ? { component: 'a' as const, href }
    : onClick
      ? { component: 'button' as const, onClick, type: 'button' as const }
      : {};

  return (
    <Card
      withBorder
      radius="xl"
      padding={0}
      {...interactiveProps}
      style={{
        overflow: 'hidden',
        textAlign: 'left',
        background: featured ? palette.background : 'var(--mantine-color-body)',
        cursor: href || onClick ? 'pointer' : 'default',
      }}
    >
      <Card.Section>{media ?? <EditorialMediaFallback compact={compact} />}</Card.Section>

      <Stack gap="md" p={compact ? 'md' : 'lg'}>
        <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
          <Stack gap={4} flex={1}>
            {eyebrow ? (
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.14em' }}>
                {eyebrow}
              </Text>
            ) : null}
            <Title order={compact ? 4 : 3}>{title}</Title>
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
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        ) : null}

        {meta ? (
          <Text size="sm" c="dimmed">
            {meta}
          </Text>
        ) : null}

        {(href || onClick || ctaLabel) ? (
          <Group gap={6} c={`${palette.accent}.7`}>
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
