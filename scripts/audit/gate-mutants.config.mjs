// Maps each governed gate to the mutants a correct implementation must kill.
//
// Verdict is inverted vs ordinary testing: under a planted defect a correct gate
// FAILS. A gate that exits 0 did not detect the defect; `claim` names the unsupported
// assertion.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The docs-governance mutant below plants a stale version on a real SSOT document. Its anchor
// must track VERSION rather than a literal frozen at the commit that wrote it, or the mutant
// goes INVALID (anchor not found) on the next release — exactly what happened at 6.5.0, caught
// by this repo's own release preflight rather than by CI.
const CURRENT_VERSION = readFileSync(resolve(import.meta.dirname, '../../VERSION'), 'utf8').trim();

// Same defect class as the version anchor above, one file over: this mutant plants a stale
// component count on docs/AI_AGENT_GUIDE.md, so its anchor must read the live census rather
// than freeze a number that changes every time a component ships (306 at #665's writing,
// 308 by #669's -- caught by this release's own preflight, not by CI).
const CURRENT_COMPONENT_COUNT = (() => {
  const source = readFileSync(
    resolve(import.meta.dirname, '../../apps/playground/src/generated-component-census.ts'), 'utf8',
  );
  const match = source.match(/GDS_PUBLIC_COMPONENT_COUNT = (\d+);/);
  if (!match) throw new Error('Could not read GDS_PUBLIC_COMPONENT_COUNT for the docs-governance mutant.');
  return match[1];
})();

/**
 * Gates deliberately not mutated, each with a reason and a review date.
 * An exemption without a reason, or past its `reviewBy`, fails the suite.
 */
export const EXEMPTIONS = {
  'build': { reason: 'The compiler is the gate; mutating source to prove tsc detects errors tests TypeScript, not GDS.', reviewBy: '2027-08-01' },
  'lint': { reason: 'ESLint is third-party and separately tested upstream.', reviewBy: '2027-08-01' },
  'test:run': { reason: 'The unit suite is itself the assertion layer; mutating it is the job of a full mutation run over packages, which is a separate initiative.', reviewBy: '2027-02-01' },
  'audit:dependencies': { reason: 'Asserts against a live npm advisory database; a planted mutation cannot produce a deterministic verdict.', reviewBy: '2027-02-01' },
  'audit:board': { reason: 'Soft-warns by design when the GitHub API is unreachable, so it cannot be relied on to fail deterministically in a sandbox.', reviewBy: '2027-02-01' },
  'verify:mantine': { reason: 'Compatibility smoke across Mantine 7/8/9 x React 18/19; mutating it would test Mantine, not GDS.', reviewBy: '2027-08-01' },
  // Runtime gates need a built playground and a browser.
  'verify:forced-colors-runtime': { reason: 'Browser-driven; needs the rebuild-aware harness pattern from issue 579. Tracked, not waived.', reviewBy: '2026-12-01' },
  'verify:theme-trust-runtime': { reason: 'Browser-driven; see above.', reviewBy: '2026-12-01' },
  'verify:input-zoom-guard-runtime': { reason: 'Browser-driven; see above.', reviewBy: '2026-12-01' },
  'verify:kanban-drag-accessibility-runtime': { reason: 'Browser-driven; see above.', reviewBy: '2026-12-01' },
  // Browser-driven. Negative control was observed live (344 uncomputable pairs, then 26 below 4.5:1) rather than planted.
  'verify:badge-contrast': { reason: 'Browser-driven; needs the rebuild-aware harness pattern from issue 579. Its negative control was observed live on real defects (344 uncomputable, then 26 low pairs) rather than planted. Tracked, not waived.', reviewBy: '2026-12-01' },
  'verify:references': { reason: 'Aggregate of 25 sub-gates; mutants belong on the individual scripts rather than the aggregate. Tracked.', reviewBy: '2026-12-01' },
  // Read from dist/; a source mutation is invisible without a rebuild.
  'verify:boundary': { reason: 'Reads dist/; needs a rebuild-aware mutant with a verified anchor. Same solved pattern as verify:theme-tokens.', reviewBy: '2026-12-01' },
  'verify:a11y-package': { reason: 'Reads dist/; needs a rebuild-aware mutant.', reviewBy: '2026-12-01' },
  'verify:token-contrast-scoring': { reason: 'Reads dist/; needs a rebuild-aware mutant.', reviewBy: '2026-12-01' },
  // Self-referential: mutating it re-runs the whole suite (8 mutants, two rebuilds) inside itself.
  'verify:gates': { reason: 'Self-referential: mutating it re-runs the whole suite inside itself, including rebuilds. Deferred on cost, not principle. The gate that verifies gates is currently unverified.', reviewBy: '2026-11-01' },
};

