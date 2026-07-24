import type { ReactNode } from 'react';
import { Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { GdsIcons } from './icons';
import {
  resolveSurfacePresentationStyles,
  type SurfacePresentationProps,
} from './SurfacePresentation';

export type StateBlockVariant =
  | 'loading'
  | 'empty'
  | 'error'
  | 'permission'
  | 'disabled'
  | 'success'
  | 'info'
  | 'not-enough-data';

export interface StateBlockProps extends SurfacePresentationProps {
  variant: StateBlockVariant;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
}

const variantConfig: Record<StateBlockVariant, { color: string; icon: ReactNode }> = {
  loading: { color: 'violet', icon: <Loader size="sm" /> },
  empty: { color: 'gray', icon: <GdsIcons.Inbox size="1.1rem" /> },
  error: { color: 'red', icon: <GdsIcons.Danger size="1.1rem" /> },
  permission: { color: 'orange', icon: <GdsIcons.Verify size="1.1rem" /> },
  disabled: { color: 'gray', icon: <GdsIcons.Toggle size="1.1rem" /> },
  success: { color: 'teal', icon: <GdsIcons.Success size="1.1rem" /> },
  info: { color: 'blue', icon: <GdsIcons.Info size="1.1rem" /> },
  'not-enough-data': { color: 'yellow', icon: <GdsIcons.Analytics size="1.1rem" /> },
};

/**
 * A single governed status panel for a non-ready surface state — `loading`,
 * `empty`, `error`, `permission`, `disabled`, `success`, `info`, or
 * `not-enough-data` — with a variant-appropriate icon, title, description, and
 * optional recovery action. It is the building block {@link AsyncSurface} composes;
 * reach for it directly when you need one explicit state message in place of a
 * blank region.
 */
export function StateBlock({
  variant,
  title,
  description,
  action,
  icon,
  compact = false,
  presentation = 'inline',
  minHeight,
  contentAlign,
  contentJustify,
}: StateBlockProps) {
  const config = variantConfig[variant];
  const layout = resolveSurfacePresentationStyles({
    presentation,
    minHeight,
    contentAlign,
    contentJustify,
  });
  const centeredText = presentation !== 'inline'
    ? (contentAlign ?? 'center') === 'center'
    : !compact;
  const centeredAlign = presentation !== 'inline' ? (contentAlign ?? 'center') : 'start';
  const headingAlign = presentation === 'inline'
    ? (compact ? 'flex-start' : 'center')
    : (centeredAlign === 'center' ? 'center' : 'flex-start');

  return (
    <Stack
      align={headingAlign}
      justify={presentation === 'inline' ? 'center' : undefined}
      gap="md"
      py={compact ? 'md' : 'xl'}
      ta={centeredText ? 'center' : 'left'}
      style={layout}
    >
      <ThemeIcon variant="light" color={config.color} size={compact ? 'lg' : 'xl'} radius="xl">
        {icon ?? config.icon}
      </ThemeIcon>
      <Stack gap={6} align={headingAlign}>
        <Title order={compact ? 4 : 3}>{title}</Title>
        {description ? (
          <Text c="dimmed" maw={compact ? undefined : 480}>
            {description}
          </Text>
        ) : null}
      </Stack>
      {action}
    </Stack>
  );
}

export interface MissingDataPromptProps extends Omit<StateBlockProps, 'variant' | 'title'> {
  title?: string;
  missingFields?: ReactNode[];
}

export function MissingDataPrompt({
  title = 'Missing data',
  description = 'Add the required data before this view can show a reliable result.',
  missingFields = [],
  action,
  compact = true,
  ...props
}: MissingDataPromptProps) {
  const details = missingFields.length ? (
    <Stack gap={4}>
      {description ? <Text c="dimmed">{description}</Text> : null}
      <Stack component="ul" gap={2} m={0} pl="md" ta="left">
        {missingFields.map((field, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Text component="li" key={index} c="dimmed">
            {field}
          </Text>
        ))}
      </Stack>
    </Stack>
  ) : description;

  return (
    <StateBlock
      variant="not-enough-data"
      title={title}
      description={details}
      action={action}
      compact={compact}
      {...props}
    />
  );
}
