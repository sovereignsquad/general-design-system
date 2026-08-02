'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';

/** Preferred side to anchor a step card relative to its spotlighted target. */
export type GdsTourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** Whether the spotlighted element can be interacted with through the scrim hole. */
export type GdsTourInteraction = 'none' | 'allow-target';

/** Lifecycle state of a tour. */
export type GdsTourStatus = 'idle' | 'running' | 'finished' | 'skipped';

/** Why a tour stopped, surfaced to `onStop`/telemetry consumers. */
export type GdsTourStopReason = 'finished' | 'skipped' | 'escape' | 'programmatic';

/**
 * One step of a guided tour: what to spotlight and what to say about it.
 * `target` is either a `data-gds-tour-target` id string (recommended — stable
 * across refactors) or a React ref to the element to highlight.
 */
export interface GdsTourStep {
  /** Stable id for the step (used for keys and analytics). */
  id: string;
  /** `data-gds-tour-target` value or a ref to the element to spotlight. */
  target: string | RefObject<HTMLElement | null>;
  /** Short heading shown in the step card. */
  title: string;
  /** Body copy explaining the spotlighted function. */
  body: ReactNode;
  /** Preferred card placement relative to the target. Defaults to `'auto'`. */
  placement?: GdsTourPlacement;
  /** Whether this step may be skipped with Esc / the Skip control. Defaults to true. */
  canSkip?: boolean;
  /** Extra halo (px) around the target inside the spotlight hole. */
  spotlightPadding?: number;
  /** Whether the target is clickable through the hole. Defaults to `'none'`. */
  interaction?: GdsTourInteraction;
}

/** Options accepted by `start()` and the declarative wrapper. */
export interface GdsTourStartOptions {
  /** Start on a specific step index. Defaults to 0. */
  startAt?: number;
  /** Persist "seen" state so an auto-start tour only runs once. */
  persist?: 'localStorage' | 'none';
  /** Called on every step transition with the new index. */
  onStepChange?: (index: number, step: GdsTourStep) => void;
  /** Called when the tour completes via the final "Done" action. */
  onFinish?: () => void;
  /** Called when the tour is skipped (Skip control or Esc). */
  onSkip?: () => void;
  /** Called whenever the tour stops, with the reason. */
  onStop?: (reason: GdsTourStopReason) => void;
}

interface GdsTourContextValue {
  status: GdsTourStatus;
  tourId: string | null;
  index: number;
  count: number;
  activeStep: GdsTourStep | null;
  start: (tourId: string, steps: GdsTourStep[], options?: GdsTourStartOptions) => void;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  stop: (reason?: GdsTourStopReason) => void;
}

const GdsTourContext = createContext<GdsTourContextValue | null>(null);

const SEEN_KEY_PREFIX = 'gds-tour-seen:';

function hasSeen(tourId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${SEEN_KEY_PREFIX}${tourId}`) === '1';
  } catch {
    return false;
  }
}

function markSeen(tourId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${SEEN_KEY_PREFIX}${tourId}`, '1');
  } catch {
    /* storage unavailable (private mode / SSR) — non-fatal */
  }
}

/**
 * Returns whether the given tour has already been completed/skipped on this
 * device (reads the same `localStorage` key the provider writes when a
 * persisted tour ends). SSR-safe: returns false on the server.
 */
export function useHasSeenTour(tourId: string): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    setSeen(hasSeen(tourId));
  }, [tourId]);
  return seen;
}

