import type { ReactNode } from 'react';
import { Anchor, Box, Stack, Text } from '@mantine/core';
import { gdsZIndexToken , useGdsTranslation } from '@sovereignsquad/gds-theme';
import type { PublicNavItem } from './PublicNav';

/**
 * Fixed, mobile-only bottom tab navigation rendered from `PublicNavItem[]`.
 * Theme-tokened (active = brand accent, inactive = secondary text, surface =
 * white), safe-area aware, with an optional raised center action. Used by
 * `PublicShell`/`DiscoveryShell` when `mobileNavigationMode="bottom-tab"`.
 */

/** Maximum number of tabs the bottom tab bar renders. */
export const BOTTOM_TAB_MAX_ITEMS = 5;
/** Bar height in pixels, excluding the safe-area inset — the fallback behind `--gds-layout-bottom-bar-height`. */
export const BOTTOM_TAB_HEIGHT = 64;

/** Props for {@link BottomTabBar}. */
export interface BottomTabBarProps {
  items: PublicNavItem[];
  /** Id of the active tab; falls back to the first item when unset or unmatched. */
  activeId?: string;
  /** Item id to render as a raised, accent-filled center action. */
  emphasizedItemId?: string;
  /** Hard cap on rendered items (max 5). */
  maxItems?: number;
  /** Analytics hook fired when a tab is selected. */
  onNavItemSelect?: (id: string) => void;
  /** Accessible name for the `<nav>`. Defaults to `'Primary'`. */
  ariaLabel?: string;
  className?: string;
  /**
   * Overrides rendering for one item; receives the item, its active state, and whether
   * it's the emphasized (raised center) item. A custom render is responsible for
   * reproducing the 44x44 min hit target and `flex: 1` sizing, and — if overriding the
   * emphasized item — its raised-button layout, since none of that comes for free once
   * the default `<Anchor>` is bypassed.
   */
  renderItem?: (item: PublicNavItem, active: boolean, emphasized: boolean) => ReactNode;
}

function resolveActiveId(items: PublicNavItem[], activeId?: string): string | undefined {
  if (activeId && items.some((item) => item.id === activeId)) {
    return activeId;
  }
  return items[0]?.id;
}

/**
 * Fixed, mobile-only (`data-gds-viewport-gated="sm"`) bottom tab navigation rendered from
 * `PublicNavItem[]`. Theme-tokened and safe-area aware, with an optional raised
 * accent center action. Throws if given more than `maxItems` (capped at
 * {@link BOTTOM_TAB_MAX_ITEMS}); renders nothing when there are no items.
 */
export function BottomTabBar({
  items,
  activeId,
  emphasizedItemId,
  maxItems = BOTTOM_TAB_MAX_ITEMS,
  onNavItemSelect,
  ariaLabel: ariaLabelProp,
  className,
  renderItem,
}: BottomTabBarProps) {
  const { t } = useGdsTranslation();
  const ariaLabel = ariaLabelProp ?? t('gds.bottomTabBar.ariaLabel', "Primary");

  const cap = Math.min(Math.max(1, maxItems), BOTTOM_TAB_MAX_ITEMS);

  if (items.length > cap) {
    throw new Error(`BottomTabBar supports at most ${cap} items, received ${items.length}.`);
  }

  const visibleItems = items.slice(0, cap);
  if (visibleItems.length === 0) {
    return null;
  }

  const resolvedActiveId = resolveActiveId(visibleItems, activeId);

  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      // Resolved by the stylesheet against an enclosing data-gds-viewport-frame, if any.
      // Plain attribute, not a React context read, keeps this component server-renderable.
      data-gds-viewport-gated="sm"
      className={className}
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: gdsZIndexToken.app,
        // display intentionally omitted: the stylesheet controls flex/none via the viewport
        // gate; an inline value here would always win over that media query.
        justifyContent: 'space-around',
        alignItems: 'stretch',
        height: `calc(var(--gds-layout-bottom-bar-height, ${BOTTOM_TAB_HEIGHT}px) + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--gds-bg-surface, var(--mantine-color-white))',
        borderTop: '1px solid var(--gds-border-card, var(--mantine-color-gray-3))',
      }}
    >
      {visibleItems.map((item) => {
        const active = item.id === resolvedActiveId;
        const emphasized = item.id === emphasizedItemId;
        const color = active
          ? 'var(--gds-brand-accent, var(--mantine-color-violet-6))'
          : 'var(--gds-text-secondary, var(--mantine-color-gray-6))';

        if (renderItem) {
          return <span key={item.id}>{renderItem(item, active, emphasized)}</span>;
        }

        return (
          <Anchor
            key={item.id}
            href={item.disabled ? undefined : item.href}
            aria-current={active ? 'page' : undefined}
            aria-disabled={item.disabled || undefined}
            underline="never"
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
            onClick={() => {
              if (!item.disabled) {
                onNavItemSelect?.(item.id);
              }
            }}
            style={{
              flex: 1,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: emphasized ? 'flex-start' : 'center',
              justifyContent: 'center',
              opacity: item.disabled ? 0.4 : 1,
              pointerEvents: item.disabled ? 'none' : undefined,
              color,
            }}
          >
            {emphasized ? (
              <Box
                aria-hidden={false}
                style={{
                  marginTop: -18,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--gds-brand-accent, var(--mantine-color-violet-6))',
                  color: 'var(--gds-brand-accent-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',
                  boxShadow: '0 6px 16px rgba(11, 34, 62, 0.25)',
                }}
              >
                {item.icon}
                <Text span fz={10} fw={700} style={{ lineHeight: 1 }}>
                  {item.label}
                </Text>
              </Box>
            ) : (
              <Stack gap={2} align="center" justify="center">
                {item.icon}
                <Text span fz={11} fw={active ? 700 : 500} style={{ lineHeight: 1 }}>
                  {item.label}
                </Text>
              </Stack>
            )}
          </Anchor>
        );
      })}
    </Box>
  );
}
