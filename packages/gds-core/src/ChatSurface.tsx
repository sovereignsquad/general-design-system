import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { ActionIcon, Box, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { GdsIcons } from './icons';

/**
 * `ChatThread` renders an auto-scrolling (pin-aware) message list as an ARIA
 * live region; `ChatMessage` renders role-styled bubbles (user = inverse/navy,
 * assistant = surface/white) with a slot to embed result cards; a streaming
 * indicator shows assistant typing; `ChatInput` sends on Enter and inserts a
 * newline on Shift+Enter. Transport/persistence are owned by the caller.
 */

/** Author of a chat message: the end user or the assistant. */
export type ChatRole = 'user' | 'assistant';

/** A single chat message: role, content, optional embedded cards, delivery state, and timestamp. */
export interface ChatMessageModel {
  id: string;
  role: ChatRole;
  content: ReactNode;
  /** Assistant-embedded cards. Up to 5 are rendered; the rest are summarized. */
  cards?: ReactNode[];
  /** Delivery state; `error` reveals a retry affordance and `streaming` marks in-progress output. */
  state?: 'sent' | 'streaming' | 'error';
  createdAt?: string;
}

/** Props for `ChatThread`. */
export interface ChatThreadProps {
  messages: ChatMessageModel[];
  /** Whether the assistant is streaming a reply (shows the typing indicator and disables input). */
  streaming?: boolean;
  onSend: (text: string) => void;
  inputDisabled?: boolean;
  placeholder?: string;
  emptyState?: ReactNode;
  errorBanner?: ReactNode;
  /** Max embedded cards rendered per assistant message before "show more". */
  maxEmbeddedCards?: number;
  userLabel?: string;
  assistantLabel?: string;
  sendLabel?: string;
  onRetry?: (messageId: string) => void;
  retryLabel?: string;
}

const PIN_THRESHOLD_PX = 48;

/** Renders one role-styled message bubble with optional embedded result cards and an error/retry affordance. */
export function ChatMessage({
  message,
  maxEmbeddedCards = 5,
  userLabel: userLabelProp,
  assistantLabel: assistantLabelProp,
  onRetry,
  retryLabel: retryLabelProp,
}: {
  message: ChatMessageModel;
  maxEmbeddedCards?: number;
  userLabel?: string;
  assistantLabel?: string;
  onRetry?: (messageId: string) => void;
  retryLabel?: string;
}) {
  const { t } = useGdsTranslation();
  const userLabel = userLabelProp ?? t('gds.chatSurface.userLabel', "You");
  const assistantLabel = assistantLabelProp ?? t('gds.chatSurface.assistantLabel', "Assistant");
  const retryLabel = retryLabelProp ?? t('gds.chatSurface.retryLabel', "Retry");

  const isUser = message.role === 'user';
  const roleLabel = isUser ? userLabel : assistantLabel;
  const cards = message.cards ?? [];
  const visibleCards = cards.slice(0, maxEmbeddedCards);
  const hiddenCount = cards.length - visibleCards.length;

  return (
    <Stack gap={4} align={isUser ? 'flex-end' : 'flex-start'}>
      <Text fz={11} c="dimmed">
        {roleLabel}
        {message.createdAt ? <time dateTime={message.createdAt}> · {new Date(message.createdAt).toLocaleTimeString()}</time> : null}
      </Text>
      <Paper
        p="sm"
        radius="lg"
        style={{
          maxWidth: '85%',
          background: isUser ? 'var(--gds-bg-inverse, var(--mantine-color-dark-7))' : 'var(--gds-bg-surface, var(--mantine-color-white))',
          color: isUser ? 'var(--gds-text-on-inverse, var(--mantine-color-white))' : 'var(--gds-text-primary, inherit)',
          border: isUser ? 'none' : '1px solid var(--mantine-color-default-border)',
        }}
      >
        {message.content}
        {message.state === 'error' ? (
          <Group gap="xs" mt="xs">
            <Text fz="sm" c="red">
              Failed to send.
            </Text>
            {onRetry ? (
              <Text fz="sm" fw={600} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => onRetry(message.id)}>
                {retryLabel}
              </Text>
            ) : null}
          </Group>
        ) : null}
      </Paper>
      {visibleCards.length > 0 ? (
        <Stack gap="sm" style={{ width: '100%' }}>
          {visibleCards.map((card, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Box key={index}>{card}</Box>
          ))}
          {hiddenCount > 0 ? (
            <Text fz="sm" c="dimmed">
              + {hiddenCount} more
            </Text>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

/** Animated three-dot indicator shown while the assistant is typing. */
export function StreamingIndicator({ label: labelProp }: { label?: string }) {
  const { t } = useGdsTranslation();
  const label = labelProp ?? t('gds.chatSurface.label', "Assistant is typing");

  return (
    <Group gap={6} aria-label={label}>
      {/* data-gds-motion lets styles.css disable animation under prefers-reduced-motion (WCAG 2.2.2). */}
      <Box className="gds-chat-typing-dot" data-gds-motion style={dotStyle(0)} />
      <Box className="gds-chat-typing-dot" data-gds-motion style={dotStyle(1)} />
      <Box className="gds-chat-typing-dot" data-gds-motion style={dotStyle(2)} />
    </Group>
  );
}

function dotStyle(index: number): React.CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--gds-text-secondary, var(--mantine-color-gray-5))',
    // Duration uses the ambient motion token, not a hardcoded value.
    animation: 'gds-chat-typing var(--gds-motion-duration-ambient, 1000ms) infinite',
    // Stagger is a fraction of the same token, so the dots stay in phase if it's retuned.
    animationDelay: `calc(var(--gds-motion-duration-ambient, 1000ms) * ${index * 0.15})`,
  };
}

/** Auto-sizing message composer that sends on Enter and inserts a newline on Shift+Enter. */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder: placeholderProp,
  sendLabel: sendLabelProp,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  sendLabel?: string;
}) {
  const { t } = useGdsTranslation();
  const placeholder = placeholderProp ?? t('gds.chatSurface.placeholder', "Message…");
  const sendLabel = sendLabelProp ?? t('gds.chatSurface.sendLabel', "Send");

  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autosize
        minRows={1}
        maxRows={5}
        aria-label={placeholder}
        style={{ flex: 1 }}
      />
      <ActionIcon size="lg" aria-label={sendLabel} disabled={disabled || !value.trim()} onClick={submit}>
        <GdsIcons.Send size="1.1rem" />
      </ActionIcon>
    </Group>
  );
}

