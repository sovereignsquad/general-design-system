/**
 * DOM phrase-translation engine. Engine is governed here; the phrase dictionary is consumer
 * data supplied via `loadIndex`.
 *
 * - Remembers each node's original English so re-translation always starts from English, not
 *   the previous locale.
 * - A node whose value matches neither the remembered English nor this engine's last write
 *   was updated by the app; it becomes the new remembered English and is never reverted.
 * - Code, form-control values, and script/style contents stay verbatim; nav and button labels
 *   translate.
 */

/** Loads the English→locale phrase index for a locale. An empty map means "leave English". */
export type GdsPhraseIndexLoader = (locale: string) => Promise<Map<string, string>>;

const translatableAttributes = [
  'aria-label',
  'alt',
  'placeholder',
  'title',
];

export function normalizeGdsPhrase(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function translateWithIndex(value: string, index: Map<string, string>) {
  if (!value) {
    return value;
  }

  return index.get(normalizeGdsPhrase(value)) ?? value;
}

/** Translates one phrase through a loaded index — the single-string form of the engine. */
export async function translateGdsPhrase(value: string, locale: string, loadIndex: GdsPhraseIndexLoader) {
  if (!value || locale === 'en') {
    return value;
  }

  const index = await loadIndex(locale);
  return translateWithIndex(value, index);
}

/**
 * Elements whose text must stay verbatim: code snippets, form control values (e.g. select
 * option locale names), and script/style contents. Links, buttons, and labels do translate.
 */
const VERBATIM_ELEMENTS = 'code, pre, kbd, samp, script, style, input, textarea, select, option';

function shouldSkipNode(node: Node) {
  const parent = node.parentElement;
  return Boolean(parent?.closest(VERBATIM_ELEMENTS));
}

/**
 * English source of every node this module has rewritten, keyed by node so translation is
 * idempotent and re-runnable across locale switches. WeakMap so detached nodes are collected.
 */
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
/**
 * Last value this overlay wrote into each node — distinguishes our own writes from app
 * updates. A current value matching neither the remembered English nor our last write means
 * the app authored it; it becomes the new remembered English.
 */
const lastWrittenText = new WeakMap<Text, string>();
const lastWrittenAttributes = new WeakMap<Element, Map<string, string>>();

function translateTextNode(node: Text, index: Map<string, string>, restore: boolean) {
  if (shouldSkipNode(node)) {
    return;
  }

  const current = node.nodeValue ?? '';
  // First sighting records the English; an app update since our last write becomes the new English.
  let original = originalText.get(node);
  if (original === undefined) {
    original = current;
    originalText.set(node, original);
  } else if (current !== (lastWrittenText.get(node) ?? original)) {
    original = current;
    originalText.set(node, original);
  }

  const normalized = normalizeGdsPhrase(original);
  if (!normalized) {
    return;
  }

  // Switching to English restores the source rather than leaving prior locale text.
  const translated = restore ? normalized : translateWithIndex(normalized, index);
  const next = translated === normalized ? original : original.replace(normalized, translated);
  if (node.nodeValue !== next) {
    node.nodeValue = next;
  }
  lastWrittenText.set(node, next);
}

function translateElementAttributes(element: Element, index: Map<string, string>, restore: boolean) {
  if (element.closest(VERBATIM_ELEMENTS)) {
    return;
  }

  // Same original-preserving rule as text nodes, for attributes.
  let originals = originalAttributes.get(element);
  if (!originals) {
    originals = new Map();
    originalAttributes.set(element, originals);
  }
  let written = lastWrittenAttributes.get(element);
  if (!written) {
    written = new Map();
    lastWrittenAttributes.set(element, written);
  }

  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;

    // Same app-update rule as text nodes.
    if (!originals.has(attribute)) {
      originals.set(attribute, current);
    } else if (current !== (written.get(attribute) ?? originals.get(attribute))) {
      originals.set(attribute, current);
    }
    const original = originals.get(attribute) as string;

    const next = restore ? original : translateWithIndex(original, index);
    if (element.getAttribute(attribute) !== next) {
      element.setAttribute(attribute, next);
    }
    written.set(attribute, next);
  }
}

/**
 * Rewrites `root` into `locale`, or back into English.
 *
 * Safe to call repeatedly and in any order of locales: every pass translates from each node's
 * remembered English rather than from whatever the previous pass left behind.
 */
export async function translateGdsDom(root: ParentNode, locale: string, loadIndex: GdsPhraseIndexLoader) {
  const restore = locale === 'en';
  // English still walks the tree, to restore what an earlier locale overwrote.
  const index = restore ? new Map<string, string>() : await loadIndex(locale);
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
