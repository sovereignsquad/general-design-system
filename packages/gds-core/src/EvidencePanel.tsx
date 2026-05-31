import type { ReactNode } from 'react';
import { Alert, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';

export type EvidencePanelState =
  | 'current'
  | 'stale'
  | 'partial'
  | 'permission-limited'
  | 'loading'
  | 'empty'
  | 'error';

export interface EvidencePanelProps {
  title: ReactNode;
  description?: ReactNode;
  source?: ReactNode;
  freshness?: ReactNode;
  confidence?: ReactNode;
  state?: EvidencePanelState;
  evidenceCount?: number;
  permissionNote?: ReactNode;
  retryAction?: ReactNode;
  details?: ReactNode;
  children?: ReactNode;
}

const stateTone: Record<EvidencePanelState, { label: string; color: string }> = {
  current: { label: 'Current', color: 'teal' },
  stale: { label: 'Stale', color: 'orange' },
  partial: { label: 'Partial data', color: 'yellow' },
  'permission-limited': { label: 'Permission limited', color: 'grape' },
  loading: { label: 'Loading', color: 'blue' },
  empty: { label: 'No evidence', color: 'gray' },
  error: { label: 'Needs attention', color: 'red' },
};

export function EvidencePanel({
  title,
  description,
  source,
  freshness,
  confidence,
  state = 'current',
  evidenceCount,
  permissionNote,
  retryAction,
  details,
  children,
}: EvidencePanelProps) {
  const tone = stateTone[state];
  const isProblem = state === 'error' || state === 'permission-limited' || state === 'stale' || state === 'partial';

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Stack gap={4}>
            <Title order={4}>{title}</Title>
            {description ? <Text size="sm" c="dimmed">{description}</Text> : null}
          </Stack>
          <Badge variant="light" color={tone.color}>
            {tone.label}
          </Badge>
        </Group>

        <Group gap="xs" wrap="wrap">
          {source ? <Badge variant="outline" color="gray">Source: {source}</Badge> : null}
          {freshness ? <Badge variant="outline" color="gray">Freshness: {freshness}</Badge> : null}
          {confidence ? <Badge variant="outline" color="gray">Confidence: {confidence}</Badge> : null}
          {typeof evidenceCount === 'number' ? <Badge variant="outline" color="gray">Evidence: {evidenceCount}</Badge> : null}
        </Group>

        {permissionNote ? (
          <Alert color={isProblem ? tone.color : 'gray'} variant="light">
            {permissionNote}
          </Alert>
        ) : null}

        {details}
        {children}
        {retryAction}
      </Stack>
    </Paper>
  );
}