/** Auto-scrolling (pin-aware) chat thread: renders the message list as an ARIA live region with a streaming indicator and a composer. */
export function ChatThread({
  messages,
  streaming = false,
  onSend,
  inputDisabled = false,
  placeholder,
  emptyState,
  errorBanner,
  maxEmbeddedCards = 5,
  userLabel,
  assistantLabel,
  sendLabel,
  onRetry,
  retryLabel,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const node = scrollRef.current;
    if (node && pinnedRef.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, streaming]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    pinnedRef.current = node.scrollHeight - node.scrollTop - node.clientHeight <= PIN_THRESHOLD_PX;
  };

  return (
    <Stack gap="sm" style={{ height: '100%' }}>
      {errorBanner}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        aria-live="polite"
        aria-relevant="additions"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        {messages.length === 0 ? (
          emptyState ?? (
            <Text c="dimmed" ta="center" py="xl">
              Ask a question to get started.
            </Text>
          )
        ) : (
          <Stack gap="md">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                maxEmbeddedCards={maxEmbeddedCards}
                userLabel={userLabel}
                assistantLabel={assistantLabel}
                onRetry={onRetry}
                retryLabel={retryLabel}
              />
            ))}
            {streaming ? <StreamingIndicator /> : null}
          </Stack>
        )}
      </Box>
      <ChatInput onSend={onSend} disabled={inputDisabled || streaming} placeholder={placeholder} sendLabel={sendLabel} />
    </Stack>
  );
}