function resolveTargetElement(target: GdsTourStep['target']): HTMLElement | null {
  if (typeof window === 'undefined') return null;
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(`[data-gds-tour-target="${CSS.escape(target)}"]`);
  }
  return target.current ?? null;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function computeCardPosition(hole: Rect, card: { width: number; height: number }, placement: GdsTourPlacement) {
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - (hole.top + hole.height);
  const spaceAbove = hole.top;
  const spaceRight = vw - (hole.left + hole.width);
  const spaceLeft = hole.left;

  let side = placement;
  if (side === 'auto') {
    if (spaceBelow >= card.height + gap) side = 'bottom';
    else if (spaceAbove >= card.height + gap) side = 'top';
    else if (spaceRight >= card.width + gap) side = 'right';
    else if (spaceLeft >= card.width + gap) side = 'left';
    else side = 'bottom';
  }

  let top = 0;
  let left = 0;
  if (side === 'bottom') {
    top = hole.top + hole.height + gap;
    left = hole.left + hole.width / 2 - card.width / 2;
  } else if (side === 'top') {
    top = hole.top - card.height - gap;
    left = hole.left + hole.width / 2 - card.width / 2;
  } else if (side === 'right') {
    top = hole.top + hole.height / 2 - card.height / 2;
    left = hole.left + hole.width + gap;
  } else {
    top = hole.top + hole.height / 2 - card.height / 2;
    left = hole.left - card.width - gap;
  }

  // Clamp within the viewport with an 8px margin.
  top = Math.max(8, Math.min(top, vh - card.height - 8));
  left = Math.max(8, Math.min(left, vw - card.width - 8));
  return { top, left };
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Props for {@link GdsTourProvider}. */
export interface GdsTourProviderProps {
  children: ReactNode;
}

/**
 * App-root controller for guided onboarding tours. Mount once inside
 * `GdsProvider`. Exposes {@link useGdsTour} and renders the spotlight scrim +
 * anchored step card while a tour is running. The dim reads the governed
 * `--gds-overlay-scrim` token; positioning is dynamic; Esc/keyboard, focus
 * trap + return, scroll-lock, and reposition-on-scroll/resize are handled here.
 */
export function GdsTourProvider({ children }: GdsTourProviderProps) {
  const { t } = useGdsTranslation();
  const [tourId, setTourId] = useState<string | null>(null);
  const [steps, setSteps] = useState<GdsTourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<GdsTourStatus>('idle');
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const optionsRef = useRef<GdsTourStartOptions>({});
  const invokerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const targetElRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const running = status === 'running';
  const activeStep = running ? steps[index] ?? null : null;
  const count = steps.length;

  const clearActiveTargetAttr = useCallback(() => {
    if (targetElRef.current) {
      targetElRef.current.removeAttribute('data-gds-tour-active-target');
      targetElRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (nextStatus: GdsTourStatus, reason: GdsTourStopReason) => {
      const opts = optionsRef.current;
      const id = tourId;
      clearActiveTargetAttr();
      setStatus(nextStatus);
      setRect(null);
      setCardPos(null);
      if (id && opts.persist === 'localStorage') markSeen(id);
      if (nextStatus === 'finished') opts.onFinish?.();
      if (nextStatus === 'skipped') opts.onSkip?.();
      opts.onStop?.(reason);
      // Return focus to whatever opened the tour.
      const invoker = invokerRef.current;
      if (invoker && typeof invoker.focus === 'function') {
        window.setTimeout(() => invoker.focus(), 0);
      }
    },
    [clearActiveTargetAttr, tourId],
  );

  const stop = useCallback((reason: GdsTourStopReason = 'programmatic') => {
    finish(reason === 'finished' ? 'finished' : 'skipped', reason);
  }, [finish]);

  const start = useCallback(
    (id: string, tourSteps: GdsTourStep[], options: GdsTourStartOptions = {}) => {
      if (!tourSteps.length) return;
      optionsRef.current = options;
      invokerRef.current = (typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null);
      setTourId(id);
      setSteps(tourSteps);
      setIndex(Math.max(0, Math.min(options.startAt ?? 0, tourSteps.length - 1)));
      setStatus('running');
    },
    [],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex((current) => {
        const clamped = Math.max(0, Math.min(nextIndex, steps.length - 1));
        if (clamped !== current) optionsRef.current.onStepChange?.(clamped, steps[clamped]);
        return clamped;
      });
    },
    [steps],
  );

  const next = useCallback(() => {
    if (index >= steps.length - 1) {
      finish('finished', 'finished');
    } else {
      goTo(index + 1);
    }
  }, [index, steps.length, finish, goTo]);

  const back = useCallback(() => {
    if (index > 0) goTo(index - 1);
  }, [index, goTo]);

  // Measure + position the current step's target (and re-measure on scroll/resize).
  useLayoutEffect(() => {
    if (!running || !activeStep) return undefined;

    const measure = () => {
      const el = resolveTargetElement(activeStep.target);
      if (!el) {
        // Missing target: warn (dev) and skip forward rather than crash.
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`[GdsTour] step "${activeStep.id}" target not found; skipping.`);
        }
        next();
        return;
      }
      if (targetElRef.current && targetElRef.current !== el) {
        targetElRef.current.removeAttribute('data-gds-tour-active-target');
      }
      targetElRef.current = el;
      el.setAttribute('data-gds-tour-active-target', activeStep.id);
      const pad = activeStep.spotlightPadding ?? 8;
      const b = el.getBoundingClientRect();
      const nextRect: Rect = {
        top: b.top - pad,
        left: b.left - pad,
        width: b.width + pad * 2,
        height: b.height + pad * 2,
      };
      setRect(nextRect);
      const cardEl = cardRef.current;
      const cardSize = cardEl
        ? { width: cardEl.offsetWidth || 320, height: cardEl.offsetHeight || 160 }
        : { width: 320, height: 160 };
      setCardPos(computeCardPosition(nextRect, cardSize, activeStep.placement ?? 'auto'));
    };

    const el = resolveTargetElement(activeStep.target);
    el?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    // Measure after the scroll settles.
    const raf = window.requestAnimationFrame(() => window.setTimeout(measure, 60));

    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && el) ro.observe(el);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [running, activeStep, index, next]);

  // Lock background scroll + focus the card while running.
  useEffect(() => {
    if (!running) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusCard = window.setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      const first = card.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? card).focus();
    }, 80);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusCard);
    };
  }, [running, index]);

  // Keyboard: Esc skips, arrows/Enter navigate, Tab is trapped in the card.
  useEffect(() => {
    if (!running || !activeStep) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeStep.canSkip !== false) {
          event.preventDefault();
          finish('skipped', 'escape');
        }
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        back();
        return;
      }
      if (event.key === 'Tab') {
        const card = cardRef.current;
        if (!card) return;
        const focusables = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute('disabled'),
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [running, activeStep, next, back, finish]);

  const value = useMemo<GdsTourContextValue>(
    () => ({ status, tourId, index, count, activeStep, start, next, back, goTo, stop }),
    [status, tourId, index, count, activeStep, start, next, back, goTo, stop],
  );

  const overlay =
    mounted && running && activeStep && rect
      ? createPortal(
          <div
            className={`gds-tour-spotlight${activeStep.interaction === 'allow-target' ? ' gds-tour-spotlight--interactive' : ''}`}
            data-gds-tour-overlay=""
          >
            {activeStep.interaction !== 'allow-target' ? (
              <div className="gds-tour-spotlight__blocker" aria-hidden="true" />
            ) : null}
            <div
              className="gds-tour-spotlight__hole"
              aria-hidden="true"
              style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            />
            <div
              ref={cardRef}
              className="gds-tour-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gds-tour-title"
              aria-describedby="gds-tour-body"
              tabIndex={-1}
              style={cardPos ? { top: cardPos.top, left: cardPos.left } : { top: 16, left: 16, visibility: 'hidden' }}
            >
              <p className="gds-tour-card__progress" aria-live="polite">
                {t('gds.tour.stepOfTotal', 'Step {n} of {m}')
                  .replace('{n}', String(index + 1))
                  .replace('{m}', String(count))}
              </p>
              <h2 id="gds-tour-title" className="gds-tour-card__title">
                {activeStep.title}
              </h2>
              <div id="gds-tour-body" className="gds-tour-card__body">
                {activeStep.body}
              </div>
              <div className="gds-tour-card__actions">
                {activeStep.canSkip !== false ? (
                  <button
                    type="button"
                    className="gds-tour-btn gds-tour-btn--ghost"
                    onClick={() => finish('skipped', 'skipped')}
                  >
                    {t('gds.tour.skip', 'Skip')}
                  </button>
                ) : (
                  <span />
                )}
                <div className="gds-tour-card__nav">
                  {index > 0 ? (
                    <button type="button" className="gds-tour-btn gds-tour-btn--secondary" onClick={back}>
                      {t('gds.tour.back', 'Back')}
                    </button>
                  ) : null}
                  <button type="button" className="gds-tour-btn gds-tour-btn--primary" onClick={next}>
                    {index >= count - 1 ? t('gds.tour.done', 'Done') : t('gds.tour.next', 'Next')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <GdsTourContext.Provider value={value}>
      {children}
      {overlay}
    </GdsTourContext.Provider>
  );
}

