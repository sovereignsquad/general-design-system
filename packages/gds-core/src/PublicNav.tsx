import type { ReactNode } from 'react';
import { Anchor, Group } from '@mantine/core';

export interface PublicNavItem {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

export interface PublicNavProps {
  items: PublicNavItem[];
  activeId?: string;
  renderLink?: (item: PublicNavItem, active: boolean) => ReactNode;
}

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
