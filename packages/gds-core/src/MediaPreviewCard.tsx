import type { ReactNode } from 'react';
import { AspectRatio, Badge, Box, Card, Group, Image, Stack, Text, Title } from '@mantine/core';
import { ActionBar, type ActionBarProps } from './ActionBar';
import { StateBlock } from './StateBlock';

export type MediaFit = 'contain' | 'cover';
export type MediaPreviewState = 'loading' | 'ready' | 'missing' | 'error' | 'readonly';
export type MediaPreviewAspectRatio = '1:1' | '4:3' | '16:9' | '3:4';

export interface MediaPreviewMetadata {
  label: ReactNode;
  value: ReactNode;
}

export interface MediaPreviewCardProps {
  title: ReactNode;
  src?: string;
  thumbnailSrc?: string;
  alt: string;
  caption?: ReactNode;
  fit?: MediaFit;
  aspectRatio?: MediaPreviewAspectRatio;
  state?: MediaPreviewState;
  metadata?: MediaPreviewMetadata[];
  actions?: ActionBarProps;
  status?: ReactNode;
  /**
   * When true, omit the media area entirely (no image, no placeholder block)
   * for records with no `src`/`thumbnailSrc`, rendering title/metadata/actions only.
   * Has no effect when `state` is `'loading'` or `'error'` — those states still
   * need a visible surface to communicate progress or failure.
   */
  hideWhenNoMedia?: boolean;
}

const aspectRatios: Record<MediaPreviewAspectRatio, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
};

export function MediaPreviewCard({
  title,
  src,
  thumbnailSrc,
  alt,
  caption,
  fit = 'cover',
  aspectRatio = '1:1',
  state = src || thumbnailSrc ? 'ready' : 'missing',
  metadata = [],
  actions,
  status,
  hideWhenNoMedia = false,
}: MediaPreviewCardProps) {
  const displaySrc = thumbnailSrc ?? src;
  const mediaState = !displaySrc && state === 'ready' ? 'missing' : state;
  const suppressMediaArea = hideWhenNoMedia && mediaState === 'missing';

  return (
    <Card withBorder radius="lg" padding="md">
      <Stack gap="md">
        {suppressMediaArea ? null : (
          <AspectRatio ratio={aspectRatios[aspectRatio]}>
            {mediaState === 'ready' || mediaState === 'readonly' ? (
              <Image
                src={displaySrc}
                alt={alt}
                fit={fit}
                radius="md"
                fallbackSrc=""
              />
            ) : (
              <Box bg="var(--mantine-color-gray-light)" style={{ display: 'grid', placeItems: 'center' }}>
                <StateBlock
                  variant={mediaState === 'error' ? 'error' : mediaState === 'loading' ? 'loading' : 'empty'}
                  title={mediaState === 'error' ? 'Preview unavailable' : mediaState === 'loading' ? 'Loading preview' : 'No media'}
                  description={mediaState === 'error' ? 'The media preview could not be rendered.' : undefined}
                  compact
                />
              </Box>
            )}
          </AspectRatio>
        )}
        {caption ? <Text size="xs" c="dimmed">{caption}</Text> : null}
        <Group justify="space-between" align="flex-start" gap="md">
          <Stack gap={4}>
            {typeof title === 'string' ? <Title order={4}>{title}</Title> : title}
            {metadata.length ? (
              <Stack gap={2}>
                {metadata.map((item, index) => (
                  <Text key={index} size="xs" c="dimmed">
                    <Text span fw={600}>{item.label}: </Text>
                    {item.value}
                  </Text>
                ))}
              </Stack>
            ) : null}
          </Stack>
          {status ? <Badge variant="light">{status}</Badge> : null}
        </Group>
        {actions ? <ActionBar {...actions} /> : null}
      </Stack>
    </Card>
  );
}
