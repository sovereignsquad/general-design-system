import type { GdsThemePresetId } from './theme-presets';
import { getGdsVibeThemes, type GdsVibeTheme } from './vibe-themes';

/** Color scheme a contrast check is evaluated in. */
export type GdsContrastMode = 'light' | 'dark';
/** UI text or focus-indicator role whose foreground/background pair is contrast-checked. */
export type GdsContrastRole =
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

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
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

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

function parseCssColor(value: string): RgbColor | null {
  const input = value.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input);
  if (hex) {
    const raw = hex[1];
    const expanded = raw.length === 3
      ? raw.split('').map((char) => `${char}${char}`).join('')
      : raw;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    const a = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(input);
  if (!rgb) {
    return null;
  }

  const parts = rgb[1].split(',').map((part) => part.trim());
  if (parts.length < 3) {
    return null;
  }

  const [r, g, b] = parts.slice(0, 3).map((part) => {
    if (part.endsWith('%')) {
      return clampChannel((Number(part.slice(0, -1)) / 100) * 255);
    }
    return clampChannel(Number(part));
  });
  const a = parts[3] === undefined ? 1 : Math.max(0, Math.min(1, Number(parts[3])));

  if ([r, g, b, a].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { r, g, b, a };
}

function blend(foreground: RgbColor, background: RgbColor): RgbColor {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) {
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  return {
    r: ((foreground.r * foreground.a) + (background.r * background.a * (1 - foreground.a))) / alpha,
    g: ((foreground.g * foreground.a) + (background.g * background.a * (1 - foreground.a))) / alpha,
    b: ((foreground.b * foreground.a) + (background.b * background.a * (1 - foreground.a))) / alpha,
    a: alpha,
  };
}

function resolveOpaque(color: string, fallback: string) {
  const parsed = parseCssColor(color);
  const parsedFallback = parseCssColor(fallback);

  if (!parsed || !parsedFallback) {
    return null;
  }

  return parsed.a < 1 ? blend(parsed, parsedFallback) : parsed;
}

function toRgbString(color: RgbColor) {
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}

function mixCssColors(first: string, second: string, firstWeight: number, fallbackBackground: string) {
  const firstColor = resolveOpaque(first, fallbackBackground);
  const secondColor = resolveOpaque(second, fallbackBackground);

  if (!firstColor || !secondColor) {
    return first;
  }

  const secondWeight = 1 - firstWeight;
  return toRgbString({
    r: (firstColor.r * firstWeight) + (secondColor.r * secondWeight),
    g: (firstColor.g * firstWeight) + (secondColor.g * secondWeight),
    b: (firstColor.b * firstWeight) + (secondColor.b * secondWeight),
    a: 1,
  });
}

function linearize(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: RgbColor) {
  return (0.2126 * linearize(color.r)) + (0.7152 * linearize(color.g)) + (0.0722 * linearize(color.b));
}

function contrastRatio(foreground: string, background: string, fallbackBackground: string) {
  const foregroundColor = resolveOpaque(foreground, fallbackBackground);
  const backgroundColor = resolveOpaque(background, fallbackBackground);

  if (!foregroundColor || !backgroundColor) {
    return null;
  }

  const light = Math.max(luminance(foregroundColor), luminance(backgroundColor));
  const dark = Math.min(luminance(foregroundColor), luminance(backgroundColor));
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}

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

      const roleChecks = [
        checkRole(vibe, mode, 'page text', text, canvas),
        checkRole(vibe, mode, 'surface text', text, surface),
        checkRole(vibe, mode, 'muted surface text', muted, surface),
        checkRole(vibe, mode, 'control text', text, shell),
        checkRole(vibe, mode, 'link text', link, canvas),
        checkRole(vibe, mode, 'focus indicator', text, canvas, MINIMUM_NON_TEXT_RATIO),
      ];

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
