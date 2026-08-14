import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { request } from 'node:https';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { measureCorpusLeakage } from './lib/i18n-leakage.mjs';

const traverse = traverseModule.default ?? traverseModule;

const root = process.cwd();
// Issue 617. The playground's own pages were the only sources, so copy GDS itself owns — a
// component's default prop, a theme preset's label — never entered the corpus and rendered in
// English on an otherwise translated page. Measured on the Korean site: 395 distinct English
// strings, most of them from these files.
const targetFiles = [
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

// Issue 587: ja/ko/zh added. gds-core shipped package packs for all three while the site had
// none, so the reference site could not render in Japanese, Korean or Chinese even though the
// packages a visitor would install support their language. Google Translate uses `zh` for
// Simplified Chinese, matching the `zh` package pack.
const localeIds = ['de', 'fr', 'it', 'es', 'ru', 'he', 'ar', 'hu', 'ja', 'ko', 'zh'];
const outDir = resolve(root, 'apps/playground/src/generated-site-phrases');

function extractPhrases(source) {
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

function parseExistingLocale(locale) {
  try {
    const source = readFileSync(resolve(outDir, `${locale}.ts`), 'utf8');
    const match = source.match(/export const generatedSitePhrases: Record<string, string> = (\{[\s\S]*?\n\}) as const;/);
    if (!match) return {};
    return Function(`return (${match[1]});`)();
  } catch {
    return {};
  }
}

function translate(text, locale) {
  return new Promise((resolveTranslation) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${locale}&dt=t&q=${encodeURIComponent(text)}`;
    const req = request(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const translated = parsed?.[0]?.map((entry) => entry?.[0] ?? '').join('');
          resolveTranslation(translated || text);
        } catch {
          resolveTranslation(text);
        }
      });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolveTranslation(text);
    });
    req.on('error', () => resolveTranslation(text));
    req.end();
  });
}

const phrases = new Set();
for (const relativePath of targetFiles) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  for (const phrase of extractPhrases(source)) {
    phrases.add(phrase);
  }
}

const sortedPhrases = [...phrases].sort((a, b) => a.localeCompare(b));
const existingByLocale = Object.fromEntries(localeIds.map((locale) => [locale, parseExistingLocale(locale)]));
const generated = Object.fromEntries(localeIds.map((locale) => [locale, {}]));
const translationJobs = [];

// Issue 588. A previously-stored value used to be kept whenever it was non-empty, which is
// why leakage ACCUMULATED: a phrase left in English is non-empty, so it was never retried,
// and it survived every regeneration for as long as the file existed. `hu` had reached 50
// such phrases and `de` 44.
//
// A stored value is now retried when it is identical to its English source AND some other
// locale translated that same phrase — peer evidence that the phrase is translatable, so
// this locale missed it. Values identical in every locale (component-name lists such as
// "SidebarNav / SidebarNavSection / SidebarNavItem") are left alone, because nothing shows
// they can be translated. See scripts/lib/i18n-leakage.mjs for why the rule is peer evidence
// rather than an enumerated allowlist.
//
// Self-healing rather than one-off: if a translation request fails, `translate()` falls back
// to the English text, which is exactly the condition this retest detects, so the next run
// picks it up instead of freezing the failure into the artifact.
// The retry set is the gate's own measurement, called on the packs as they stand, so the
// generator repairs exactly what `verify:i18n-leakage` fails on. Two separate notions of
// "untranslated" would drift apart and leave the build unfixable by its own generator.
const leakedByLocale = Object.fromEntries(localeIds.map((locale) => [locale, new Set()]));
if (existsSync(outDir)) {
  for (const row of measureCorpusLeakage(outDir, { referenceIsKey: true }).rows) {
    if (leakedByLocale[row.locale]) leakedByLocale[row.locale] = new Set(row.leakedKeys);
  }
}

let retried = 0;
for (const en of sortedPhrases) {
  for (const locale of localeIds) {
    const existingTranslation = existingByLocale[locale][en];
    const isStored = typeof existingTranslation === 'string' && existingTranslation.trim().length > 0;
    const leaked = isStored && leakedByLocale[locale].has(en);

    if (isStored && !leaked) {
      generated[locale][en] = existingTranslation;
      continue;
    }

    if (leaked) retried += 1;
    translationJobs.push(async () => {
      generated[locale][en] = await translate(en, locale);
    });
  }
}

if (retried > 0) {
  console.log(`Retrying ${retried} peer-evidenced untranslated value(s) (issue 588).`);
}

async function runBounded(jobs, concurrency = 24) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < jobs.length) {
      const job = jobs[index];
      index += 1;
      await job();
    }
  });
  await Promise.all(workers);
}

await runBounded(translationJobs);

mkdirSync(outDir, { recursive: true });

for (const locale of localeIds) {
  const sorted = Object.fromEntries(
    Object.entries(generated[locale]).sort((a, b) => a[0].localeCompare(b[0])),
  );
  writeFileSync(
    resolve(outDir, `${locale}.ts`),
    `// Generated by scripts/generate-site-phrase-translations.mjs.\n` +
    `// Per-locale phrase map: English phrase -> ${locale} translation.\n` +
    `export const generatedSitePhrases: Record<string, string> = ${JSON.stringify(sorted, null, 2)} as const;\n`,
  );
}

const totalPairs = localeIds.reduce((sum, locale) => sum + Object.keys(generated[locale]).length, 0);
console.log(`Generated ${sortedPhrases.length} phrases across ${localeIds.length} locales (${totalPairs} translated pairs).`);
