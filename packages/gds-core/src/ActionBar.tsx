import { ActionIcon, Button, Group, Stack } from '@mantine/core';
import type { ButtonProps, MantineSpacing } from '@mantine/core';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsVocabularyPack, SemanticActionId } from './vocabulary';

export interface ActionBarAction extends Omit<ButtonProps, 'leftSection' | 'children'> {
  action: SemanticActionId;
  ariaLabel?: string;
  onClick?: () => void;
}

export interface ActionBarIconAction {
  action: SemanticActionId;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface ActionBarProps {
  primary?: ActionBarAction;
  secondary?: ActionBarAction[];
  tertiary?: ActionBarAction[];
  iconOnly?: ActionBarIconAction[];
  gap?: MantineSpacing | number;
  vocabularyPacks?: GdsVocabularyPack[];
}

function renderSemanticAction(action: ActionBarAction, slot: 'primary' | 'secondary' | 'tertiary', vocabularyPacks: GdsVocabularyPack[]) {
  const { action: actionId, variant, ariaLabel, ...props } = action;
  const fallbackVariant = slot === 'primary' ? 'filled' : slot === 'secondary' ? 'default' : 'subtle';
  const config = resolveSemanticActionConfig(actionId, vocabularyPacks);
  const Icon = config.icon;
  const label = getSemanticActionLabel(actionId, undefined, vocabularyPacks);

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

export function ActionBar({
  primary,
  secondary = [],
  tertiary = [],
  iconOnly = [],
  gap = 'sm',
  vocabularyPacks = [],
}: ActionBarProps) {
  return (
    <Stack gap={gap}>
      <Group justify="space-between" align="center" gap={gap} wrap="wrap">
        <Group gap={gap} wrap="wrap">
          {secondary.map((action) => renderSemanticAction(action, 'secondary', vocabularyPacks))}
          {tertiary.map((action) => renderSemanticAction(action, 'tertiary', vocabularyPacks))}
        </Group>

        <Group gap={gap} wrap="wrap" justify="flex-end" style={{ marginInlineStart: 'auto' }}>
          {iconOnly.map(({ action, ariaLabel, ...props }) => {
            const config = resolveSemanticActionConfig(action, vocabularyPacks);
            const Icon = config.icon;

            return (
              <ActionIcon
                key={`icon-${action}`}
                variant="subtle"
                size="lg"
                aria-label={ariaLabel ?? getSemanticActionLabel(action, undefined, vocabularyPacks)}
                {...props}
              >
                <Icon size="1rem" stroke={1.75} />
              </ActionIcon>
            );
          })}
          {primary ? renderSemanticAction(primary, 'primary', vocabularyPacks) : null}
        </Group>
      </Group>
    </Stack>
  );
}
