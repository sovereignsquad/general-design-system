import { useState } from 'react';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { ActionIcon, Card, Group, Stack, TextInput } from '@mantine/core';
import { ChoiceChip } from './ChoiceChip';
import { MeaningBadge } from './MeaningBadge';
import { GdsIcons } from './icons';

/**
 * AISearchCard (gap B10 / issue 325).
 *
 * Governed pattern + thin wrapper for an AI search entry surface: a search
 * input, a BETA meaning badge, and prompt chips that route a query into the
 * assistant (e.g. a `ChatThread`). Routing/transport is owned by the consumer
 * via `onSubmit`; the component performs no navigation itself.
 */

/** Props for the `AISearchCard` component. */
export interface AISearchCardProps {
  /** Called with the trimmed query when the user submits (Enter or the search button). */
  onSubmit: (query: string) => void;
  /** Suggested prompt chips. */
  prompts?: string[];
  /** Called when a prompt chip is chosen; when omitted, choosing a prompt calls `onSubmit` instead. */
  onPromptSelect?: (prompt: string) => void;
  /** Input placeholder and accessible label. Defaults to "Ask anything…". */
  placeholder?: string;
  /** Text of the beta badge. Defaults to "BETA". */
  betaLabel?: string;
  /** Accessible label for the search region. Defaults to "AI search". */
  ariaLabel?: string;
  disabled?: boolean;
}

/** Governed AI search entry card (see file overview): search input, BETA badge, and prompt chips; submits trimmed, non-empty queries via `onSubmit` and performs no navigation itself. */
export function AISearchCard({
  onSubmit,
  prompts = [],
  onPromptSelect,
  placeholder: placeholderProp,
  betaLabel: betaLabelProp,
  ariaLabel: ariaLabelProp,
  disabled = false,
}: AISearchCardProps) {
  const { t } = useGdsTranslation();
  const placeholder = placeholderProp ?? t('gds.aiSearchCard.placeholder', "Ask anything…");
  const betaLabel = betaLabelProp ?? t('gds.aiSearchCard.betaLabel', "BETA");
  const ariaLabel = ariaLabelProp ?? t('gds.aiSearchCard.ariaLabel', "AI search");

  const [query, setQuery] = useState('');

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  const selectPrompt = (prompt: string) => {
    if (disabled) return;
    setQuery(prompt);
    if (onPromptSelect) {
      onPromptSelect(prompt);
    } else {
      onSubmit(prompt);
    }
  };

  return (
    <Card withBorder radius="lg" padding="lg" role="search" aria-label={ariaLabel}>
      <Stack gap="sm">
        <Group justify="flex-end">
          <MeaningBadge variant="info" label={betaLabel} />
        </Group>
        <Group gap="xs" wrap="nowrap">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit(query);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={placeholder}
            style={{ flex: 1 }}
          />
          <ActionIcon size="lg" aria-label="Search" disabled={disabled || !query.trim()} onClick={() => submit(query)}>
            <GdsIcons.Search size="1.1rem" />
          </ActionIcon>
        </Group>
        {prompts.length > 0 ? (
          <Group gap="xs" wrap="wrap" role="group" aria-label="Suggested prompts">
            {prompts.map((prompt) => (
              <ChoiceChip
                key={prompt}
                label={prompt}
                component="button"
                onClick={() => selectPrompt(prompt)}
                style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : { cursor: 'pointer' }}
              />
            ))}
          </Group>
        ) : null}
      </Stack>
    </Card>
  );
}
