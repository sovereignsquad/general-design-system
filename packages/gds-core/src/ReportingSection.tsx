import type { ReactNode } from 'react';
import { Group, Paper, Stack, Text, Title } from '@mantine/core';
import { StateBlock } from './StateBlock';

/**
 * State of a reporting section: `ready` shows content; `loading`/`empty`/`error`/
 * `below-threshold`/`permission-limited` replace it with a governed state block;
 * `partial`/`stale`/`filtered` show an inline info banner above the content.
 */
export type ReportingSectionState =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'error'
  | 'below-threshold'
  | 'partial'
  | 'stale'
  | 'filtered'
  | 'permission-limited';

/** Props for {@link ReportingSection}. */
export interface ReportingSectionProps {
  title: ReactNode;
  description?: ReactNode;
  state?: ReportingSectionState;
  /** Period/date-range control rendered above the report body. */
  periodControl?: ReactNode;
  /** Evidence/footnote content rendered last. */
  evidence?: ReactNode;
  /** Metric tiles slot. */
  metrics?: ReactNode;
  /** Chart slot. */
  chart?: ReactNode;
  /** Table slot. */
  table?: ReactNode;
  /** Header action, right-aligned. */
  action?: ReactNode;
  /** Overrides the default copy for the active state's message. */
  stateMessage?: ReactNode;
  /** Retry control shown in the error and permission-limited state blocks. */
  retryAction?: ReactNode;
}

/**
 * Governed reporting surface that frames a report's period control, metrics, chart,
 * table, and evidence, and swaps in the appropriate state block (loading/empty/error/
 * threshold/permission) or inline banner (partial/stale/filtered) based on `state`.
 */
export function ReportingSection({
  title,
  description,
  state = 'ready',
  periodControl,
  evidence,
  metrics,
  chart,
  table,
  action,
  stateMessage,
  retryAction,
}: ReportingSectionProps) {
  let stateBlock: ReactNode = null;

  if (state === 'loading') {
    stateBlock = <StateBlock variant="loading" title="Loading report" description={stateMessage ?? 'The reporting surface is synchronizing.'} compact />;
  } else if (state === 'empty') {
    stateBlock = <StateBlock variant="empty" title="No report data" description={stateMessage ?? 'No records match this reporting scope yet.'} compact />;
  } else if (state === 'error') {
    stateBlock = <StateBlock variant="error" title="Unable to load report" description={stateMessage ?? 'The report could not be prepared.'} compact action={retryAction} />;
  } else if (state === 'below-threshold') {
    stateBlock = <StateBlock variant="not-enough-data" title="Not enough data" description={stateMessage ?? 'This report is hidden until the threshold is met.'} compact />;
  } else if (state === 'permission-limited') {
    stateBlock = <StateBlock variant="permission" title="Permission-limited report" description={stateMessage ?? 'Some evidence is hidden by access rules.'} compact action={retryAction} />;
  }

  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md">
          <Stack gap={4}>
            <Title order={3}>{title}</Title>
            {description ? <Text size="sm" c="dimmed">{description}</Text> : null}
          </Stack>
          {action}
        </Group>

        {periodControl}

        {(state === 'partial' || state === 'stale' || state === 'filtered') && stateMessage ? (
          <StateBlock variant="info" title={state === 'partial' ? 'Partial report' : state === 'stale' ? 'Stale report' : 'Filtered report'} description={stateMessage} compact />
        ) : null}

        {stateBlock}
        {metrics}
        {chart}
        {table}
        {evidence}
      </Stack>
    </Paper>
  );
}
