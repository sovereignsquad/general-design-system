'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Drawer, Modal } from '@mantine/core';
import type { DrawerProps, ModalProps } from '@mantine/core';
import { getGdsMotionPreset, useGdsTranslation } from '@sovereignsquad/gds-theme';

/** Governed overlay surface kinds. */
export type GdsOverlayType = 'modal' | 'dialog' | 'drawer' | 'sheet' | 'popover' | 'command';
/** Overlay kind tracked by the manager, including the non-focus-trapping tooltip. */
export type OverlayKind = GdsOverlayType | 'tooltip';
/** Why an overlay close was requested. */
export type OverlayCloseReason = 'escape' | 'backdrop' | 'outside-click' | 'programmatic' | 'action' | 'route-change';
/** Lifecycle status of an overlay within the manager's stack. */
export type GdsOverlayStatus = 'opening' | 'open' | 'nested' | 'closing' | 'blocked-close' | 'route-recovery' | 'mobile-fullscreen';
/** How an overlay reacts to a route change: close, preserve, or recover. */
export type GdsOverlayRoutePolicy = 'close' | 'preserve' | 'recover';
/** Metadata-only overlay lifecycle event names. */
export type GdsOverlayEventType = 'overlay_opened' | 'overlay_closed' | 'escape_close' | 'blocked_close' | 'route_recovered';

/** Per-overlay behavior policy: close triggers, nesting, route handling, and focus return. */
export interface GdsOverlayPolicy {
  /** Whether Escape closes the overlay. Defaults to true. */
  closeOnEscape?: boolean;
  /** Whether a backdrop / outside click closes the overlay. Defaults to true. */
  closeOnOutsideClick?: boolean;
  /** Whether this overlay may stack on top of an existing one instead of replacing it. Defaults to false. */
  allowNested?: boolean;
  /** Behavior on route change. Defaults to `close`. */
  routeChange?: GdsOverlayRoutePolicy;
  /** Renders the surface full-screen on mobile. Defaults to false. */
  mobileFullscreen?: boolean;
  /** Whether to return focus to the invoker when the overlay closes. Defaults to true. */
  returnFocus?: boolean;
}

/** Describes an overlay when it registers with the manager. */
export interface OverlayDescriptor {
  /** Stable unique overlay id. */
  id: string;
  kind: OverlayKind;
  title?: ReactNode;
  description?: ReactNode;
  /** DOM id of the element that opened the overlay, used to restore focus on close. */
  invokerId?: string;
  policy?: GdsOverlayPolicy;
  status?: GdsOverlayStatus;
}

/** An overlay descriptor augmented with stack bookkeeping (open timestamp and resolved status). */
export interface GdsOverlayStackItem extends OverlayDescriptor {
  openedAt: number;
  status: GdsOverlayStatus;
}

/** Metadata-only event emitted for overlay lifecycle changes; carries no user content. */
export interface GdsOverlayEvent {
  type: GdsOverlayEventType;
  id: string;
  kind: OverlayKind;
  reason?: OverlayCloseReason;
  status: GdsOverlayStatus;
  timestamp: number;
  privacy: 'metadata-only';
}

interface OverlayManagerValue {
  stack: GdsOverlayStackItem[];
  registerOverlay: (overlay: OverlayDescriptor) => void;
  unregisterOverlay: (id: string, reason?: OverlayCloseReason) => void;
  openOverlay: (overlay: OverlayDescriptor) => void;
  closeOverlay: (id: string, reason?: OverlayCloseReason) => boolean;
  isTopMost: (id: string) => boolean;
  getOverlay: (id: string) => GdsOverlayStackItem | undefined;
  requestClose: (id: string, reason: OverlayCloseReason) => OverlayCloseReason | null;
}