/** Access the guided-tour controller. Throws if used outside {@link GdsTourProvider}. */
export function useGdsTour(): GdsTourContextValue {
  const context = useContext(GdsTourContext);
  if (!context) {
    throw new Error('useGdsTour must be used within GdsTourProvider.');
  }
  return context;
}

/** Props for the declarative {@link GdsGuidedTour} wrapper. */
export interface GdsGuidedTourProps extends GdsTourStartOptions {
  /** Stable id for the tour (used for persistence + analytics). */
  id: string;
  /** The ordered steps to run. */
  steps: GdsTourStep[];
  /** When true, the tour starts (once, respecting `persist`). */
  open?: boolean;
  /** Alias of `startAt`. */
  defaultStep?: number;
}

/**
 * Declarative controller for a guided tour: renders nothing, but starts the
 * tour when `open` becomes true (skipping it if `persist: 'localStorage'` and
 * the tour was already seen). For imperative control use {@link useGdsTour}.
 */
export function GdsGuidedTour({ id, steps, open = false, defaultStep, ...options }: GdsGuidedTourProps) {
  const { start, status } = useGdsTour();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open || startedRef.current || status === 'running') return;
    if (options.persist === 'localStorage' && hasSeen(id)) return;
    startedRef.current = true;
    start(id, steps, { ...options, startAt: defaultStep ?? options.startAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  return null;
}
