'use client';

import type { ReactNode } from 'react';
import type { MantineColor } from '@mantine/core';
import { Center, Paper, Text, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export interface GameBoardTileProps {
  face: ReactNode;
  revealed: boolean;
  matched: boolean;
  disabled: boolean;
  onPress: () => void;
  /** Mantine color token for revealed (non-matched) highlight, e.g. `violet.5` or product primary. */
  highlightColor?: MantineColor;
}

/**
 * Governed flip/select tile for memory-match and similar game boards.
 * Respects prefers-reduced-motion; motion is local to the tile, not global theme hover defaults.
 */
export function GameBoardTile({
  face,
  revealed,
  matched,
  disabled,
  onPress,
  highlightColor,
}: GameBoardTileProps) {
  const theme = useMantineTheme();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const highlighted = revealed && !matched;
  const revealBg =
    highlightColor ??
    (typeof theme.primaryColor === 'string' ? `${theme.primaryColor}.5` : 'violet.5');

  return (
    <UnstyledButton w="100%" disabled={disabled} onClick={onPress} aria-pressed={revealed}>
      <Paper
        withBorder
        radius="md"
        p="md"
        bg={revealed ? revealBg : 'dark.6'}
        styles={{
          root: {
            aspectRatio: '1',
            opacity: matched ? 0.55 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: reduceMotion
              ? 'opacity 0.2s ease'
              : 'transform 0.25s ease, background-color 0.25s ease, opacity 0.25s ease',
            transform: reduceMotion || !highlighted ? 'scale(1)' : 'scale(1.02)',
          },
        }}
      >
        <Center h="100%">
          <Text size="xl" fw={700}>
            {face}
          </Text>
        </Center>
      </Paper>
    </UnstyledButton>
  );
}
