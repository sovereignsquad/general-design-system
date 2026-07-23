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

function translateTextNode(node: Text, index: Map<string, string>) {
  if (shouldSkipNode(node)) {
    return;
  }

  const original = node.nodeValue ?? '';
  const normalized = normalizePhrase(original);
  if (!normalized) {
    return;
  }

  const translated = translateWithIndex(normalized, index);
  if (translated !== normalized) {
    node.nodeValue = original.replace(normalized, translated);
  }
}

function translateElementAttributes(element: Element, index: Map<string, string>) {
  if (element.closest('a, button, code, input, label, option, pre, script, select, style, textarea, [role="button"], [role="link"], [role="menuitem"]')) {
    return;
  }

  for (const attribute of translatableAttributes) {
    const value = element.getAttribute(attribute);
    if (!value) continue;
    const translated = translateWithIndex(value, index);
    if (translated !== value) {
      element.setAttribute(attribute, translated);
    }
  }
}

export async function translateSiteDom(root: ParentNode, locale: string) {
  if (locale === 'en') {
    return;
  }

  const index = await loadPhraseIndex(locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current: Node | null = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      translateTextNode(current as Text, index);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(current as Element, index);
    }
    current = walker.nextNode();
  }
}
