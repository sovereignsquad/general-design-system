import type { GdsThemePresetId } from './theme-presets';
import { getGdsVibeThemes, getGdsVibeThemeCssVariables, type GdsVibeTheme } from './vibe-themes';
import { contrastRatio, mixCssColors } from './color-math';

/** Color scheme a contrast check is evaluated in. */
export type GdsContrastMode = 'light' | 'dark';
/** UI text or focus-indicator role whose foreground/background pair is contrast-checked. */
export type GdsContrastRole =
  // Issue 585 widened this: the semantic pairs added for F22 are named per pair, and a
  // closed union could not express them — the same shape of limit that kept the semantic
  // roles out of the token graph.
  | (string & {})
  | 'page text'
  | 'surface text'
  | 'muted surface text'
  | 'control text'
  | 'link text'
  | 'focus indicator';

/** Severity of an accessibility finding: `'blocking'` fails the gate, `'warning'` is advisory. */
export type GdsAccessibilityFindingSeverity = 'blocking' | 'warning';

/**
 * A contrast problem found while statically auditing theme tokens: either a pair
 * that failed its minimum ratio (`'blocking'`) or a pair whose colors could not be
 * resolved statically and must be covered by runtime checks (`'warning'`).
 */
export interface GdsContrastFinding {
  /** Vibe/preset theme the pair belongs to. */
  themeId: GdsThemePresetId;
  /** Color scheme the pair was evaluated in. */
  mode: GdsContrastMode;
  /** UI role of the checked pair. */
  role: GdsContrastRole;
  /** Foreground color as authored in the theme. */
  foreground: string;
  /** Background color as authored in the theme. */
  background: string;
  /** Measured WCAG ratio; `0` when the colors could not be resolved statically. */
  ratio: number;
  /** Required minimum ratio for this role. */
  minimumRatio: number;
  /** `'blocking'` failed the ratio; `'warning'` could not be statically resolved. */
  severity: GdsAccessibilityFindingSeverity;
  /** Human-readable explanation. */
  message: string;
}

/** One resolved contrast measurement for a theme role/mode pair. */
export interface GdsContrastCheck {
  /** Vibe/preset theme the pair belongs to. */
  themeId: GdsThemePresetId;
  /** Color scheme the pair was evaluated in. */
  mode: GdsContrastMode;
  /** UI role of the checked pair. */
  role: GdsContrastRole;
  foreground: string;
  background: string;
  /** Measured WCAG contrast ratio. */
  ratio: number;
  /** Required minimum ratio for this role. */
  minimumRatio: number;
  /** `true` when `ratio >= minimumRatio`. */
  passes: boolean;
}

/** A forced-colors (Windows High Contrast) role mapped to the CSS system color it must adopt. */
export interface GdsForcedColorRole {
  /** Semantic UI role (e.g. `'page canvas'`, `'link text'`). */
  role: string;
  /** CSS system color keyword the role must map to (e.g. `'Canvas'`, `'LinkText'`). */
  cssSystemColor: string;
  /** Why this mapping is required. */
  reason: string;
}

/** Full static accessibility audit of every vibe theme across light and dark modes. */
export interface GdsThemeAccessibilityReport {
  /** ISO timestamp the report was generated (fixed epoch for deterministic snapshots). */
  checkedAt: string;
  /** Number of themes audited. */
  themeCount: number;
  /** Number of color schemes audited per theme (light + dark = 2). */
  modeCount: number;
  /** Count of blocking (failing) findings. */
  blockingCount: number;
  /** Count of advisory (unresolvable) findings. */
  warningCount: number;
  /** Every resolved contrast measurement. */
  checks: GdsContrastCheck[];
  /** Failing and unresolvable findings. */
  findings: GdsContrastFinding[];
  /** Forced-colors role → system-color mapping the design system guarantees. */
  forcedColorRoles: GdsForcedColorRole[];
  /** Runtime verification commands that static checks cannot replace. */
  recommendedRuntimeChecks: string[];
}

const MINIMUM_NORMAL_TEXT_RATIO = 4.5;
const MINIMUM_NON_TEXT_RATIO = 3;

