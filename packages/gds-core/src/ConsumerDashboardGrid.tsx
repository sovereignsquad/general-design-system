import type { ReactNode } from 'react';
import { SimpleGrid } from '@mantine/core';

export interface ConsumerDashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

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
