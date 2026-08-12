import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGdsTokenGraph } from '../packages/gds-theme/dist/index.mjs';

// W3C DTCG token export (issue #452).
//
// The code tokens stay authoritative: this transforms the graph produced by
// `createGdsTokenGraph()` (the same source the theme-token contract and the
// `gds-theme-tokens` CLI use) into a W3C Design Tokens Community Group (DTCG)
// document that Figma variables, Style Dictionary v4, and other platform
// tooling can consume. It is generated, never hand-edited — `--check` fails the
// release if the committed artifact drifts from the source tokens.
//
// Output is fully deterministic (no timestamps, stable key ordering) so the CI
// regeneration check is stable.

const root = process.cwd();
const outputPath = resolve(root, 'tokens/gds.tokens.json');
const GDS_EXT = 'com.sovereignsquad.gds';

// Color-category tokens map to the strict DTCG `color` type. Effect-category
// tokens (CSS gradients/hero backgrounds) are composite CSS values with no
// strict DTCG color representation, so they carry a GDS-namespaced custom type
// and the raw CSS string — conformant tooling that only understands `color`
// skips them; nothing is lost.
const CSS_GRADIENT_TYPE = `${GDS_EXT}.cssGradient`;
// `env(safe-area-inset-*)` is an environment function, not a static dimension. DTCG has no
// type for it, and publishing it as `dimension` would be worse than omitting it — a
// consuming tool would act on a value it cannot resolve. Same escape hatch as gradients.
const CSS_ENV_TYPE = `${GDS_EXT}.cssEnv`;
// A value built from `color-mix()` or `var()` references resolves only in a browser, against
// whatever the referenced tokens hold at that moment. It is a real published token, but it is
// not a static DTCG color and calling it one would hand a consuming tool a string it cannot
// parse while telling it the string is a colour.
const CSS_COMPUTED_TYPE = `${GDS_EXT}.cssComputed`;
// A mode keyword (`comfortable`) is not a colour, a length or a duration. DTCG has no type
// for "one of a closed set of names", and calling it a string would tell a design tool it can
// be edited freely when it cannot.
const CSS_KEYWORD_TYPE = `${GDS_EXT}.cssKeyword`;
// DTCG's own `shadow` type is a structured object (offsetX/offsetY/blur/spread/color). GDS
// publishes the raw CSS string, which supports multi-layer shadows the structured form
// cannot express, so it carries a namespaced type rather than claiming conformance.
const CSS_SHADOW_TYPE = `${GDS_EXT}.cssShadow`;

/**
 * DTCG type for a value, or a thrown error.
 *
 * Issue 585 is explicit that a duration published as `$type: "color"` is worse than an
 * omission, because a consuming tool acts on it. So an unclassifiable value fails
 * generation; it is never given a plausible type.
 */