const forcedColorRoles: GdsForcedColorRole[] = [
  { role: 'page canvas', cssSystemColor: 'Canvas', reason: 'User-selected forced-color canvas must replace decorative theme backgrounds.' },
  { role: 'body text', cssSystemColor: 'CanvasText', reason: 'Text must remain readable when brand palettes are suppressed.' },
  { role: 'interactive surface', cssSystemColor: 'ButtonFace', reason: 'Buttons, inputs, cards, and menu items need a visible platform-backed fill.' },
  { role: 'interactive text', cssSystemColor: 'ButtonText', reason: 'Interactive labels must inherit the user agent contrast pair.' },
  { role: 'link text', cssSystemColor: 'LinkText', reason: 'Links must preserve the user configured link affordance.' },
  { role: 'focus ring', cssSystemColor: 'Highlight', reason: 'Keyboard focus must be visible independent of theme hue.' },
  { role: 'selected text', cssSystemColor: 'HighlightText', reason: 'Selected and active controls need the platform highlighted-text pair.' },
  { role: 'disabled text', cssSystemColor: 'GrayText', reason: 'Disabled controls must expose a known forced-color disabled state.' },
  { role: 'mark background', cssSystemColor: 'Mark', reason: 'Search marks and highlights must not depend on decorative gradients.' },
  { role: 'mark text', cssSystemColor: 'MarkText', reason: 'Highlighted text must keep a platform-backed readable pair.' },
];

const recommendedRuntimeChecks = [
  'Run npm run verify:theme-accessibility after changing package theme tokens.',
  'Run npm run verify:accessibility-runtime against the docs site before publishing.',
  'Run npm run verify:forced-colors-runtime against the docs site before publishing.',
  'Validate light, dark, and forced-colors active modes before accepting partner themes.',
];

function checkRole(
  vibe: GdsVibeTheme,
  mode: GdsContrastMode,
  role: GdsContrastRole,
  foreground: string,
  background: string,
  minimumRatio = MINIMUM_NORMAL_TEXT_RATIO,
) {
  const fallbackBackground = mode === 'dark' ? vibe.canvasDark : vibe.canvasLight;
  const ratio = contrastRatio(foreground, background, fallbackBackground);

  if (ratio === null) {
    const finding: GdsContrastFinding = {
      themeId: vibe.id,
      mode,
      role,
      foreground,
      background,
      ratio: 0,
      minimumRatio,
      severity: 'warning',
      message: `Could not statically resolve ${role} colors for ${vibe.id} ${mode}. Keep this pair covered by runtime browser checks.`,
    };
    return {
      check: null,
      finding,
    };
  }

  const check: GdsContrastCheck = {
    themeId: vibe.id,
    mode,
    role,
    foreground,
    background,
    ratio,
    minimumRatio,
    passes: ratio >= minimumRatio,
  };

  return {
    check,
    finding: check.passes
      ? null
      : {
        themeId: vibe.id,
        mode,
        role,
        foreground,
        background,
        ratio,
        minimumRatio,
        severity: 'blocking' as const,
        message: `${vibe.id} ${mode} ${role} contrast is ${ratio}:1; expected at least ${minimumRatio}:1.`,
      },
  };
}

/**
 * Statically audits every vibe theme in light and dark modes, scoring each
 * governed text/focus role against its WCAG minimum ratio, and returns the full
 * report (checks, findings, forced-color mappings, recommended runtime checks).
 */
/**
 * Semantic role pairs scored against WCAG minimums (issue 585, finding F22).
 *
 * The atmosphere checks below score `vibe.textLight` against `vibe.canvasLight` — the
 * PALETTE fields. The values that actually paint a component are the derived `--gds-*`
 * semantic roles, and nothing scored them. That is why `--gds-text-body` could be set to
 * near-white on a light canvas and every contrast gate stayed green, and it is the same
 * blind spot that let issue 537 ship a 1.89:1 ChoiceChip.
 *
 * Every pair below was measured across all 25 presets in both schemes before being made
 * blocking: all 450 checks pass today, so this adds enforcement without changing any value.
 *
 * `--gds-border-card` on `--gds-bg-card` is deliberately NOT here. It measures below 3:1 in
 * 47 of 50 cells, but WCAG 1.4.11 governs user-interface components and meaningful
 * graphics — a decorative card boundary is neither. Enforcing 3:1 on it would invent a
 * requirement and produce 47 findings that are not violations, which is how a gate teaches
 * people to ignore it.
 */
