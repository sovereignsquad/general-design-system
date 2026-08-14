import type { SiteLocaleId } from './site-copy';

type PhraseMap = Record<string, string>;

// Each loader is its own static dynamic-import() call (not a template-literal
// path) so bundlers can code-split every locale into its own chunk — a visitor
// only ever downloads the one language they actually picked, not all eight.
const localeLoaders: Partial<Record<SiteLocaleId, () => Promise<{ generatedSitePhrases: PhraseMap }>>> = {
  de: () => import('./generated-site-phrases/de'),
  fr: () => import('./generated-site-phrases/fr'),
  it: () => import('./generated-site-phrases/it'),
  es: () => import('./generated-site-phrases/es'),
  ru: () => import('./generated-site-phrases/ru'),
  he: () => import('./generated-site-phrases/he'),
  ar: () => import('./generated-site-phrases/ar'),
  hu: () => import('./generated-site-phrases/hu'),
  ja: () => import('./generated-site-phrases/ja'),
  ko: () => import('./generated-site-phrases/ko'),
  zh: () => import('./generated-site-phrases/zh'),
};

const phraseIndexCache = new Map<string, Map<string, string>>();

async function loadPhraseIndex(locale: string): Promise<Map<string, string>> {
  const cached = phraseIndexCache.get(locale);
  if (cached) {
    return cached;
  }

  const loader = localeLoaders[locale as SiteLocaleId];
  const index = new Map<string, string>();
  if (loader) {
    const { generatedSitePhrases } = await loader();
    for (const [en, translated] of Object.entries(generatedSitePhrases)) {
      index.set(en, translated);
    }
  }

  phraseIndexCache.set(locale, index);
  return index;
}

const translatableAttributes = [
  'aria-label',
  'alt',
  'placeholder',
  'title',
];

function normalizePhrase(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function translateWithIndex(value: string, index: Map<string, string>) {
  if (!value) {
    return value;
  }

  return index.get(normalizePhrase(value)) ?? value;
}

export async function translateSitePhrase(value: string, locale: string) {
  if (!value || locale === 'en') {
    return value;
  }

  const index = await loadPhraseIndex(locale);
  return translateWithIndex(value, index);
}

function shouldSkipNode(node: Node) {
  const parent = node.parentElement;
  return Boolean(parent?.closest('a, button, code, input, label, option, pre, script, select, style, textarea, [role="button"], [role="link"], [role="menuitem"]'));
}

/**
 * The English source of every node this module has ever rewritten.
 *
 * WHY THIS EXISTS. Translation used to read the node's CURRENT text and overwrite it, which
 * destroyed the English the phrase index is keyed by. That made the pass work exactly once:
 * switching from Korean to French looked up Korean text in an English-keyed map, found nothing,
 * and left the page in Korean while the locale selector said "Français". Only strings React
 * re-rendered from `page-copy` changed language, which is why a single button read "Enregistrer"
 * on an otherwise Korean page.
 *
 * Remembering the original makes the pass idempotent and, more importantly, re-runnable: every
 * switch translates from English rather than from whatever the last locale left behind. A
 * `WeakMap` so detached nodes are collected with the DOM.
 */
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function translateTextNode(node: Text, index: Map<string, string>, restore: boolean) {
  if (shouldSkipNode(node)) {
    return;
  }

  // First sighting records the English; later passes always start from it.
  const original = originalText.get(node) ?? node.nodeValue ?? '';
  if (!originalText.has(node)) {
    originalText.set(node, original);
  }

  const normalized = normalizePhrase(original);
  if (!normalized) {
    return;
  }

  // Switching back to English restores the source rather than leaving the previous locale's
  // text in place — the same defect in the other direction, and just as visible.
  if (restore) {
    if (node.nodeValue !== original) {
      node.nodeValue = original;
    }
    return;
  }

  const translated = translateWithIndex(normalized, index);
  const next = translated === normalized ? original : original.replace(normalized, translated);
  if (node.nodeValue !== next) {
    node.nodeValue = next;
  }
}

function translateElementAttributes(element: Element, index: Map<string, string>, restore: boolean) {
  if (element.closest('a, button, code, input, label, option, pre, script, select, style, textarea, [role="button"], [role="link"], [role="menuitem"]')) {
    return;
  }

  // Same original-preserving rule as text: an `aria-label` rewritten in place would be looked
  // up in the next locale's English-keyed index and never match again.
  let originals = originalAttributes.get(element);
  if (!originals) {
    originals = new Map();
    originalAttributes.set(element, originals);
  }

  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;

    if (!originals.has(attribute)) {
      originals.set(attribute, current);
    }
    const original = originals.get(attribute) as string;

    const next = restore ? original : translateWithIndex(original, index);
    if (element.getAttribute(attribute) !== next) {
      element.setAttribute(attribute, next);
    }
  }
}

/**
 * Rewrites `root` into `locale`, or back into English.
 *
 * Safe to call repeatedly and in any order of locales: every pass translates from each node's
 * remembered English rather than from whatever the previous pass left behind.
 */
export async function translateSiteDom(root: ParentNode, locale: string) {
  const restore = locale === 'en';
  // English still walks the tree — it has to put back what an earlier locale overwrote. Returning
  // early here is what left the page in the previous language when a reader switched back.
  const index = restore ? new Map<string, string>() : await loadPhraseIndex(locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current: Node | null = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      translateTextNode(current as Text, index, restore);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(current as Element, index, restore);
    }
    current = walker.nextNode();
  }
}
