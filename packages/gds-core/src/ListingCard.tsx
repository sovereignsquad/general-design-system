import type { ReactNode } from 'react';
import { ActionIcon, AspectRatio, Badge, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import { GdsVocabulary, getSemanticActionLabel, type SemanticAction } from './vocabulary';

export type ListingCardMediaRatio = '1:1' | '4:3' | '16:9';

export interface ListingMetadataRow {
  id: string;
  label: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
}

export interface ListingCardAffordance {
  action: SemanticAction;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

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
  primaryAction?: ReactNode;
  saveAction?: ListingCardAffordance;
  shareAction?: ListingCardAffordance;
  compact?: boolean;
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

  if (affordance.href) {
    return (
      <ActionIcon
        component="a"
        href={affordance.href}
        variant="subtle"
        size="lg"
        aria-label={label}
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
      disabled={affordance.disabled}
    >
      <Icon size="1rem" stroke={1.75} />
    </ActionIcon>
  );
}

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
  primaryAction,
  saveAction,
  shareAction,
  compact = false,
}: ListingCardProps) {
  const titleContent =
    href && typeof title === 'string' ? (
      <Text component="a" href={href} inherit td="none">
        {title}
      </Text>
    ) : (
      title
    );

  return (
    <Card withBorder radius="lg" padding={compact ? 'md' : 'lg'}>
      <Stack gap={compact ? 'sm' : 'md'}>
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
          <Title order={compact ? 5 : 4} lineClamp={2}>
            {titleContent}
          </Title>
          {description ? (
            <Text size="sm" c="dimmed" lineClamp={compact ? 2 : 3}>
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

        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            {price ? (
              <Text fw={700} size={compact ? 'md' : 'lg'}>
                {price}
              </Text>
            ) : null}
          </Stack>

          <Group gap="xs" wrap="nowrap" justify="flex-end" style={{ marginInlineStart: 'auto' }}>
            {saveAction ? <ListingAffordance affordance={saveAction} /> : null}
            {shareAction ? <ListingAffordance affordance={shareAction} /> : null}
            {primaryAction}
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}
