import { useEffect, useState, type ReactNode } from 'react';
import { AspectRatio, Box, Text } from '@mantine/core';

/**
 * MediaWithFallback (gap B8 / issue #323).
 *
 * Image primitive that guarantees a stable, branded box. On load failure or a
 * missing `src` it renders a branded fallback instead of collapsing to null, so
 * a broken image never drops a card or breaks result counts. The aspect-ratio
 * box reserves space to avoid layout shift.
 */

/** Props for {@link MediaWithFallback}. */
export interface MediaWithFallbackProps {
  src?: string;
  /** Required for accessibility. Use `alt=""` for decorative images. */
  alt: string;
  /** Aspect ratio width/height, e.g. 16/9. Defaults to 4/3. */
  ratio?: number;
  /** Custom fallback node; defaults to a branded box with initials/label. */
  fallback?: ReactNode;
  /** Short text shown in the default fallback (e.g. provider name/initials). */
  fallbackLabel?: string;
  /** Show a loading shimmer while the image loads. Defaults to true. */
  showShimmer?: boolean;
  /** Passthrough error hook for analytics. */
  onError?: () => void;
}

type MediaState = 'loading' | 'loaded' | 'error';

function initialsFor(label?: string): string {
  if (!label) return '';
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/** Renders `src` inside a fixed aspect-ratio box, showing a branded fallback (and an optional loading shimmer) on load error or missing `src`, so a broken image never collapses the layout. */
export function MediaWithFallback({
  src,
  alt,
  ratio = 4 / 3,
  fallback,
  fallbackLabel,
  showShimmer = true,
  onError,
}: MediaWithFallbackProps) {
  const [state, setState] = useState<MediaState>(src ? 'loading' : 'error');

  useEffect(() => {
    setState(src ? 'loading' : 'error');
  }, [src]);

  const showFallback = state === 'error';

  return (
    <AspectRatio ratio={ratio}>
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--mantine-radius-md)',
          background: 'var(--gds-bg-surface, var(--mantine-color-gray-1))',
        }}
      >
        {!showFallback && src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setState('loaded')}
            onError={() => {
              setState('error');
              onError?.();
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}

        {state === 'loading' && showShimmer ? (
          <Box
            aria-hidden
            data-gds-media-shimmer
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, var(--gds-bg-surface, #eee) 25%, color-mix(in srgb, var(--gds-bg-surface, #eee) 80%, #fff) 50%, var(--gds-bg-surface, #eee) 75%)',
            }}
          />
        ) : null}

        {showFallback
          ? fallback ?? (
              <Box
                role="img"
                aria-label={alt || fallbackLabel || 'No image available'}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--gds-bg-inverse, var(--mantine-color-dark-6))',
                  color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',
                }}
              >
                <Text fw={700} fz="xl">
                  {initialsFor(fallbackLabel) || '—'}
                </Text>
              </Box>
            )
          : null}
      </Box>
    </AspectRatio>
  );
}
