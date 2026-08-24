import type { ReactNode } from 'react';
import type { GdsBadgeIconStyle } from '@sovereignsquad/gds-theme';
import type { GdsIconKey } from './icons';
import type { GdsBadgeAccentName, GdsBadgeAccentShade } from './GdsBadge';

/**
 * A consumer's own category identity (issue 525): one color+glyph record
 * shared across `GdsBadge`, `GdsMapPinBadge`, `GdsGeneratedThumbnail`, and
 * `GdsGeneratedHero`, so a category reads the same everywhere it appears —
 * the existing principle `BADGE_SYSTEM.md`'s "same activity identity, worn
 * a different way" section already documents for `accent`+`icon`, extended
 * here with an optional `emoji`.
 *
 * **Not shipped with any business data.** GDS ships the type and
 * {@link resolveGdsCategoryBadgeIcon} only — categories like "Soccer" or
 * "Basketball" are a consumer's own domain vocabulary (exactly like
 * `GdsMapPinBadge`'s own docs already say: "sports/hobbies/interests
 * routinely have no `GdsIcons` equivalent"), never a GDS-owned enum.
 *
 * **`icon` is required, `emoji` is optional — on purpose.** This is the
 * structural guarantee behind "emoji affects only the badge, thumbnails
 * keep the structure": `GdsGeneratedThumbnail`/`GdsGeneratedHero` read only
 * a category's `icon` field. They have no code path that reads `emoji` at
 * all, so a category can never fabricate a thumbnail/hero motif from an
 * emoji glyph, regardless of what badge glyph mode is active elsewhere.
 */
export interface GdsCategoryDefinition {
  /** Stable identity, e.g. `'soccer'` — for keys/lookups, not rendered. */
  key: string;
  /** Real, consumer-written accessible name, e.g. `'Soccer'` — never derived from an icon library's own display name. */
  label: string;
  /** Curated accent driving this category's color across every surface it appears on. */
  accent: GdsBadgeAccentName;
  /** Within-accent differentiation for related sub-categories (see `GdsBadgeAccentShade`). Defaults to `'base'`. */
  shade?: GdsBadgeAccentShade;
  /** A canonical `GdsIcons` key, or any externally-sourced icon element — the structural fallback every surface can render. */
  icon: GdsIconKey | ReactNode;
  /**
   * Optional emoji glyph — a badge-only alternative to `icon`, used only
   * when the effective badge glyph mode (see `useGdsBadgeIconStyle`) is
   * `'emoji'`. A category with no `emoji` simply renders its `icon` even
   * in emoji mode; that fallback is the point, not a gap to fill in later.
   */
  emoji?: string;
}

/** What {@link resolveGdsCategoryBadgeIcon} resolved a category's badge glyph to. */
export type GdsResolvedCategoryBadgeGlyph =
  | { mode: 'emoji'; emoji: string }
  | { mode: 'tabler'; icon: GdsIconKey | ReactNode };

/**
 * The one shared failsafe branch behind "emoji where it has to be, icon
 * where it doesn't" (issue 525): `iconStyle === 'emoji'` and `category`
 * has an `emoji` resolves to that emoji; every other case — `'tabler'`
 * mode, or `'emoji'` mode with no `emoji` on this category — resolves to
 * the category's `icon`. A plain data-presence check, deterministic and
 * SSR-safe, deliberately not a runtime "does this device render this
 * glyph" probe (unreliable across browsers, untestable in CI without
 * flaking, and would break `GdsGeneratedThumbnail`'s server/client
 * determinism guarantee for no gain, since that component never reads
 * `emoji` in the first place).
 */
export function resolveGdsCategoryBadgeIcon(
  category: GdsCategoryDefinition,
  iconStyle: GdsBadgeIconStyle,
): GdsResolvedCategoryBadgeGlyph {
  if (iconStyle === 'emoji' && category.emoji) {
    return { mode: 'emoji', emoji: category.emoji };
  }
  return { mode: 'tabler', icon: category.icon };
}