function inferDtcgType(id, value) {
  const v = String(value).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v) || /^(rgba?|hsla?)\([^)]*\)$/.test(v)) return 'color';
  if (/^0$/.test(v)) return 'dimension';
  if (/^-?[\d.]+(px|rem|em)$/.test(v)) return 'dimension';
  if (/^-?[\d.]+m?s$/.test(v)) return 'duration';
  if (/^(cubic-bezier\([^)]*\)|linear|ease|ease-in|ease-out|ease-in-out|steps\([^)]*\))$/.test(v)) return 'cubicBezier';
  if (/gradient\(/.test(v)) return CSS_GRADIENT_TYPE;
  if (/^env\(/.test(v)) return CSS_ENV_TYPE;
  // Any calc() is computed, whether or not it references a var(). DTCG's `dimension` expects
  // a resolvable value, and a derived modular-scale step like calc(1rem * 1.4238) is no more
  // a static dimension than calc(0.5rem * var(--mantine-scale)) is.
  if (/^calc\(|var\(|color-mix\(/.test(v)) return CSS_COMPUTED_TYPE;
  if (/^(transparent|none|currentColor)$/.test(v)) return 'color';
  if (/^(compact|comfortable|spacious)$/.test(v)) return CSS_KEYWORD_TYPE;
  // A box-shadow list. DTCG's `shadow` type is a structured object; GDS publishes the raw
  // CSS string, so it carries the namespaced type rather than claiming conformance it does
  // not have — same decision as gradients.
  // A length plus a colour, with the gradient case already returned above: that is a shadow
  // list. A first attempt anchored on the leading offset and missed every value starting with
  // a bare `0` — which is most of them.
  if (/\d(px|rem|em)/.test(v) && /(rgba?\(|#[0-9a-fA-F]{3,8})/.test(v)) return CSS_SHADOW_TYPE;
  // A unitless number: font weights (400) and line heights (1.55).
  if (/^\d+(\.\d+)?$/.test(v)) return 'number';
  // A registered font-lane id.
  if (/^[a-z][a-z0-9-]*$/.test(v)) return CSS_KEYWORD_TYPE;
  throw new Error(`Cannot infer DTCG type for ${id}: "${v}". Add an explicit rule rather than shipping a guessed $type.`);
}

/**
 * Theme-invariant `--gds-*` tokens declared once in `:root`.
 *
 * These render identically under every preset, so they have no place in a per-theme group,
 * but they are published tokens a design tool needs (motion durations and easings, overlay
 * scrims, safe-area insets, tour geometry).
 *
 * Only PLAIN top-level `:root` declarations are taken. The same tokens are re-declared
 * under `@media (prefers-reduced-motion)` as `0ms`/`linear` and under forced-colors as
 * `transparent`; publishing one of those overrides as the token's value would be a
 * straightforward lie about what the system renders by default.
 */
function readRootGlobals(cssPath) {
  const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const found = new Map();
  const stack = [];
  let buffer = '';
  for (const ch of css) {
    if (ch === '{') { stack.push(buffer.trim()); buffer = ''; }
    else if (ch === '}') { stack.pop(); buffer = ''; }
    else if (ch === ';') {
      const m = /^(--gds-[a-zA-Z0-9-]+)\s*:\s*(.+)$/.exec(buffer.trim());
      if (m && stack.length && stack[stack.length - 1] === ':root' && !stack.some((sel) => sel.startsWith('@'))) {
        if (!found.has(m[1])) found.set(m[1], m[2].trim());
      }
      buffer = '';
    } else buffer += ch;
  }
  return found;
}

function buildDtcgDocument() {
  const graph = createGdsTokenGraph();

  // Group nodes by theme, preserving a stable theme order (graph.themes) and a
  // stable role order (first-seen within the deterministic node list).
  const byTheme = new Map();
  for (const themeId of graph.themes) {
    byTheme.set(themeId, {});
  }
  for (const node of graph.nodes) {
    const group = byTheme.get(node.themeId) ?? {};
    const isColor = node.category === 'color';

    if (node.lane === 'semantic') {
      // Semantic roles live in their own group per theme. They are NOT merged in beside the
      // atmosphere roles because `accent` exists in both with different values — the single
      // overlap finding F12 measured — and merging would silently drop one of them.
      const semantic = group.semantic ?? {
        $description:
          'Semantic role tokens: the values that actually paint GDS components. '
          + 'Each carries both scheme values under $extensions; $value is the light one.',
      };
      semantic[node.role] = {
        $type: inferDtcgType(node.id, node.scheme.light),
        // Light stays in $value so a tool that ignores $extensions still receives something
        // correct rather than nothing.
        $value: node.scheme.light,
        $description: `${node.themeId} semantic role "${node.role}" — the value GDS components render for this role.`,
        $extensions: {
          [GDS_EXT]: { role: node.role, lane: 'semantic', scheme: node.scheme },
        },
      };
      group.semantic = semantic;
      byTheme.set(node.themeId, group);
      continue;
    }

    group[node.role] = {
      $type: isColor ? 'color' : CSS_GRADIENT_TYPE,
      $value: node.value,
      $description: `${node.themeId} ${node.role} (${node.mode} mode)`,
      $extensions: {
        [GDS_EXT]: {
          role: node.role,
          mode: node.mode,
          category: node.category,
          lane: 'atmosphere',
          ...(isColor ? {} : { cssComposite: true }),
        },
      },
    };
    byTheme.set(node.themeId, group);
  }

  // Theme-invariant tokens, published once rather than repeated per preset.
  const globals = {};
  const perThemeRoles = new Set(graph.nodes.map((node) => `--gds-${node.role}`));
  for (const [property, value] of [...readRootGlobals(resolve(root, 'packages/gds-theme/styles.css'))].sort()) {
    if (perThemeRoles.has(property)) continue;
    const role = property.replace(/^--gds-/, '');
    globals[role] = {
      $type: inferDtcgType(property, value),
      $value: value,
      $description: `Theme-invariant GDS token "${role}" — identical under every preset.`,
      $extensions: { [GDS_EXT]: { role, lane: 'global', cssProperty: property } },
    };
  }

  const gds = {
    global: {
      $description:
        'Tokens that render identically under every preset (motion, overlay, safe-area, tour geometry). '
        + 'Values are the plain :root declarations, not the reduced-motion or forced-colors overrides.',
      ...globals,
    },
  };
  for (const themeId of graph.themes) {
    gds[themeId] = {
      $description: `GDS theme preset: ${themeId}`,
      ...byTheme.get(themeId),
    };
  }

  return {
    $description:
      'General Design System (GDS) design tokens in W3C Design Tokens Community Group (DTCG) format. ' +
      'Generated from the authoritative code tokens via createGdsTokenGraph() — do not hand-edit; run `npm run tokens:dtcg`. ' +
      'Color-category tokens use $type "color"; CSS gradient/hero effects use a GDS-namespaced custom type and carry the raw CSS string.',
    $extensions: {
      [GDS_EXT]: {
        generator: 'scripts/generate-dtcg-tokens.mjs',
        source: 'createGdsTokenGraph() from @sovereignsquad/gds-theme',
        themeCount: graph.themeCount,
        tokenCount: graph.tokenCount,
        atmosphereTokenCount: graph.nodes.filter((n) => n.lane === 'atmosphere').length,
        semanticTokenCount: graph.nodes.filter((n) => n.lane === 'semantic').length,
        globalTokenCount: Object.keys(globals).length,
        cssGradientType: CSS_GRADIENT_TYPE,
        cssEnvType: CSS_ENV_TYPE,
        cssComputedType: CSS_COMPUTED_TYPE,
        cssKeywordType: CSS_KEYWORD_TYPE,
        cssShadowType: CSS_SHADOW_TYPE,
        note: 'Regenerated and drift-checked in CI (verify:tokens-dtcg). The code tokens remain the single source of truth.',
      },
    },
    gds,
  };
}

function serialize(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

// Issue 585 measures its own result. `publishedGraphOverlap` ratchets on this, and a budget
// whose number is transcribed by hand is a budget that can be wrong in the flattering
// direction — finding F21's lesson.
function writeOverlapMeasurement(document, graph) {
  const runtimeSemanticRoles = new Set(graph.nodes.filter((n) => n.lane === 'semantic').map((n) => n.role));
  const publishedRoles = new Set();
  for (const [themeId, group] of Object.entries(document.gds)) {
    if (themeId.startsWith('$') || themeId === 'global') continue;
    for (const role of Object.keys(group.semantic ?? {})) {
      if (!role.startsWith('$')) publishedRoles.add(role);
    }
  }
  const overlap = [...publishedRoles].filter((role) => runtimeSemanticRoles.has(role));
  mkdirSync(resolve(root, 'audit'), { recursive: true });
  writeFileSync(resolve(root, 'audit/published-graph.json'), `${JSON.stringify({
    runtimeSemanticRoles: runtimeSemanticRoles.size,
    publishedSemanticRoles: publishedRoles.size,
    overlap: overlap.length,
    coverage: runtimeSemanticRoles.size ? Number(((overlap.length / runtimeSemanticRoles.size) * 100).toFixed(1)) : 0,
    globalTokens: Object.keys(document.gds.global).filter((k) => !k.startsWith('$')).length,
    totalTokens: graph.tokenCount,
  }, null, 2)}\n`);
  return overlap.length;
}

const isCheck = process.argv.includes('--check');
const nextDocument = buildDtcgDocument();
writeOverlapMeasurement(nextDocument, createGdsTokenGraph());
const nextContent = serialize(nextDocument);

if (isCheck) {
  let current;
  try {
    current = readFileSync(outputPath, 'utf8');
  } catch {
    console.error('DTCG token export check failed: tokens/gds.tokens.json is missing. Run `npm run tokens:dtcg`.');
    process.exit(1);
  }
  if (current !== nextContent) {
    console.error(
      'DTCG token export check failed: tokens/gds.tokens.json is stale relative to the source tokens. ' +
        'Run `npm run tokens:dtcg` and commit the result.',
    );
    process.exit(1);
  }
  console.log('DTCG token export check passed: tokens/gds.tokens.json matches the source tokens.');
} else {
  writeFileSync(outputPath, nextContent);
  console.log(`DTCG token export written: tokens/gds.tokens.json (${JSON.parse(nextContent).$extensions[GDS_EXT].tokenCount} tokens across ${JSON.parse(nextContent).$extensions[GDS_EXT].themeCount} themes).`);
}
