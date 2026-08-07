import { ActionIcon, Button, Group, Stack } from '@mantine/core';
import type { ButtonProps, MantineSpacing } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsVocabularyPack, SemanticActionId } from './vocabulary';

/**
 * A button action in an {@link ActionBar}, resolved from the GDS action
 * vocabulary. Extends Mantine `ButtonProps` (minus `leftSection`/`children`,
 * which the vocabulary supplies as the icon and label).
 */
export interface ActionBarAction extends Omit<ButtonProps, 'leftSection' | 'children'> {
  /** Semantic action id (e.g. `'save'`, `'cancel'`); resolves the label, icon, and default variant. */
  action: SemanticActionId;
  /** Overrides the accessible name (defaults to the resolved vocabulary label). */
  ariaLabel?: string;
  /** Click handler. */
  onClick?: () => void;
}

/** An icon-only action in an {@link ActionBar}, resolved from the GDS action vocabulary. */
export interface ActionBarIconAction {
  /** Semantic action id; resolves the icon and accessible label. */
  action: SemanticActionId;
  /** Click handler. */
  onClick?: () => void;
  /** Disables the control. */
  disabled?: boolean;
  /** Overrides the accessible name (defaults to the resolved vocabulary label). */
  ariaLabel?: string;
}

/** Props for {@link ActionBar}. */
export interface ActionBarProps {
  /** The single highest-priority action, rendered filled at the trailing edge. */
  primary?: ActionBarAction;
  /** Secondary actions, rendered at the leading edge. */
  secondary?: ActionBarAction[];
  /** Tertiary (lowest-priority) actions, rendered alongside the secondary group. */
  tertiary?: ActionBarAction[];
  /** Icon-only actions, rendered just before the primary action. */
  iconOnly?: ActionBarIconAction[];
  /** Gap between actions and groups (a Mantine spacing token or px number). Defaults to `'sm'`. */
  gap?: MantineSpacing | number;
  /** Additional vocabulary packs used to resolve custom semantic action ids. */
  vocabularyPacks?: GdsVocabularyPack[];
}

function renderSemanticAction(action: ActionBarAction, slot: 'primary' | 'secondary' | 'tertiary', vocabularyPacks: GdsVocabularyPack[], t: ReturnType<typeof useGdsTranslation>['t']) {
  const { action: actionId, variant, ariaLabel, ...props } = action;
  const fallbackVariant = slot === 'primary' ? 'filled' : slot === 'secondary' ? 'default' : 'subtle';
  const config = resolveSemanticActionConfig(actionId, vocabularyPacks);
  const Icon = config.icon;
  const label = getSemanticActionLabel(actionId, t, vocabularyPacks);

  return (
    <Button
      key={`${slot}-${actionId}`}
      leftSection={<Icon size="1rem" stroke={1.75} />}
      aria-label={ariaLabel ?? label}
      variant={variant ?? fallbackVariant}
      {...props}
    >
      {label}
    </Button>
  );
}

/**
 * Governed row of semantic actions arranged by priority — one `primary`, plus
 * `secondary`, `tertiary`, and `iconOnly` groups — each resolved from the GDS
 * action vocabulary so labels and variants stay consistent everywhere. Use it for
 * the action cluster on a page header, toolbar, or card footer instead of laying
 * out raw buttons.
 */
export function ActionBar({
  primary,
  secondary = [],
  tertiary = [],
  iconOnly = [],
  gap = 'sm',
  vocabularyPacks = [],
}: ActionBarProps) {
  const { t } = useGdsTranslation();

  return (
    <Stack gap={gap}>
      <Group justify="space-between" align="center" gap={gap} wrap="wrap">
        <Group gap={gap} wrap="wrap">
          {secondary.map((action) => renderSemanticAction(action, 'secondary', vocabularyPacks, t))}
          {tertiary.map((action) => renderSemanticAction(action, 'tertiary', vocabularyPacks, t))}
        </Group>

        {/*
         * No `marginInlineStart: 'auto'` here: the outer Group's own
         * `justify="space-between"` already pushes this group to the trailing
         * edge whenever both groups fit on one row. The auto margin only ever
         * mattered once the outer Group wrapped this group onto its own row —
         * where it forced a right-aligned row sitting under a left-aligned
         * secondary-action row, reading as misaligned rather than a single
         * coherent stacked list.
         */}
        <Group gap={gap} wrap="wrap" justify="flex-end">
          {iconOnly.map(({ action, ariaLabel, ...props }) => {
            const config = resolveSemanticActionConfig(action, vocabularyPacks);
            const Icon = config.icon;

            return (
              <ActionIcon
                key={`icon-${action}`}
                variant="subtle"
                size="lg"
                aria-label={ariaLabel ?? getSemanticActionLabel(action, t, vocabularyPacks)}
                {...props}
              >
                <Icon size="1rem" stroke={1.75} />
              </ActionIcon>
            );
          })}
          {primary ? renderSemanticAction(primary, 'primary', vocabularyPacks, t) : null}
        </Group>
      </Group>
    </Stack>
  );
}
