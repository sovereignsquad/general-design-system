import type { ReactNode } from 'react';
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { EmptyState } from './EmptyState';
import { StateBlock } from './StateBlock';

/** Lifecycle state of a `PlaybackSurface`, driving the status badge and rendered body. */
export type PlaybackSurfaceState = 'loading' | 'ready' | 'playing' | 'empty' | 'error' | 'degraded';

/** Props for `PlaybackSurface`. */
export interface PlaybackSurfaceProps {
  title?: ReactNode;
  state: PlaybackSurfaceState;
  /** Media node rendered in the ready, playing, and degraded states. */
  media?: ReactNode;
  statusMessage?: ReactNode;
  /** Playback controls shown in the header. */
  controls?: ReactNode;
  /** Custom node for the `empty` state; falls back to a default empty state. */
  emptyState?: ReactNode;
  /** Custom node for the `error` state; falls back to a default error block. */
  errorState?: ReactNode;
  /** Nodes layered over the media (e.g. captions or badges). */
  overlays?: ReactNode;
  /** Presentation mode surfaced via `data-playback-mode`; defaults to `embedded`. */
  mode?: 'fullscreen' | 'embedded' | 'kiosk';
}

const stateTone: Record<PlaybackSurfaceState, { label: string; color: string }> = {
  loading: { label: 'Loading', color: 'blue' },
  ready: { label: 'Ready', color: 'teal' },
  playing: { label: 'Playing', color: 'teal' },
  empty: { label: 'Empty', color: 'gray' },
  error: { label: 'Error', color: 'red' },
  degraded: { label: 'Degraded', color: 'orange' },
};

/** Governed media playback container that renders a status badge and swaps its body across loading, empty, error, degraded, and ready/playing states. */
export function PlaybackSurface({
  title,
  state,
  media,
  statusMessage,
  controls,
  emptyState,
  errorState,
  overlays,
  mode = 'embedded',
}: PlaybackSurfaceProps) {
  const tone = stateTone[state];

  let content: ReactNode;
  if (state === 'loading') {
    content = (
      <StateBlock
        variant="loading"
        title="Loading playback"
        description="The playback surface is still preparing timed or fullscreen media."
      />
    );
  } else if (state === 'empty') {
    content = emptyState ?? (
      <EmptyState
        title="No playback content available"
        description="Add media assets or a playlist to render this playback surface."
      />
    );
  } else if (state === 'error') {
    content = errorState ?? (
      <StateBlock
        variant="error"
        title="Playback unavailable"
        description="The playback surface could not render the current media safely."
      />
    );
  } else {
    content = (
      <Stack gap="md">
        {media}
        {overlays}
      </Stack>
    );
  }

  return (
    <Paper withBorder radius="xl" p="lg" data-playback-mode={mode}>
      <Stack gap="md">
        {(title || statusMessage || controls) ? (
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <Stack gap={4}>
              {title ? <Title order={3}>{title}</Title> : null}
              {statusMessage ? (
                <Text size="sm" c="dimmed">
                  {statusMessage}
                </Text>
              ) : null}
            </Stack>
            <Group gap="sm" align="center" wrap="wrap">
              <Badge variant="light" color={tone.color}>
                {tone.label}
              </Badge>
              {controls}
            </Group>
          </Group>
        ) : null}
        {state === 'degraded' ? (
          <StateBlock
            variant="info"
            title="Playback degraded"
            description={statusMessage ?? 'Playback is continuing with reduced fidelity or recoverable media failures.'}
            compact
          />
        ) : null}
        {content}
      </Stack>
    </Paper>
  );
}
