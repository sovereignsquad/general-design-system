import type { ReactNode } from 'react';
import { Anchor, Group } from '@mantine/core';

/** A single public navigation entry. */
export interface PublicNavItem {
  id: string;
  label: string;
  href: string;
  /** Opens the link in a new tab with `rel="noreferrer"`. */
  external?: boolean;
  /** Optional icon, used by surfaces that render icons (e.g. bottom-tab nav). */
  icon?: ReactNode;
  /** Disabled items are dimmed and non-interactive in icon-based surfaces. */
  disabled?: boolean;
}

/** Props for the `PublicNav` component. */
export interface PublicNavProps {
  items: PublicNavItem[];
  /** Id of the currently active item, marked with `aria-current="page"`. */
  activeId?: string;
  /** Overrides link rendering per item; receives the item and its active state. */
  renderLink?: (item: PublicNavItem, active: boolean) => ReactNode;
}

/** Horizontal primary navigation landmark for public pages; renders governed anchors by default, or a custom link per item via `renderLink`, marking the active item with `aria-current`. */
export function PublicNav({ items, activeId, renderLink }: PublicNavProps) {
  return (
    <Group component="nav" aria-label="Primary" gap="lg" wrap="nowrap">
      {items.map((item) => {
        const active = item.id === activeId;
        if (renderLink) {
          return <span key={item.id}>{renderLink(item, active)}</span>;
        }

        return (
          <Anchor
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            c={active ? 'var(--mantine-color-text)' : 'dimmed'}
            fw={active ? 700 : 500}
            underline="never"
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
          >
            {item.label}
          </Anchor>
        );
      })}
    </Group>
  );
}
