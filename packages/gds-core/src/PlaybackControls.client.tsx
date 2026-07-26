'use client';

import { useEffect } from 'react';
import { ActionIcon, Group, Text } from '@mantine/core';
import { GdsIcons } from './icons';

/** Playback state driving control availability and the play/pause icon. */
export type PlaybackControlState = 'loading' | 'ready' | 'playing' | 'paused' | 'empty' | 'error' | 'degraded';

/** Props for `PlaybackControls`. Optional handlers whose control should not render are simply omitted (e.g. no `onRestart` hides the restart button). */
export interface PlaybackControlsProps {
  state: PlaybackControlState;
  /** Whether the Next control is enabled. Defaults to `true`. */
  canGoNext?: boolean;
  /** Whether the Previous control is enabled. Defaults to `true`. */
  canGoPrevious?: boolean;
  /** Current fullscreen state, driving the fullscreen toggle label. Defaults to `false`. */
  fullscreen?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  /** Toggles fullscreen; when omitted the fullscreen control is not rendered. */
  onFullscreenChange?: (fullscreen: boolean) => void;
  /** Restarts playback; when omitted the restart control is not rendered. */
  onRestart?: () => void;
  reducedMotion?: boolean;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName) || target.isContentEditable;
}

/**
 * Binds global playback keyboard shortcuts while `enabled`: Space toggles
 * play/pause, Arrow Right/Left go next/previous, and `F` toggles fullscreen.
 * Ignores key events originating from inputs, buttons, links, or editable
 * elements, and cleans up its listener on unmount.
 */
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

/** Governed transport control bar (previous, play/pause, next, optional restart/fullscreen) with a live-announced state label; controls disable in loading/empty/error states. */
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

/** Overlay-styled wrapper around {@link PlaybackControls}, sharing the same props, for use atop media surfaces. */
export function PlaybackOverlayControls(props: PlaybackControlsProps) {
  return <PlaybackControls {...props} />;
}