const SEMANTIC_CONTRAST_PAIRS: { role: string; foreground: string; background: string; minimumRatio?: number }[] = [
  { role: 'semantic body text on page', foreground: '--gds-text-body', background: '--gds-bg-page' },
  { role: 'semantic body text on card', foreground: '--gds-text-body', background: '--gds-bg-card' },
  { role: 'semantic meta text on card', foreground: '--gds-text-meta', background: '--gds-bg-card' },
  { role: 'semantic primary text on surface', foreground: '--gds-text-primary', background: '--gds-bg-surface' },
  { role: 'semantic secondary text on card', foreground: '--gds-text-secondary', background: '--gds-bg-card' },
  { role: 'semantic text on inverse', foreground: '--gds-text-on-inverse', background: '--gds-bg-inverse' },
  { role: 'semantic text on support', foreground: '--gds-text-on-support', background: '--gds-support' },
  { role: 'semantic inactive nav on inverse', foreground: '--gds-nav-inactiveOnInverse', background: '--gds-bg-inverse' },
  { role: 'semantic focus ring on page', foreground: '--gds-focus-ring', background: '--gds-bg-page', minimumRatio: MINIMUM_NON_TEXT_RATIO },
];

export function createGdsThemeAccessibilityReport(): GdsThemeAccessibilityReport {
  const checks: GdsContrastCheck[] = [];
  const findings: GdsContrastFinding[] = [];

  for (const vibe of getGdsVibeThemes()) {
    for (const mode of ['light', 'dark'] satisfies GdsContrastMode[]) {
      const dark = mode === 'dark';
      const canvas = dark ? vibe.canvasDark : vibe.canvasLight;
      const surface = dark ? vibe.surfaceDark : vibe.surfaceLight;
      const shell = dark ? vibe.shellDark : vibe.shellLight;
      const text = dark ? vibe.textDark : vibe.textLight;
      const muted = dark ? vibe.mutedDark : vibe.mutedLight;
      const link = dark
        ? mixCssColors(vibe.accent, text, 0.56, canvas)
        : mixCssColors(vibe.primary, text, 0.56, canvas);

      const roleChecks: ReturnType<typeof checkRole>[] = [
        checkRole(vibe, mode, 'page text', text, canvas),
        checkRole(vibe, mode, 'surface text', text, surface),
        checkRole(vibe, mode, 'muted surface text', muted, surface),
        checkRole(vibe, mode, 'control text', text, shell),
        checkRole(vibe, mode, 'link text', link, canvas),
        checkRole(vibe, mode, 'focus indicator', text, canvas, MINIMUM_NON_TEXT_RATIO),
      ];

      // Issue 585 / F22: score the roles that actually paint components, not only the
      // atmosphere palette they were derived from.
      const resolved = getGdsVibeThemeCssVariables(vibe.id, mode);
      for (const pair of SEMANTIC_CONTRAST_PAIRS) {
        const foreground = resolved[pair.foreground];
        const background = resolved[pair.background];
        // A missing role is a real problem, not a reason to skip: it means the pair this
        // gate claims to cover is not being covered at all.
        if (!foreground || !background) {
          findings.push({
            themeId: vibe.id,
            mode,
            role: pair.role as GdsContrastRole,
            foreground: foreground ?? pair.foreground,
            background: background ?? pair.background,
            ratio: 0,
            minimumRatio: pair.minimumRatio ?? MINIMUM_NORMAL_TEXT_RATIO,
            severity: 'blocking',
            message: `${vibe.id} ${mode} does not emit ${!foreground ? pair.foreground : pair.background}, so ${pair.role} cannot be verified.`,
          });
          continue;
        }
        roleChecks.push(checkRole(vibe, mode, pair.role as GdsContrastRole, foreground, background, pair.minimumRatio));
      }

      for (const result of roleChecks) {
        if (result.check) {
          checks.push(result.check);
        }
        if (result.finding) {
          findings.push(result.finding);
        }
      }
    }
  }

  return {
    checkedAt: new Date(0).toISOString(),
    themeCount: getGdsVibeThemes().length,
    modeCount: 2,
    blockingCount: findings.filter((finding) => finding.severity === 'blocking').length,
    warningCount: findings.filter((finding) => finding.severity === 'warning').length,
    checks,
    findings,
    forcedColorRoles,
    recommendedRuntimeChecks,
  };
}

/** Runs the accessibility report and returns `{ ok, report }`, where `ok` is `true` when there are no blocking findings. */
export function validateGdsThemeAccessibility() {
  const report = createGdsThemeAccessibilityReport();

  return {
    ok: report.blockingCount === 0,
    report,
  };
}
