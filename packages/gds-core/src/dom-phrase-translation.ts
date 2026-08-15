/**
 * Issue 624 (owner directive, 2026-08-15) — the DOM phrase-translation engine, promoted from
 * the reference site into GDS: every single thing visible on the page must be implemented as
 * part of the GDS, and the mechanism that renders the site's translated text is visible on
 * every localized page. The ENGINE is governed here; the phrase DICTIONARY stays consumer
 * data, supplied through `loadIndex` — the reference site passes its generated packs, and any
 * consumer can pass theirs.
 *
 * What the engine holds, each learned from a shipped defect on the reference site:
 * - Original-text memory per node, so every pass translates from English rather than from the
 *   previous locale (the "selector says Français over a Korean page" defect).
 * - App-update discrimination: a node whose current value is neither the remembered English
 *   nor this engine's own last write was updated by the APP — it becomes the new remembered
 *   English and is translated from there, never reverted (the "every live status froze at its
 *   first value" defect).
 * - Verbatim protection for code, form-control values, and script/style contents — while
 *   navigation and button labels DO translate (skipping them once left 39 strings English).
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
 * Elements whose text must stay verbatim.
 *
 * Issue 617. This used to skip `a`, `button`, `label`, `[role="button"]`, `[role="link"]` and
 * `[role="menuitem"]` as well, which meant **navigation links and button labels never
 * translated** — 39 of the 395 English strings measured on the Korean site were inside them.
 * Those are ordinary copy and a reader expects them in their own language.
 *
 * What genuinely must not be translated is CODE (a snippet is not prose), FORM CONTROL VALUES
 * (a select element's options include the locale names themselves, which stay in their own
 * language by design), and script/style contents.
 */
const VERBATIM_ELEMENTS = 'code, pre, kbd, samp, script, style, input, textarea, select, option';

function shouldSkipNode(node: Node) {
  const parent = node.parentElement;
  return Boolean(parent?.closest(VERBATIM_ELEMENTS));
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
/**
 * What THIS overlay last wrote into each node — the discriminator between "our own write" and
 * "the app updated this text" (owner report, via the map's state line: React moved it from
 * "is loading" to "4 markers", the observer fired, and the overlay wrote the REMEMBERED first
 * value back — freezing every dynamically-updating text on the site at its first-seen value,
 * in every locale including English). When the current value is neither the remembered
 * English nor what we last wrote, the app authored it: it becomes the NEW remembered English
 * and is translated from there, never reverted.
 */
const lastWrittenText = new WeakMap<Text, string>();
const lastWrittenAttributes = new WeakMap<Element, Map<string, string>>();

function translateTextNode(node: Text, index: Map<string, string>, restore: boolean) {
  if (shouldSkipNode(node)) {
    return;
  }

  const current = node.nodeValue ?? '';
  // First sighting records the English; later passes start from it — unless the app has
  // updated the node since our last write, in which case the new value IS the new English.
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

  // Switching back to English restores the source rather than leaving the previous locale's
  // text in place — the same defect in the other direction, and just as visible.
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

  // Same original-preserving rule as text: an `aria-label` rewritten in place would be looked
  // up in the next locale's English-keyed index and never match again.
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

    // Same app-update rule as text nodes: an aria-label the app swaps (a save toggle naming
    // its next action) must not be reverted to its first-seen value.
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
  // English still walks the tree — it has to put back what an earlier locale overwrote. Returning
  // early here is what left the page in the previous language when a reader switched back.
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
