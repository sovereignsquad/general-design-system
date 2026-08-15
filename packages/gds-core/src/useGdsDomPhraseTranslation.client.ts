'use client';

import { useEffect } from 'react';
import { translateGdsDom } from './dom-phrase-translation';
import type { GdsPhraseIndexLoader } from './dom-phrase-translation';

/** Options for {@link useGdsDomPhraseTranslation}. */
export interface UseGdsDomPhraseTranslationOptions {
  /** The subtree to keep translated. */
  root: HTMLElement | null;
  /** Active locale; `'en'` restores the remembered source text. */
  locale: string;
  /** Supplies the English→locale index. The reference site passes its generated packs. */
  loadIndex: GdsPhraseIndexLoader;
  /** Re-run key for route changes — a new page mounts new nodes the observer must sweep. */
  routeKey?: string;
}

/**
 * Issue 624 — the overlay lifecycle that used to live in the reference site's App shell:
 * one initial pass, then a MutationObserver keeping later-mounted and app-updated nodes in
 * the active locale. The engine's own-write memory is what makes observing `characterData`
 * safe — without it this exact loop froze every live status at its first value.
 */
export function useGdsDomPhraseTranslation({ root, locale, loadIndex, routeKey }: UseGdsDomPhraseTranslationOptions) {
  useEffect(() => {
    if (!root) return undefined;

    let cancelled = false;
    const run = () => { translateGdsDom(root, locale, loadIndex).catch(() => {}); };
    run();
    const observer = new MutationObserver(() => { if (!cancelled) run(); });
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [root, locale, loadIndex, routeKey]);
}