/** Props for {@link OverlayManagerProvider}. */
export interface OverlayManagerProviderProps {
  children: ReactNode;
  /** Baseline policy merged under each overlay's own policy. */
  defaultPolicy?: GdsOverlayPolicy;
  /** When true, opening any overlay replaces the current stack (no nesting). Defaults to false. */
  singleOverlayMode?: boolean;
  /** Changing this value signals a route change, triggering each overlay's route policy. */
  routeKey?: string | number;
  /** Receives metadata-only overlay lifecycle events. */
  onOverlayEvent?: (event: GdsOverlayEvent) => void;
}

const defaultOverlayPolicy: Required<GdsOverlayPolicy> = {
  closeOnEscape: true,
  closeOnOutsideClick: true,
  allowNested: false,
  routeChange: 'close',
  mobileFullscreen: false,
  returnFocus: true,
};

const OverlayManagerContext = createContext<OverlayManagerValue | null>(null);

function normalizePolicy(defaultPolicy: GdsOverlayPolicy | undefined, policy: GdsOverlayPolicy | undefined): Required<GdsOverlayPolicy> {
  return {
    ...defaultOverlayPolicy,
    ...defaultPolicy,
    ...policy,
  };
}

function createOverlayEvent(type: GdsOverlayEventType, item: Pick<GdsOverlayStackItem, 'id' | 'kind' | 'status'>, reason?: OverlayCloseReason): GdsOverlayEvent {
  return {
    type,
    id: item.id,
    kind: item.kind,
    reason,
    status: item.status,
    timestamp: Date.now(),
    privacy: 'metadata-only',
  };
}

function getFocusableElement(invokerId?: string) {
  if (invokerId) {
    return document.getElementById(invokerId);
  }
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

/**
 * Context provider owning the overlay stack: registration, nesting vs. single-overlay
 * replacement, focus return, route-change handling, and metadata-only event emission.
 * Wrap the app (or a subtree) so GDS overlay surfaces can coordinate.
 */
export function OverlayManagerProvider({
  children,
  defaultPolicy,
  singleOverlayMode = false,
  routeKey,
  onOverlayEvent,
}: OverlayManagerProviderProps) {
  const [stack, setStack] = useState<GdsOverlayStackItem[]>([]);
  const focusReturnTargets = useRef<Map<string, HTMLElement>>(new Map());
  const previousRouteKey = useRef(routeKey);

  const emit = useCallback((type: GdsOverlayEventType, item: GdsOverlayStackItem, reason?: OverlayCloseReason) => {
    onOverlayEvent?.(createOverlayEvent(type, item, reason));
  }, [onOverlayEvent]);

  const registerOverlay = useCallback((overlay: OverlayDescriptor) => {
    const policy = normalizePolicy(defaultPolicy, overlay.policy);
    const focusTarget = getFocusableElement(overlay.invokerId);
    if (policy.returnFocus && focusTarget) {
      focusReturnTargets.current.set(overlay.id, focusTarget);
    }

    setStack((current) => {
      const withoutExisting = current.filter((item) => item.id !== overlay.id);
      const shouldReplace = singleOverlayMode || (!policy.allowNested && withoutExisting.length > 0);
      const base = shouldReplace ? [] : withoutExisting;
      const item: GdsOverlayStackItem = {
        ...overlay,
        status: policy.mobileFullscreen ? 'mobile-fullscreen' : (base.length > 0 ? 'nested' : 'open'),
        openedAt: Date.now(),
        policy,
      };
      emit('overlay_opened', item);
      return [...base, item];
    });
  }, [defaultPolicy, emit, singleOverlayMode]);

  const unregisterOverlay = useCallback((id: string, reason: OverlayCloseReason = 'programmatic') => {
    setStack((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        emit(reason === 'escape' ? 'escape_close' : 'overlay_closed', { ...target, status: 'closing' }, reason);
      }
      return current.filter((item) => item.id !== id);
    });

    const focusTarget = focusReturnTargets.current.get(id);
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus(), 0);
      focusReturnTargets.current.delete(id);
    }
  }, [emit]);

  const isTopMost = useCallback((id: string) => stack.length > 0 && stack[stack.length - 1]?.id === id, [stack]);

  const requestClose = useCallback((id: string, reason: OverlayCloseReason) => {
    const target = stack.find((item) => item.id === id);
    if (!target || !isTopMost(id)) {
      if (target) emit('blocked_close', { ...target, status: 'blocked-close' }, reason);
      return null;
    }

    const policy = normalizePolicy(defaultPolicy, target.policy);
    if (reason === 'escape' && !policy.closeOnEscape) {
      emit('blocked_close', { ...target, status: 'blocked-close' }, reason);
      return null;
    }
    if ((reason === 'backdrop' || reason === 'outside-click') && !policy.closeOnOutsideClick) {
      emit('blocked_close', { ...target, status: 'blocked-close' }, reason);
      return null;
    }

    return reason;
  }, [defaultPolicy, emit, isTopMost, stack]);

  const closeOverlay = useCallback((id: string, reason: OverlayCloseReason = 'programmatic') => {
    const acceptedReason = requestClose(id, reason);
    if (!acceptedReason) return false;
    unregisterOverlay(id, acceptedReason);
    return true;
  }, [requestClose, unregisterOverlay]);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;
    previousRouteKey.current = routeKey;
    setStack((current) => {
      const preserved: GdsOverlayStackItem[] = [];
      for (const item of current) {
        const policy = normalizePolicy(defaultPolicy, item.policy);
        if (policy.routeChange === 'preserve') {
          preserved.push(item);
          continue;
        }
        emit('route_recovered', { ...item, status: 'route-recovery' }, 'route-change');
        focusReturnTargets.current.delete(item.id);
      }
      return preserved;
    });
  }, [defaultPolicy, emit, routeKey]);

  const value = useMemo<OverlayManagerValue>(() => ({
    stack,
    registerOverlay,
    unregisterOverlay,
    openOverlay: registerOverlay,
    closeOverlay,
    isTopMost,
    getOverlay: (id) => stack.find((item) => item.id === id),
    requestClose,
  }), [closeOverlay, isTopMost, registerOverlay, requestClose, stack, unregisterOverlay]);

  return (
    <OverlayManagerContext.Provider value={value}>
      {children}
    </OverlayManagerContext.Provider>
  );
}

