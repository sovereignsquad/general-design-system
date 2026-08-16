// One extraction, shared by the generator and the gate that checks it.

import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;

// Includes gds-core/gds-theme source files, not just playground pages, so component
// default props and theme preset labels enter the corpus.
export const TARGET_FILES = [
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/showcase-pages.tsx',
  'apps/playground/src/pattern-pages.tsx',
  'apps/playground/src/pattern-registry.ts',
  'apps/playground/src/product-use-cases.ts',
  'apps/playground/src/site-routes.ts',
  // Theme preset and vibe labels/descriptions, rendered on /themes and the Theme Lab.
  'packages/gds-theme/src/theme-presets.ts',
  // Theme Lab preview mock copy lives inline in the explorer, not in its copy map.
  'packages/gds-core/src/ReferenceThemeExplorer.tsx',
  'packages/gds-core/src/GdsAccentContrastMatrix.tsx',
  'packages/gds-core/src/GdsPinSystemReference.tsx',
  'packages/gds-theme/src/vibe-themes.ts',
  // Component default copy: every gds-core component whose props default to English prose.
  'packages/gds-core/src/AISearchCard.tsx',
  'packages/gds-core/src/AsyncSurface.tsx',
  'packages/gds-core/src/BrowseSurface.tsx',
  'packages/gds-core/src/AuthShell.tsx',
  'packages/gds-core/src/BottomTabBar.tsx',
  'packages/gds-core/src/ChatSurface.tsx',
  'packages/gds-core/src/DiscoveryShell.tsx',
  'packages/gds-core/src/EditorialCard.tsx',
  'packages/gds-core/src/GdsAccessGate.tsx',
  'packages/gds-core/src/GdsDataTable.client.tsx',
  'packages/gds-core/src/GdsFormControls.tsx',
  'packages/gds-core/src/GdsPageTemplates.tsx',
  'packages/gds-core/src/GdsResourceManager.client.tsx',
  'packages/gds-core/src/ListingCard.tsx',
  'packages/gds-core/src/GdsSchemaForm.client.tsx',
  'packages/gds-core/src/NumberStepper.tsx',
  'packages/gds-core/src/LayoutTemplatePreview.client.tsx',
  'packages/gds-core/src/Notifications.client.tsx',
  'packages/gds-core/src/Notifications.tsx',
  'packages/gds-core/src/ListingPrimitives.tsx',
  'packages/gds-core/src/SearchableSelect.tsx',
  'packages/gds-core/src/ShareButtonGroup.tsx',
  'packages/gds-core/src/PartnerDiscovery.tsx',
  'packages/gds-core/src/StateBlock.tsx',
  'packages/gds-core/src/SocialAuthButtons.tsx',
  'packages/gds-core/src/UploadDropzone.tsx',
  'packages/gds-core/src/SimpleDataTable.tsx',
];

export function extractPhrases(source) {
  const phrases = new Set();
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  function addPhrase(value) {
    // ALL-CAPS multi-word strings are copy, not identifiers — "TWO PILLARS" and "WHY THIS
    // FITS" render as headings. Single all-caps tokens are still excluded below as acronyms.
    if (!/[A-Za-z][a-z]/.test(value) && !/^[A-Z][A-Z\s]{4,}$/.test(value.trim())) return;
    if (value.includes('\n')) return;
    if (/[{}[\]`]|=>|;\s*$|^\s*,/.test(value)) return;
    if (/^(?:@|\.\/|\/|https?:|mailto:)/.test(value)) return;
    // Excludes CSS values (e.g. `rgba(...)`, `1 1 320px`), which are string literals but not copy.
    if (/^(?:rgba?|hsla?|var|calc|clamp|min|max|url|linear-gradient|radial-gradient|color-mix)\(/i.test(value)) return;
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return;
    // Pure geometry: "1 1 320px", "0 6px 16px …", "0.25rem 0"
    if (/^[\d.\s]*\d(?:px|rem|em|%|vh|vw|fr|s|ms)?(?:[\s,]+[\d.]+(?:px|rem|em|%|vh|vw|fr|s|ms)?)*$/.test(value.trim())) return;
    if (/\d(?:px|rem|em|vh|vw)\b/.test(value) && !/[.!?]/.test(value)) return;
    // Code expressions: `extendGdsTheme(...) / createTheme(...)`
    if (/\w\(/.test(value)) return;
    // HTML attribute keyword lists (`rel="noreferrer noopener"`) are protocol tokens, not copy.
    if (/^(?:noreferrer|noopener|nofollow|external|alternate|_blank|_self)(?:\s+(?:noreferrer|noopener|nofollow|external|alternate))*$/.test(value.trim())) return;
    // Single-token strings excluded from machine translation: one-word UI vocabulary needs
    // human-reviewed context and belongs in `getGdsMessages` instead.
    const token = value.trim();
    const isSingleToken = !/\s/.test(token);
    // Identifier shapes stay out: internal capitals (`GdsBadge`), separators
    // (`partner-discovery`), bare lowercase keys (`music`), short acronyms (`GDS`, `API`).
    if (isSingleToken && !/^[A-Z][a-z]{2,}$/.test(token)) return;
    if (/^(?:id|title|status|draft|published|row-\d+)$/i.test(value.trim())) return;
    // Length ceiling: the translate endpoint is a GET with a URL-length limit; 900 leaves headroom under the measured working ceiling.
    if (value.length > 900) return;
    phrases.add(value.trim());
  }

  traverse(ast, {
    StringLiteral(path) {
      addPhrase(path.node.value);
    },
    JSXText(path) {
      const value = path.node.value.replace(/\s+/g, ' ').trim();
      if (value) addPhrase(value);
    },
  });

  return phrases;
}

