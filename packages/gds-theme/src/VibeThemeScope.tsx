import type { CSSProperties, ReactNode } from 'react';
import { getGdsVibeThemeCssVariables } from './vibe-themes';
import type { GdsThemePresetId } from './theme-presets';

/** Props for `GdsVibeThemeScope`. */
export interface GdsVibeThemeScopeProps {
  /** Preset whose CSS variables scope this subtree. */
  presetId: GdsThemePresetId;
  /** Light/dark scheme to resolve. Defaults to `light`. */
  scheme?: 'light' | 'dark';
  children: ReactNode;
  className?: string;
}

/**
 * Scopes its children to one vibe-theme preset/scheme by overriding the
 * `--gds-vibe-*` and `--gds-*` semantic CSS custom properties on a wrapping
 * `span`, using the same {@link getGdsVibeThemeCssVariables} values the app-wide
 * theme provider applies at the document root. Every governed component
 * rendered inside (`GdsBadge`, `GdsCountBadge`, `StatusBadge`, …) re-resolves
 * its color from the override through the normal CSS cascade, so a page can
 * preview several presets side by side without switching the whole app's
 * active theme. Product surfaces should read the app-wide theme instead of
 * scoping locally — this is for side-by-side preset comparison only.
 *
 * @example
 * ```tsx
 * <GdsVibeThemeScope presetId="high-contrast" scheme="light">
 *   <GdsBadge tone="success" icon="Success" label="Published" />
 * </GdsVibeThemeScope>
 * ```
 */
export function GdsVibeThemeScope({ presetId, scheme = 'light', children, className }: GdsVibeThemeScopeProps) {
  const variables = getGdsVibeThemeCssVariables(presetId, scheme);
  return (
    <span data-gds-vibe-theme-scope={presetId} className={className} style={variables as CSSProperties}>
      {children}
    </span>
  );
}
