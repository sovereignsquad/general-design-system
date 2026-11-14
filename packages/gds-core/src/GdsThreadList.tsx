'use client';

import { Avatar, Box, Button, Group, Stack, Text, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { formatGdsDate } from './GdsI18nRuntime';
import { StateBlock } from './StateBlock';

/** One conversation in a {@link GdsThreadList}. */
export interface GdsThreadListItem {
  /** Unique, stable id. */
  id: string;
  /** Conversation title, usually the other participants' names. */
  title: string;
  /** One-line preview of the latest message. */
  preview?: string;
  /** Time of the latest message, formatted for the active locale. */
  timestamp?: Date | number | string;
  /** The thread has messages the user has not read. */
  unread?: boolean;
  /** Name used for the avatar initials and alt text; defaults to `title`. */
  avatarName?: string;
  /** Avatar image URL. */
  avatarSrc?: string;
}

/** Props for {@link GdsThreadList}. */
export interface GdsThreadListProps {
  /** Threads, newest first. */
  threads: GdsThreadListItem[];
  /** Accessible name of the list. */
  ariaLabel: string;
  /** Id of the open thread; marked with `aria-current`. */
  selectedId?: string | null;
  /** Called when a thread is chosen. */
  onSelect?: (id: string) => void;
  /** Shows the loading state instead of the list. */
  loading?: boolean;
  /** Error message; shows the error state instead of the list. */
  error?: string;
  /** Retry action shown in the error state. */
  onRetry?: () => void;
  /** More threads can be loaded; shows the load-more control. */
  hasMore?: boolean;
  /** Loads the next page of threads. */
  onLoadMore?: () => void;
  /** A page is loading; disables the load-more control. */
  loadingMore?: boolean;
  /** Empty-state heading; defaults to the `gds.threadList.emptyTitle` message. */
  emptyTitle?: string;
}

function formatTimestamp(value: Date | number | string, locale: string) {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return formatGdsDate(date, sameDay ? { locale, timeStyle: 'short' } : { locale, dateStyle: 'medium' });
}

/**
 * Scrollable list of conversations for an inbox. Each thread is a button in a list item with
 * the title, a one-line preview, a locale-formatted timestamp and an avatar. The open thread
 * carries `aria-current="true"`. Unread threads are bold, show a dot and include a visually
 * hidden "Unread" label, so the state does not depend on colour. Loading, error (with retry),
 * empty and load-more states are built in.
 */
export function GdsThreadList({
  threads,
  ariaLabel,
  selectedId,
  onSelect,
  loading = false,
  error,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  emptyTitle,
}: GdsThreadListProps) {
  const { t, locale } = useGdsTranslation();

  if (error) {
    return (
      <StateBlock
        variant="error"
        compact
        title={t('gds.threadList.errorTitle', 'Conversations could not be loaded')}
        description={error}
        action={onRetry ? <Button size="xs" variant="light" onClick={onRetry}>{t('gds.threadList.retry', 'Retry')}</Button> : undefined}
      />
    );
  }
  if (loading) {
    return <StateBlock variant="loading" compact title={t('gds.threadList.loading', 'Loading conversations')} />;
  }
  if (threads.length === 0) {
    return <StateBlock variant="empty" compact title={emptyTitle ?? t('gds.threadList.emptyTitle', 'No conversations yet')} />;
  }

  return (
    <Stack gap="xs" data-gds-thread-list="">
      <Box component="ul" aria-label={ariaLabel} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {threads.map((thread) => {
          const isSelected = selectedId === thread.id;
          return (
            <Box component="li" key={thread.id}>
              <UnstyledButton
                onClick={() => onSelect?.(thread.id)}
                aria-current={isSelected ? 'true' : undefined}
                data-gds-thread-item=""
                data-unread={thread.unread || undefined}
                style={{
                  display: 'block',
                  inlineSize: '100%',
                  padding: 'var(--gds-space-xs) var(--gds-space-sm)',
                  borderRadius: 'var(--gds-radius-sm)',
                  background: isSelected ? 'var(--gds-nav-active-bg)' : undefined,
                  color: isSelected ? 'var(--gds-nav-active-fg)' : undefined,
                  boxShadow: isSelected ? 'inset var(--gds-focus-ring-width) 0 0 var(--gds-nav-active-indicator)' : undefined,
                }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <Avatar src={thread.avatarSrc} name={thread.avatarName ?? thread.title} alt={thread.avatarName ?? thread.title} radius="xl" size="md" />
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Group gap="xs" justify="space-between" wrap="nowrap">
                      <Text size="sm" fw={thread.unread ? 700 : 500} truncate>
                        {thread.title}
                      </Text>
                      {thread.timestamp !== undefined ? (
                        <Text size="xs" c="dimmed" style={{ flex: 'none' }}>
                          {formatTimestamp(thread.timestamp, locale)}
                        </Text>
                      ) : null}
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      {thread.unread ? (
                        <Box
                          component="span"
                          aria-hidden="true"
                          style={{ flex: 'none', inlineSize: 'var(--gds-space-2xs)', blockSize: 'var(--gds-space-2xs)', borderRadius: 'var(--gds-radius-pill)', background: 'var(--gds-nav-active-indicator)' }}
                        />
                      ) : null}
                      {thread.unread ? <VisuallyHidden>{t('gds.threadList.unread', 'Unread')}</VisuallyHidden> : null}
                      {thread.preview ? (
                        <Text size="xs" c={thread.unread ? undefined : 'dimmed'} fw={thread.unread ? 600 : 400} truncate>
                          {thread.preview}
                        </Text>
                      ) : null}
                    </Group>
                  </Box>
                </Group>
              </UnstyledButton>
            </Box>
          );
        })}
      </Box>
      {hasMore ? (
        <Button variant="subtle" size="xs" fullWidth onClick={onLoadMore} loading={loadingMore}>
          {t('gds.threadList.loadMore', 'Load more')}
        </Button>
      ) : null}
    </Stack>
  );
}
