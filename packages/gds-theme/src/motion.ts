/** Named motion duration token (maps to a millisecond value in `gdsMotionDurations`). */
export type GdsMotionDurationToken = 'instant' | 'fast' | 'base' | 'slow' | 'slower' | 'ambient';
/** Named motion easing token (maps to a `cubic-bezier(...)` in `gdsMotionEasings`). */
export type GdsMotionEasingToken = 'standard' | 'entrance' | 'exit' | 'emphasis' | 'linear';
/** Identifier of a governed motion preset (one per interaction surface). */
export type GdsMotionPresetId = 'overlay' | 'drawer' | 'command' | 'list' | 'feedback' | 'skeleton' | 'state';
/** Reduced-motion policy: follow the OS (`'system'`), always reduce, or disable motion entirely. */
export type GdsReducedMotionPolicy = 'system' | 'reduce' | 'no-motion';

/** A governed motion preset: duration/easing tokens plus the full and reduced-motion transition strings. */
export interface GdsMotionPreset {
  id: GdsMotionPresetId;
  /** Duration token driving this preset. */
  duration: GdsMotionDurationToken;
  /** Easing token driving this preset. */
  easing: GdsMotionEasingToken;
  /** Delay before the transition starts, in milliseconds. */
  delayMs: number;
  /** Full-motion CSS `transition` value. */
  transition: string;
  /** `transform` applied in the entered state. */
  enterTransform: string;
  /** `transform` applied in the exited state. */
  exitTransform: string;
  /** CSS `transition` used when motion is reduced. */
  reducedTransition: string;
  /** `transform` used when motion is reduced. */
  reducedTransform: string;
  /** Where this preset is meant to be applied. */
  usage: string;
}

/** A motion preset resolved under a specific policy, with concrete values and an animate flag. */
export interface GdsResolvedMotionPreset extends GdsMotionPreset {
  /** Resolved duration in milliseconds (`0` under `'no-motion'`). */
  durationMs: number;
  /** Resolved easing function value. */
  easingValue: string;
  /** Policy this preset was resolved under. */
  policy: GdsReducedMotionPolicy;
  /** `false` under `'no-motion'`; `true` otherwise. */
  shouldAnimate: boolean;
}

/** Motion duration tokens mapped to their millisecond values. */
export const gdsMotionDurations: Record<GdsMotionDurationToken, number> = {
  instant: 0,
  fast: 120,
  base: 180,
  slow: 240,
  slower: 360,
  /**
   * Looping ambient motion — a typing indicator, a pulse, a breathing dot.
   *
   * A separate value, not mapped onto an existing step: every step above is a transition
   * duration (state-change time), the longest being 360ms — a loop repeating that fast reads
   * as frantic rather than "working".
   *
   * Lives on the same scale so it inherits the generated CSS variable, the DTCG export, and
   * the reduced-motion override that zeroes it.
   */
  ambient: 1000,
};

/** Motion easing tokens mapped to their CSS timing-function values. */
export const gdsMotionEasings: Record<GdsMotionEasingToken, string> = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  emphasis: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
};

