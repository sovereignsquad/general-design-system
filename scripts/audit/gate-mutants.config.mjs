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
  // Same browser-driven category. Worth stating what stands in for a mutant meanwhile:
  // this gate's negative control was OBSERVED, not assumed — during issue 597 it reported
  // 344 uncomputable pairs and then 26 below 4.5:1, each traced to a real shipped defect,
  // before reaching 0. A gate that has failed loudly on real defects has demonstrated it
  // detects them; that is evidence a planted mutant would only repeat, not evidence this
  // exemption can outlive its date.
  'verify:badge-contrast': { reason: 'Browser-driven; needs the rebuild-aware harness pattern from issue 579. Its negative control was observed live on real defects (344 uncomputable, then 26 low pairs) rather than planted. Tracked, not waived.', reviewBy: '2026-12-01' },
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
        // Anchored on renderMutationScore, which is a `min` budget already at its ceiling
        // of 100 — the one value in the file that cannot ratchet further and so cannot
        // silently invalidate this mutant. The previous anchor was `"value": 15,`
        // (unreachableTokens), which issue 586 ratcheted to 0; the suite reported INVALID
        // rather than passing, which is the anchor check doing its job.
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
    // Issue 585 moved this mutant off verify:theme-tokens. That gate validates graph
    // STRUCTURE, and a renamed role is still structurally valid, so it could never have
    // detected this — it was a KNOWN_SURVIVOR against #585 for exactly that reason.
    //
    // Now that the published graph carries the semantic roles, renaming one makes the
    // committed tokens/gds.tokens.json stale and the drift check fails. Measured, not
    // assumed: with `--gds-support` renamed, verify:tokens-dtcg exits 1.
    //
    // Honest limit, stated because it matters: regenerating the artifact makes this pass
    // again. For a RENAME that is acceptable governance — the contract change is visible in
    // the diff and has to be committed deliberately. It would NOT be acceptable for a value
    // regression, which is why the contrast case is covered by verify:theme-accessibility
    // scoring the semantic roles directly rather than by this drift check.
    npmScript: 'verify:tokens-dtcg',
    script: null,
    mutants: [
      {
        id: 'tokens-dtcg-detects-renamed-semantic-token',
        claim: 'Detects a semantic token disappearing from the published graph',
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
    npmScript: 'verify:theme-tokens',
    script: 'verify-theme-token-contract.mjs',
    standalone: true,
    mutants: [
      {
        id: 'theme-tokens-detects-unresolvable-token-value',
        // Matched to what this gate actually asserts. Its previous mutant tested for a
        // RENAME, which validateGdsTokenGraph cannot see because a renamed role is still
        // structurally valid — it survived for a year and was excused as a KNOWN_SURVIVOR.
        // A mutant should test the gate's real claim, not the claim one wishes it made.
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
        // Was a KNOWN_SURVIVOR against #585: createGdsThemeAccessibilityReport scored the
        // vibe ATMOSPHERE palette (vibe.textLight), never the derived --gds-* roles that
        // paint components. Issue 585 added 450 semantic pair checks, so this now fails at
        // 1.04:1 instead of passing silently.
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
        // If the identity stops reading the resolved tokens, every theme collides and a
        // switch silently stops remounting — which looks exactly like "the theme
        // half-applied", the report this issue came from.
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
        // Zero violations is also what a gate measuring nothing reports. Narrowing the sweep
        // to a single accent must fail on the length assertion, not pass quietly.
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
        // A floor evaluating no rules reports zero violations, which is exactly what a
        // compliant system reports. The count alone cannot tell those apart — finding F19's
        // failure mode — so the gate proves the rules are live against a canary first. This
        // mutant makes evaluation return nothing; without the canary it would SURVIVE.
        claim: 'Detects a floor that evaluates nothing and reports a vacuous pass',
        file: 'packages/gds-theme/src/accessibility-floor.ts',
        find: '  return gdsAccessibilityFloorRules.flatMap((rule) => rule.evaluate(ctx));',
        // Keeps ctx and the rule set referenced so the mutant COMPILES — a mutant that only
        // breaks the build tests tsc, not the gate.
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
        // A reference to a token the axis does not define renders as nothing at all — the
        // silent-nothing failure mode, which looks like a design choice rather than a bug.
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
        // The nine values were hand-typed into styles.css a second time, which is the
        // duplication HANDOVER.md §2 blames for the 5.0.1 dark-mode defect. This proves the
        // generated block cannot be edited away from motion.ts without the release failing.
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
        file: 'scripts/token-reachability.config.mjs',
        find: "    reviewBy: '2027-08-01',\n  },\n  '--gds-bg-canvas'",
        replace: "    reviewBy: '2020-01-01',\n  },\n  '--gds-bg-canvas'",
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
        // Mutates the DEFINITION of a component, not the published number. The first version
        // of this mutant pinned `= 289;` and went INVALID the moment a component was added —
        // a mutant anchored to a legitimately-changing value is a maintenance trap that reads
        // as a broken gate. Narrowing the census makes the committed file stale whatever the
        // count happens to be, which is the failure mode: "250+" was true when written and
        // drifted from then on because nothing compared it to reality.
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
        // Reads dist/, so the mutation is invisible without a rebuild.
        requiresBuild: ['@sovereignsquad/gds-theme'],
        // Strips the universal script fallback from the shared sans stack, which is exactly the
        // state every lane was in before the full-coverage policy: latin display face, no face
        // for hebrew/arabic/han/kana/hangul, and ja/ko/zh rendering tofu.
        file: 'packages/gds-theme/src/font-lanes.ts',
        find: 'const sansFallback = `Inter, ${universalScriptFallback}, ${systemSans}`;',
        replace: 'const sansFallback = `Inter, ${systemSans}`;',
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
        // Anchored on the exact defect issue 517 reported: zh's `trendingUp` sat in English
        // beside a correctly translated `trendingDown`. Chinese shares no cognates with
        // English, so this can never be a false positive the way a German `Pause` would be.
        file: 'packages/gds-core/src/locales/zh.ts',
        find: "'gds.action.trendingUp': '趋势上升',",
        replace: "'gds.action.trendingUp': 'Trending Up',",
        once: true,
      },
    ],
  },
  {
    npmScript: 'verify:pattern-live-proof',
    script: null,
    mutants: [
      {
        id: 'live-proof-detects-unproven-claim',
        claim: 'Detects a pattern claiming live-proof coverage that nothing on the site renders',
        // RE-ANCHORED (issue 609). This used to flip the one honestly-`static-reference` entry
        // to `live-proof`. Issue 609 built the frame that entry was waiting for, so it became a
        // real live proof and the anchor vanished — the suite reported INVALID rather than
        // passing, which is the anchor check doing its job, and is the same trap that voided an
        // earlier census mutant. A status that is *supposed* to change as the system improves
        // is a bad anchor.
        //
        // Anchored instead on a demo CASE LABEL, which is the definition the gate reads: rename
        // it and `searchable-select` claims a live proof whose card renders the "No interactive
        // demo renders here" fallback — exactly the #600 defect.
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
        // The word is not a style preference. It invites treating the page as a sandbox where
        // a shortcut is acceptable, which is exactly what nearly happened when a positioned
        // wrapper was about to be staged with an inline style rather than built into the
        // primitive that was missing it (Rule 15).
        file: 'apps/playground/src/showcase-pages.tsx',
        find: 'How to read these proofs',
        replace: 'How to read these demos',
        once: true,
      },
      {
        id: 'site-claims-detects-malformed-rename',
        claim: 'Detects a substring rename that fused a replacement term onto another word',
        // The exact artifact #606 shipped: "demonstrations" -> "proofnstrations", live on
        // /patterns and translated into all eight locale packs before a human read it.
        file: 'apps/playground/src/pattern-pages.tsx',
        find: "{ id: 'live', title: 'Live proofs',",
        replace: "{ id: 'live', title: 'Live proofnstrations',",
        once: true,
      },
      {
        id: 'site-claims-detects-short-visible-demo-label',
        claim: 'Detects a SHORT visible label calling a proof surface a demo',
        // `label: 'Live Demos'` is ten characters. The gate used to skip anything under twelve
        // as an identifier, and the capture regex required twelve too, so the primary nav label
        // was never even collected — it shipped that way for months after #606.
        file: 'apps/playground/src/site-routes.ts',
        find: "    label: 'Live Proofs',",
        replace: "    label: 'Live Demos',",
        once: true,
      },
      {
        id: 'site-claims-detects-hardcoded-number',
        claim: 'Detects a number typed into visible prose instead of interpolated from its source',
        // "250+ components" was exactly this: true when written, drifting from then on.
        file: 'apps/playground/src/pattern-pages.tsx',
        find: "'Online orders account for %online% percent of visible orders; in-store orders account for %instore% percent.'",
        replace: "'Online orders account for 62 percent of visible orders; in-store orders account for 38 percent.'",
        once: true,
      },
      {
        id: 'site-claims-detects-unevidenced-claim',
        claim: 'Detects an absolute claim on the reference site with no registered evidence',
        // Removing a registration leaves the sentence on the site with nothing behind it —
        // the exact state that let the badge panel assert a false rule for as long as it did.
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
        // Reverting BottomTabBar to the pre-597 pairing: `--gds-text-on-inverse` is derived to
        // sit on `--gds-bg-inverse`, so against the athlete-gold dark accent it is 1.22:1.
        // This gate is static — no browser, no build — so unlike the runtime gates it can carry
        // a real mutant instead of a dated exemption.
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
  // Empty, and that is the point.
  //
  // Both entries lived here against issue #585, sharing one root cause (finding F12/F22):
  // createGdsTokenGraph() and createGdsThemeAccessibilityReport() operated on the 17-role
  // vibe atmosphere palette, so the 34 semantic --gds-* roles that actually paint
  // components were outside both. A semantic token could be renamed, or dropped below its
  // contrast floor, and verify:release stayed green.
  //
  // #585 published the semantic roles into the graph and added 450 semantic contrast pair
  // checks. Both mutants are now KILLED by named gates, so neither has an excuse left.
  // An entry added here in future needs an issue, a reason, and a review date.
};

/**
 * Release-chain gates that read from `dist/` and would need a rebuild-aware mutant.
 * Listed here rather than silently omitted; each is tracked to follow the pattern
 * issue 579 established for Phase 1.
 */
export const NEEDS_REBUILD_AWARE_MUTANT = ['verify:boundary', 'verify:a11y-package', 'verify:token-contrast-scoring'];
