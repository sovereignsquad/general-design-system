// Issue 580 — single source of truth mapping each governed gate to the mutants a
// correct implementation must kill.
//
// The verdict here is INVERTED relative to ordinary testing: under a planted defect a
// correct gate FAILS. A gate that still exits 0 has proven it does not detect that
// defect, and the `claim` string names exactly which assertion is thereby unsupported.
//
// Why this exists: 45 verify-* scripts, 21 in the release chain, and nothing verified
// any of them. Issue 516 was a gate reporting 100% while covering 0 of 17 exports —
// green and wrong for an unknown number of releases. A gate nobody checks is a gate
// that will eventually lie, and a lying gate is worse than no gate because it consumes
// the attention that would have found the problem.

/**
 * Gates that are deliberately not mutated, each with a reason and a review date.
 * An exemption without a reason, or past its `reviewBy`, fails the suite — silent
 * exemption is how a coverage requirement rots.
 */
export const EXEMPTIONS = {
  'build': { reason: 'The compiler is the gate; mutating source to prove tsc detects errors tests TypeScript, not GDS.', reviewBy: '2027-08-01' },
  'lint': { reason: 'ESLint is third-party and separately tested upstream.', reviewBy: '2027-08-01' },
  'test:run': { reason: 'The unit suite is itself the assertion layer; mutating it is the job of a full mutation run over packages, which is a separate initiative.', reviewBy: '2027-02-01' },
  'audit:dependencies': { reason: 'Asserts against a live npm advisory database; a planted mutation cannot produce a deterministic verdict.', reviewBy: '2027-02-01' },
  'audit:board': { reason: 'Soft-warns by design when the GitHub API is unreachable, so it cannot be relied on to fail deterministically in a sandbox.', reviewBy: '2027-02-01' },
  'verify:mantine': { reason: 'Compatibility smoke across Mantine 7/8/9 x React 18/19; mutating it would test Mantine, not GDS.', reviewBy: '2027-08-01' },
  // Runtime gates need a built playground and a browser. Mutating them is the same
  // rebuild-aware problem issue 579 solved for Phase 1, and is tracked to follow the
  // same pattern rather than being silently skipped.
  'verify:forced-colors-runtime': { reason: 'Browser-driven; needs the rebuild-aware harness pattern from issue 579. Tracked, not waived.', reviewBy: '2026-12-01' },
  'verify:theme-trust-runtime': { reason: 'Browser-driven; see above.', reviewBy: '2026-12-01' },
  'verify:input-zoom-guard-runtime': { reason: 'Browser-driven; see above.', reviewBy: '2026-12-01' },
  'verify:kanban-drag-accessibility-runtime': { reason: 'Browser-driven; see above.', reviewBy: '2026-12-01' },
  'verify:references': { reason: 'Aggregate of 25 sub-gates; mutants belong on the individual scripts rather than the aggregate. Tracked.', reviewBy: '2026-12-01' },
  // These read from dist/, so a source mutation is invisible to them without a rebuild.
  // Solvable exactly as verify:theme-tokens now is (requiresBuild), but each needs its
  // own anchor chosen and verified. Dated so they are re-examined, not waived forever.
  'verify:boundary': { reason: 'Reads dist/; needs a rebuild-aware mutant with a verified anchor. Same solved pattern as verify:theme-tokens.', reviewBy: '2026-12-01' },
  'verify:a11y-package': { reason: 'Reads dist/; needs a rebuild-aware mutant.', reviewBy: '2026-12-01' },
  'verify:token-contrast-scoring': { reason: 'Reads dist/; needs a rebuild-aware mutant.', reviewBy: '2026-12-01' },
  // The suite applying its own rule to itself, which is correct. Mutating this gate
  // means deleting a KNOWN_SURVIVORS entry and re-running the suite from inside itself
  // — each inner run re-executes 8 mutants including two workspace rebuilds. The test
  // is meaningful and should exist; it is deferred on cost, not on principle, and this
  // is stated plainly rather than dressed up: RIGHT NOW THE GATE THAT VERIFIES GATES IS
  // ITSELF UNVERIFIED. Near-dated so that is revisited soon.
  'verify:gates': { reason: 'Self-referential: mutating it re-runs the whole suite inside itself, including rebuilds. Deferred on cost, not principle. The gate that verifies gates is currently unverified.', reviewBy: '2026-11-01' },
};

/**
 * Gate -> mutants. Each mutant states the CLAIM it tests, because a survivor's value is
 * knowing precisely which assertion is unsupported — not merely that something failed.
 */
