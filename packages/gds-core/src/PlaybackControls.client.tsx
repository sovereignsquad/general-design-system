'use client';

import { useEffect } from 'react';
import { ActionIcon, Group, Text } from '@mantine/core';
import { GdsIcons } from './icons';

export type PlaybackControlState = 'loading' | 'ready' | 'playing' | 'paused' | 'empty' | 'error' | 'degraded';

export interface PlaybackControlsProps {
  state: PlaybackControlState;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  fullscreen?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFullscreenChange?: (fullscreen: boolean) => void;
  onRestart?: () => void;
  reducedMotion?: boolean;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName) || target.isContentEditable;
}

export function usePlaybackKeyboardControls({
  enabled = true,
  onPlayPause,
  onNext,
  onPrevious,
  onFullscreenToggle,
}: {
  enabled?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFullscreenToggle?: () => void;
}) {
  useEffect(() => {
    if (!enabled) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) return;
      if (event.key === ' ') {
        event.preventDefault();
        onPlayPause?.();
      } else if (event.key === 'ArrowRight') {
        onNext?.();
      } else if (event.key === 'ArrowLeft') {
        onPrevious?.();
      } else if (event.key.toLowerCase() === 'f') {
        onFullscreenToggle?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onFullscreenToggle, onNext, onPlayPause, onPrevious]);
}

export function PlaybackControls({
  state,
  canGoNext = true,
  canGoPrevious = true,
  fullscreen = false,
  onPlayPause,
  onNext,
  onPrevious,
  onFullscreenChange,
  onRestart,
}: PlaybackControlsProps) {
  const playing = state === 'playing';
  const disabled = state === 'loading' || state === 'empty' || state === 'error';

  return (
    <Group gap="xs" wrap="wrap" align="center">
      <ActionIcon variant="default" size="lg" aria-label="Previous" onClick={onPrevious} disabled={disabled || !canGoPrevious}>
        <GdsIcons.Back size="1rem" />
      </ActionIcon>
      <ActionIcon variant="filled" size="lg" aria-label={playing ? 'Pause' : 'Play'} onClick={onPlayPause} disabled={disabled}>
        {playing ? <GdsIcons.Pause size="1rem" /> : <GdsIcons.Play size="1rem" />}
      </ActionIcon>
      <ActionIcon variant="default" size="lg" aria-label="Next" onClick={onNext} disabled={disabled || !canGoNext}>
        <GdsIcons.Forward size="1rem" />
      </ActionIcon>
      {onRestart ? (
        <ActionIcon variant="subtle" size="lg" aria-label="Restart" onClick={onRestart} disabled={state === 'loading'}>
          <GdsIcons.Refresh size="1rem" />
        </ActionIcon>
      ) : null}
      {onFullscreenChange ? (
        <ActionIcon variant="subtle" size="lg" aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={() => onFullscreenChange(!fullscreen)}>
          <GdsIcons.Launch size="1rem" />
        </ActionIcon>
      ) : null}
      <Text size="sm" c="dimmed" aria-live="polite">
        {state}
      </Text>
    </Group>
  );
}

export function PlaybackOverlayControls(props: PlaybackControlsProps) {
  return <PlaybackControls {...props} />;
}
