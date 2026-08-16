import { useId, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { gdsGeneratedPaletteCssRefs, gdsSeededRandom } from './generated-art-engine';
import type { GdsGeneratedPaletteColors, GdsGeneratedPaletteSource } from './generated-art-engine';
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';

/**
 * Compact square/logo mark: house gradient with one icon motif, full strength, centred,
 * seeded rotation. Decorative by default (aria-hidden); pass `label` when it stands alone.
 */

/** Props for {@link GdsGeneratedMark}. */
export interface GdsGeneratedMarkProps {
  /** Stable identity seeding the motif rotation — same seed, same mark, every render. */
  seed: string;
  /** The motif: a canonical `GdsIcons` key, or any externally-sourced icon element. */
  icon: GdsIconKey | ReactNode;
  /** Accessible name when the mark stands alone. Omitted = decorative, the common case. */
  label?: string;
  /** Rendered size (width = height). Defaults to `'3em'`. */
  size?: number | string;
  /** Defaults to `'theme'`. */
  paletteSource?: GdsGeneratedPaletteSource;
  /** Required when `paletteSource` is `'category'`. */
  category?: GdsBadgeAccentName;
  /** `'category'` mode only. */
  shade?: GdsBadgeAccentShade;
  /** Full palette override. */
  colors?: GdsGeneratedPaletteColors;
  className?: string;
  style?: CSSProperties;
}

const isIconKey = (icon: GdsIconKey | ReactNode): icon is GdsIconKey => typeof icon === 'string';

/**
 * Deterministic, theme-aware square mark for logo-shaped slots — see the module docs.
 *
 * @example
 * ```tsx
 * <GdsGeneratedMark seed="acme-workspace" icon="Habit" />
 * <GdsGeneratedMark seed="gds" icon="Location" label="GDS" size={64} />
 * ```
 */
export function GdsGeneratedMark({
  seed, icon, label, size = '3em', paletteSource, category, shade, colors, className, style,
}: GdsGeneratedMarkProps) {
  const gradientId = useId();
  const palette = useMemo(
    () => gdsGeneratedPaletteCssRefs({ paletteSource, category, shade, colors }),
    [paletteSource, category, shade, colors],
  );
  // Tilt range ±20°; hue stays theme-controlled.
  const tilt = useMemo(() => Math.round((gdsSeededRandom(seed)() - 0.5) * 40), [seed]);

  return (
    <span
      data-gds-generated-mark=""
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ display: 'inline-block', width: size, height: size, borderRadius: 'var(--mantine-radius-md, 12px)', overflow: 'hidden', ...style }}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
        </defs>
        <rect width="48" height="48" fill={`url(#${gradientId})`} />
      </svg>
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          marginTop: '-100%',
          transform: `rotate(${tilt}deg)`,
          color: 'var(--gds-text-on-inverse, var(--mantine-color-white, #ffffff))',
        }}
      >
        {isIconKey(icon) ? <GdsIcon icon={icon} size="55%" tone="default" /> : icon}
      </span>
    </span>
  );
}
