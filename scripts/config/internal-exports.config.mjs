// Exports internal to a package rather than part of its public surface — shared by
// verify-pattern-export-coverage.mjs and verify-api-docs-coverage.mjs.
//
// Both gates collect "public exports" by scanning for `export function|const|class`
// across a package's whole src tree, so anything exported for cross-module use inside a
// package lands here even though no consumer can reach it.

export const INTERNAL_EXPORTS = new Set([
  // Server-safe halves of 'use client' modules, imported by their client sibling. Absent from index/client/server.
  'gdsResolvedAccentTokens',
  'templateConfigs',
  // gds-theme's theme composition (theme.ts, brand-tokens.ts, font-lanes.ts). Absent from index/client/server.
  'mergeGdsThemeOverrides',
  // Built-in preset registry (gds-theme/src/presets). theme-presets.ts and vibe-themes.ts derive the public surface from it.
  'defineGdsThemePreset',
  'createVibrantPresetTheme',
  'neutralVibe',
  'gdsThemePresetRegistry',
  // Page template frame shared by GdsPageTemplates.tsx and GdsPageTemplates.client.tsx. Absent from index/client/server.
  'stateTitle',
  'stateDescription',
  'renderActions',
  'PageTemplateFrame',
  'TemplateStateGate',
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
