'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, VisuallyHidden } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';
import { gdsDevWarnOnce, useGdsTranslation } from '@sovereignsquad/gds-theme';
import { IconCheck, IconLoader2, IconX } from '@tabler/icons-react';
import { getSemanticActionLabel, resolveSemanticActionConfig } from './vocabulary';
import type { GdsButtonMotion, GdsVocabularyPack, SemanticActionId } from './vocabulary';

/**
 * How long a transient success/error feedback treatment stays on the button before it reverts
 * to its resting label. Exported so documentation surfaces read the real value rather than
 * restating it, so a change here changes both the behaviour and the page.
 */
export const GDS_BUTTON_FEEDBACK_DURATION_MS = 2000;

/** An `onAction` promise that settles sooner than this never shows the pending state, so fast actions do not flash a spinner. */
export const GDS_BUTTON_PENDING_DELAY_MS = 500;

/** Once shown, the pending state stays at least this long, so it never flickers. */
export const GDS_BUTTON_PENDING_MIN_MS = 200;

/** How long a confirm-first action (`motion.confirm`) waits for the second click before disarming. */
export const GDS_BUTTON_CONFIRM_WINDOW_MS = 3000;

/**
 * Minimum label typography for the `gradient` brand intent (issue 700). White label text on
 * the reserved Scout AI gradient fill (issue 697) clears only the WCAG non-text threshold
 * (3:1) -- the `ai-accent-text-contrast` accessibility-floor rule measures and reports this
 * every run -- never the 4.5:1 normal-text floor, so the gradient intent's label is held at or
 * above this size and weight as a hard component invariant rather than relying on a preset to
 * compensate.
 */
export const GDS_BUTTON_GRADIENT_TEXT_FLOOR = { fontSizePx: 14, fontWeight: 600 } as const;

/** Outline stroke width for the `outline-accent` brand intent, in px (issue 700). */
export const GDS_BUTTON_OUTLINE_ACCENT_STROKE_PX = 1.5;

/** Props for `SemanticButton`; extends Mantine `ButtonProps` and the native button attributes. */
export interface SemanticButtonProps extends Omit<ButtonProps, 'children'>, Omit<React.ComponentPropsWithoutRef<'button'>, keyof ButtonProps | 'leftSection' | 'children'> {
  /** Governed semantic action id whose label and icon are resolved from the vocabulary. */
  action: SemanticActionId;
  /**
   * Applies a brand color treatment; the `disabled` variant also disables the button.
   * `outline-accent` (transparent fill, accent stroke and label) and `gradient` (the reserved
   * Scout AI gradient fill, issue 697, over a solid primary-chain fallback where a preset
   * declares no `ai` lane) are issue 700: their full hover/pressed/disabled state axis lives in
   * `packages/gds-theme/styles.css`, keyed on the `data-gds-brand-button` attribute this
   * component emits, because a stylesheet `:hover`/`:active` rule cannot override an inline
   * style. Never combine either with a destructive action -- style those through the existing
   * `danger` vocabulary intent instead.
   */
  brandVariant?: 'primary' | 'secondary' | 'accent' | 'disabled' | 'outline-accent' | 'gradient';
  loading?: boolean;
  /** Triggers a transient success/error feedback treatment (icon, color, label) for ~2s. */
  feedbackState?: 'success' | 'error' | null;
  /**
   * The action to run on click. The button drives the whole cycle from it: pending while the
   * returned promise runs (after {@link GDS_BUTTON_PENDING_DELAY_MS}), success when it resolves,
   * error when it rejects, then back to rest after {@link GDS_BUTTON_FEEDBACK_DURATION_MS}.
   * Clicks are ignored while it runs. `onClick` still fires when the action starts.
   */
  onAction?: () => unknown;
  /** Overrides the label shown during a feedback state. */
  feedbackText?: string;
  /** Renders the untranslated label on first paint to avoid a hydration mismatch, then upgrades; defaults to true. */
  prerenderLabelOnly?: boolean;
  /** Additional vocabulary packs consulted when resolving the action's label and icon. */
  vocabularyPacks?: GdsVocabularyPack[];
  /**
   * Overrides the rendered label with an arbitrary node instead of the vocabulary-resolved
   * string -- the vocabulary system is string-only by design (it exists to keep a label
   * translated and consistent everywhere the same `action` appears), so a caller that genuinely
   * needs non-string content (e.g. a caller-supplied `ReactNode` label prop of its own) sets this
   * rather than reimplementing button chrome locally. The icon, `feedbackState`, and
   * `prerenderLabelOnly` behavior are unaffected -- only the text content changes.
   */
  label?: React.ReactNode;
  /** Not supported: the text comes from `action`, or from `label`. Children would be discarded. */
  children?: never;
}