/**
 * Gate -> mutants. Each mutant states the CLAIM it tests.
 */
export const GATE_MUTANTS = [
  {
    // Run directly rather than through `verify:references`, which aggregates 25 sub-gates and
    // is exempted above for exactly that reason. This is the first of them to carry a mutant.
    npmScript: 'verify:docs-governance-consistency',
    script: 'verify-docs-governance-consistency.mjs',
    standalone: true,
    mutants: [
      {
        id: 'docs-governance-detects-stale-version-outside-the-old-list',
        claim: 'Detects a stale Version header on an Active SSOT document that the pre-#658 hand-written array did not cover',
        // docs/BADGE_SYSTEM.md was never in that array and sat at 6.0.0 for four releases.
        // The anchor and its replacement both read the live VERSION file (issue 663's sibling
        // defect: a mutant with a version number frozen in source breaks on every release).
        file: 'docs/BADGE_SYSTEM.md',
        find: `Version: ${CURRENT_VERSION}`,
        replace: 'Version: 0.0.0-mutant',
        once: true,
      },
      {
        id: 'docs-governance-detects-active-ssot-doc-with-no-version-header',
        claim: 'Detects an Active SSOT document that has no Version header at all, not just a stale one',
        // docs/MAP_SYSTEM.md, docs/SITE_ARCHITECTURE.md, and docs/ACCESS_GATE.md all shipped
        // this exact way: Active SSOT, no Version line, invisible to the derivation because it
        // only ever scanned docs that already had one (deep-audit finding F1). Deleting the
        // line this mutant plants proves the fix, rather than just re-proving the sibling
        // mutant above.
        file: 'docs/ACCESS_GATE.md',
        find: 'Status: Active SSOT\nVersion: ' + CURRENT_VERSION + '\n',
        replace: 'Status: Active SSOT\n',
        once: true,
      },
      {
        id: 'docs-governance-detects-stale-component-count',
        claim: 'Detects docs/AI_AGENT_GUIDE.md stating a component count that no longer matches the generated census (deep-audit F4)',
        file: 'docs/AI_AGENT_GUIDE.md',
        find: `ships ${CURRENT_COMPONENT_COUNT} components`,
        replace: 'ships 250+ components',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:budgets',
    script: 'verify-budgets.mjs',
    mutants: [
      {
        id: 'budgets-detects-regression',
        claim: 'Detects a measured value exceeding its budget',
        file: 'audit/budgets.json',
        // Anchored on renderMutationScore, a `min` budget fixed at its ceiling of 100.
        find: '"value": 100,',
        replace: '"value": 200,',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:smoke-import-surface',
    script: 'verify-smoke-import-surface.mjs',
    mutants: [
      {
        id: 'smoke-detects-stale-import',
        claim: 'Detects a fixture import resolved from an entrypoint that does not export it — the exact issue 553 defect',
        file: 'scripts/verify-published-consumer-smoke.mjs',
        find: "import { ReferenceThemeExplorer } from '@sovereignsquad/gds-core/reference-theme-explorer';",
        replace: "import { ReferenceThemeExplorer } from '@sovereignsquad/gds/client';",
      },
    ],
  },
  {
    npmScript: 'verify:api-jsdoc-coverage',
    script: 'verify-api-jsdoc-coverage.mjs',
    standalone: true,
    mutants: [
      {
        id: 'jsdoc-detects-undocumented-export',
        claim: 'Reports true JSDoc coverage rather than a vacuous 0/0 = 100%',
        file: 'packages/gds-a11y/src/index.ts',
        find: ' * Renders a {@link GdsA11yReport} as plain text for CI logs.',
        replace: 'RENDERS_A_REPORT_PLACEHOLDER',
        // Strips the block terminator so the export directly below is undocumented.
        alsoRemove: [' */\nexport function formatGdsA11yReport'],
        replaceWith: ['\nexport function formatGdsA11yReport'],
      },
    ],
  },
  {
    // verify:theme-tokens validates graph structure only; a renamed role stays structurally
    // valid. Renaming makes the committed tokens/gds.tokens.json stale, so this drift check
    // catches it (verify:tokens-dtcg exits 1). Regenerating the artifact makes it pass again;
    // value regressions are caught separately by verify:theme-accessibility.
    npmScript: 'verify:tokens-dtcg',
    script: null,
    mutants: [
      {
        id: 'tokens-dtcg-detects-renamed-semantic-token',
        claim: 'Detects a semantic token disappearing from the published graph',
        file: 'packages/gds-theme/src/semantic-token-source.ts',
        find: "    '--gds-support': supportLight,",
        replace: "    '--gds-support-RENAMED': supportLight,",
        // verify-theme-token-contract imports from packages/gds-theme/dist; needs a rebuild to see a source mutation.
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:theme-tokens',
    script: 'verify-theme-token-contract.mjs',
    standalone: true,
    mutants: [
      {
        id: 'theme-tokens-detects-unresolvable-token-value',
        claim: 'Detects a token whose value does not resolve to a static CSS colour',
        file: 'packages/gds-theme/src/semantic-token-source.ts',
        find: "    '--gds-support': supportLight,",
        replace: "    '--gds-support': 'not-a-resolvable-color',",
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:component-catalog-parity',
    script: 'verify-component-catalog-parity.mjs',
    standalone: true,
    mutants: [
      {
        id: 'catalog-detects-unregistered-component',
        claim: 'Detects a public UI component that is neither registered nor exempted',
        file: 'packages/gds-core/src/index.ts',
        find: 'export',
        replace: 'export const GdsAuditMutantComponent = () => null;\nexport',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:vendor-pin',
    script: 'verify-vendor-governance.mjs',
    mutants: [
      {
        id: 'vendor-pin-detects-unpinned-version',
        claim: 'Detects a governed vendor dependency drifting off its pinned version',
        file: 'vendor-governance.json',
        find: '"pinnedRange": "^7.9.0 || ^8.3.0 || ^9.0.0"',
        replace: '"pinnedRange": "^1.0.0"',
      },
    ],
  },
  {
    npmScript: 'verify:theme-accessibility',
    script: 'verify-theme-accessibility.mjs',
    standalone: true,
    mutants: [
      {
        id: 'theme-a11y-detects-contrast-regression',
        // Scores the derived --gds-* semantic roles, not the vibe ATMOSPHERE palette.
        claim: 'Detects a semantic text colour dropping below its contrast floor',
        file: 'packages/gds-theme/src/semantic-token-source.ts',
        find: "    '--gds-text-body': vibe.textLight,",
        replace: "    '--gds-text-body': '#f5f5f5',",
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:tokens-dtcg',
    script: null,
    mutants: [
      {
        id: 'dtcg-detects-token-graph-drift',
        claim: 'Detects the committed DTCG graph drifting from the source tokens',
        file: 'tokens/gds.tokens.json',
        find: '"$value"',
        replace: '"$value_MUTANT"',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:registry-drift',
    script: null,
    mutants: [
      {
        id: 'registry-drift-detects-stale-committed-registry',
        claim: 'Detects the committed registry drifting from what source extraction produces',
        file: 'audit/registry.json',
        find: '"prop":',
        replace: '"prop_MUTANT":',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:token-single-source',
    script: null,
    mutants: [
      {
        id: 'single-source-detects-parallel-table',
        claim: 'Detects a semantic-role table re-declared outside semantic-token-source.ts',
        file: 'packages/gds-theme/src/vibe-themes.ts',
        find: 'const brandSemanticCssVariablesByPreset',
        replace:
          "const auditMutantTable = {\n  '--gds-brand-primary': '#123456',\n"
          + "  '--gds-bg-card': '#654321',\n  '--gds-text-body': '#abcdef',\n};\n\n"
          + 'const brandSemanticCssVariablesByPreset',
        once: true,
      },
      {
        id: 'single-source-detects-one-path-override',
        // Overrides a role on one consumption path only (provider vs document), with no duplicated table for a structural scan to catch.
        claim: 'Detects the two consumption paths resolving one role to different values',
        file: 'packages/gds-theme/src/brand-tokens.ts',
        find: '  const cssVariables = emitGoldAthleteCssVariables(ramps);',
        replace: "  const cssVariables = emitGoldAthleteCssVariables(ramps);\n  cssVariables['--gds-bg-card'] = '#ff0000';",
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:generated-imagery-only',
    script: null,
    mutants: [
      {
        id: 'imagery-detects-external-image',
        claim: 'Detects an image the site renders from a third-party host',
        file: 'apps/playground/src/pattern-pages.tsx',
        find: '            preview={(',
        replace: '            preview={<img alt="x" src="https://picsum.photos/id/1/64/64" />}\n            unusedPreview={(',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:theme-identity',
    script: null,
    mutants: [
      {
        id: 'identity-detects-collapsed-identity',
        claim: 'Detects an identity that no longer distinguishes themes',
        file: 'packages/gds-theme/src/theme-identity.ts',
        find: '  return `${preset}:${colorScheme}:${fnv1a(parts.join(\';\'))}`;',
        replace: '  return `constant:${fnv1a(\'\')}`;',
        once: true,
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:accent-contrast',
    script: null,
    mutants: [
      {
        id: 'accent-detects-illegible-base',
        claim: 'Detects an accent whose filled mode cannot carry its white foreground',
        file: 'packages/gds-theme/src/accent-axis.ts',
        find: "    plum: { base: '#7c3a6e' },",
        replace: "    plum: { base: '#e8d5e2' },",
        once: true,
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
      {
        id: 'accent-detects-a-sweep-that-measures-nothing',
        // Narrows the sweep to a single accent; must fail on the length assertion.
        claim: 'Detects a shortened sweep rather than accepting it as clean',
        file: 'packages/gds-theme/src/accent-axis.ts',
        find: "export const GDS_ACCENT_SHADES: GdsAccentShade[] = ['base', 'deep', 'deeper', 'deepest'];",
        replace: "export const GDS_ACCENT_SHADES: GdsAccentShade[] = ['base'];",
        once: true,
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:a11y-floor',
    script: null,
    mutants: [
      {
        id: 'a11y-floor-detects-thin-focus-ring',
        claim: 'Detects a theme thinning the focus ring below the 2px floor',
        file: 'packages/gds-theme/src/axes.ts',
        find: "  width: '2px',",
        replace: "  width: '1px',",
        once: true,
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
      {
        id: 'a11y-floor-detects-a-floor-that-checks-nothing',
        // A floor evaluating no rules also reports zero violations; the gate must prove rules are live via a canary.
        claim: 'Detects a floor that evaluates nothing and reports a vacuous pass',
        file: 'packages/gds-theme/src/accessibility-floor.ts',
        find: '  return gdsAccessibilityFloorRules.flatMap((rule) => rule.evaluate(ctx));',
        // Keeps ctx and the rule set referenced so the mutant compiles.
        replace: '  return gdsAccessibilityFloorRules.flatMap((rule) => (ctx ? [] : rule.evaluate(ctx)));',
        once: true,
        requiresBuild: ['@sovereignsquad/gds-theme'],
      },
    ],
  },
  {
    npmScript: 'verify:density-token-adoption',
    script: null,
    mutants: [
      {
        id: 'density-detects-hardcoded-spacing',
        claim: 'Detects a component hardcoding spacing instead of reading the density axis',
        file: 'packages/gds-core/src/EditorialHero.tsx',
        find: "padding: 'var(--gds-space-xs) var(--gds-space-md)'",
        replace: "padding: '0.625rem 1rem'",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:shape-token-adoption',
    script: null,
    mutants: [
      {
        id: 'shape-detects-hardcoded-radius',
        claim: 'Detects a component hardcoding a corner radius instead of reading the shape axis',
        file: 'packages/gds-core/src/MapPanel.tsx',
        find: "borderRadius: 'var(--gds-radius-image)' }",
        replace: 'borderRadius: 12 }',
        once: true,
      },
      {
        id: 'shape-detects-undeclared-radius-token',
        // An undeclared token reference renders as nothing, with no error.
        claim: 'Detects a var(--gds-radius-*) reference to a step or role the axis does not declare',
        file: 'packages/gds-core/src/MapPanel.tsx',
        find: "borderRadius: 'var(--gds-radius-image)' }",
        replace: "borderRadius: 'var(--gds-radius-nonexistent)' }",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:motion-scale',
    script: null,
    mutants: [
      {
        id: 'motion-scale-detects-offscale-literal',
        claim: 'Detects a shipped transition reintroducing a literal duration or easing',
        file: 'packages/gds-theme/styles.css',
        find: '  transition: top var(--gds-motion-duration-slow) var(--gds-motion-ease-standard), left var(--gds-motion-duration-slow) var(--gds-motion-ease-standard);',
        replace: '  transition: top 200ms ease, left 200ms ease;',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:motion-css',
    script: null,
    mutants: [
      {
        id: 'motion-css-detects-hand-edited-scale',
        // styles.css's motion scale is generated from motion.ts and must not be hand-edited.
        claim: 'Detects the stylesheet motion scale drifting from motion.ts',
        file: 'packages/gds-theme/styles.css',
        find: '  --gds-motion-duration-fast: 120ms;',
        replace: '  --gds-motion-duration-fast: 137ms;',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:token-reachability',
    script: null,
    mutants: [
      {
        id: 'reachability-detects-newly-unreachable-token',
        claim: 'Detects a declared token that no rule or component references',
        file: 'packages/gds-theme/styles.css',
        find: '  --gds-tour-spotlight-padding: 8px;',
        replace: '  --gds-tour-spotlight-padding: 8px;\n  --gds-audit-mutant-orphan: 4px;',
        once: true,
      },
      {
        id: 'reachability-detects-expired-extension-point',
        claim: 'Detects an extension-point allowlist entry whose reviewBy date has passed',
        // Anchored on --gds-badge-validation's reviewBy line alone (confirmed unique in the
        // file), not its free-text reason, which is legitimately edited over time -- it already
        // has been once, breaking an earlier version of this exact anchor that matched the
        // whole entry including that prose. issue 586 §6 records this entry as
        // retained-not-removed only because of the breaking-change cost of dropping a published
        // BrandSemanticRole member -- it cannot become accidentally reachable the way a generic
        // surface-role token (--gds-bg-page, --gds-bg-canvas) can once some component starts
        // consuming it for an unrelated reason, so it stays a stable, real extension point.
        file: 'scripts/token-reachability.config.mjs',
        find: "    reviewBy: '2026-11-01',\n  },",
        replace: "    reviewBy: '2020-01-01',\n  },",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:component-census',
    script: null,
    mutants: [
      {
        id: 'census-detects-stale-published-count',
        claim: 'Detects a published component count that no longer matches the packages',
        // Mutates the component-name predicate, not the published number, so the anchor survives future component additions.
        file: 'scripts/lib/component-census.mjs',
        find: "  return /^[A-Z]/.test(name) && /[a-z]/.test(name) && !/^use[A-Z]/.test(name);",
        replace: "  return /^[A-Z]/.test(name) && /[a-z]/.test(name) && !/^use[A-Z]/.test(name) && !name.startsWith('Gds');",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:font-lane-coverage',
    script: null,
    mutants: [
      {
        id: 'font-coverage-detects-partial-lane',
        claim: 'Detects a font lane that cannot render every supported language',
        // Reads dist/; needs a rebuild.
        requiresBuild: ['@sovereignsquad/gds-theme'],
        // Strips the universal script fallback from the shared sans stack (hebrew/arabic/han/kana/hangul lose face; ja/ko/zh render tofu).
        file: 'packages/gds-theme/src/font-lanes.ts',
        find: 'const sansFallback = `Inter, ${universalScriptFallback}, ${systemSans}`;',
        replace: 'const sansFallback = `Inter, ${systemSans}`;',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:accent-background-vars',
    script: null,
    mutants: [
      {
        id: 'accent-background-vars-detects-stale-committed-list',
        claim: 'Detects the committed accent-background variable list drifting from ACCENT_ROLES',
        file: 'packages/gds-eslint-config/generated-accent-background-vars.js',
        find: '"--gds-brand-accent",',
        replace: '"--gds-brand-accent-MUTANT",',
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:design-rule-coverage-module',
    script: null,
    mutants: [
      {
        id: 'design-rule-coverage-module-detects-stale-committed-copy',
        claim: 'Detects the committed gds-core coverage module drifting from audit/design-rule-coverage.json',
        file: 'packages/gds-core/src/generated-design-rule-coverage.ts',
        find: "'default': { dominant:",
        replace: "'default_MUTANT': { dominant:",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:i18n-leakage',
    script: null,
    mutants: [
      {
        id: 'leakage-detects-untranslated-value',
        claim: 'Detects a locale pack shipping English where a translation belongs',
        // zh has no English cognates, so this can't false-positive the way a German `Pause` would.
        file: 'packages/gds-core/src/locales/zh.ts',
        find: "'gds.action.trendingUp': '趋势上升',",
        replace: "'gds.action.trendingUp': 'Trending Up',",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:pattern-coverage',
    script: null,
    mutants: [
      {
        id: 'pattern-coverage-detects-stale-derivation',
        claim: 'Detects a demo removed without the derived coverage being regenerated',
        // Anchored on a demo case label rather than a status that can legitimately change.
        file: 'apps/playground/src/pattern-pages.tsx',
        find: "    case 'searchable-select':",
        replace: "    case 'searchable-select-renamed':",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:site-claims',
    script: null,
    mutants: [
      {
        id: 'site-claims-detects-demo-word',
        claim: 'Detects the reference site calling one of its proof surfaces a demo',
        file: 'apps/playground/src/showcase-pages.tsx',
        find: 'How to read these proofs',
        replace: 'How to read these demos',
        once: true,
      },
      {
        id: 'site-claims-detects-malformed-rename',
        claim: 'Detects a substring rename that fused a replacement term onto another word',
        file: 'apps/playground/src/pattern-pages.tsx',
        find: "{ id: 'live', title: 'Live proofs',",
        replace: "{ id: 'live', title: 'Live proofnstrations',",
        once: true,
      },
      {
        id: 'site-claims-detects-short-visible-demo-label',
        claim: 'Detects a SHORT visible label calling a proof surface a demo',
        // `label: 'Live Demos'` is ten characters; the capture regex must not require a length floor above that.
        file: 'apps/playground/src/site-routes.ts',
        find: "    label: 'Live Proofs',",
        replace: "    label: 'Live Demos',",
        once: true,
      },
      {
        id: 'site-claims-detects-hardcoded-number',
        claim: 'Detects a number typed into visible prose instead of interpolated from its source',
        file: 'apps/playground/src/pattern-pages.tsx',
        find: "'Online orders account for %online% percent of visible orders; in-store orders account for %instore% percent.'",
        replace: "'Online orders account for 62 percent of visible orders; in-store orders account for 38 percent.'",
        once: true,
      },
      {
        id: 'site-claims-detects-unevidenced-claim',
        claim: 'Detects an absolute claim on the reference site with no registered evidence',
        file: 'scripts/site-claims.config.mjs',
        find: "  'Focus never depends on hover-only reveal.': {",
        replace: "  'Focus never depends on hover-only reveal. (mutant: registration removed)': {",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:component-color-pairs',
    script: null,
    mutants: [
      {
        id: 'component-pairs-detects-fixed-foreground-on-themeable-fill',
        claim: 'Detects a component pairing a themeable fill with a foreground not derived against it',
        // `--gds-text-on-inverse` is derived against `--gds-bg-inverse`; against the athlete-gold dark accent it drops to 1.22:1.
        file: 'packages/gds-core/src/BottomTabBar.tsx',
        find: "color: 'var(--gds-brand-accent-fg, var(--gds-text-on-inverse, var(--mantine-color-white)))',",
        replace: "color: 'var(--gds-text-on-inverse, var(--mantine-color-white))',",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:mantine-governance',
    script: null,
    mutants: [
      {
        id: 'mantine-governance-detects-new-ungoverned-variable',
        claim: 'Detects a newly consumed --mantine-* variable that no GDS theme dictates',
        file: 'packages/gds-core/src/GdsBadge.tsx',
        // Must add a consumption, not swap one, or the ungoverned count doesn't move.
        find: 'var(--mantine-color-gray-1, #f1f3f5)',
        replace: 'var(--mantine-color-gray-1, var(--mantine-color-pink-6, #f1f3f5))',
        once: true,
      },
      {
        id: 'mantine-governance-detects-expired-delegation',
        claim: 'Detects a delegation whose reviewBy date has passed',
        file: 'scripts/mantine-governance.config.mjs',
        find: "reviewBy: '2027-08-01',\n  },\n  '--mantine-z-index-modal'",
        replace: "reviewBy: '2020-01-01',\n  },\n  '--mantine-z-index-modal'",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:obligation-coverage',
    script: null,
    mutants: [
      {
        id: 'obligation-detects-new-undocumented-prop',
        claim: 'Detects a newly added prop that carries no JSDoc, without any manual registration',
        file: 'packages/gds-core/src/MapPanel.tsx',
        find: '  minHeight?: number | string;',
        replace: '  minHeight?: number | string;\n  auditMutantUndocumented?: string;',
        // The gate reads audit/registry.json; the registry must be regenerated for the new prop to be visible.
        regenerate: ['registry'],
      },
    ],
  },
];

/**
 * Mutants that legitimately survive today because the gate they target has a known,
 * filed weakness. Fails once `reviewBy` passes.
 */
export const KNOWN_SURVIVORS = {
  // Empty. New entries need a reason and a review date.
};

/**
 * Release-chain gates that read from `dist/` and would need a rebuild-aware mutant.
 */
export const NEEDS_REBUILD_AWARE_MUTANT = ['verify:boundary', 'verify:a11y-package', 'verify:token-contrast-scoring'];
