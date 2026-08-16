import type { CSSProperties, ReactNode } from 'react';
import { Badge, Box, Group } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';

/** Props for {@link ChoiceChip}; extends Mantine `BadgeProps` minus `children`/`variant`. */
export interface ChoiceChipProps extends Omit<BadgeProps, 'children' | 'variant'> {
  label: ReactNode;
  /** Active/selected state; renders filled and sets `aria-current`/`aria-pressed`. */
  active?: boolean;
  /** When set, the chip renders as a link (anchor by default). */
  href?: string;
  /** Click handler; renders the chip as a `button` when no `href`/`component` is given. */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Override the rendered element (e.g. a router `Link`). */
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

function SelectionScroller<T extends string>({
  ariaLabel,
  className,
  options,
  value,
  onChange,
  children,
}: {
  ariaLabel: string;
  className?: string;
  options: GdsSelectionOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  // Roving tabindex: arrows move selection/focus among enabled radios (wrapping);
  // Home/End jump to the ends. One tab stop per group.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const home = event.key === 'Home';
    const end = event.key === 'End';
    if (!forward && !backward && !home && !end) {
      return;
    }
    const enabled = options.filter((option) => !option.disabled);
    if (enabled.length === 0) {
      return;
    }
    event.preventDefault();
    const currentIndex = Math.max(
      0,
      enabled.findIndex((option) => option.value === value),
    );
    let nextIndex = currentIndex;
    if (forward) nextIndex = (currentIndex + 1) % enabled.length;
    if (backward) nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
    if (home) nextIndex = 0;
    if (end) nextIndex = enabled.length - 1;
    const nextValue = enabled[nextIndex].value;
    onChange(nextValue);
    const group = event.currentTarget;
    const radio = group.querySelector<HTMLElement>(`[role="radio"][data-gds-selection-value="${nextValue}"]`);
    radio?.focus();
  };

  return (
    <Box
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      onKeyDown={handleKeyDown}
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
  isTabStop,
  onChange,
  size,
  activeStyle,
  inactiveStyle,
}: {
  option: GdsSelectionOption<T>;
  active: boolean;
  /** Roving tabindex: exactly one radio per group is the tab stop. */
  isTabStop: boolean;
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
      tabIndex={isTabStop ? 0 : -1}
      data-gds-selection-value={option.value}
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

function tabStopValueFor<T extends string>(options: GdsSelectionOption<T>[], value: T | null): T | undefined {
  const selected = options.find((option) => option.value === value && !option.disabled);
  return (selected ?? options.find((option) => !option.disabled))?.value;
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
    <SelectionScroller ariaLabel={ariaLabel} className={className} options={options} value={value} onChange={onChange}>
      {options.map((option) => (
        <SelectionBadge
          key={option.value}
          option={option}
          active={option.value === value}
          isTabStop={option.value === tabStopValueFor(options, value)}
          onChange={onChange}
          size="macro"
          activeStyle={{
            // text-on-inverse targets bg-inverse, not brand-primary; measured 1.00:1 in default dark.
            color: 'var(--gds-brand-primary-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',
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
    <SelectionScroller ariaLabel={ariaLabel} className={className} options={options} value={value} onChange={onChange}>
      {options.map((option) => (
        <SelectionBadge
          key={option.value}
          option={option}
          active={option.value === value}
          isTabStop={option.value === tabStopValueFor(options, value)}
          onChange={onChange}
          size="micro"
          activeStyle={{
            // --gds-text-on-support is derived per preset/scheme against the support fill.
            color: 'var(--gds-text-on-support, var(--gds-text-on-inverse, var(--mantine-color-white)))',
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
    <SelectionScroller ariaLabel={ariaLabel} className={className} options={options} value={value} onChange={onChange}>
      {options.map((option) => (
        <SelectionBadge
          key={option.value}
          option={option}
          active={option.value === value}
          isTabStop={option.value === tabStopValueFor(options, value)}
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
