// Not a TARGET_FILES entry for scripts/lib/site-phrases.mjs — the SVG markup below is
// asset data, not user-facing copy, and lives in its own module so the phrase extractor
// (which walks every string literal in its target files) never sees it.

const GDS_LOGO_LOCKUP_DEMO_MARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
  + '<rect x="1" y="1" width="30" height="30" rx="9" fill="#2f6f4f"/>'
  + '<path d="M9 22V10l7 7 7-7v12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
  + '</svg>';

/**
 * A generic, license-free mark (no brand imagery) — the demo asset URL the architecture
 * section calls for; `GdsLogoLockup` itself never ships or generates the mark, only
 * composes a consumer-supplied one.
 */
export const GDS_LOGO_LOCKUP_DEMO_MARK = `data:image/svg+xml;utf8,${encodeURIComponent(GDS_LOGO_LOCKUP_DEMO_MARK_SVG)}`;
