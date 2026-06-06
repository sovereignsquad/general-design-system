'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { GdsNotificationProvider, useGdsNotifications } from './Notifications.client';
import type { GdsNotificationMessage } from './Notifications';
import type { SemanticAction } from './vocabulary';

export interface ConfirmRequest {
  id?: string;
  title: string;
  message: ReactNode;
  targetName?: string;
  consequence?: ReactNode;
  confirmAction?: SemanticAction;
  cancelAction?: SemanticAction;
  danger?: boolean;
}

export interface GdsConfirmApi {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  confirmDestructive: (request: ConfirmRequest & { targetName: string }) => Promise<boolean>;
}

interface ActiveConfirmRequest extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

const GdsConfirmContext = createContext<GdsConfirmApi | null>(null);

export function GdsConfirmProvider({ children }: { children: ReactNode }) {
  const [activeRequest, setActiveRequest] = useState<ActiveConfirmRequest | null>(null);
  const activeResolver = useRef<((confirmed: boolean) => void) | null>(null);

  const openConfirm = useCallback((request: ConfirmRequest) => new Promise<boolean>((resolve) => {
    if (activeResolver.current) {
      activeResolver.current(false);
    }
    activeResolver.current = resolve;
    setActiveRequest({ ...request, resolve });
  }), []);

  const resolveActive = useCallback((confirmed: boolean) => {
    activeResolver.current?.(confirmed);
    activeResolver.current = null;
    setActiveRequest(null);
  }, []);

  const value = useMemo<GdsConfirmApi>(() => ({
    confirm: openConfirm,
    confirmDestructive: (request) => openConfirm({ ...request, danger: true, confirmAction: request.confirmAction ?? 'delete' }),
  }), [openConfirm]);

  return (
    <GdsConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        opened={Boolean(activeRequest)}
        onClose={() => resolveActive(false)}
        onConfirm={() => resolveActive(true)}
        title={activeRequest?.title ?? ''}
        confirmAction={activeRequest?.confirmAction ?? (activeRequest?.danger ? 'delete' : 'confirm')}
        cancelAction={activeRequest?.cancelAction ?? 'cancel'}
        isDanger={activeRequest?.danger ?? false}
      >
        <>
          {activeRequest?.targetName ? <strong>{activeRequest.targetName}</strong> : null}
          {activeRequest?.targetName ? <br /> : null}
          {activeRequest?.message}
          {activeRequest?.consequence ? (
            <>
              <br />
              {activeRequest.consequence}
            </>
          ) : null}
        </>
      </ConfirmDialog>
    </GdsConfirmContext.Provider>
  );
}

export function useGdsConfirm() {
  const context = useContext(GdsConfirmContext);
  if (!context) {
    throw new Error('useGdsConfirm must be used within GdsConfirmProvider.');
  }
  return context;
}

export interface GdsToastMessage extends Omit<GdsNotificationMessage, 'id' | 'severity'> {
  id?: string;
}

export interface GdsToastApi {
  notifySuccess: (message: GdsToastMessage) => void;
  notifyError: (message: GdsToastMessage & { retry?: () => void }) => void;
  notifyActionComplete: (message: GdsToastMessage) => void;
}

const GdsToastContext = createContext<GdsToastApi | null>(null);

function createToastId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function GdsToastProvider({ children }: { children: ReactNode }) {
  return (
    <GdsNotificationProvider>
      <GdsToastProviderInner>{children}</GdsToastProviderInner>
    </GdsNotificationProvider>
  );
}

function GdsToastProviderInner({ children }: { children: ReactNode }) {
  const { notify } = useGdsNotifications();
  const value = useMemo<GdsToastApi>(() => ({
    notifySuccess: (message) => notify({
      ...message,
      id: message.id ?? createToastId('success'),
      severity: 'success',
      autoCloseMs: message.autoCloseMs ?? 4000,
    }),
    notifyError: (message) => notify({
      ...message,
      id: message.id ?? createToastId('error'),
      severity: 'error',
      autoCloseMs: message.autoCloseMs ?? false,
      actions: message.retry
        ? [...(message.actions ?? []), { id: 'retry', label: 'Retry', onClick: message.retry }]
        : message.actions,
    }),
    notifyActionComplete: (message) => notify({
      ...message,
      id: message.id ?? createToastId('complete'),
      severity: 'success',
      autoCloseMs: message.autoCloseMs ?? 3000,
    }),
  }), [notify]);

  return <GdsToastContext.Provider value={value}>{children}</GdsToastContext.Provider>;
}

export function useGdsToasts() {
  const context = useContext(GdsToastContext);
  if (!context) {
    throw new Error('useGdsToasts must be used within GdsToastProvider.');
  }
  return context;
}
