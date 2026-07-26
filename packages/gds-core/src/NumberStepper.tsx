import { ActionIcon, Group, Text } from '@mantine/core';
import { GdsIcons } from './icons';

/**
 * NumberStepper (gap B9 / issue #324).
 *
 * Accessible bounded -/value/+ quantity control composed from GDS primitives.
 * Enforces min/max/step with clamp + snap, supports keyboard (Arrow/Home/End),
 * and disables the relevant button at each bound. No raw Mantine leaks in the
 * public API.
 */

/** Props for {@link NumberStepper}. */
export interface NumberStepperProps {
  value: number;
  /** Receives the clamped, step-snapped value on every change. */
  onChange: (value: number) => void;
  /** Lower bound (inclusive); defaults to 0. */
  min?: number;
  /** Upper bound (inclusive); defaults to +Infinity (unbounded). */
  max?: number;
  /** Increment size; values snap to this from `min`. Defaults to 1. */
  step?: number;
  disabled?: boolean;
  /** Required accessible label for the control. */
  ariaLabel: string;
  /** Accessible label for the decrement button; defaults to "Decrease". */
  decrementLabel?: string;
  /** Accessible label for the increment button; defaults to "Increase". */
  incrementLabel?: string;
}

/**
 * Accessible bounded −/value/+ quantity control composed from GDS primitives.
 * Enforces `min`/`max`/`step` with clamp + snap, supports keyboard control
 * (Arrow/Home/End), and disables the relevant button at each bound. `ariaLabel`
 * is required; `onChange` receives the clamped, snapped value.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  ariaLabel,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
}: NumberStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const snap = (next: number) => {
    const snapped = Math.round((next - min) / step) * step + min;
    return clamp(Number.isFinite(snapped) ? snapped : min);
  };

  const current = snap(value);
  const atMin = current <= min;
  const atMax = current >= max;

  const commit = (next: number) => {
    if (disabled) return;
    onChange(snap(next));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        commit(current + step);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        commit(current - step);
        break;
      case 'Home':
        event.preventDefault();
        if (Number.isFinite(min)) commit(min);
        break;
      case 'End':
        event.preventDefault();
        if (Number.isFinite(max)) commit(max);
        break;
      default:
        break;
    }
  };

  return (
    <Group
      gap="xs"
      wrap="nowrap"
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={current}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <ActionIcon
        variant="default"
        aria-label={decrementLabel}
        disabled={disabled || atMin}
        onClick={() => commit(current - step)}
      >
        <GdsIcons.Remove size="1rem" />
      </ActionIcon>
      <Text fw={600} ta="center" style={{ minWidth: 32 }} aria-hidden>
        {current}
      </Text>
      <ActionIcon
        variant="default"
        aria-label={incrementLabel}
        disabled={disabled || atMax}
        onClick={() => commit(current + step)}
      >
        <GdsIcons.Add size="1rem" />
      </ActionIcon>
    </Group>
  );
}
