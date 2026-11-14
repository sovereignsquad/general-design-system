'use client';

import { SegmentedControl } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** A collection layout a user can switch between. */
export type GdsCollectionView = 'table' | 'grid';

/** Props for {@link GdsViewToggle}. */
export interface GdsViewToggleProps {
  /** The current layout. */
  value: GdsCollectionView;
  /** Called with the layout the user picks. */
  onChange: (view: GdsCollectionView) => void;
  /** Accessible name; defaults to the `gds.dataView.toggleLabel` message ("Layout"). */
  ariaLabel?: string;
}

/**
 * Labelled table/grid layout switch for a collection of items, as a segmented control with
 * text labels (`gds.dataView.table`, `gds.dataView.grid`). `ResponsiveDataView` and the
 * asset-manager page template use it.
 */
export function GdsViewToggle({ value, onChange, ariaLabel }: GdsViewToggleProps) {
  const { t } = useGdsTranslation();
  return (
    <SegmentedControl
      aria-label={ariaLabel ?? t('gds.dataView.toggleLabel', 'Layout')}
      value={value}
      onChange={(next) => onChange(next as GdsCollectionView)}
      data={[
        { value: 'table', label: t('gds.dataView.table', 'Table') },
        { value: 'grid', label: t('gds.dataView.grid', 'Grid') },
      ]}
      style={{ alignSelf: 'flex-start' }}
      data-gds-view-toggle=""
    />
  );
}
