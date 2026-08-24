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
 * Translate `text` into `locale`.
 *
 * Resolves `{ text, ok }`. `ok` is false when the endpoint could not be reached or its response
 * could not be parsed, and `text` is then the ORIGINAL English. Callers must distinguish the two:
 * writing a fallback over a stored translation downgrades it, and the caller is the only layer
 * that knows whether a stored value exists (issue 660).
 *
 * Falling back rather than rejecting is deliberate: a network blip must not write a truncated
 * pack or an error string into a shipped file. Returning `ok` is what keeps that from being
 * silent — a failed call and a successful one that legitimately returns the source text are
 * otherwise identical strings.
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
          resolveTranslation(translated ? { text: translated, ok: true } : { text, ok: false });
        } catch {
          resolveTranslation({ text, ok: false });
        }
      });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolveTranslation({ text, ok: false });
    });
    req.on('error', () => resolveTranslation({ text, ok: false }));
    req.end();
  });
}

/**
 * Pick what to write for one phrase, given a {@link translate} result and whatever is already
 * committed for that locale.
 *
 * The invariant: a failed call never replaces a stored translation. `preserved` reports when
 * that rule fired, so a caller can say how much of a run was real (issue 660).
 */
export function chooseTranslationValue(result, storedValue) {
  const stored = typeof storedValue === 'string' && storedValue.trim().length > 0;
  if (result.ok) return { value: result.text, preserved: false, failed: false };
  if (stored) return { value: storedValue, preserved: true, failed: true };
  return { value: result.text, preserved: false, failed: true };
}
