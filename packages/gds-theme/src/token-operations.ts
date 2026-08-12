import type { GdsThemePresetId } from './theme-presets';
import { getGdsVibeThemes, getGdsVibeThemeCssVariables, type GdsVibeTheme } from './vibe-themes';

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
  /**
   * Semantic role the token fills.
   *
   * Issue 585 widened this from a closed 17-member union to a string. The union WAS the
   * mechanism of finding F12: the graph could not express a role it did not already name,
   * so the 34 semantic roles that actually paint components had nowhere to go and the
   * published token graph described a different, smaller system than the one GDS ships.
   * The 17 atmosphere roles below remain, unchanged, as the vibe-palette lane.
   */
  role:
    | (string & {})
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
  /** CSS color or effect value. For a `paired` node this is the LIGHT value. */
  value: string;
  /**
   * What kind of value this is.
   *
   * Issue 555 added `dimension`. The graph previously assumed every semantic token was a
   * colour, which held only while the theme could express nothing but colour — the exact
   * limitation the axis mechanism removes. A radius validated as a colour fails as one.
   */
  category: 'color' | 'effect' | 'dimension' | 'keyword' | 'number' | 'duration';
  /**
   * Which color scheme the value applies to.
   *
   * `paired` (issue 585) carries both schemes in {@link GdsTokenNode.scheme} rather than
   * encoding the scheme in the role name. A consumer can then tell which value applies in
   * dark mode without parsing a `-dark` suffix, which was goal 3 of that issue.
   */
  mode: 'light' | 'dark' | 'shared' | 'paired';
  /** Both scheme values, present only when `mode` is `paired`. */
  scheme?: { light: string; dark: string };
  /** Semantic lane: `atmosphere` is the vibe palette, `semantic` the roles that paint components. */
  lane?: 'atmosphere' | 'semantic';
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

/**
 * The semantic roles a preset resolves, as `paired` nodes carrying both schemes.
 *
 * Issue 585 / finding F12. The graph published 17 atmosphere roles while the tokens that
 * actually paint components numbered 34, and the overlap was exactly one (`accent`). A
 * design tool importing the graph received background colours and none of the roles that
 * determine what a component looks like.
 *
 * Read from `getGdsVibeThemeCssVariables` — the SAME resolver the runtime applies to the
 * document. A parallel traversal here would reintroduce precisely the dual-source failure
 * that caused the 5.0.1 dark-mode defect and that issue 554 removed from this package.
 */
/**
 * Classifies a resolved token value.
 *
 * Deliberately conservative: anything that is not recognisably a colour or a length is an
 * `effect`, never a guessed colour. Mis-typing a token as a colour makes the validator
 * demand a colour and report a false error; mis-typing a colour as an effect makes it skip a
 * real one. `effect` is the safer default because it is the one that does not fabricate a
 * finding.
 */
function inferNodeCategory(role: string): GdsTokenNode['category'] {
  // Issue 555. A first cut classified by VALUE, and it silently weakened the gate: any
  // unparseable string became an 'effect' and escaped colour validation entirely, so
  // `--gds-support: not-a-resolvable-color` stopped being an error. The gate mutation suite
  // caught it as a SURVIVED mutant. Classifying by role name keeps the value as the thing
  // being judged rather than the thing doing the judging.
  // Issue 556 extended this. Each axis owns a token prefix, so the prefix is the category —
  // and a new axis must be added HERE, which is the intended coupling: a token whose category
  // nobody declared would be validated as a colour and fail as one, loudly, rather than
  // shipping unvalidated.
  if (/^(radius|space|control-height|font-size)-/.test(role)) return 'dimension';
  if (/^focus-ring-(width|offset)$/.test(role)) return 'dimension';
  if (/^reaction-\w+-lift$/.test(role)) return 'dimension';
  if (/^(weight|line-height)-/.test(role)) return 'number';
  if (/^reaction-\w+-scale$/.test(role)) return 'number';
  if (/^(density|font-lane-|tracking-)/.test(role)) return 'keyword';
  if (/^focus-ring-style$/.test(role) || /^transition-scope$/.test(role)) return 'keyword';
  if (/^reaction-(hover|active|pressed)$/.test(role)) return 'keyword';
  if (/^motion-policy$/.test(role)) return 'keyword';
  if (/^focus-ring-color$/.test(role)) return 'effect';
  if (/^motion-duration-/.test(role)) return 'duration';
  if (/^motion-ease-/.test(role)) return 'effect';
  if (/^accent-\w+-(base|deep|deeper|deepest|on)$/.test(role)) return 'color';
  if (/^elevation-/.test(role)) return 'effect';
  return 'color';
}

function createSemanticNodes(theme: GdsVibeTheme): GdsTokenNode[] {
  const light = getGdsVibeThemeCssVariables(theme.id, 'light');
  const dark = getGdsVibeThemeCssVariables(theme.id, 'dark');

  return Object.keys(light)
    // `--gds-vibe-*` is the atmosphere lane, already published by createThemeNodes; a
    // `-dark` name is not an independent role, since the dark resolution collapses it onto
    // its base name — taking both would double-count every role.
    .filter((property) => !property.startsWith('--gds-vibe-') && !property.endsWith('-dark'))
    .sort()
    .map((property) => {
      const role = property.replace(/^--gds-/, '');
      return {
        // Namespaced by lane: `accent` exists in both the atmosphere palette and the
        // semantic set with DIFFERENT values (the atmosphere one is the raw preset hue,
        // the semantic one is contrast-adjusted). That single collision is exactly the
        // "overlap is exactly one" F12 measured, and it must not silently merge.
        id: `${theme.id}.semantic.${role}`,
        themeId: theme.id,
        role,
        value: light[property],
        category: inferNodeCategory(role),
        mode: 'paired' as const,
        scheme: { light: light[property], dark: dark[property] ?? light[property] },
        lane: 'semantic' as const,
      };
    });
}

/** Builds the token graph for every vibe theme: the 17 atmosphere roles plus every semantic role the preset resolves (issue 585). */
export function createGdsTokenGraph(): GdsTokenGraph {
  const themes = getGdsVibeThemes();
  const nodes = themes.flatMap((theme) => [
    ...createThemeNodes(theme).map((node) => ({ ...node, lane: 'atmosphere' as const })),
    ...createSemanticNodes(theme),
  ]);

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

    // Issue 585: COLOR_ROLES enumerates the 17 ATMOSPHERE roles. Applying it to the
    // semantic lane would warn on all 850 legitimate semantic tokens — 825 warnings that
    // say nothing, which is how a real warning gets missed.
    if (node.lane !== 'semantic' && !COLOR_ROLES.has(node.role) && node.category === 'color') {
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

    if (node.mode === 'paired') {
      // The whole point of the paired shape is that a consumer gets a dark value without
      // parsing a name. A missing or unparseable one is an error, not a shrug.
      for (const scheme of ['light', 'dark'] as const) {
        const value = node.scheme?.[scheme];
        if (!value) {
          findings.push({
            severity: 'error',
            rule: scheme === 'dark' ? 'token.missing-dark-pair' : 'token.missing-light-pair',
            tokenId: node.id,
            message: `Paired token "${node.id}" is missing its ${scheme}-mode value.`,
          });
        } else if (node.category === 'color' && !COLOR_PATTERN.test(value.trim())) {
          findings.push({
            severity: 'error',
            rule: 'token.invalid-color',
            tokenId: node.id,
            message: `Paired token "${node.id}" must resolve to a static CSS color in ${scheme} mode, but received "${value}".`,
          });
        }
      }
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
