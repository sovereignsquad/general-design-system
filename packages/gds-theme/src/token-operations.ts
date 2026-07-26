import type { GdsThemePresetId } from './theme-presets';
import { getGdsVibeThemes, type GdsVibeTheme } from './vibe-themes';

/** Severity of a token validation finding. */
export type GdsTokenSeverity = 'error' | 'warning';
/** Kind of change recorded for a token between two graphs. */
export type GdsTokenDiffChangeType = 'added' | 'removed' | 'changed';

/** A single token in the design-system token graph. */
export interface GdsTokenNode {
  /** Fully-qualified token id (`themeId.role`). */
  id: string;
  /** Preset theme this token belongs to. */
  themeId: GdsThemePresetId;
  /** Semantic role the token fills. */
  role:
    | 'primary'
    | 'accent'
    | 'glow'
    | 'canvas-light'
    | 'canvas-dark'
    | 'shell-light'
    | 'shell-dark'
    | 'surface-light'
    | 'surface-dark'
    | 'border-light'
    | 'border-dark'
    | 'text-light'
    | 'text-dark'
    | 'muted-light'
    | 'muted-dark'
    | 'gradient'
    | 'hero';
  /** CSS color or effect value. */
  value: string;
  /** Whether the value is a plain color or a composite effect (gradient/hero). */
  category: 'color' | 'effect';
  /** Which color scheme the value applies to. */
  mode: 'light' | 'dark' | 'shared';
}

/** A snapshot of every theme's tokens: the canonical structure validated and diffed by GDS CI. */
export interface GdsTokenGraph {
  /** ISO timestamp the graph was generated. */
  generatedAt: string;
  /** Number of themes represented. */
  themeCount: number;
  /** Total number of token nodes. */
  tokenCount: number;
  /** Ids of the themes included. */
  themes: GdsThemePresetId[];
  /** Every token node in the graph. */
  nodes: GdsTokenNode[];
}

/** A problem found while validating a token graph. */
export interface GdsTokenValidationFinding {
  severity: GdsTokenSeverity;
  /** Which validation rule was violated. */
  rule:
    | 'token.invalid-color'
    | 'token.missing-dark-pair'
    | 'token.missing-light-pair'
    | 'token.duplicate-id'
    | 'token.unknown-role';
  /** Id (or role pair key) the finding concerns. */
  tokenId: string;
  /** Human-readable explanation. */
  message: string;
}

/** Result of validating a token graph. */
export interface GdsTokenValidationReport {
  /** The graph that was validated. */
  graph: GdsTokenGraph;
  /** All findings (errors and warnings). */
  findings: GdsTokenValidationFinding[];
  /** Number of error-severity findings. */
  errorCount: number;
  /** Number of warning-severity findings. */
  warningCount: number;
  /** `true` when there are no errors. */
  ok: boolean;
}

/** One token-level change between two graphs. */
export interface GdsTokenDiffEntry {
  type: GdsTokenDiffChangeType;
  tokenId: string;
  /** Prior value (absent for `added`). */
  before?: string;
  /** New value (absent for `removed`). */
  after?: string;
}

/** Result of diffing two token graphs. */
export interface GdsTokenDiffReport {
  /** ISO timestamp the diff was computed. */
  comparedAt: string;
  /** Token count of the "before" graph. */
  beforeTokenCount: number;
  /** Token count of the "after" graph. */
  afterTokenCount: number;
  /** Number of changed/added/removed tokens. */
  changedCount: number;
  /** The individual change entries, sorted by token id. */
  entries: GdsTokenDiffEntry[];
}

/** A single foreground/background surface pairing derived for a theme, with a compatibility verdict. */
export interface GdsThemeCompatibilitySurface {
  /** Which UI surface the pairing represents. */
  surface: 'page' | 'shell' | 'card' | 'border' | 'primary-action' | 'muted-copy';
  mode: 'light' | 'dark';
  foreground: string;
  background: string;
  /** `'needs-review'` when a required token was missing; otherwise `'compatible'`. */
  status: 'compatible' | 'needs-review';
}

/** Per-theme compatibility result: all derived surface pairings for one theme. */
export interface GdsThemeCompatibilityResult {
  themeId: GdsThemePresetId;
  surfaces: GdsThemeCompatibilitySurface[];
}

/** Aggregate compatibility report across every theme in a token graph. */
export interface GdsThemeCompatibilityReport {
  /** ISO timestamp the report was generated. */
  checkedAt: string;
  /** Number of themes checked. */
  themeCount: number;
  /** How many themes had every surface `'compatible'`. */
  compatibleThemeCount: number;
  /** Per-theme results. */
  themes: GdsThemeCompatibilityResult[];
}

type GdsCompatibilitySurfaceBase = Omit<GdsThemeCompatibilitySurface, 'status'>;

const COLOR_ROLES = new Set([
  'primary',
  'accent',
  'glow',
  'canvas-light',
  'canvas-dark',
  'shell-light',
  'shell-dark',
  'surface-light',
  'surface-dark',
  'border-light',
  'border-dark',
  'text-light',
  'text-dark',
  'muted-light',
  'muted-dark',
]);
const MODE_PAIRED_BASE_ROLES = new Set(['canvas', 'shell', 'surface', 'border', 'text', 'muted']);

