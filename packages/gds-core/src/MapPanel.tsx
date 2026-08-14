import type { ReactNode } from 'react';
import { AspectRatio, Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ActionBarProps } from './ActionBar';
import { ActionBar } from './ActionBar';
import { StateBlock } from './StateBlock';

/** Props for the `MapPanel` component. */
export interface MapPanelProps {
  title: ReactNode;
  description?: ReactNode;
  /** Optional header action bar. */
  actions?: ActionBarProps;
  loading?: boolean;
  /** Description shown in the empty state when no map source is provided. */
  empty?: ReactNode;
  /** Error content; when set, an error state block replaces the map. */
  error?: ReactNode;
  /** Accessible title for the embedded iframe. Defaults to "Embedded map". */
  embedTitle?: string;
  /** Sanctioned embed URL rendered in a sandboxed iframe (used when `renderMap` is not given). */
  iframeSrc?: string;
  /** iframe sandbox permissions. Defaults to `allow-scripts allow-same-origin allow-popups`. */
  iframeSandbox?: string;
  /**
   * Custom map renderer; takes precedence over `iframeSrc`.
   *
   * A `renderMap` integration inherits the map system's required architecture — every result
   * as its own mark in the tiles' render pass (no clustering, no DOM markers racing the
   * canvas) and a synced list carrying everything the map shows, because canvas pixels are
   * never in the accessibility tree. See `docs/MAP_SYSTEM.md` §6 (issue 550).
   */
  renderMap?: () => ReactNode;
  /** Minimum height of the custom map body. Defaults to a scale-aware 20rem (issue 569). */
  minHeight?: number | string;
}

/** Governed map surface: a titled bordered panel that renders a custom map (`renderMap`) or a sandboxed embed (`iframeSrc`), with loading, empty, and error state blocks. */
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
  minHeight = 'calc(20rem * var(--mantine-scale, 1))',
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
          style={{ width: '100%', height: '100%', border: 0, borderRadius: 'var(--gds-radius-image)' }}
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