const brandButtonStyles: Record<NonNullable<SemanticButtonProps['brandVariant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
    borderColor: 'var(--gds-brand-primary, var(--gds-vibe-primary, var(--mantine-primary-color-filled)))',
    // --gds-text-on-inverse is derived against --gds-bg-inverse only; against
    // --gds-brand-primary it is 1.00:1 in the default dark preset (identical color).
    color: 'var(--gds-brand-primary-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',
  },
  secondary: {
    background: 'var(--gds-bg-card, var(--gds-vibe-surface, var(--mantine-color-white)))',
    borderColor: 'var(--gds-border-card, var(--gds-vibe-border, var(--mantine-color-gray-3)))',
    color: 'var(--gds-brand-primary, var(--gds-vibe-text, var(--mantine-color-dark-7)))',
  },
  accent: {
    background: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
    borderColor: 'var(--gds-brand-accent-action, var(--gds-brand-accent, var(--gds-vibe-accent, var(--mantine-primary-color-filled))))',
    // 1.66:1 against the gold-athlete dark accent.
    color: 'var(--gds-brand-accent-action-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',
  },
  disabled: {
    background: 'var(--gds-control-disabledBg, var(--mantine-color-gray-2))',
    borderColor: 'var(--gds-control-disabledBg, var(--mantine-color-gray-2))',
    color: 'var(--gds-control-disabledText, var(--mantine-color-gray-6))',
  },
  // `outline-accent` and `gradient` (issue 700) carry no inline paint. A stylesheet
  // `:hover`/`:active` rule cannot override an inline style without `!important`, so their
  // entire resting paint -- and every state layered on top of it -- lives in
  // packages/gds-theme/styles.css, keyed on `data-gds-brand-button`; the component contributes
  // only the attribute.
  'outline-accent': {},
  gradient: {},
};

/**
 * Button whose label is resolved from a governed semantic `action` id (via the GDS
 * vocabulary) rather than a hardcoded string, so the same action reads and
 * localizes consistently everywhere it appears. Supports brand variants, a
 * `loading` busy state, and transient success/error feedback. Use it for any
 * action tied to a known semantic verb; fall back to Mantine's raw `Button` only
 * for one-off actions with no vocabulary entry.
 */
type GdsButtonPhase = 'idle' | 'busy' | 'pending' | 'success' | 'error' | 'confirm';

type IconComponent = React.ComponentType<{ size?: string | number }>;

const ICON_SIZE = '1rem';

function pendingLabel(action: SemanticActionId, t: (id: string, fallback: string) => string): string {
  switch (action) {
    case 'send': return t('gds.pending.send', 'Sending…');
    case 'save': return t('gds.pending.save', 'Saving…');
    case 'copy': return t('gds.pending.copy', 'Copying…');
    case 'delete': return t('gds.pending.delete', 'Deleting…');
    case 'add': return t('gds.pending.add', 'Adding…');
    case 'download': return t('gds.pending.download', 'Downloading…');
    case 'upload': return t('gds.pending.upload', 'Uploading…');
    case 'refresh': return t('gds.pending.refresh', 'Refreshing…');
    case 'complete': return t('gds.pending.complete', 'Completing…');
    case 'submit': return t('gds.pending.submit', 'Submitting…');
    default: return t('gds.pending.working', 'Working…');
  }
}

function Layer({ motion, after, children }: { motion?: string; after?: 'exit'; children: React.ReactNode }) {
  return (
    <span data-gds-motion={motion ? '' : undefined} data-gds-button-motion={motion} data-gds-button-motion-after={after}>
      {children}
    </span>
  );
}

