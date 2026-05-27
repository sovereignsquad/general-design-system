import type { ReactNode } from 'react';
import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';

export interface ChoiceChipProps extends Omit<BadgeProps, 'children' | 'variant'> {
  label: ReactNode;
  active?: boolean;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  component?: React.ElementType;
}

/**
 * ChoiceChip provides a neutral, token-safe chip for lightweight selection,
 * mode toggles, and taxonomy links without introducing page-local badge rules.
 */
export function ChoiceChip({
  label,
  active = false,
  href,
  onClick,
  component,
  ...props
}: ChoiceChipProps) {
  const sharedProps = {
    variant: active ? 'filled' : 'light',
    size: 'sm' as const,
    radius: 'xl' as const,
    ...props,
  };

  if (href) {
    const LinkComponent = (component || 'a') as any;

    return (
      <Badge
        component={LinkComponent}
        href={href}
        aria-current={active ? 'page' : undefined}
        {...sharedProps}
      >
        {label}
      </Badge>
    );
  }

  if (onClick || component) {
    const ButtonComponent = (component || 'button') as any;

    return (
      <Badge
        component={ButtonComponent}
        type={component ? undefined : 'button'}
        onClick={onClick as any}
        aria-pressed={onClick ? active : undefined}
        {...sharedProps}
      >
        {label}
      </Badge>
    );
  }

  return <Badge {...sharedProps}>{label}</Badge>;
}
