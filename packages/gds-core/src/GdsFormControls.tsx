import type { ReactNode } from 'react';
import { Box, Button, Group, Progress, SegmentedControl, Slider, Stack, Text, Title } from '@mantine/core';
import { FormField } from './FormField';

/** A single option in a {@link GdsSegmentedControl}. */
export interface GdsSegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

/** Props for {@link GdsSegmentedControl}. */
export interface GdsSegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: GdsSegmentedControlOption<T>[];
  /** Accessible name for the control group. */
  ariaLabel: string;
  /** How options that exceed the width behave: horizontal `'scroll'` (default) or `'wrap'` onto multiple rows. */
  overflow?: 'scroll' | 'wrap';
  fullWidth?: boolean;
  disabled?: boolean;
}

/** Governed segmented control: a token-themed, overflow-aware `role="group"` of mutually-exclusive options. */
export function GdsSegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  ariaLabel,
  overflow = 'scroll',
  fullWidth = false,
  disabled = false,
}: GdsSegmentedControlProps<T>) {
  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      style={{
        overflowX: overflow === 'scroll' ? 'auto' : undefined,
        maxWidth: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <SegmentedControl
        value={value}
        onChange={(next) => onChange(next as T)}
        data={options.map((option) => ({
          value: option.value,
          label: option.label,
          disabled: option.disabled || disabled,
        }))}
        fullWidth={fullWidth}
        withItemsBorders={false}
        styles={{
          root: {
            minWidth: overflow === 'scroll' ? 'max-content' : undefined,
            flexWrap: overflow === 'wrap' ? 'wrap' : undefined,
            background: 'var(--gds-vibe-control, var(--mantine-color-gray-1))',
          },
          label: {
            minHeight: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
          },
          indicator: {
            background: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
          },
        }}
      />
    </Box>
  );
}

/** Props for {@link GdsSlider}. */
export interface GdsSliderProps {
  label: ReactNode;
  description?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  /** Minimum value. Defaults to 1. */
  min?: number;
  /** Maximum value. Defaults to 10. */
  max?: number;
  /** Step increment. Defaults to 1. */
  step?: number;
  disabled?: boolean;
  /** Accessible name; falls back to `label` when it is a string. */
  ariaLabel?: string;
  marks?: { value: number; label?: ReactNode }[];
}

/** Governed slider wrapped in a {@link FormField}, with brand-tokened color and an accessible label. */
export function GdsSlider({
  label,
  description,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  disabled = false,
  ariaLabel,
  marks,
}: GdsSliderProps) {
  return (
    <FormField label={label} description={description}>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks={marks}
        disabled={disabled}
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : 'Slider')}
        color="var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))"
      />
    </FormField>
  );
}

/** Props for {@link GdsRatingScale} — a {@link GdsSlider} fixed to a 1..`scale` integer range. */
export interface GdsRatingScaleProps extends Omit<GdsSliderProps, 'min' | 'max' | 'step'> {
  /** Top of the rating range. Defaults to 5. */
  scale?: 5 | 10;
}

/** A {@link GdsSlider} preset for 1..`scale` integer ratings, with default end-point marks. */
export function GdsRatingScale({ scale = 5, marks, ...props }: GdsRatingScaleProps) {
  return (
    <GdsSlider
      min={1}
      max={scale}
      step={1}
      marks={marks ?? [
        { value: 1, label: '1' },
        { value: scale, label: String(scale) },
      ]}
      {...props}
    />
  );
}

/** A single step in a {@link GdsWizardStepper}. */
export interface GdsWizardStep {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  optional?: boolean;
  completed?: boolean;
}

/** Props for {@link GdsWizardStepper}. */
export interface GdsWizardStepperProps {
  steps: GdsWizardStep[];
  /** Index of the currently active step (clamped to a valid range). */
  activeStep: number;
  onStepChange?: (stepIndex: number) => void;
  onBack?: () => void;
  /** Advance/finish handler; the primary button shows a loading state while it resolves. */
  onSaveNext?: () => void | Promise<void>;
  backLabel?: string;
  saveNextLabel?: string;
  /** Label for the primary button on the final step. */
  finishLabel?: string;
  loading?: boolean;
  ariaLabel?: string;
}

/**
 * Governed multi-step wizard: a progress bar, a scrollable ordered list of step
 * buttons (with `aria-current="step"` on the active one), the current step's
 * title/description, and Back / Save&Next (or Finish) controls.
 */
export function GdsWizardStepper({
  steps,
  activeStep,
  onStepChange,
  onBack,
  onSaveNext,
  backLabel = 'Back',
  saveNextLabel = 'Save & Next',
  finishLabel = 'Finish',
  loading = false,
  ariaLabel = 'Progress',
}: GdsWizardStepperProps) {
  const safeIndex = Math.min(Math.max(activeStep, 0), Math.max(steps.length - 1, 0));
  const current = steps[safeIndex];
  const progress = steps.length <= 1 ? 100 : ((safeIndex + 1) / steps.length) * 100;
  const atFirst = safeIndex === 0;
  const atLast = safeIndex >= steps.length - 1;

  if (!steps.length) {
    return null;
  }

  return (
    <Stack gap="md" aria-label={ariaLabel}>
      <Progress value={progress} radius="xl" size="sm" aria-label={`${safeIndex + 1} of ${steps.length} steps complete`} />
      <Group component="ol" gap="xs" wrap="nowrap" style={{ overflowX: 'auto', padding: 0, margin: 0 }}>
        {steps.map((step, index) => {
          const active = index === safeIndex;
          return (
            <Box component="li" key={step.id} style={{ listStyle: 'none', minWidth: 120 }}>
              <Button
                variant={active ? 'filled' : step.completed ? 'light' : 'default'}
                size="xs"
                fullWidth
                onClick={() => onStepChange?.(index)}
                aria-current={active ? 'step' : undefined}
              >
                {step.title}
              </Button>
            </Box>
          );
        })}
      </Group>
      <Stack gap={4}>
        <Title order={4}>{current.title}</Title>
        {current.description ? <Text size="sm" c="dimmed">{current.description}</Text> : null}
        {current.optional ? <Text size="xs" c="dimmed">Optional step</Text> : null}
      </Stack>
      <Group justify="space-between" gap="sm">
        <Button variant="default" onClick={onBack} disabled={loading || atFirst}>
          {backLabel}
        </Button>
        <Button onClick={() => { void onSaveNext?.(); }} loading={loading}>
          {atLast ? finishLabel : saveNextLabel}
        </Button>
      </Group>
    </Stack>
  );
}
