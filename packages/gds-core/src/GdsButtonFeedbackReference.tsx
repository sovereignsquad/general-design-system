'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import { GdsVocabulary } from './vocabulary';
import { GDS_BUTTON_FEEDBACK_DURATION_MS, SemanticButton } from './SemanticButton';
import { SimpleDataTable } from './SimpleDataTable';

type FeedbackRow = {
  action: string;
  color: string;
  messageId: string;
  Icon: React.ComponentType<{ size?: string | number }>;
} & Record<string, unknown>;

// Every vocabulary action that declares a success-feedback config, read from GdsVocabulary at
// render time. An action added or re-coloured in the vocabulary changes this table with no edit
// here (Rule 14).
const feedbackRows: FeedbackRow[] = Object.entries(GdsVocabulary)
  .filter(([, config]) => Boolean(config.feedback))
  .map(([action, config]) => ({
    action,
    color: config.feedback!.color,
    messageId: config.feedback!.messageId,
    Icon: config.feedback!.icon,
  }));

const totalActions = Object.keys(GdsVocabulary).length;
// One representative action per distinct feedback colour, so the live proof below covers every
// colour the system actually uses rather than a hand-picked three.
const representativeByColor = Array.from(
  feedbackRows.reduce((acc, row) => (acc.has(row.color) ? acc : acc.set(row.color, row)), new Map<string, FeedbackRow>()).values(),
);

function LiveFeedbackButton({ action }: { action: string }) {
  const [state, setState] = useState<'success' | 'error' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The prop must return to null or a second click cannot re-trigger the effect that drives the
  // treatment -- the same thing a real consumer does after an async action settles.
  const fire = useCallback((next: 'success' | 'error') => {
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(null), GDS_BUTTON_FEEDBACK_DURATION_MS);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Group gap="xs" wrap="nowrap">
      <SemanticButton action={action as never} feedbackState={state} onClick={() => fire('success')} />
      <SemanticButton action={action as never} variant="light" feedbackState={state} onClick={() => fire('error')} />
    </Group>
  );
}

/**
 * Reference for the button micro-feedback axis: the transient success/error treatment
 * `SemanticButton` applies after an action settles. The treatment is per action -- each governed
 * action declares its own feedback icon and message key, so a `delete` confirms with "Deleted"
 * and its own glyph rather than a generic tick. Every value below is read from `GdsVocabulary`
 * and `GDS_BUTTON_FEEDBACK_DURATION_MS` at render time, so the page cannot drift from the
 * component.
 *
 * Each action also declares a feedback *colour*, which the theme currently does not render --
 * stated on the page rather than claimed, and tracked in issue 677.
 */
export function GdsButtonFeedbackReference() {
  return (
    <Stack gap="md" data-gds-button-feedback-reference="">
      <Stack gap="2xs">
        <Group gap="xs" align="center">
          <Text fw={700}>Live — click either button</Text>
          <Badge variant="light">{GDS_BUTTON_FEEDBACK_DURATION_MS}ms</Badge>
        </Group>
        <Text size="sm">
          The left button fires the success treatment, the right one fires the error treatment.
          Watch the label and the icon change, then revert on their own after{' '}
          {GDS_BUTTON_FEEDBACK_DURATION_MS}ms — the duration is owned by the component
          (`GDS_BUTTON_FEEDBACK_DURATION_MS`), not by the caller. One row per distinct feedback
          colour declared in the vocabulary.
        </Text>
        <Stack gap="xs">
          {representativeByColor.map((row) => (
            <Group key={row.action} gap="sm" align="center" wrap="wrap">
              <Box miw={110}>
                <Text size="xs" c="dimmed" ff="monospace">{row.color}</Text>
              </Box>
              <LiveFeedbackButton action={row.action} />
            </Group>
          ))}
        </Stack>
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Success feedback is per action</Text>
        <Text size="sm">
          {feedbackRows.length} of {totalActions} governed actions declare their own success
          feedback — icon, colour, and message key. The icon and message are the action&apos;s
          own, not a generic tick: a `delete` confirms with &ldquo;Deleted&rdquo; and its own
          glyph.
        </Text>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={600}>Known gap (issue 677):</Text> the colour column below is
          what each action <Text component="span" fs="italic">declares</Text>, not what currently
          paints. Measured live in the default preset, a success on `delete` sets{' '}
          <Text component="span" ff="monospace">--button-bg</Text> to Mantine&apos;s red and still
          renders brand-primary, because a governed Button rule in the theme stylesheet repaints
          it. Until that is resolved, treat the label and icon — not the colour — as the part of
          the treatment you can rely on.
        </Text>
        <SimpleDataTable<FeedbackRow>
          columns={[
            { key: 'action', header: 'Action' },
            {
              key: 'Icon',
              header: 'Icon',
              render: (row) => <row.Icon size="1rem" />,
            },
            { key: 'color', header: 'Colour (declared)' },
            {
              key: 'messageId',
              header: 'Message key',
              // A bare key in a table cell gets squeezed by the other columns; a minimum width
              // keeps the dotted id on one line instead of wrapping per segment.
              render: (row) => <Box miw={200}><Text size="xs" c="dimmed" ff="monospace">{row.messageId}</Text></Box>,
            },
          ]}
          rows={feedbackRows}
          getRowKey={(row) => row.action}
        />
      </Stack>

      <Stack gap="2xs">
        <Text fw={700}>Error feedback is uniform</Text>
        <Text size="sm">
          Where success is per action, the error treatment is fixed: the same cross icon and the
          `gds.feedback.error` message key for every action, so a failure reads the same way
          wherever it appears. Pass `feedbackText` to replace the label in either state — the icon
          stays governed.
        </Text>
      </Stack>
    </Stack>
  );
}
