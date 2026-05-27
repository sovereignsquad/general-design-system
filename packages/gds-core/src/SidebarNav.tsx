'use client';

import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { Box, NavLink, Stack, Text, createPolymorphicComponent } from '@mantine/core';
import type { NavLinkProps } from '@mantine/core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsVocabularyPack, SemanticActionId } from './vocabulary';

export interface SidebarNavProps {
  children: ReactNode;
  ariaLabel?: string;
  gap?: string | number;
}

export interface SidebarNavSectionProps {
  label?: ReactNode;
  children: ReactNode;
  pushToBottom?: boolean;
}

export interface SidebarNavItemProps extends Omit<NavLinkProps, 'label' | 'leftSection' | 'description'> {
  action?: SemanticActionId;
  label?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  'aria-label'?: string;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  vocabularyPacks?: GdsVocabularyPack[];
}

export function SidebarNav({ children, ariaLabel = 'Primary navigation', gap = 'md' }: SidebarNavProps) {
  return (
    <Stack component="nav" aria-label={ariaLabel} gap={gap} h="100%">
      {children}
    </Stack>
  );
}

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

export const SidebarNavItem = createPolymorphicComponent<'a', SidebarNavItemProps>(_SidebarNavItem);