export const GATE_MUTANTS = [
  {
    npmScript: 'verify:budgets',
    script: 'verify-budgets.mjs',
    mutants: [
      {
        id: 'budgets-detects-regression',
        claim: 'Detects a measured value exceeding its budget',
        file: 'audit/budgets.json',
        find: '"value": 15,',
        replace: '"value": 5,',
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
        // This is the issue 516 claim, reproduced as a mutant. Before that fix it would
        // have SURVIVED, because the gate could not see gds-a11y at all.
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
    npmScript: 'verify:theme-tokens',
    script: 'verify-theme-token-contract.mjs',
    standalone: true,
    mutants: [
      {
        id: 'theme-tokens-detects-renamed-token',
        claim: 'Detects a semantic token disappearing from the emitted set',
        // Issue 554 moved deriveVibeSemanticCssVariables into semantic-token-source.ts.
        // The suite reported INVALID rather than silently passing, which is the anchor
        // check doing its job — a mutant whose anchor has drifted tests nothing.
        file: 'packages/gds-theme/src/semantic-token-source.ts',
        find: "    '--gds-support': supportLight,",
        replace: "    '--gds-support-RENAMED': supportLight,",
        // verify-theme-token-contract imports from packages/gds-theme/dist, so a source
        // mutation is invisible to it until rebuilt. Without this the mutant reported
        // SURVIVED and falsely accused a working gate.
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
        // Reproduces the ACTUAL historical defect: `createBrandTheme` overrode a role
        // after calling the emitter, so the provider path and the document path painted
        // different values with no duplicated table anywhere for a structural scan to
        // find. A first attempt mutated the single source instead and the gate correctly
        // stayed green — editing the one source changes both paths together, which is
        // the property being bought. Only a ONE-PATH override is a real divergence.
        claim: 'Detects the two consumption paths resolving one role to different values',
        file: 'packages/gds-theme/src/brand-tokens.ts',
        find: '  const cssVariables = emitGoldAthleteCssVariables(ramps);',
        replace: "  const cssVariables = emitGoldAthleteCssVariables(ramps);\n  cssVariables['--gds-bg-card'] = '#ff0000';",
        requiresBuild: ['@sovereignsquad/gds-theme'],
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
        // Must ADD a consumption, not swap one. A first attempt replaced gray-1 with
        // pink-6 and the gate correctly stayed green: both are ungoverned, so the count
        // did not move. The mutant has to increase the ungoverned set, not relabel it.
        find: 'var(--mantine-color-gray-1, #f1f3f5)',
        replace: 'var(--mantine-color-gray-1, var(--mantine-color-pink-6, #f1f3f5))',
        once: true,
      },
      {
        id: 'mantine-governance-detects-expired-delegation',
        // A delegation that cannot expire becomes permanent by neglect, which is how 87
        // ungoverned variables accumulated. This proves the expiry is load-bearing.
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
        // Proven as a negative control before being formalised: adding one undocumented
        // prop moves gaps 410 -> 411 and trips both this gate and the budget gate.
        claim: 'Detects a newly added prop that carries no JSDoc, without any manual registration',
        file: 'packages/gds-core/src/MapPanel.tsx',
        find: '  minHeight?: number | string;',
        replace: '  minHeight?: number | string;\n  auditMutantUndocumented?: string;',
        // The gate reads audit/registry.json, so the registry must be regenerated for the
        // new prop to be visible — the same dist-staleness class as the theme-tokens
        // mutant, in a different guise.
        regenerate: ['registry'],
      },
    ],
  },
];

/**
 * Mutants that legitimately survive TODAY because the gate they target has a known,
 * filed weakness. Recorded rather than hidden: the suite reports them every run and
 * fails once `reviewBy` passes, so they cannot quietly become permanent.
 *
 * Both entries below share one root cause — audit finding F12. `createGdsTokenGraph()`
 * and `createGdsThemeAccessibilityReport()` operate on the 17-role vibe ATMOSPHERE
 * palette (425 tokens = 17 x 25 themes). The 73 semantic `--gds-*` roles that actually
 * paint components are outside that graph entirely, so renaming or breaking one is
 * invisible to both gates. F12 is therefore not merely "the published graph is
 * incomplete for design tools" — two release-chain gates are blind to the tokens that
 * determine what a component looks like. Issue #585 closes it.
 */
export const KNOWN_SURVIVORS = {
  'theme-tokens-detects-renamed-token': {
    issue: 585,
    reason: 'validateGdsTokenGraph() validates the 17-role atmosphere palette; the 73 semantic --gds-* roles are outside the graph (F12).',
    reviewBy: '2026-12-01',
  },
  'theme-a11y-detects-contrast-regression': {
    issue: 585,
    reason: 'createGdsThemeAccessibilityReport() scores vibe palette fields (role "page text" = vibe.textLight), not the derived --gds-* semantic roles (F12).',
    reviewBy: '2026-12-01',
  },
};

/**
 * Release-chain gates that read from `dist/` and would need a rebuild-aware mutant.
 * Listed here rather than silently omitted; each is tracked to follow the pattern
 * issue 579 established for Phase 1.
 */
export const NEEDS_REBUILD_AWARE_MUTANT = ['verify:boundary', 'verify:a11y-package', 'verify:token-contrast-scoring'];
