import { forwardRef } from 'react';
import { createPolymorphicComponent } from '@mantine/core';
import type { SidebarNavItemProps, SemanticAction } from '@sovereignsquad/gds-core';
import { SidebarNavItem } from '@sovereignsquad/gds-core';

/** Props for {@link SemanticNavLink}: {@link SidebarNavItemProps} with the label/icon governed by `action`. */
export interface SemanticNavLinkProps extends Omit<SidebarNavItemProps, 'label' | 'icon' | 'action'> {
  /** Semantic action supplying the standardized label and icon for this link. */
  action: SemanticAction;
}

/**
 * SemanticNavLink strictly enforces ubiquitous language and standardized iconography
 * for sidebar navigation links.
 */
const _SemanticNavLink = forwardRef<HTMLAnchorElement, SemanticNavLinkProps>(
  ({ action, ...props }, ref) => {
    return (
      <SidebarNavItem
        ref={ref}
        action={action}
        {...props}
      />
    );
  }
);

/**
 * Polymorphic sidebar nav link that enforces GDS ubiquitous language and
 * standardized iconography by deriving its label and icon from a
 * {@link SemanticAction}. Renders as an `a` by default.
 */
export const SemanticNavLink = createPolymorphicComponent<'a', SemanticNavLinkProps>(_SemanticNavLink);
