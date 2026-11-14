'use client';

import type { ReactNode } from 'react';
import { Avatar, Box, Divider, Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { formatGdsDate } from './GdsI18nRuntime';

/** One message in a {@link GdsMessageThread}. */
export interface GdsThreadMessage {
  /** Unique, stable id. */
  id: string;
  /** Id of the person who sent it; compared with `selfId`. */
  senderId: string;
  /** Sender's display name. */
  senderName: string;
  /** Sender's avatar image URL; initials are used without it. */
  senderAvatarSrc?: string;
  /** Message content. */
  content: ReactNode;
  /** When the message was sent. */
  createdAt: Date | number | string;
}

/** Props for {@link GdsMessageThread}. */
export interface GdsMessageThreadProps {
  /** Messages, oldest first. */
  messages: GdsThreadMessage[];
  /** Id of the current user; their messages are the `self` side. */
  selfId: string;
  /** Accessible name of the conversation. */
  ariaLabel: string;
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/**
 * Conversation between people, as a `role="log"` region. The current user's messages align to
 * the end on `--gds-message-self-bg`; other people's align to the start on
 * `--gds-message-other-bg` with the sender's name and avatar. Consecutive messages from one
 * sender share one header. A separator with the locale-formatted date starts each day. Every
 * message carries the sender and time for assistive technology. For user and assistant chat
 * use `ChatThread`, which this does not change.
 */
export function GdsMessageThread({ messages, selfId, ariaLabel }: GdsMessageThreadProps) {
  const { t, locale } = useGdsTranslation();
  const youLabel = t('gds.messageThread.you', 'You');

  const rows: ReactNode[] = [];
  let previousDay = '';
  let previousSender = '';
  for (const message of messages) {
    const date = new Date(message.createdAt);
    const day = dayKey(date);
    if (day !== previousDay) {
      rows.push(
        <Divider
          key={`day-${day}`}
          role="separator"
          label={formatGdsDate(date, { locale, dateStyle: 'medium' })}
          labelPosition="center"
          data-gds-message-day=""
        />,
      );
      previousDay = day;
      previousSender = '';
    }
    const isSelf = message.senderId === selfId;
    const showHeader = message.senderId !== previousSender;
    previousSender = message.senderId;
    const time = formatGdsDate(date, { locale, timeStyle: 'short' });
    const sender = isSelf ? youLabel : message.senderName;

    rows.push(
      <Stack key={message.id} gap={4} align={isSelf ? 'flex-end' : 'flex-start'} data-gds-message={isSelf ? 'self' : 'other'}>
        {showHeader ? (
          <Group gap="xs" wrap="nowrap" aria-hidden="true">
            {!isSelf ? <Avatar src={message.senderAvatarSrc} name={message.senderName} radius="xl" size="sm" /> : null}
            <Text size="xs" fw={600}>{sender}</Text>
          </Group>
        ) : null}
        <Box
          style={{
            maxInlineSize: '80%',
            padding: 'var(--gds-space-xs) var(--gds-space-sm)',
            borderRadius: 'var(--gds-radius-card)',
            background: isSelf ? 'var(--gds-message-self-bg)' : 'var(--gds-message-other-bg)',
            color: isSelf ? 'var(--gds-message-self-fg)' : 'var(--gds-message-other-fg)',
            border: isSelf ? undefined : 'calc(var(--gds-focus-ring-width) / 2) solid var(--gds-border-subtle)',
          }}
        >
          <VisuallyHidden>{`${sender}, ${time}: `}</VisuallyHidden>
          <Box>{message.content}</Box>
          <Text size="xs" aria-hidden="true" ta={isSelf ? 'end' : 'start'}>{time}</Text>
        </Box>
      </Stack>,
    );
  }

  return (
    <Stack gap="sm" role="log" aria-label={ariaLabel} aria-live="polite" data-gds-message-thread="">
      {rows}
    </Stack>
  );
}
