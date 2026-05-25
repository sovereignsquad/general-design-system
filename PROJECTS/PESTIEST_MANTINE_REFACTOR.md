# Pesti Est Mantine Refactor

Status: In progress
Version: 1.0.0
Last updated: 2026-05-24
Project: `budapest-night` / `Pesti Est`

## Objective

Capture Pesti Est as a real GDS consumer and close the remaining package, theme-extension, RTL, and shared-surface gaps.

## Current state

- Mantine migration completed in the product
- local `pestiestTheme` extends the GDS baseline
- product needs published packages rather than sibling-repo assumptions
- discovery cards, public shells, admin layouts, and i18n/RTL support still depend on local composition

## Required central GDS dependencies

1. published packages with CI/Vercel install guidance
2. product-brand extension rules on top of `gdsTheme`
3. discovery/public shell and listing-card contracts
4. data toolbar, state block, auth shell, and admin CRUD coverage
5. Next.js + `next-intl` + RTL consumption guidance
6. shared ESLint/compliance toolkit

## Product-specific notes

- default dark/editorial chrome and flat surfaces must remain brand-valid
- Lucide/map/embed usage should stay documented exceptions unless promoted centrally
- six-locale QA expectations should inform the shared RTL/i18n checklist

## Exit criteria

- Pesti Est appears in the portfolio matrix with explicit next actions
- the GDS repo records the project’s package/theme/i18n adoption map
- the remaining local duplicates are mapped to shared contracts or approved exceptions
