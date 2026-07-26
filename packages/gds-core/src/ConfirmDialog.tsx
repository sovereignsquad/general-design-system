import type { ReactNode } from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { SemanticButton } from './SemanticButton';
import type { SemanticAction } from './vocabulary';

/** Props for `ConfirmDialog`. */
export interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  /** Semantic action id for the confirm button; defaults to `confirm`. */
  confirmAction?: SemanticAction;
  /** Semantic action id for the cancel button; defaults to `cancel`. */
  cancelAction?: SemanticAction;
  /** Styles the confirm button as destructive (red); defaults to true. */
  isDanger?: boolean;
  /** Shows the confirm button in a loading state and disables cancel; defaults to false. */
  loading?: boolean;
}

/**
 * Standardized destructive/confirmation dialog.
 */
export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  children,
  confirmAction = 'confirm',
  cancelAction = 'cancel',
  isDanger = true,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered trapFocus>
      <Text component="div" size="sm" mb="xl">
        {children}
      </Text>
      <Group justify="flex-end">
        <SemanticButton action={cancelAction} variant="default" onClick={onClose} disabled={loading} />
        <SemanticButton action={confirmAction} color={isDanger ? 'red' : 'violet'} onClick={onConfirm} loading={loading} />
      </Group>
    </Modal>
  );
}