/** Returns the overlay manager context; throws if used outside an {@link OverlayManagerProvider}. */
export function useOverlayManager() {
  const context = useContext(OverlayManagerContext);
  if (!context) {
    throw new Error('useOverlayManager must be used within OverlayManagerProvider.');
  }
  return context;
}

interface GdsOverlaySurfaceBaseProps {
  id: string;
  opened: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  invokerId?: string;
  policy?: GdsOverlayPolicy;
  onBlockedClose?: (reason: OverlayCloseReason) => void;
}

/** Props for {@link GdsModal}: the governed overlay base props plus Mantine `Modal` props the manager does not control. */
export type GdsModalProps = GdsOverlaySurfaceBaseProps & Omit<ModalProps, 'opened' | 'onClose' | 'title' | 'children' | 'trapFocus'>;
/** Props for {@link GdsDrawer}: the governed overlay base props plus Mantine `Drawer` props the manager does not control. */
export type GdsDrawerProps = GdsOverlaySurfaceBaseProps & Omit<DrawerProps, 'opened' | 'onClose' | 'title' | 'children' | 'trapFocus'>;
/** Alias of {@link GdsModalProps} for the dialog surface. */
export type GdsDialogProps = GdsModalProps;
/** Alias of {@link GdsDrawerProps} for the side-panel surface. */
export type GdsSidePanelProps = GdsDrawerProps;
/** Alias of {@link GdsDrawerProps} for the bottom-sheet surface. */
export type GdsSheetProps = GdsDrawerProps;

