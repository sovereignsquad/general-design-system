import type { ReactNode } from 'react';
import { AspectRatio, Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ActionBarProps } from './ActionBar';
import { ActionBar } from './ActionBar';
import { StateBlock } from './StateBlock';

export interface MapPanelProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ActionBarProps;
  loading?: boolean;
  empty?: ReactNode;
  error?: ReactNode;
  embedTitle?: string;
  iframeSrc?: string;
  iframeSandbox?: string;
  renderMap?: () => ReactNode;
  minHeight?: number | string;
}

export function MapPanel({
  title,
  description,
  actions,
  loading = false,
  empty,
  error,
  embedTitle,
  iframeSrc,
  iframeSandbox = 'allow-scripts allow-same-origin allow-popups',
  renderMap,
  minHeight = 320,
}: MapPanelProps) {
  let body: ReactNode;

  if (loading) {
    body = (
      <StateBlock
        variant="loading"
        title="Loading map"
        description="The shared map panel is still preparing the embedded surface."
        compact
      />
    );
  } else if (error) {
    body = <StateBlock variant="error" title="Map unavailable" description={error} compact />;
  } else if (!iframeSrc && !renderMap) {
    body = (
      <StateBlock
        variant="empty"
        title="No map available"
        description={empty ?? 'Add coordinates or a sanctioned embed source to render this panel.'}
        compact
      />
    );
  } else if (renderMap) {
    body = <Box style={{ minHeight }}>{renderMap()}</Box>;
  } else {
    body = (
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={iframeSrc}
          title={embedTitle ?? 'Embedded map'}
          sandbox={iframeSandbox}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
        />
      </AspectRatio>
    );
  }

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={4}>
            <Title order={3}>{title}</Title>
            {description ? (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            ) : null}
          </Stack>
          {actions ? <ActionBar {...actions} /> : null}
        </Group>
        {body}
      </Stack>
    </Paper>
  );
}
