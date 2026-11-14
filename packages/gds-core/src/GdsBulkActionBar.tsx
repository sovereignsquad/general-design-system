'use client';

import { Button, Group, Paper, Text, VisuallyHidden } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsVocabularyPack, SemanticActionId } from './vocabulary';

/** One action in a {@link GdsBulkActionBar}. */
export interface GdsBulkAction {
  /** Semantic action id; supplies the default label and icon. */
  action: SemanticActionId;
  /** Runs the action on the current selection. */
  onClick: () => void;
  /** Explicit label; overrides the vocabulary label. */
  label?: string;
  /** Disables the action button. */
  disabled?: boolean;
}

/** Props for {@link GdsBulkActionBar}. */
export interface GdsBulkActionBarProps {
  /** Number of selected items. The bar renders only when it is above zero. */
  selectedCount: number;
  /** Actions offered for the selection, in order. */
  actions: GdsBulkAction[];
  /** Clears the selection; the bar hides when the count returns to zero. */
  onClearSelection: () => void;
  /** Vocabulary packs consulted to resolve action labels and icons. */
  vocabularyPacks?: GdsVocabularyPack[];
}

/**
 * Toolbar for actions on a selection (rows in a table, items in a grid). It appears when
 * `selectedCount` is above zero, states the count, offers the actions and a clear-selection
 * control, and announces count changes through a polite live region that stays mounted so the
 * change to zero is announced too. Painted on `--gds-bg-raised` inside a `--gds-border-strong`
 * boundary.
 */
export function GdsBulkActionBar({ selectedCount, actions, onClearSelection, vocabularyPacks = [] }: GdsBulkActionBarProps) {
  const { t } = useGdsTranslation();
  const countText = t('gds.bulkActions.selectedCount', '{count} selected').replace('{count}', String(selectedCount));
  const announcement = selectedCount > 0 ? countText : t('gds.bulkActions.selectionCleared', 'Selection cleared');

  return (
    <>
      <VisuallyHidden role="status" aria-live="polite" data-gds-bulk-action-status="">
        {announcement}
      </VisuallyHidden>
      {selectedCount > 0 ? (
        <Paper
          withBorder
          p="xs"
          role="toolbar"
          aria-label={t('gds.bulkActions.toolbarLabel', 'Bulk actions')}
          data-gds-bulk-action-bar=""
          style={{ background: 'var(--gds-bg-raised)', ['--paper-border-color' as string]: 'var(--gds-border-strong)' }}
        >
          <Group justify="space-between" gap="sm" wrap="wrap">
            <Text size="sm" fw={600} aria-hidden="true">{countText}</Text>
            <Group gap="xs" wrap="wrap">
              {actions.map((item) => {
                const Icon = resolveSemanticActionConfig(item.action, vocabularyPacks)?.icon;
                const label = item.label ?? getSemanticActionLabel(item.action, t, vocabularyPacks);
                return (
                  <Button
                    key={String(item.action)}
                    size="xs"
                    variant="light"
                    leftSection={Icon ? <Icon size="1rem" stroke={1.5} /> : undefined}
                    onClick={item.onClick}
                    disabled={item.disabled}
                  >
                    {label}
                  </Button>
                );
              })}
              <Button size="xs" variant="subtle" onClick={onClearSelection}>
                {t('gds.bulkActions.clearSelection', 'Clear selection')}
              </Button>
            </Group>
          </Group>
        </Paper>
      ) : null}
    </>
  );
}