function ButtonIcon({ phase, motion, Icon, SuccessIcon, fromRest }: {
  phase: GdsButtonPhase;
  motion: GdsButtonMotion | undefined;
  Icon: IconComponent;
  SuccessIcon: IconComponent;
  fromRest: boolean;
}) {
  let layers: React.ReactNode;
  if (phase === 'pending') {
    const pending = motion?.pending ?? 'spinner';
    layers = pending === 'spinner'
      ? <Layer motion="spin"><IconLoader2 size={ICON_SIZE} /></Layer>
      : <Layer motion={pending}><Icon size={ICON_SIZE} /></Layer>;
  } else if (phase === 'success') {
    const success = motion?.success;
    if ((success === 'fly-off' || success === 'turn') && fromRest) {
      layers = (
        <>
          <Layer motion={success === 'fly-off' ? 'fly-off' : 'turn-out'}><Icon size={ICON_SIZE} /></Layer>
          <Layer motion="pop-in" after="exit"><IconCheck size={ICON_SIZE} /></Layer>
        </>
      );
    } else if (success === 'fly-off' || success === 'turn' || success === 'check-pop') {
      layers = <Layer motion="pop-in"><IconCheck size={ICON_SIZE} /></Layer>;
    } else if (success === 'check-draw') {
      layers = <Layer motion="draw"><IconCheck size={ICON_SIZE} /></Layer>;
    } else if (success === 'draw') {
      layers = <Layer motion="draw"><SuccessIcon size={ICON_SIZE} /></Layer>;
    } else {
      layers = <Layer motion="pop"><SuccessIcon size={ICON_SIZE} /></Layer>;
    }
  } else if (phase === 'error') {
    layers = <Layer><IconX size={ICON_SIZE} /></Layer>;
  } else {
    layers = <Layer><Icon size={ICON_SIZE} /></Layer>;
  }
  return <span data-gds-button-icon="">{layers}</span>;
}

/**
 * Button whose label is resolved from a governed semantic `action` id (via the GDS
 * vocabulary) rather than a hardcoded string, so the same action reads and
 * localizes consistently everywhere it appears. Supports brand variants, a
 * `loading` busy state, transient success/error feedback, and a promise-driven
 * `onAction` cycle with the action's own micro-interaction. Use it for any
 * action tied to a known semantic verb; fall back to Mantine's raw `Button` only
 * for one-off actions with no vocabulary entry.
 */
