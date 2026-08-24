/**
 * Opt-in lazy locale registry for `gds-core`'s component-internal message dictionaries.
 *
 * `getGdsMessages` (the package's default) eagerly bundles all twelve locales — zero setup,
 * but every consumer pays for every locale whether or not they use it. This subpath is the
 * alternative for a consumer that wants to register only the locales it ships: import
 * `@sovereignsquad/gds-core/locales/lazy/<locale>` for each one, then call
 * {@link getGdsMessagesLazy} instead of `getGdsMessages`. English is always registered — it is
 * the reference locale and the fallback, so it ships either way.
 *
 * Purely additive: `getGdsMessages`, `gdsLocales`, and the individual `en`/`de`/... exports are
 * unaffected by this subpath existing or not being imported.
 */
export { registerGdsLocale, getGdsMessagesLazy, type GdsLocaleDictionary } from './registry';
