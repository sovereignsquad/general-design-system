// Exports internal to a package rather than part of its public surface — shared by
// verify-pattern-export-coverage.mjs and verify-api-docs-coverage.mjs.
//
// Both gates collect "public exports" by scanning for `export function|const|class`
// across a package's whole src tree, so anything exported for cross-module use inside a
// package lands here even though no consumer can reach it.

export const INTERNAL_EXPORTS = new Set([
  // Cross-module, not cross-package: semantic emitters call it for badge tone pairs. Absent from index/client/server.
  'emitBadgeToneCssVariables',
  // Cross-module: vibe-themes.ts and semantic-token-source.ts both call it. Absent from index/client/server.
  'resolveGdsAxisTokens',
  'classUsaDefaultColorRamps',
  'goldAthleteDefaultColorRamps',
  'cssVarName',
  'deriveClassUsaSemanticTokens',
  'deriveGoldAthleteSemanticTokens',
  'emitCssVariables',
  'emitClassUsaCssVariables',
  'emitGoldAthleteCssVariables',
  'PROVIDER_IDENTITY_REGISTRY',
  'ar',
  'de',
  'en',
  'es',
  'fr',
  'gdsLocales',
  'he',
  'hu',
  'it',
  'ja',
  'ko',
  'ru',
  'zh',
  'parseCssColor',
  'blend',
  'resolveOpaque',
  'toRgbString',
  'mixCssColors',
  'luminance',
  'contrastRatio',
  'ensureContrast',
  'readableForeground',
  'rgbToHsl',
  'hueAngleDistance',
  // Test-only escape hatch (issue #646): not part of the public API, no barrel export.
  '__internal',
]);
