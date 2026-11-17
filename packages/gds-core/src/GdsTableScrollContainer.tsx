'use client';

import type { ReactNode } from 'react';
import { Table } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** Props for {@link GdsTableScrollContainer}. */
export interface GdsTableScrollContainerProps {
  /** The table. */
  children: ReactNode;
  /** Accessible name of the scroll region. Defaults to the localized "Table". */
  label?: string;
  /** Width below which the table scrolls instead of shrinking. Defaults to `0`. */
  minWidth?: number | string;
}

/**
 * A horizontally scrolling wrapper for a table. A table wider than its container scrolls
 * natively, and the region is focusable and named so keyboard users can scroll it (WCAG 2.1.1).
 */
export function GdsTableScrollContainer({ children, label, minWidth = 0 }: GdsTableScrollContainerProps) {
  const { t } = useGdsTranslation();
  return (
    <Table.ScrollContainer
      minWidth={minWidth}
      type="native"
      tabIndex={0}
      role="group"
      aria-label={label ?? t('gds.tableScroll.region', 'Table')}
      data-gds-table-scroll=""
    >
      {children}
    </Table.ScrollContainer>
  );
}
