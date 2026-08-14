'use client';

import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { Box, NavLink, Stack, Text, createPolymorphicComponent } from '@mantine/core';
import type { NavLinkProps } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsVocabularyPack, SemanticActionId } from './vocabulary';

/** Props for {@link SidebarNav}, the `<nav>` container. */
export interface SidebarNavProps {
  children: ReactNode;
  /** Accessible label for the nav landmark; defaults to "Primary navigation". */
  ariaLabel?: string;
  /** Vertical gap between sections; defaults to `'md'`. */
  gap?: string | number;
}

/** Props for {@link SidebarNavSection}, a labeled group of nav items. */
export interface SidebarNavSectionProps {
  /** Optional group heading. */
  label?: ReactNode;
  children: ReactNode;
  /** When true, pushes the section to the bottom of the sidebar (via `margin-top: auto`). */
  pushToBottom?: boolean;
}

/** Props for {@link SidebarNavItem}; extends Mantine `NavLinkProps` but owns `label`/`leftSection`/`description`. */
export interface SidebarNavItemProps extends Omit<NavLinkProps, 'label' | 'leftSection' | 'description'> {
  /** Semantic action id; supplies a default label and icon from the vocabulary. */
  action?: SemanticActionId;
  /** Explicit label; overrides the label derived from `action`. */
  label?: ReactNode;
  description?: ReactNode;
  /** Content rendered in the item's right section. */
  badge?: ReactNode;
  /** Explicit leading icon; overrides the icon derived from `action`. */
  icon?: ReactNode;
  'aria-label'?: string;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  /** Vocabulary packs consulted to resolve `action` labels and icons. */
  vocabularyPacks?: GdsVocabularyPack[];
}

/** Full-height sidebar navigation landmark that stacks its sections inside a labeled `<nav>`. */
export function SidebarNav({ children, ariaLabel: ariaLabelProp, gap = 'md' }: SidebarNavProps) {
  const { t } = useGdsTranslation();
  const ariaLabel = ariaLabelProp ?? t('gds.sidebarNav.ariaLabel', "Primary navigation");

  return (
    <Stack component="nav" aria-label={ariaLabel} gap={gap} h="100%">
      {children}
    </Stack>
  );
}

/** Groups sidebar items under an optional heading; `pushToBottom` anchors the group to the bottom of the sidebar. */
export function SidebarNavSection({ label, children, pushToBottom = false }: SidebarNavSectionProps) {
  return (
    <Stack gap="xs" mt={pushToBottom ? 'auto' : undefined}>
      {label ? (
        <Text size="xs" fw={700} c="dimmed">
          {label}
        </Text>
      ) : null}
      <Stack gap={4}>
        {children}
      </Stack>
    </Stack>
  );
}

const _SidebarNavItem = forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({
    action,
    label,
    description,
    badge,
    icon,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
    vocabularyPacks = [],
    ...props
  }, ref) => {
    const { t } = useGdsTranslation();
    const config = action ? resolveSemanticActionConfig(action, vocabularyPacks) : null;
    const Icon = config?.icon;
    const resolvedLabel = label ?? (action ? getSemanticActionLabel(action, t, vocabularyPacks) : undefined);

    return (
      <NavLink
        ref={ref}
        label={resolvedLabel}
        description={description}
        leftSection={icon ?? (Icon ? <Icon size="1rem" stroke={1.5} /> : undefined)}
        rightSection={badge ? <Box>{badge}</Box> : props.rightSection}
        aria-label={ariaLabel ?? (typeof resolvedLabel === 'string' ? resolvedLabel : undefined)}
        aria-current={props.active ? 'page' : ariaCurrent}
        {...props}
      />
    );
  },
);

/**
 * Polymorphic sidebar nav item built on Mantine `NavLink`. Resolves its label and
 * leading icon from a semantic `action` (via the vocabulary/translation) unless
 * overridden, mirrors the active state into `aria-current="page"`, and renders any
 * `badge` in the right section. Renders as an `<a>` by default.
 */
export const SidebarNavItem = createPolymorphicComponent<'a', SidebarNavItemProps>(_SidebarNavItem);
