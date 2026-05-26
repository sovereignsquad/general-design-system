'use client';

import type { ReactNode } from 'react';
import { GdsProvider, gdsFlatSurfaceTheme } from '@doneisbetter/gds-theme/client';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <GdsProvider theme={gdsFlatSurfaceTheme} defaultColorScheme="light">
      {children}
    </GdsProvider>
  );
}
