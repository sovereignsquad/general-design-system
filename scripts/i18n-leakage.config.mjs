// Issue 588 — per-pack leakage budgets for `verify:i18n-leakage`.
//
// A budget is a RECORD OF WHAT IS STILL WRONG, not permission for it. Every non-zero entry
// names what remains and what would clear it. CI fails when a pack exceeds its budget and
// also when a pack comes in UNDER it without the budget being lowered, so the numbers cannot
// quietly stop meaning anything (the same ratchet rule as audit/budgets.json).

export const LEAKAGE_BUDGETS = {
  site: {
    // Machine translation cannot resolve these. Verified 2026-08-13 against the same
    // translate endpoint the generator uses: "Docs Code Blocks", "Reference Link Grid",
    // "Docs Shell", "Auth Shells", "Admin AppShell", "Fit Score Chip" and "Partner LLC ©2026"
    // all come back byte-identical for Hebrew. Seven other locales translated them, which is
    // why they are flagged and why the flag is correct — but clearing them needs a human
    // Hebrew translator, and inventing the strings would violate Rule 11. Tracked as #611.
    he: 7,
    // German technical prose that is genuinely built from English loanwords:
    // "Overlay stack governance" and "Product owner, design lead, frontend lead". Verified
    // 2026-08-13 against the translate endpoint, which returns "Overlay-Stack-Governance" and
    // "Product Owner, Design Lead, Frontend Lead" — German noun capitalisation and compound
    // hyphenation of the same words, not a different phrase. The detector compares letters
    // only, so orthography does not clear the flag, and it should not: the rule stays honest
    // about what it can and cannot tell apart rather than being loosened to hide two cases.
    // Issue 617 added "Layout schema JSON" to the corpus when the theme and component copy
    // sources were included; German renders it with the same words. Same category as the two
    // below, which are English loanwords German uses verbatim.
    de: 3,
  },
  package: {},
};

/** Locales with no recorded budget must be clean. */
export const DEFAULT_BUDGET = 0;