export function SemanticButton({
  action,
  brandVariant,
  loading,
  feedbackState,
  feedbackText,
  onAction,
  prerenderLabelOnly = true,
  vocabularyPacks = [],
  label: labelOverride,
  ...props
}: SemanticButtonProps) {
  if ((props as { children?: unknown }).children !== undefined) {
    gdsDevWarnOnce(
      'SemanticButton:children',
      'SemanticButton ignores children: its text comes from `action` or the `label` prop. Pass the text as `label`.',
    );
  }
  const { t } = useGdsTranslation();
  const config = resolveSemanticActionConfig(action, vocabularyPacks);
  const motion = config.motion;

  const [mounted, setMounted] = useState(!prerenderLabelOnly);
  const [phase, setPhaseState] = useState<GdsButtonPhase>('idle');
  const [cycle, setCycle] = useState(0);
  const [fromRest, setFromRest] = useState(true);
  const phaseRef = useRef<GdsButtonPhase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const alive = useRef(true);

  const setPhase = useCallback((next: GdsButtonPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);
  const clearTimers = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (prerenderLabelOnly) {
      setMounted(true);
    }
  }, [prerenderLabelOnly]);

  useEffect(() => {
    if (feedbackState) {
      setFromRest(true);
      setCycle((n) => n + 1);
      setPhase(feedbackState);
      const timer = setTimeout(() => setPhase('idle'), GDS_BUTTON_FEEDBACK_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [feedbackState, setPhase]);

  const { onClick, ...buttonRest } = props;

  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onAction) {
      onClick?.(event);
      return;
    }
    const current = phaseRef.current;
    if (current === 'busy' || current === 'pending') {
      event.preventDefault();
      return;
    }
    clearTimers();
    if (motion?.confirm && current !== 'confirm') {
      setPhase('confirm');
      later(GDS_BUTTON_CONFIRM_WINDOW_MS, () => setPhase('idle'));
      return;
    }
    onClick?.(event);
    setCycle((n) => n + 1);
    setPhase('busy');
    let shownAt = 0;
    later(GDS_BUTTON_PENDING_DELAY_MS, () => {
      shownAt = Date.now();
      setPhase('pending');
    });
    let ok = true;
    try {
      await onAction();
    } catch {
      ok = false;
    }
    clearTimers();
    if (shownAt) {
      const remaining = GDS_BUTTON_PENDING_MIN_MS - (Date.now() - shownAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    if (!alive.current) return;
    setFromRest(!shownAt);
    setCycle((n) => n + 1);
    setPhase(ok ? 'success' : 'error');
    later(GDS_BUTTON_FEEDBACK_DURATION_MS, () => setPhase('idle'));
  }, [onAction, onClick, motion?.confirm, clearTimers, later, setPhase]);

  const restLabel: React.ReactNode = labelOverride ?? getSemanticActionLabel(action, t, vocabularyPacks);
  const feedbackConfig = config.feedback ?? { icon: IconCheck, color: 'teal', messageId: 'gds.feedback.saved' };
  const successLabel = feedbackText || t(feedbackConfig.messageId, 'Success');
  const failedLabel = feedbackText || t('gds.feedback.failed', 'Failed');
  const errorAnnouncement = feedbackText || t('gds.feedback.error', 'Something went wrong');
  const confirmLabel = t('gds.feedback.confirmAgain', 'Click again to confirm');
  const workingLabel = pendingLabel(action, t);
  // Buttons that can show feedback reserve the width of their widest state, so a label swap
  // never moves the layout around them.
  const reservesWidth = Boolean(onAction) || feedbackState !== undefined;

  let color = props.color;
  const brandStyle = brandVariant ? brandButtonStyles[brandVariant] : undefined;
  const disabled = props.disabled || brandVariant === 'disabled';
  const showingFeedback = phase === 'success' || phase === 'error';

  // `outline-accent`/`gradient` paint entirely from the stylesheet (see brandButtonStyles
  // above), so while a transient feedback treatment is showing, the governed success/danger
  // button rules in styles.css must be the ones that paint instead -- withholding the attribute
  // for exactly that window is what hands the cascade to those existing rules, so feedback
  // fully overrides intent paint with no new stylesheet rule and no residual stroke/gradient.
  // The four pre-existing variants are untouched: their resting paint is inline and already
  // wins the cascade regardless of feedback, exactly as before this change (issue 700).
  const isStylesheetPaintedBrand = brandVariant === 'outline-accent' || brandVariant === 'gradient';
  const brandButtonAttr = isStylesheetPaintedBrand && showingFeedback ? undefined : brandVariant;

  if (!mounted) {
    const { leftSection, style, ...prerenderProps } = buttonRest;
    return (
      <Button {...prerenderProps} onClick={onAction ? undefined : onClick} loading={loading} color={color} data-gds-brand-button={brandButtonAttr} disabled={disabled} aria-busy={loading ? true : undefined} style={{ ...brandStyle, ...style }}>
        {labelOverride ?? getSemanticActionLabel(action, undefined, vocabularyPacks)}
      </Button>
    );
  }

  let visibleLabel: React.ReactNode = restLabel;
  let announcement = '';
  if (phase === 'success') {
    visibleLabel = successLabel;
    announcement = successLabel;
    color = feedbackConfig.color;
  } else if (phase === 'error') {
    visibleLabel = failedLabel;
    announcement = errorAnnouncement;
    color = 'red';
  } else if (phase === 'pending') {
    visibleLabel = workingLabel;
    announcement = workingLabel;
  } else if (phase === 'confirm') {
    visibleLabel = confirmLabel;
    announcement = confirmLabel;
  }

  const ghosts: React.ReactNode[] = [restLabel, successLabel, failedLabel];
  if (onAction) ghosts.push(workingLabel);
  if (onAction && motion?.confirm) ghosts.push(confirmLabel);
  const busy = phase === 'busy' || phase === 'pending';

  return (
    <>
      <Button
        {...buttonRest}
        onClick={handleClick}
        leftSection={<ButtonIcon key={`${phase}-${cycle}`} phase={phase} motion={motion} Icon={config.icon} SuccessIcon={feedbackConfig.icon} fromRest={fromRest} />}
        loading={loading}
        color={color}
        data-gds-brand-button={brandButtonAttr}
        data-gds-button-phase={phase === 'idle' ? undefined : phase}
        disabled={disabled}
        aria-disabled={busy ? true : undefined}
        aria-busy={loading || busy ? true : undefined}
        style={{ ...brandStyle, ...props.style }}
      >
        {reservesWidth ? (
          <span data-gds-button-label-stack="">
            {ghosts.map((ghost, index) => (
              <span key={index} data-gds-button-label-ghost="" aria-hidden="true">{ghost}</span>
            ))}
            <span data-gds-button-label="">{visibleLabel}</span>
          </span>
        ) : visibleLabel}
      </Button>
      {reservesWidth ? (
        <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </VisuallyHidden>
      ) : null}
    </>
  );
}
