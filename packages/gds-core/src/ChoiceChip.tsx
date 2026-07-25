import type { CSSProperties, ReactNode } from 'react';
import { Badge, Box, Group } from '@mantine/core';
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

/** A single option in a governed single-select chip group (`PillBar` / `SoftChipGroup` / `FilterChipGroup`). */
export interface GdsSelectionOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * Props shared by the governed single-select chip groups. Each renders a
 * horizontally-scrollable `radiogroup` of chips; `value` is the currently
 * selected option value (or `null` for none), and `onChange` fires with the
 * chosen value. `ariaLabel` names the group for assistive tech.
 */
export interface GdsSelectionGroupProps<T extends string = string> {
  options: GdsSelectionOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

function SelectionScroller({ ariaLabel, className, children }: { ariaLabel: string; className?: string; children: ReactNode }) {
  return (
    <Box
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      style={{
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Group gap="xs" wrap="nowrap" style={{ minWidth: 'max-content' }}>
        {children}
      </Group>
    </Box>
  );
}

function SelectionBadge<T extends string>({
  option,
  active,
  onChange,
  size,
  activeStyle,
  inactiveStyle,
}: {
  option: GdsSelectionOption<T>;
  active: boolean;
  onChange: (value: T) => void;
  size: 'macro' | 'micro';
  activeStyle: CSSProperties;
  inactiveStyle: CSSProperties;
}) {
  return (
    <Badge
      component="button"
      type="button"
      role="radio"
      aria-checked={active}
      disabled={option.disabled}
      radius="xl"
      size={size === 'macro' ? 'lg' : 'md'}
      onClick={() => {
        if (!option.disabled) {
          onChange(option.value);
        }
      }}
      style={{
        minHeight: size === 'macro' ? 36 : 28,
        minWidth: size === 'macro' ? 72 : 44,
        cursor: option.disabled ? 'not-allowed' : 'pointer',
        opacity: option.disabled ? 0.55 : 1,
        border: '1px solid var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-gray-3)))',
        ...(active ? activeStyle : inactiveStyle),
      }}
    >
      {option.label}
    </Badge>
  );
}

/**
 * Governed single-select chip group rendered as prominent, brand-filled "macro"
 * pills in a horizontally-scrollable `radiogroup`. Use for a primary segmented
 * choice (a mode switch or a top-level filter) where the options should read as
 * buttons. For a quieter choice use `SoftChipGroup`; for filter facets use
 * `FilterChipGroup`.
 */
export function PillBar<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: GdsSelectionGroupProps<T>) {
  return (
    <SelectionScroller ariaLabel={ariaLabel} className={className}>
      {options.map((option) => (
        <SelectionBadge
          key={option.value}
          option={option}
          active={option.value === value}
          onChange={onChange}
          size="macro"
          activeStyle={{
            color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',
            background: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
          }}
          inactiveStyle={{
            color: 'var(--gds-brand-primary, var(--gds-vibe-text, var(--mantine-color-dark-7)))',
            background: 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-white)))',
          }}
        />
      ))}
    </SelectionScroller>
  );
}

/**
 * Governed single-select chip group rendered as compact, low-emphasis "micro"
 * chips (support-colored when active) in a scrollable `radiogroup`. Use for a
 * secondary, quieter choice than `PillBar`.
 */
export function SoftChipGroup<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: GdsSelectionGroupProps<T>) {
  return (
    <SelectionScroller ariaLabel={ariaLabel} className={className}>
      {options.map((option) => (
        <SelectionBadge
          key={option.value}
          option={option}
          active={option.value === value}
          onChange={onChange}
          size="micro"
          activeStyle={{
            color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',
            background: 'var(--gds-support, var(--mantine-color-teal-6))',
          }}
          inactiveStyle={{
            color: 'var(--gds-text-meta, var(--gds-vibe-muted, var(--mantine-color-gray-7)))',
            background: 'transparent',
          }}
        />
      ))}
    </SelectionScroller>
  );
}

/**
 * Governed single-select chip group styled as accent-tinted filter chips in a
 * scrollable `radiogroup`. Use for a filter/facet selection where the active
 * chip should read as an applied filter (accent tint) rather than a solid button.
 */
export function FilterChipGroup<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: GdsSelectionGroupProps<T>) {
  return (
    <SelectionScroller ariaLabel={ariaLabel} className={className}>
      {options.map((option) => (
        <SelectionBadge
          key={option.value}
          option={option}
          active={option.value === value}
          onChange={onChange}
          size="micro"
          activeStyle={{
            color: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
            background: 'var(--gds-brand-accent-tint, color-mix(in srgb, var(--gds-vibe-accent) 18%, transparent))',
          }}
          inactiveStyle={{
            color: 'var(--gds-text-meta, var(--gds-vibe-muted, var(--mantine-color-gray-7)))',
            background: 'var(--gds-bg-card, var(--gds-vibe-surface, transparent))',
          }}
        />
      ))}
    </SelectionScroller>
  );
}
