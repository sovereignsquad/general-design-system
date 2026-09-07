import type { ReactNode } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { gdsElevation, gdsRadius } from '@sovereignsquad/gds-theme';

/** Props for {@link GdsLogoLockup}. */
export interface GdsLogoLockupProps {
  /** Mark image URL (consumer-owned asset). Mutually exclusive with `mark`. */
  src?: string;
  /**
   * Accessible name for the mark when it stands alone (no `wordmark`). Required
   * with `src` — pass `alt=""` only when the mark is decorative inside a link
   * or heading that already carries the accessible name.
   */
  alt?: string;
  /** Arbitrary mark node (e.g. an inline SVG or `GdsGeneratedMark`) instead of `src`. */
  mark?: ReactNode;
  /** Wordmark text, e.g. "Your Field". Omit for mark-only rendering. */
  wordmark?: string;
  /** Optional badge pill text, e.g. a city tag. Rendered only when `wordmark` renders. */
  badge?: string;
  /** Mark size; a number is px, a string is any CSS length. Defaults to `'2.25em'`. */
  size?: number | string;
  /** Adjusts wordmark/pill colors for an inverse (dark) ground. Defaults to `false`. */
  onInverse?: boolean;
  /**
   * Renders the lockup on a light contrasting badge (card surface, card border,
   * card radius, card elevation) — the brand-guidelines presentation rule for a
   * real logo mark. Mandatory whenever the lockup sits on a non-light ground;
   * `onInverse` alone is legible but off-guideline without it.
   */
  framed?: boolean;
}

/**
 * Real-asset brand lockup: a consumer-supplied mark (image or node), an
 * optional wordmark, and an optional badge pill, composed from governed
 * tokens only. Unlike `GdsGeneratedMark`/`GdsGeneratedAvatar`, the mark here
 * is never generated — it is the consumer's actual logo asset. Slots directly
 * into `PublicShell`'s `brand` prop or `DiscoveryShell`'s `header`.
 *
 * A broken or slow-loading `src` keeps the lockup's layout — the `img`
 * element's native behavior — and exposes `alt` in its place; the wordmark
 * never collapses because the mark failed to load.
 *
 * @example
 * ```tsx
 * <GdsLogoLockup src="/brand/mark.svg" alt="" wordmark="Your Field" badge="NYC" />
 * <GdsLogoLockup src="/brand/mark.svg" alt="" wordmark="Your Field" onInverse framed />
 * ```
 */
export function GdsLogoLockup({
  src,
  alt,
  mark,
  wordmark,
  badge,
  size = '2.25em',
  onInverse = false,
  framed = false,
}: GdsLogoLockupProps) {
  if (process.env.NODE_ENV !== 'production') {
    if (src && mark) {
      throw new Error('GdsLogoLockup: pass either `src` or `mark`, never both.');
    }
    if (src && alt === undefined) {
      throw new Error(
        'GdsLogoLockup: `alt` is required with `src` — pass `alt=""` only when the mark is '
        + 'decorative inside a link/heading that already carries the accessible name.',
      );
    }
  }

  const resolvedSize = typeof size === 'number' ? `${size}px` : size;

  const markNode = mark ?? (src ? (
    <img
      src={src}
      alt={alt}
      data-gds-logo-lockup-mark=""
      style={{
        width: resolvedSize,
        height: resolvedSize,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
      }}
    />
  ) : null);

  const wordmarkColor = onInverse ? 'var(--gds-text-on-inverse)' : 'var(--gds-text-primary)';
  // Inverse badge ground derives from the inverse text token itself via color-mix, never a raw rgba.
  const badgeBackground = onInverse
    ? 'color-mix(in srgb, var(--gds-text-on-inverse) 12%, transparent)'
    : 'var(--gds-bg-canvas)';
  const badgeColor = onInverse ? 'var(--gds-text-on-inverse)' : 'var(--gds-text-secondary)';

  const ellipsis = {
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    maxWidth: '100%',
  };

  const content = (
    <Group
      gap="xs"
      wrap="nowrap"
      align="center"
      data-gds-logo-lockup={framed ? 'framed' : onInverse ? 'inverse' : 'default'}
      style={{ minWidth: 0 }}
    >
      {markNode}
      {wordmark ? (
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Text span fw={700} style={{ color: wordmarkColor, lineHeight: 1.5, ...ellipsis }}>
            {wordmark}
          </Text>
          {badge ? (
            <Text
              span
              fw={600}
              size="xs"
              data-gds-logo-lockup-badge=""
              style={{
                color: badgeColor,
                background: badgeBackground,
                borderRadius: gdsRadius('badge'),
                padding: '0.0625em 0.5em',
                width: 'fit-content',
                lineHeight: 1.4,
                ...ellipsis,
              }}
            >
              {badge}
            </Text>
          ) : null}
        </Stack>
      ) : null}
    </Group>
  );

  if (!framed) {
    return content;
  }

  return (
    <Box
      data-gds-logo-lockup-frame=""
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 0,
        background: 'var(--gds-bg-card)',
        border: '1px solid var(--gds-border-card)',
        borderRadius: gdsRadius('card'),
        boxShadow: gdsElevation('card'),
        padding: '0.5em 0.75em',
      }}
    >
      {content}
    </Box>
  );
}
