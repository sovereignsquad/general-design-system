// Per-pack leakage budgets for `verify:i18n-leakage`.
//
// CI fails when a pack exceeds its budget, and also when a pack comes in under it without the
// budget being lowered.

export const LEAKAGE_BUDGETS = {
  site: {
    // 3 remaining: German technical prose built from English loanwords ("Overlay-Stack-Governance",
    // "Product Owner, Design Lead, Frontend Lead", "Layout schema JSON"). The detector compares
    // letters only, so German capitalisation/hyphenation of the same words does not clear the flag.
    de: 3,
  },
  package: {},
};

/** Locales with no recorded budget must be clean. */
export const DEFAULT_BUDGET = 0;