const COLOR_PATTERN = /^(#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]*\)|hsla?\([^)]*\))$/;

function createThemeNodes(theme: GdsVibeTheme): GdsTokenNode[] {
  return [
    { id: `${theme.id}.primary`, themeId: theme.id, role: 'primary', value: theme.primary, category: 'color', mode: 'shared' },
    { id: `${theme.id}.accent`, themeId: theme.id, role: 'accent', value: theme.accent, category: 'color', mode: 'shared' },
    { id: `${theme.id}.glow`, themeId: theme.id, role: 'glow', value: theme.glow, category: 'color', mode: 'shared' },
    { id: `${theme.id}.canvas-light`, themeId: theme.id, role: 'canvas-light', value: theme.canvasLight, category: 'color', mode: 'light' },
    { id: `${theme.id}.canvas-dark`, themeId: theme.id, role: 'canvas-dark', value: theme.canvasDark, category: 'color', mode: 'dark' },
    { id: `${theme.id}.shell-light`, themeId: theme.id, role: 'shell-light', value: theme.shellLight, category: 'color', mode: 'light' },
    { id: `${theme.id}.shell-dark`, themeId: theme.id, role: 'shell-dark', value: theme.shellDark, category: 'color', mode: 'dark' },
    { id: `${theme.id}.surface-light`, themeId: theme.id, role: 'surface-light', value: theme.surfaceLight, category: 'color', mode: 'light' },
    { id: `${theme.id}.surface-dark`, themeId: theme.id, role: 'surface-dark', value: theme.surfaceDark, category: 'color', mode: 'dark' },
    { id: `${theme.id}.border-light`, themeId: theme.id, role: 'border-light', value: theme.borderLight, category: 'color', mode: 'light' },
    { id: `${theme.id}.border-dark`, themeId: theme.id, role: 'border-dark', value: theme.borderDark, category: 'color', mode: 'dark' },
    { id: `${theme.id}.text-light`, themeId: theme.id, role: 'text-light', value: theme.textLight, category: 'color', mode: 'light' },
    { id: `${theme.id}.text-dark`, themeId: theme.id, role: 'text-dark', value: theme.textDark, category: 'color', mode: 'dark' },
    { id: `${theme.id}.muted-light`, themeId: theme.id, role: 'muted-light', value: theme.mutedLight, category: 'color', mode: 'light' },
    { id: `${theme.id}.muted-dark`, themeId: theme.id, role: 'muted-dark', value: theme.mutedDark, category: 'color', mode: 'dark' },
    { id: `${theme.id}.gradient`, themeId: theme.id, role: 'gradient', value: theme.gradient, category: 'effect', mode: 'shared' },
    { id: `${theme.id}.hero`, themeId: theme.id, role: 'hero', value: theme.hero, category: 'effect', mode: 'shared' },
  ];
}

/** Builds the token graph for every vibe theme (primary/accent/glow, canvas/shell/surface/border/text/muted light+dark, gradient, hero). */
export function createGdsTokenGraph(): GdsTokenGraph {
  const themes = getGdsVibeThemes();
  const nodes = themes.flatMap(createThemeNodes);

  return {
    generatedAt: new Date().toISOString(),
    themeCount: themes.length,
    tokenCount: nodes.length,
    themes: themes.map((theme) => theme.id),
    nodes,
  };
}

/**
 * Validates a token graph and returns a report. Flags duplicate ids and
 * unparseable colors as errors, non-standard color roles as warnings, and any
 * mode-paired role missing its light or dark counterpart as an error.
 */
export function validateGdsTokenGraph(graph: GdsTokenGraph = createGdsTokenGraph()): GdsTokenValidationReport {
  const findings: GdsTokenValidationFinding[] = [];
  const seen = new Set<string>();
  const rolePairs = new Map<string, Set<string>>();

  for (const node of graph.nodes) {
    if (seen.has(node.id)) {
      findings.push({
        severity: 'error',
        rule: 'token.duplicate-id',
        tokenId: node.id,
        message: `Token id "${node.id}" is duplicated in the graph.`,
      });
    }
    seen.add(node.id);

    if (!COLOR_ROLES.has(node.role) && node.category === 'color') {
      findings.push({
        severity: 'warning',
        rule: 'token.unknown-role',
        tokenId: node.id,
        message: `Token "${node.id}" uses a non-standard color role.`,
      });
    }

    if (node.category === 'color' && !COLOR_PATTERN.test(node.value.trim())) {
      findings.push({
        severity: 'error',
        rule: 'token.invalid-color',
        tokenId: node.id,
        message: `Token "${node.id}" must resolve to a static CSS color, but received "${node.value}".`,
      });
    }

    const pairKey = `${node.themeId}:${node.role.replace(/-(light|dark)$/, '')}`;
    const pairSet = rolePairs.get(pairKey) ?? new Set<string>();
    pairSet.add(node.mode);
    rolePairs.set(pairKey, pairSet);
  }

  for (const [pairKey, pairSet] of rolePairs) {
    const [, baseRole] = pairKey.split(':');
    if (!MODE_PAIRED_BASE_ROLES.has(baseRole)) {
      continue;
    }
    if (!pairSet.has('light')) {
      findings.push({
        severity: 'error',
        rule: 'token.missing-light-pair',
        tokenId: pairKey,
        message: `Token pair "${pairKey}" is missing its light-mode value.`,
      });
    }
    if (!pairSet.has('dark')) {
      findings.push({
        severity: 'error',
        rule: 'token.missing-dark-pair',
        tokenId: pairKey,
        message: `Token pair "${pairKey}" is missing its dark-mode value.`,
      });
    }
  }

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  const warningCount = findings.length - errorCount;

  return {
    graph,
    findings,
    errorCount,
    warningCount,
    ok: errorCount === 0,
  };
}

function createNodeMap(graph: GdsTokenGraph) {
  return new Map(graph.nodes.map((node) => [node.id, node.value]));
}

/** Diffs two token graphs by id and reports each added, removed, or changed token value. */
export function createGdsTokenDiff(before: GdsTokenGraph, after: GdsTokenGraph = createGdsTokenGraph()): GdsTokenDiffReport {
  const beforeMap = createNodeMap(before);
  const afterMap = createNodeMap(after);
  const tokenIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const entries: GdsTokenDiffEntry[] = [];

  for (const tokenId of [...tokenIds].sort()) {
    const beforeValue = beforeMap.get(tokenId);
    const afterValue = afterMap.get(tokenId);

    if (beforeValue == null && afterValue != null) {
      entries.push({ type: 'added', tokenId, after: afterValue });
      continue;
    }
    if (beforeValue != null && afterValue == null) {
      entries.push({ type: 'removed', tokenId, before: beforeValue });
      continue;
    }
    if (beforeValue !== afterValue) {
      entries.push({ type: 'changed', tokenId, before: beforeValue, after: afterValue });
    }
  }

  return {
    comparedAt: new Date().toISOString(),
    beforeTokenCount: before.tokenCount,
    afterTokenCount: after.tokenCount,
    changedCount: entries.length,
    entries,
  };
}

/**
 * Derives the standard foreground/background surface pairings (page, shell,
 * card, border, primary-action, muted-copy in both modes) for every theme in the
 * graph, marking any pairing that references a missing token as `'needs-review'`.
 */
export function createGdsThemeCompatibilityReport(graph: GdsTokenGraph = createGdsTokenGraph()): GdsThemeCompatibilityReport {
  const themeMap = new Map<GdsThemePresetId, GdsTokenNode[]>();
  for (const node of graph.nodes) {
    const nodes = themeMap.get(node.themeId) ?? [];
    nodes.push(node);
    themeMap.set(node.themeId, nodes);
  }

  const themes: GdsThemeCompatibilityResult[] = [...themeMap.entries()].map(([themeId, nodes]) => {
    const get = (role: GdsTokenNode['role']) => nodes.find((node) => node.role === role)?.value ?? 'missing';
    const surfaceDefinitions: GdsCompatibilitySurfaceBase[] = [
      { surface: 'page', mode: 'light', foreground: get('text-light'), background: get('canvas-light') },
      { surface: 'page', mode: 'dark', foreground: get('text-dark'), background: get('canvas-dark') },
      { surface: 'shell', mode: 'light', foreground: get('text-light'), background: get('shell-light') },
      { surface: 'shell', mode: 'dark', foreground: get('text-dark'), background: get('shell-dark') },
      { surface: 'card', mode: 'light', foreground: get('text-light'), background: get('surface-light') },
      { surface: 'card', mode: 'dark', foreground: get('text-dark'), background: get('surface-dark') },
      { surface: 'border', mode: 'light', foreground: get('border-light'), background: get('surface-light') },
      { surface: 'border', mode: 'dark', foreground: get('border-dark'), background: get('surface-dark') },
      { surface: 'primary-action', mode: 'light', foreground: get('canvas-light'), background: get('primary') },
      { surface: 'primary-action', mode: 'dark', foreground: get('canvas-dark'), background: get('primary') },
      { surface: 'muted-copy', mode: 'light', foreground: get('muted-light'), background: get('surface-light') },
      { surface: 'muted-copy', mode: 'dark', foreground: get('muted-dark'), background: get('surface-dark') },
    ];

    const surfaces: GdsThemeCompatibilitySurface[] = surfaceDefinitions.map((surface) => ({
      ...surface,
      status: [surface.foreground, surface.background].includes('missing') ? 'needs-review' : 'compatible',
    }));

    return { themeId, surfaces };
  });

  return {
    checkedAt: new Date().toISOString(),
    themeCount: themes.length,
    compatibleThemeCount: themes.filter((theme) => theme.surfaces.every((surface) => surface.status === 'compatible')).length,
    themes,
  };
}
