// One list of exports that are internal to a package rather than part of its public
// surface — imported by BOTH verify-pattern-export-coverage.mjs and
// verify-api-docs-coverage.mjs.
//
// Issue 554. These two gates each carried their own hand-maintained copy of the same
// names, kept in step by nothing. That is the identical dual-source pattern this issue
// was filed to remove from the theme package, sitting in the tooling that polices it —
// adding one internal export meant remembering to edit two files, with a green build
// either way until the second gate happened to run.
//
// Both gates collect "public exports" by scanning for `export function|const|class`
// across a package's whole src tree, so anything exported for cross-module use inside a
// package lands here even though no consumer can reach it.

export const INTERNAL_EXPORTS = new Set([
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
]);
