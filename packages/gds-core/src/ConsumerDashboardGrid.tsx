import type { ReactNode } from 'react';
import { SimpleGrid } from '@mantine/core';

/** Props for {@link ConsumerDashboardGrid}. */
export interface ConsumerDashboardGridProps {
  children: ReactNode;
  /** Column count at the large breakpoint. Defaults to 3. */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Responsive dashboard grid: lays children out in up to `columns` columns at the
 * large breakpoint, at most two on small screens, and one column on mobile.
 */
export function ConsumerDashboardGrid({
  children,
  columns = 3,
}: ConsumerDashboardGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(columns, 2), lg: columns }} spacing="lg">
      {children}
    </SimpleGrid>
  );
}
