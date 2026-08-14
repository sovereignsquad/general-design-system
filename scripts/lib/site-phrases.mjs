// Issue 617 — ONE extraction, shared by the generator and the gate that checks it.
//
// `verify-site-phrase-translations.mjs` kept its own copy of the file list and the phrase
// filter. The moment the generator's filters changed, the two disagreed: the gate demanded a
// translation for `redacted@example.com` that the generator had (correctly) stopped extracting,
// and the build failed on a phrase nobody wanted. Two implementations of the same question
// drift apart the first time either is touched — the same reason the leakage detector lives in
// scripts/lib/i18n-leakage.mjs rather than in both places.

import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;

// Issue 617. The playground's own pages were the only sources, so copy GDS itself owns — a
// component's default prop, a theme preset's label — never entered the corpus and rendered in
// English on an otherwise translated page. Measured on the Korean site: 395 distinct English
// strings, most of them from these files.
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
    // Issue 617. Adding the theme files as sources pulled in their CSS VALUES — `rgba(...)`,
    // `0 6px 16px rgba(...)`, `1 1 320px` — which are string literals but not copy. They bloated
    // the corpus, wasted a translation request each, and polluted the leakage metric, which
    // counted them as untranslated English. Translating one would be worse than useless.
    if (/^(?:rgba?|hsla?|var|calc|clamp|min|max|url|linear-gradient|radial-gradient|color-mix)\(/i.test(value)) return;
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return;
    // Pure geometry: "1 1 320px", "0 6px 16px …", "0.25rem 0"
    if (/^[\d.\s]*\d(?:px|rem|em|%|vh|vw|fr|s|ms)?(?:[\s,]+[\d.]+(?:px|rem|em|%|vh|vw|fr|s|ms)?)*$/.test(value.trim())) return;
    if (/\d(?:px|rem|em|vh|vw)\b/.test(value) && !/[.!?]/.test(value)) return;
    // Code expressions: `extendGdsTheme(...) / createTheme(...)`
    if (/\w\(/.test(value)) return;
    // HTML attribute keyword lists (`rel="noreferrer noopener"`) are protocol tokens, not copy.
    if (/^(?:noreferrer|noopener|nofollow|external|alternate|_blank|_self)(?:\s+(?:noreferrer|noopener|nofollow|external|alternate))*$/.test(value.trim())) return;
    // Single-token strings are excluded, and issue 617 is the reason to LEAVE them excluded.
    //
    // It looks like a bug: "Choir" and "Saved" render in English on an otherwise Korean page
    // because of this line, while the two-word "Verified host" beside them translates. Widening
    // it to accept capitalised words was tried and MEASURED — 226 new entries — and roughly a
    // quarter came back confidently wrong, because a single word carries no context for a
    // machine translator to disambiguate:
    //
    //   Browse    -> 먹다        ("to eat" — grazing, not the nav action)
    //   About     -> 에 대한      (the preposition, not the page)
    //   Adoption  -> 양자        (adopting a child)
    //   Back      -> 뒤쪽에      (positional "at the back", not the action)
    //   Amenities -> 예의        ("manners")
    //
    // Replacing an English fragment with confidently wrong Korean is worse than leaving it in
    // English: the reader can see the first and cannot see the second. One-word UI vocabulary
    // belongs in the REVIEWED message catalogue (`getGdsMessages`, 188 keys x 12 locales),
    // where a human chose the term — not in a machine-translated phrase corpus. Issue 617.
    const token = value.trim();
    const isSingleToken = !/\s/.test(token);
    // Identifier SHAPES stay out: internal capitals (`GdsBadge`), separators
    // (`partner-discovery`), bare lowercase keys (`music`) and short acronyms (`GDS`, `API`).
    // An ordinary capitalised word is copy — `Choir`, `Saved`, `Browse` were dropped here and
    // rendered in English on an otherwise translated page.
    if (isSingleToken && !/^[A-Z][a-z]{2,}$/.test(token)) return;
    if (/^(?:id|title|status|draft|published|row-\d+)$/i.test(value.trim())) return;
    if (value.length > 240) return;
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

