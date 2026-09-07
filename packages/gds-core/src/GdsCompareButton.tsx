import type { CSSProperties } from 'react';
import { Button } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { GdsIcon } from './icons';

/** Props for {@link GdsCompareButton}. */
export interface GdsCompareButtonProps {
  /** Whether the item is in the compare set. Controlled; no internal mirror. */
  added: boolean;
  /** Called with the next state when activated. */
  onAddedChange?: (added: boolean) => void;
  /** Label override for the off state. Defaults to the locale pack copy ("Compare"). */
  addLabel?: string;
  /** Label override for the added state. Defaults to the locale pack copy ("Added to compare"). */
  addedLabel?: string;
  /** Disables the control. */
  disabled?: boolean;
}

const offStyle: CSSProperties = {
  background: 'var(--gds-bg-card)',
  borderColor: 'var(--gds-border-card)',
  color: 'var(--gds-text-primary)',
};

const addedStyle: CSSProperties = {
  background: 'var(--gds-bg-canvas)',
  borderColor: 'var(--gds-brand-primary)',
  color: 'var(--gds-brand-primary)',
};

/**
 * Fully controlled compare toggle: off/added states with an icon and label
 * swap, `aria-pressed` carrying the state. Deliberately holds no internal
 * state mirroring `added` — a prop change re-renders correctly, unlike the
 * bundle defect this component exists to not repeat. For a different
 * semantic (favoriting, icon-only) use `GdsSavedIndicator` instead.
 *
 * @example
 * ```tsx
 * <GdsCompareButton added={inCompareSet} onAddedChange={setInCompareSet} />
 * ```
 */
export function GdsCompareButton({
  added,
  onAddedChange,
  addLabel,
  addedLabel,
  disabled,
}: GdsCompareButtonProps) {
  const { t } = useGdsTranslation();
  const resolvedAddLabel = addLabel ?? t('gds.compareButton.add', 'Compare');
  const resolvedAddedLabel = addedLabel ?? t('gds.compareButton.added', 'Added to compare');

  return (
    <Button
      type="button"
      variant="outline"
      radius="xl"
      size="sm"
      aria-pressed={added}
      disabled={disabled}
      data-gds-compare-button={added ? 'added' : 'off'}
      leftSection={<GdsIcon icon={added ? 'Success' : 'Compare'} size="xs" decorative />}
      onClick={() => {
        if (disabled) return;
        onAddedChange?.(!added);
      }}
      style={{
        height: 'auto',
        minHeight: 'var(--gds-control-height-md)',
        borderWidth: 1,
        borderStyle: 'solid',
        ...(added ? addedStyle : offStyle),
      }}
      styles={{ label: { whiteSpace: 'normal', overflow: 'visible' } }}
    >
      {added ? resolvedAddedLabel : resolvedAddLabel}
    </Button>
  );
}