function useOverlaySurface({
  id,
  opened,
  kind,
  title,
  description,
  invokerId,
  policy,
  onClose,
  onBlockedClose,
}: GdsOverlaySurfaceBaseProps & { kind: GdsOverlayType }) {
  const {
    registerOverlay,
    unregisterOverlay,
    requestClose: requestOverlayClose,
  } = useOverlayManager();

  useEffect(() => {
    if (!opened) return undefined;
    registerOverlay({ id, kind, title, description, invokerId, policy });
    return () => unregisterOverlay(id);
  }, [description, id, invokerId, kind, opened, policy, registerOverlay, title, unregisterOverlay]);

  const requestClose = useCallback((reason: OverlayCloseReason) => {
    const acceptedReason = requestOverlayClose(id, reason);
    if (!acceptedReason) {
      onBlockedClose?.(reason);
      return;
    }
    unregisterOverlay(id, acceptedReason);
    onClose();
  }, [id, onBlockedClose, onClose, requestOverlayClose, unregisterOverlay]);

  return requestClose;
}

/** Governed modal surface that registers with the overlay manager, traps focus, and honors its close policy. */
export function GdsModal({
  id,
  opened,
  onClose,
  title,
  description,
  children,
  invokerId,
  policy,
  onBlockedClose,
  ...modalProps
}: GdsModalProps) {
  const requestClose = useOverlaySurface({ id, opened, kind: 'modal', title, description, children, invokerId, policy, onClose, onBlockedClose });
  const motion = getGdsMotionPreset('overlay');
  const { t } = useGdsTranslation();

  return (
    <Modal
      {...modalProps}
      opened={opened}
      onClose={() => requestClose('escape')}
      title={title}
      centered={modalProps.centered ?? true}
      trapFocus
      closeButtonProps={{ 'aria-label': t('gds.overlay.close', 'Close'), ...modalProps.closeButtonProps }}
      closeOnEscape={policy?.closeOnEscape ?? true}
      closeOnClickOutside={policy?.closeOnOutsideClick ?? true}
      transitionProps={{ transition: 'fade', duration: motion.durationMs }}
    >
      {children}
    </Modal>
  );
}

/** Governed drawer surface that registers with the overlay manager, traps focus, and honors its close policy. */
export function GdsDrawer({
  id,
  opened,
  onClose,
  title,
  description,
  children,
  invokerId,
  policy,
  onBlockedClose,
  ...drawerProps
}: GdsDrawerProps) {
  const requestClose = useOverlaySurface({ id, opened, kind: 'drawer', title, description, children, invokerId, policy, onClose, onBlockedClose });
  const motion = getGdsMotionPreset('drawer');
  const { t } = useGdsTranslation();

  return (
    <Drawer
      {...drawerProps}
      opened={opened}
      onClose={() => requestClose('escape')}
      title={title}
      position={drawerProps.position ?? 'right'}
      size={policy?.mobileFullscreen ? '100%' : drawerProps.size}
      trapFocus
      closeButtonProps={{ 'aria-label': t('gds.overlay.close', 'Close'), ...drawerProps.closeButtonProps }}
      closeOnEscape={policy?.closeOnEscape ?? true}
      closeOnClickOutside={policy?.closeOnOutsideClick ?? true}
      transitionProps={{ transition: 'slide-left', duration: motion.durationMs }}
    >
      {children}
    </Drawer>
  );
}

/** Bottom-anchored, mobile-fullscreen {@link GdsDrawer} variant. */
export function GdsSheet(props: GdsSheetProps) {
  return <GdsDrawer {...props} position={props.position ?? 'bottom'} policy={{ mobileFullscreen: true, ...props.policy }} />;
}

/** Semantic alias of {@link GdsModal} for dialog use cases. */
export function GdsDialog(props: GdsDialogProps) {
  return <GdsModal {...props} />;
}

/** Right-anchored (by default) {@link GdsDrawer} variant for side panels. */
export function GdsSidePanel(props: GdsSidePanelProps) {
  return <GdsDrawer {...props} position={props.position ?? 'right'} />;
}
