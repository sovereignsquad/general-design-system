import type { ReactNode } from 'react';
import { AspectRatio, Badge, Box, Card, Group, Image, Stack, Text, Title } from '@mantine/core';
import { ActionBar, type ActionBarProps } from './ActionBar';
import { StateBlock } from './StateBlock';

/** `object-fit` policy for the preview image. */
export type MediaFit = 'contain' | 'cover';
/** Rendering state of the preview: loading, ready, missing media, error, or read-only. */
export type MediaPreviewState = 'loading' | 'ready' | 'missing' | 'error' | 'readonly';
/** Supported aspect ratios for the preview frame. */
export type MediaPreviewAspectRatio = '1:1' | '4:3' | '16:9' | '3:4';

/** A labeled metadata pair shown beneath the preview. */
export interface MediaPreviewMetadata {
  label: ReactNode;
  value: ReactNode;
}

/** Props for {@link MediaPreviewCard}. */
export interface MediaPreviewCardProps {
  title: ReactNode;
  /** Full-resolution media source. */
  src?: string;
  /** Thumbnail source; preferred over `src` for display when present. */
  thumbnailSrc?: string;
  /** Alt text for the media. */
  alt: string;
  caption?: ReactNode;
  fit?: MediaFit;
  aspectRatio?: MediaPreviewAspectRatio;
  /** Explicit state; defaults to `'ready'` when a source exists, else `'missing'`. */
  state?: MediaPreviewState;
  metadata?: MediaPreviewMetadata[];
  /** Action bar rendered under the metadata. */
  actions?: ActionBarProps;
  /** Status badge shown beside the title. */
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

/**
 * Card that previews a single media item with a fixed aspect ratio, falling back
 * to a governed state block (loading/error/empty) when the media is unavailable.
 * Optionally shows a caption, labeled metadata, a status badge, and an action bar,
 * and can omit the media area entirely via `hideWhenNoMedia`.
 */
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
