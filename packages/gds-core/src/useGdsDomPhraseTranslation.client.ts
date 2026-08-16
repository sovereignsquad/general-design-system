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
 * One initial translation pass, then a MutationObserver keeps later-mounted and app-updated
 * nodes in the active locale.
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
