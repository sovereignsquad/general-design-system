import { createContext, useContext } from 'react';

/**
 * Badge glyph mode (issue 525): `'tabler'` (default) renders every
 * badge/pin icon through the governed `GdsIcons` stroke-SVG registry,
 * exactly today's only behavior. `'emoji'` is an alternate, opt-in "view"
 * for the whole badge family (`GdsBadge`, `GdsMapPinBadge`) — every badge
 * whose category carries an `emoji` renders that emoji instead; a badge
 * whose category has no `emoji` falls back to its Tabler icon
 * automatically. The mode never reaches `GdsGeneratedThumbnail`/
 * `GdsGeneratedHero` — those read only a category's `icon`, by
 * construction, regardless of this setting.
 */
export type GdsBadgeIconStyle = 'tabler' | 'emoji';

/** Value carried by `GdsIconStyleContext`: the ambient badge glyph mode. */
export interface GdsIconStyleContextValue {
  badgeIconStyle: GdsBadgeIconStyle;
}

/**
 * The context's default value, used when no `GdsProvider` is mounted above
 * the consumer. Unlike `GdsI18nContext`, reading this default silently is
 * not a misconfiguration worth a dev warning: `'tabler'` is exactly every
 * existing consumer's only, pre-existing behavior, so there is nothing
 * newly wrong to surface.
 */
const defaultGdsIconStyleContextValue: GdsIconStyleContextValue = {
  badgeIconStyle: 'tabler',
};

/** React context supplying the ambient badge glyph mode set by `GdsProvider`. */
export const GdsIconStyleContext = createContext<GdsIconStyleContextValue>(defaultGdsIconStyleContextValue);

/**
 * Resolves the effective badge glyph mode for one badge/pin instance: an
 * explicit per-instance `override` (a consumer's own `iconStyle` prop)
 * always wins; otherwise falls back to the ambient mode set by the nearest
 * `GdsProvider`'s `defaultBadgeIconStyle`, or `'tabler'` with no provider
 * mounted at all.
 */
export function useGdsBadgeIconStyle(override?: GdsBadgeIconStyle): GdsBadgeIconStyle {
  const context = useContext(GdsIconStyleContext);
  return override ?? context.badgeIconStyle;
}
