// Public barrel for `@sovereignsquad/gds-theme`.
//
// Grouped by role (themes → presets → reporting → tokens → runtime → provider →
// i18n → motion → brand → viewport). Grouping is documentation only; it carries
// no runtime meaning. Value and type exports are kept adjacent per feature so a
// consumer can find both in one place.

// ── Core themes & extension helpers ──
export { gdsTheme, gdsDarkPublicTheme, gdsFlatSurfaceTheme, gdsEditorialPublicTheme, createPublicBrandTheme, extendGdsTheme, withGdsMotion } from './theme';

// ── Theme presets & vibe themes ──
export { getGdsThemePresets, resolveGdsThemePreset, partnerDiscoveryThemePreset, classUsaThemePreset, goldAthleteThemePreset } from './theme-presets';
export type { GdsThemePreset, GdsThemePresetId } from './theme-presets';
export { getGdsVibeThemes, resolveGdsVibeTheme, getGdsVibeThemeCssVariables } from './vibe-themes';
export type { GdsVibeTheme } from './vibe-themes';
export { VibeThemePicker } from './VibeThemePicker.client';
export type { VibeThemePickerProps } from './VibeThemePicker.client';

// ── Accessibility & contrast reporting ──
export { createGdsThemeAccessibilityReport, validateGdsThemeAccessibility } from './accessibility-report';
export type { GdsAccessibilityFindingSeverity, GdsContrastCheck, GdsContrastFinding, GdsContrastMode, GdsContrastRole, GdsForcedColorRole, GdsThemeAccessibilityReport } from './accessibility-report';

// ── Token graph, diffing & compatibility ──
export { createGdsTokenDiff, createGdsTokenGraph, createGdsThemeCompatibilityReport, validateGdsTokenGraph } from './token-operations';
export type { GdsThemeCompatibilityReport, GdsThemeCompatibilityResult, GdsThemeCompatibilitySurface, GdsTokenDiffChangeType, GdsTokenDiffEntry, GdsTokenDiffReport, GdsTokenGraph, GdsTokenNode, GdsTokenSeverity, GdsTokenValidationFinding, GdsTokenValidationReport } from './token-operations';

// ── Font lanes ──
export { getGdsFontLanes, resolveGdsFontLane, applyGdsFontLane, getGdsFontLaneStylesheetUrls, isGdsFontLaneId } from './font-lanes';
export type { GdsFontLane, GdsFontLaneId, GdsFontLaneLoadStrategy, GdsFontLaneSource } from './font-lanes';

// ── Theme-preset runtime state ──
export { createGdsThemePresetSelection, useGdsThemePresetState } from './theme-runtime';
export type { GdsStoredThemePresetState, GdsThemePresetSelection, GdsThemeScheme, UseGdsThemePresetStateOptions, UseGdsThemePresetStateResult } from './theme-runtime';

// ── Provider & overlay adapter ──
export { GdsProvider } from './GdsProvider';
export type { GdsProviderProps } from './GdsProvider';
export { OverlayAdapterProvider, useOverlayAdapter, mantineOverlayAdapter, defaultGdsOverlayConfig } from './overlay-adapter';
export type { OverlayAdapter, GdsOverlayConfig, GdsOverlayPlacement, GdsOverlayRole, GdsOverlayDismissReason } from './overlay-adapter';

// ── Internationalization ──
export { GdsI18nContext, gdsLocaleMetadata, getGdsLocaleIdsByScript, getGdsLocaleMetadata, isGdsRtlLocale, useGdsTranslation } from './i18n';
export type { GdsI18nContextValue, GdsLocaleDirection, GdsLocaleId, GdsLocaleScript } from './i18n';

// ── Notifications ──
export { showGdsNotification } from './notifications';
export type { GdsNotificationOptions, GdsNotificationTone } from './notifications';

// ── Motion & z-index ──
export { createGdsMotionCssVariables, gdsMotionDurations, gdsMotionEasings, gdsMotionPresets, getGdsMotionPreset } from './motion';
export { gdsZIndexToken } from './z-index';
export type { GdsZIndexTier } from './z-index';
export type { GdsMotionDurationToken, GdsMotionEasingToken, GdsMotionPreset, GdsMotionPresetId, GdsReducedMotionPolicy, GdsResolvedMotionPreset } from './motion';
export { useGdsReducedMotion } from './motion.client';
export type { UseGdsReducedMotionResult } from './motion.client';

// ── Brand theming ──
export { createBrandTheme, deriveBrandSemanticTokens, brandContrastRatio, GdsBrandThemeError } from './brand-tokens';
export type { BrandColorRamp, BrandColorRamps, BrandFonts, ClassUsaColorRampName, ClassUsaColorRamps, CreateBrandThemeOptions, CreateClassUsaBrandThemeOptions, GoldAthleteColorRampName, GoldAthleteColorRamps, CreateGoldAthleteBrandThemeOptions, BrandSemanticRole, BrandThemeResult } from './brand-tokens';

// ── PWA viewport ──
export { getGdsPwaViewportMetaContent } from './viewport';
export type { GdsPwaViewportOptions, GdsViewportZoomPolicy } from './viewport';
export { getGdsWebAppManifest, gdsSafeAreaInset } from './pwa';
export type { GdsWebAppManifest, GdsWebAppManifestOptions, GdsWebAppManifestIcon, GdsWebAppManifestDisplay } from './pwa';
export { useGdsStandaloneDisplayMode } from './pwa.client';
export type { GdsStandaloneDisplayModeState } from './pwa.client';

// ── Development diagnostics ──
export { gdsDevWarnOnce, resetGdsDevWarnings } from './dev-warnings';
