import { readFileSync, writeFileSync } from 'node:fs';
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
    group[node.role] = {
      $type: isColor ? 'color' : CSS_GRADIENT_TYPE,
      $value: node.value,
      $description: `${node.themeId} ${node.role} (${node.mode} mode)`,
      $extensions: {
        [GDS_EXT]: {
          role: node.role,
          mode: node.mode,
          category: node.category,
          ...(isColor ? {} : { cssComposite: true }),
        },
      },
    };
    byTheme.set(node.themeId, group);
  }

  const gds = {};
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
        cssGradientType: CSS_GRADIENT_TYPE,
        note: 'Regenerated and drift-checked in CI (verify:tokens-dtcg). The code tokens remain the single source of truth.',
      },
    },
    gds,
  };
}

function serialize(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

const isCheck = process.argv.includes('--check');
const nextContent = serialize(buildDtcgDocument());

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
