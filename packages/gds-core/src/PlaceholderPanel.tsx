import type { ReactNode } from 'react';
import { Badge, Card, Stack, Text, Title } from '@mantine/core';
import { StateBlock } from './StateBlock';

/** Props for {@link PlaceholderPanel}. */
export interface PlaceholderPanelProps {
  title: string;
  description: ReactNode;
  /** Optional badge shown above the title in placeholder mode. */
  badge?: string;
  /** Optional footer text shown beneath the description in placeholder mode. */
  footer?: ReactNode;
  /** Live content rendered directly when `mode` is "live". */
  children?: ReactNode;
  /** "live" renders `children`; "placeholder" renders the governed placeholder card. */
  mode: 'placeholder' | 'live';
}

/**
 * Renders `children` directly in "live" mode, or a governed placeholder card
 * (badge, title, description, footer, and a not-enough-data block) when in
 * "placeholder" mode or when no children are supplied.
 */
export function PlaceholderPanel({
  title,
  description,
  badge,
  footer,
  children,
  mode,
}: PlaceholderPanelProps) {
  if (mode === 'live' && children) {
    return <>{children}</>;
  }

  return (
    <Card>
      <Stack gap="md">
        {badge ? (
          <Badge variant="light" color="blue" w="fit-content">
            {badge}
          </Badge>
        ) : null}
        <Stack gap="xs">
          <Title order={4}>{title}</Title>
          <Text c="dimmed">{description}</Text>
        </Stack>
        {footer ? <Text size="sm">{footer}</Text> : null}
        <StateBlock
          variant="not-enough-data"
          title="Content is not live yet"
          description="This surface is intentionally showing a governed placeholder until live data is available."
          compact
        />
      </Stack>
    </Card>
  );
}