/** The governed motion presets keyed by id, one per interaction surface. */
export const gdsMotionPresets: Record<GdsMotionPresetId, GdsMotionPreset> = {
  overlay: {
    id: 'overlay',
    duration: 'base',
    easing: 'entrance',
    delayMs: 0,
    transition: 'opacity var(--gds-motion-duration-base) var(--gds-motion-ease-entrance), transform var(--gds-motion-duration-base) var(--gds-motion-ease-entrance)',
    enterTransform: 'translateY(0) scale(1)',
    exitTransform: 'translateY(0.5rem) scale(0.98)',
    reducedTransition: 'opacity var(--gds-motion-duration-fast) linear',
    reducedTransform: 'none',
    usage: 'Modal, popover, and blocking dialog entrance/exit.',
  },
  drawer: {
    id: 'drawer',
    duration: 'slow',
    easing: 'entrance',
    delayMs: 0,
    transition: 'opacity var(--gds-motion-duration-slow) var(--gds-motion-ease-entrance), transform var(--gds-motion-duration-slow) var(--gds-motion-ease-entrance)',
    enterTransform: 'translateX(0)',
    exitTransform: 'translateX(1rem)',
    reducedTransition: 'opacity var(--gds-motion-duration-fast) linear',
    reducedTransform: 'none',
    usage: 'Drawer, sheet, and mobile full-screen surface movement.',
  },
  command: {
    id: 'command',
    duration: 'fast',
    easing: 'standard',
    delayMs: 0,
    transition: 'opacity var(--gds-motion-duration-fast) var(--gds-motion-ease-standard), transform var(--gds-motion-duration-fast) var(--gds-motion-ease-standard)',
    enterTransform: 'translateY(0)',
    exitTransform: 'translateY(-0.25rem)',
    reducedTransition: 'opacity var(--gds-motion-duration-fast) linear',
    reducedTransform: 'none',
    usage: 'Command palette, quick action, and search result reveal.',
  },
  list: {
    id: 'list',
    duration: 'base',
    easing: 'standard',
    delayMs: 0,
    transition: 'opacity var(--gds-motion-duration-base) var(--gds-motion-ease-standard), transform var(--gds-motion-duration-base) var(--gds-motion-ease-standard)',
    enterTransform: 'translateY(0)',
    exitTransform: 'translateY(0.25rem)',
    reducedTransition: 'opacity var(--gds-motion-duration-fast) linear',
    reducedTransform: 'none',
    usage: 'List, table, and card collection state changes.',
  },
  feedback: {
    id: 'feedback',
    duration: 'fast',
    easing: 'emphasis',
    delayMs: 0,
    transition: 'opacity var(--gds-motion-duration-fast) var(--gds-motion-ease-emphasis), transform var(--gds-motion-duration-fast) var(--gds-motion-ease-emphasis)',
    enterTransform: 'translateY(0) scale(1)',
    exitTransform: 'translateY(0.25rem) scale(0.99)',
    reducedTransition: 'opacity var(--gds-motion-duration-fast) linear',
    reducedTransform: 'none',
    usage: 'Toast, notification, badge, and inline status feedback.',
  },
  skeleton: {
    id: 'skeleton',
    duration: 'slower',
    easing: 'linear',
    delayMs: 0,
    transition: 'opacity var(--gds-motion-duration-slower) linear',
    enterTransform: 'none',
    exitTransform: 'none',
    reducedTransition: 'none',
    reducedTransform: 'none',
    usage: 'Loading skeleton shimmer or pulse timing; content must not depend on motion.',
  },
  state: {
    id: 'state',
    duration: 'base',
    easing: 'standard',
    delayMs: 0,
    transition: 'background-color var(--gds-motion-duration-base) var(--gds-motion-ease-standard), border-color var(--gds-motion-duration-base) var(--gds-motion-ease-standard), color var(--gds-motion-duration-base) var(--gds-motion-ease-standard)',
    enterTransform: 'none',
    exitTransform: 'none',
    reducedTransition: 'none',
    reducedTransform: 'none',
    usage: 'Color, border, disabled, validation, and status state transitions.',
  },
};

/**
 * Resolves a motion preset under the given policy, producing concrete duration
 * and easing values plus reduced-motion-aware transitions. Under `'reduce'` the
 * reduced transition/transform are used; under `'no-motion'` duration is `0`,
 * easing is linear, and `shouldAnimate` is `false`.
 */
export function getGdsMotionPreset(id: GdsMotionPresetId, policy: GdsReducedMotionPolicy = 'system'): GdsResolvedMotionPreset {
  const preset = gdsMotionPresets[id];
  const reduced = policy === 'reduce' || policy === 'no-motion';
  const noMotion = policy === 'no-motion';
  return {
    ...preset,
    durationMs: noMotion ? 0 : gdsMotionDurations[preset.duration],
    easingValue: noMotion ? gdsMotionEasings.linear : gdsMotionEasings[preset.easing],
    policy,
    shouldAnimate: !noMotion,
    transition: noMotion ? 'none' : (reduced ? preset.reducedTransition : preset.transition),
    enterTransform: reduced ? preset.reducedTransform : preset.enterTransform,
    exitTransform: reduced ? preset.reducedTransform : preset.exitTransform,
  };
}

/** Builds the `--gds-motion-duration-*` / `--gds-motion-ease-*` CSS variable map; under `'no-motion'` durations collapse to 0 and easings to linear. */
export function createGdsMotionCssVariables(policy: GdsReducedMotionPolicy = 'system') {
  // Derived from the records rather than hand-listed, so a step cannot be added to one and
  // forgotten in the other.
  const noMotion = policy === 'no-motion';
  const vars: Record<string, string> = {};
  for (const [name, ms] of Object.entries(gdsMotionDurations)) {
    vars[`--gds-motion-duration-${name}`] = `${noMotion ? 0 : ms}ms`;
  }
  for (const [name, value] of Object.entries(gdsMotionEasings)) {
    // `linear` is the reduced-motion REPLACEMENT, not a curve any component asks for by name.
    if (name === 'linear') continue;
    vars[`--gds-motion-ease-${name}`] = noMotion ? gdsMotionEasings.linear : value;
  }
  return vars;
}
