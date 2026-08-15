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
export { gdsRadius, resolveGdsShapeTokens, validateGdsShapeAxis, GdsAxisError, GDS_DEFAULT_SHAPE_AXIS, GDS_RADIUS_STEPS, GDS_RADIUS_ROLES } from './axes';
export { GdsThemeBoundary } from './GdsThemeBoundary';
export type { GdsThemeBoundaryProps } from './GdsThemeBoundary';
export { computeGdsThemeIdentity, gdsThemeIdentityChanged } from './theme-identity';
export type { GdsThemeIdentity, GdsThemeApplicationMode, GdsThemeIdentityInput } from './theme-identity';
export { resolveGdsAccentTokens, evaluateGdsAccentContrast, deriveGdsAccentShades, GdsAccentError, GDS_DEFAULT_ACCENT_AXIS, GDS_ACCENT_NAMES, GDS_ACCENT_SHADES, GDS_ACCENT_MODES, GDS_DEFAULT_SHADE_FACTORS, GDS_ACCENT_EMOJI_DISC, GDS_ACCENT_MODE_ENFORCEMENT } from './accent-axis';
export type { GdsAccentAxis, GdsAccentRamp, GdsAccentName, GdsAccentShade, GdsAccentMode, GdsAccentContrastResult } from './accent-axis';
export { gdsAccessibilityFloorRules, validateGdsAccessibilityFloor, auditGdsAccessibilityFloor, describeGdsAccessibilityFloor } from './accessibility-floor';
export type { GdsFloorRule, GdsFloorViolation, GdsFloorContext, GdsFloorSeverity } from './accessibility-floor';
export { resolveGdsMotionTokens, resolveGdsReactionTokens, GDS_DEFAULT_REACTION_AXIS, GDS_DEFAULT_FOCUS_RING } from './axes';
export type { GdsMotionAxis, GdsReactionAxis, GdsReactionIntensity, GdsFocusRingSpec } from './axes';
export { gdsElevation, resolveGdsTypographyTokens, resolveGdsElevationTokens, GDS_DEFAULT_TYPOGRAPHY_AXIS, GDS_DEFAULT_ELEVATION_AXIS, GDS_TEXT_STEPS, GDS_WEIGHT_NAMES, GDS_ELEVATION_STEPS, GDS_ELEVATION_ROLES } from './axes';
export type { GdsTypographyAxis, GdsElevationAxis, GdsTextSizeStep, GdsWeightName, GdsFontLaneRole, GdsElevationStep, GdsElevationValue, GdsElevationRole } from './axes';
export { gdsSpace, resolveGdsDensityTokens, validateGdsDensityAxis, GDS_DEFAULT_DENSITY_AXIS, GDS_SPACE_STEPS, GDS_CONTROL_SIZES, GDS_MIN_TARGET_PX, GDS_CONTROL_HEIGHT_EXCEPTIONS } from './axes';
export type { GdsThemeAxes, GdsShapeAxis, GdsRadiusStep, GdsRadiusRole, GdsResolvedShapeTokens } from './axes';
export type { GdsDensityAxis, GdsSpaceStep, GdsControlSize, GdsDensityMode } from './axes';
export { getGdsVibeThemes, resolveGdsVibeTheme, getGdsVibeThemeCssVariables, deriveVibeSemanticCssVariables } from './vibe-themes';
export type { GdsVibeTheme } from './vibe-themes';
export { VibeThemePicker } from './VibeThemePicker.client';
export type { VibeThemePickerProps } from './VibeThemePicker.client';
export { GdsVibeThemeScope } from './VibeThemeScope';
export type { GdsVibeThemeScopeProps } from './VibeThemeScope';

// ── Accessibility & contrast reporting ──
export { createGdsThemeAccessibilityReport, validateGdsThemeAccessibility } from './accessibility-report';
export type { GdsAccessibilityFindingSeverity, GdsContrastCheck, GdsContrastFinding, GdsContrastMode, GdsContrastRole, GdsForcedColorRole, GdsThemeAccessibilityReport } from './accessibility-report';
export { getGdsMapAreaFill, GDS_MAP_AREA_FILL_ACCENT_WEIGHT, GDS_MAP_AREA_FILL_OPACITY } from './map-area-fill';
export type { GdsMapAreaFill } from './map-area-fill';
export { getGdsContrastRatio, checkGdsContrast, pickGdsAutoForeground } from './contrast';
export type { GdsContrastLevel, GdsContrastResult, GdsContrastTextSize, GdsAutoForegroundOptions } from './contrast';

// ── Token graph, diffing & compatibility ──
export { createGdsTokenDiff, createGdsTokenGraph, createGdsThemeCompatibilityReport, validateGdsTokenGraph } from './token-operations';
export type { GdsThemeCompatibilityReport, GdsThemeCompatibilityResult, GdsThemeCompatibilitySurface, GdsTokenDiffChangeType, GdsTokenDiffEntry, GdsTokenDiffReport, GdsTokenGraph, GdsTokenNode, GdsTokenSeverity, GdsTokenValidationFinding, GdsTokenValidationReport } from './token-operations';

// ── Font lanes ──
export { getGdsFontLanes, resolveGdsFontLane, applyGdsFontLane, getGdsFontLaneStylesheetUrls, isGdsFontLaneId } from './font-lanes';
export type { GdsFontLane, GdsFontLaneId, GdsFontLaneLoadStrategy, GdsFontLaneSource } from './font-lanes';

// ── Theme-preset runtime state ──
export { createGdsThemePresetSelection, useGdsThemePresetState, useGdsAmbientTheme } from './theme-runtime';
export type { GdsAmbientTheme } from './theme-runtime';
export type { GdsStoredThemePresetState, GdsThemePresetSelection, GdsThemeScheme, UseGdsThemePresetStateOptions, UseGdsThemePresetStateResult } from './theme-runtime';

// ── Provider & overlay adapter ──
export { GdsProvider } from './GdsProvider';
export type { GdsProviderProps } from './GdsProvider';
export { OverlayAdapterProvider, useOverlayAdapter, mantineOverlayAdapter, defaultGdsOverlayConfig } from './overlay-adapter';
export type { OverlayAdapter, GdsOverlayConfig, GdsOverlayPlacement, GdsOverlayRole, GdsOverlayDismissReason } from './overlay-adapter';

// ── Internationalization ──
export { GdsI18nContext, gdsLocaleMetadata, getGdsLocaleIds, getGdsLocaleIdsByScript, getGdsLocaleMetadata, getGdsLocaleScripts, isGdsRtlLocale, useGdsTranslation } from './i18n';
export type { GdsI18nContextValue, GdsLocaleDirection, GdsLocaleId, GdsLocaleScript } from './i18n';

// ── Badge icon style (issue #525) ──
export { GdsIconStyleContext, useGdsBadgeIconStyle } from './icon-style';
export type { GdsBadgeIconStyle, GdsIconStyleContextValue } from './icon-style';

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
