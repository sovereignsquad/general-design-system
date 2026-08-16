import { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import {
  gdsGeneratedPaletteCssRefs,
  gdsSeededRandom,
} from './generated-art-engine';
import type { GdsGeneratedPaletteColors, GdsGeneratedPaletteSource } from './generated-art-engine';
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';

/**
 * Deterministic identity mark: gradient (theme palette) + initials, seeded rotation so
 * same-initial people still differ. role="img" named by the person's name; initials are
 * aria-hidden.
 */

/** Props for {@link GdsGeneratedAvatar}. */
export interface GdsGeneratedAvatarProps {
  /** Display name. Required — names the image for screen readers and derives the initials. */
  name: string;
  /**
   * Stable identity seeding the gradient variation. Defaults to `name`; supply it explicitly
   * when display names can change while the person does not, so their mark stays put.
   */
  seed?: string;
  /** Rendered size (width = height). Defaults to `'2.5em'` — the control scale's neighbourhood. */
  size?: number | string;
  /** Defaults to `'theme'` — the mark follows the active theme like every generated surface. */
  paletteSource?: GdsGeneratedPaletteSource;
  /** Required when `paletteSource` is `'category'`. */
  category?: GdsBadgeAccentName;
  /** `'category'` mode only. */
  shade?: GdsBadgeAccentShade;
  /** Full palette override — the escape hatch the other generated surfaces already share. */
  colors?: GdsGeneratedPaletteColors;
  className?: string;
  style?: CSSProperties;
}

/**
 * Initials from a display name: first grapheme of the first and last words, uppercased. One
 * word yields one initial; a name with no letter-like graphemes (an emoji handle) yields the
 * first grapheme alone — the mark never renders empty.
 */
export function gdsAvatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = [...words[0]][0] ?? '';
  const last = words.length > 1 ? [...words[words.length - 1]][0] ?? '' : '';
  return (first + last).toLocaleUpperCase();
}

/**
 * Deterministic, theme-aware identity mark — see the module docs for why initials and why no
 * photos. Same `seed`, same mark, every render.
 *
 * @example
 * ```tsx
 * <GdsGeneratedAvatar name="Ada Lovelace" />
 * <GdsGeneratedAvatar name="Ada Lovelace" seed="user-42" size={64} />
 * ```
 */
export function GdsGeneratedAvatar({
  name, seed, size = '2.5em', paletteSource, category, shade, colors, className, style,
}: GdsGeneratedAvatarProps) {
  const gradientId = useId();
  const palette = useMemo(
    () => gdsGeneratedPaletteCssRefs({ paletteSource, category, shade, colors }),
    [paletteSource, category, shade, colors],
  );
  const identity = seed ?? name;
  // Seed varies the gradient angle only; hue stays theme-controlled.
  const angle = useMemo(() => Math.round(gdsSeededRandom(identity)() * 360), [identity]);
  const initials = gdsAvatarInitials(name);
  const rad = (angle * Math.PI) / 180;
  const [x2, y2] = [Math.round(50 + Math.cos(rad) * 50), Math.round(50 + Math.sin(rad) * 50)];
  const [x1, y1] = [100 - x2, 100 - y2];

  return (
    <span
      data-gds-generated-avatar=""
      role="img"
      aria-label={name}
      className={className}
      style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', overflow: 'hidden', ...style }}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={gradientId} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
        </defs>
        <rect width="48" height="48" fill={`url(#${gradientId})`} />
        {initials ? (
          <text
            x="24"
            y="25"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--mantine-font-family, sans-serif)"
            fontWeight={600}
            fontSize={initials.length > 1 ? 17 : 20}
            fill="var(--gds-text-on-inverse, var(--mantine-color-white, #ffffff))"
          >
            {initials}
          </text>
        ) : null}
      </svg>
    </span>
  );
}
