import { forwardRef } from 'react';
import { NavLink, createPolymorphicComponent } from '@mantine/core';
import type { NavLinkProps } from '@mantine/core';
import { useGdsTranslation } from '@doneisbetter/gds-theme';
import { GdsVocabulary, type SemanticAction } from '@doneisbetter/gds-core';

export interface SemanticNavLinkProps extends Omit<NavLinkProps, 'leftSection' | 'label'> {
  action: SemanticAction;
}

/**
 * SemanticNavLink strictly enforces ubiquitous language and standardized iconography
 * for sidebar navigation links.
 */
const _SemanticNavLink = forwardRef<HTMLAnchorElement, SemanticNavLinkProps>(
  ({ action, ...props }, ref) => {
    const { t } = useGdsTranslation();
    const config = GdsVocabulary[action];
    const Icon = config.icon;

    return (
      <NavLink
        ref={ref}
        label={t(config.id, config.defaultMessage)}
        leftSection={<Icon size="1rem" stroke={1.5} />}
        {...props}
      />
    );
  }
);

export const SemanticNavLink = createPolymorphicComponent<'a', SemanticNavLinkProps>(_SemanticNavLink);
