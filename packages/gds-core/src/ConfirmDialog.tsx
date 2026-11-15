import type { ReactNode } from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
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
  /** Visible label of the confirm button, e.g. "Delete project"; defaults to the `confirmAction` vocabulary label. */
  confirmLabel?: ReactNode;
  /** Visible label of the cancel button; defaults to the `cancelAction` vocabulary label. */
  cancelLabel?: ReactNode;
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
  confirmLabel,
  cancelLabel,
}: ConfirmDialogProps) {
  const { t } = useGdsTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      trapFocus
      closeButtonProps={{ 'aria-label': t('gds.overlay.close', 'Close') }}
    >
      <Text component="div" size="sm" mb="xl">
        {children}
      </Text>
      <Group justify="flex-end">
        <SemanticButton action={cancelAction} label={cancelLabel} variant="default" onClick={onClose} disabled={loading} />
        <SemanticButton action={confirmAction} label={confirmLabel} color={isDanger ? 'red' : undefined} onClick={onConfirm} loading={loading} />
      </Group>
    </Modal>
  );
}
