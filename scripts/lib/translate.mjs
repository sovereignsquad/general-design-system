// Machine translation, shared by every generator that needs it.
//
// Extracted when issue 617 added a SECOND consumer (the component-default packs). A copy would
// have been the shorter diff and the wrong one: the two callers must hit the same endpoint with
// the same locale ids, or a phrase and a component default rendering the same English word could
// disagree between the site and the package a visitor installs.
//
// The output is machine translation and is labelled as such wherever it lands. Human review of
// the copy is a separate, later pass — not something this helper claims to have done.

import { request } from 'node:https';

/** The locales GDS ships packs for, minus `en`. Google uses `zh` for Simplified Chinese. */
export const TRANSLATION_LOCALES = ['de', 'fr', 'it', 'es', 'ru', 'he', 'ar', 'hu', 'ja', 'ko', 'zh'];

/**
 * Translate `text` into `locale`, resolving to the ORIGINAL English on any failure.
 *
 * Falling back to English rather than rejecting is deliberate: a network blip must not write a
 * truncated pack or an error string into a shipped file. An untranslated entry is visible to the
 * leakage gate and gets fixed on the next run; a corrupted one is not.
 */
export function translate(text, locale) {
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
