'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type OverlayKind = 'dialog' | 'drawer' | 'popover' | 'tooltip';
export type OverlayCloseReason = 'escape' | 'backdrop' | 'programmatic' | 'action';

export interface OverlayDescriptor {
  id: string;
  kind: OverlayKind;
  invokerId?: string;
}

interface OverlayManagerValue {
  stack: OverlayDescriptor[];
  registerOverlay: (overlay: OverlayDescriptor) => void;
  unregisterOverlay: (id: string) => void;
  isTopMost: (id: string) => boolean;
  requestClose: (id: string, reason: OverlayCloseReason) => OverlayCloseReason | null;
}

const OverlayManagerContext = createContext<OverlayManagerValue | null>(null);

export function OverlayManagerProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<OverlayDescriptor[]>([]);

  const value = useMemo<OverlayManagerValue>(() => ({
    stack,
    registerOverlay: (overlay) => {
      setStack((current) => {
        const without = current.filter((item) => item.id !== overlay.id);
        return [...without, overlay];
      });
    },
    unregisterOverlay: (id) => {
      setStack((current) => current.filter((item) => item.id !== id));
    },
    isTopMost: (id) => stack.length > 0 && stack[stack.length - 1]?.id === id,
    requestClose: (id, reason) => {
      if (stack.length === 0 || stack[stack.length - 1]?.id !== id) {
        return null;
      }
      return reason;
    },
  }), [stack]);

  return (
    <OverlayManagerContext.Provider value={value}>
      {children}
    </OverlayManagerContext.Provider>
  );
}

export function useOverlayManager() {
  const context = useContext(OverlayManagerContext);
  if (!context) {
    throw new Error('useOverlayManager must be used within OverlayManagerProvider.');
  }
  return context;
}
