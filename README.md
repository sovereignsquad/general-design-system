# General Design System

Status: Active SSOT
Version: 2.4.2
Last updated: 2026-05-25

`/Users/Shared/Projects/general-design-system` is the cross-project single source of truth for design, UI, and UX.

## How to Use This Design System

This repository serves as the central, hardened hub for all UI, UX, and design patterns across projects. It is organized around strict foundation rules, reusable component contracts, a cross-project pattern service model, and governance requirements.

### Getting Started

1. **Familiarize Yourself with the Foundation**: Start by reading [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md) to understand the core principles, accessibility baselines, and our strict Mantine token policies.
2. **Review the Component Contracts**: Before building a new UI component or workflow, check [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md) to see if a canonical pattern already exists for buttons, tables, modals, public shells, docs pages, or public data surfaces.
3. **Use the Pattern Service Model**: Before borrowing from Mantine UI or another project, read [PATTERN_SERVICE_MODEL.md](/Users/Shared/Projects/general-design-system/PATTERN_SERVICE_MODEL.md) to convert references into governed, reusable contracts.
4. **Read the Service Backbone Plan**: Use [SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md](/Users/Shared/Projects/general-design-system/SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md) to understand how the GDS operates as a reliable, cross-project service with adoption, validation, and portfolio layers.
5. **Adopt & Migrate**: Use [GOVERNANCE_AND_ADOPTION.md](/Users/Shared/Projects/general-design-system/GOVERNANCE_AND_ADOPTION.md) to understand how to correctly implement this system in a new or legacy codebase, including the required local project statement, the adoption manifest, and compliance tooling.
6. **Check Compatibility & Release Rules**: Use [COMPATIBILITY_AND_RELEASES.md](/Users/Shared/Projects/general-design-system/COMPATIBILITY_AND_RELEASES.md) before wiring package installs, CI/Vercel builds, or framework upgrades.

### What You Can Find Here

- **Core Principles & Tokens**: [FOUNDATION.md](/Users/Shared/Projects/general-design-system/FOUNDATION.md) — The fundamental rules that guide UI decisions, dark/light modes, and Mantine boundaries.
- **Component Contracts & Patterns**: [COMPONENTS_AND_PATTERNS.md](/Users/Shared/Projects/general-design-system/COMPONENTS_AND_PATTERNS.md) — Required behaviors for standard UI elements and full-page workflows.
- **Pattern Service Model**: [PATTERN_SERVICE_MODEL.md](/Users/Shared/Projects/general-design-system/PATTERN_SERVICE_MODEL.md) — The reusable cross-project process for borrowing Mantine-native patterns, promoting them into contracts, and enforcing consistency.
- **Service Backbone Plan**: [SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md](/Users/Shared/Projects/general-design-system/SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md) — The operating model that makes the GDS reliable, adaptable, and replicable across a portfolio of projects.
- **Governance & Migration**: [GOVERNANCE_AND_ADOPTION.md](/Users/Shared/Projects/general-design-system/GOVERNANCE_AND_ADOPTION.md) — Strict rules on how projects must adopt the system, review PRs, and deprecate old code.
- **Compatibility & Releases**: [COMPATIBILITY_AND_RELEASES.md](/Users/Shared/Projects/general-design-system/COMPATIBILITY_AND_RELEASES.md) — Supported Mantine/React/Next ranges, subpath exports, version alignment, and upgrade expectations.
- **Theme Governance**: [THEME_GOVERNANCE.md](/Users/Shared/Projects/general-design-system/THEME_GOVERNANCE.md) — Brand extension, dark-mode defaults, white-label, flat-surface, and tenant-theme rules.
- **Exception Surfaces**: [EXCEPTION_SURFACES.md](/Users/Shared/Projects/general-design-system/EXCEPTION_SURFACES.md) — Chart, map, embed, and other approved exception-surface guidance.
- **Deprecations & Migrations**: [DEPRECATIONS_AND_MIGRATIONS.md](/Users/Shared/Projects/general-design-system/DEPRECATIONS_AND_MIGRATIONS.md) — Contract retirement policy, migration rules, and release handover expectations.
- **Portfolio Matrix**: [PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md](/Users/Shared/Projects/general-design-system/PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md) — The current cross-project inventory, archetypes, and recommended next actions.
- **Operational Files**: `CONTRIBUTING.md` and `CHANGELOG.md` — Shared rules for contributing to the design system and its versioned history.
- **Templates**: `TEMPLATES/` — Starter templates for your project's theme, providers, shell, and thin wrappers.
- **Machine-readable Contracts**: `compatibility.matrix.json`, `schemas/gds-adoption.schema.json`, and `TEMPLATES/gds-adoption.json.template` — shared compatibility, adoption, and validation contracts.
- **Tooling Packages**: `@gds/eslint-config` and `@gds/compliance` — shared lint and compliance enforcement for adopting repos.
- **Locale Bridge**: `getGdsMessages(locale)` and `GdsLocale` from `@gds/core` — canonical bridge for host i18n systems that want GDS-owned semantic labels only.
- **Reference Consumers**: `apps/reference-vite` and `apps/reference-next` — verified fixture apps that exercise the canonical package-consumption path.
- **Projects**: `PROJECTS/` — Product-specific migration plans and adoption strategies.

---

Product repositories may document:
- local theme/provider paths
- local implementation paths for required pattern contracts
- wrapper component paths
- migration state
- validation commands
- narrow approved exceptions
- consumed GDS version and shared package install path

Product repositories may **not** redefine:
- component behavior
- interaction patterns
- token policy
- responsive strategy
- accessibility baseline
- UX meaning of canonical controls

**If a project-local UI document conflicts with this directory, this directory wins.**

## Repository Rules

This directory is intended to be managed as its own git repository.

Required repository behavior:
- every normative change is committed here, not only in consuming product repos
- projects should reference the SSOT path and aligned version/date in local docs
- projects should use the portfolio matrix and project plans when sequencing GDS work
- breaking behavior changes should be treated as major contract changes
- additive patterns should be documented here before they spread to multiple products

## Validation Commands

- `npm run verify:release` — checks release alignment, then runs build, lint, and tests
- `npm run verify:references` — validates the reference consumers and their adoption manifests
- `npm run build` — builds `@gds/theme`, `@gds/core`, `@gds/admin`, and the playground in dependency order
- `npm run lint` — runs the playground lint target
- `npm run test:run` — runs the shared jsdom component test suite for the workspace packages

The shared package validation path is now expected to cover:
- provider composition in `@gds/theme`
- behavior coverage in `@gds/core` and `@gds/admin`
- i18n-safe shared copy
- reference consumer manifests and fixture validation
- compliance tooling and shared lint enforcement
- GitHub Actions quality gates before deployment
- version and project-plan alignment for active adopter releases

## Non-Negotiable Rules

- One interaction concept gets one canonical pattern.
- One product gets one active theme and token source.
- New product UI must use Mantine primitives or thin approved wrappers around them.
- No new product UI may bypass Mantine with raw custom primitives, ad hoc HTML/CSS controls, or alternate component frameworks.
- Mantine UI examples may be used only as reference material; reusable output must become GDS-governed project contracts.
- Raw colors and repeated hard-coded spacing in feature code are prohibited.
- Dark/light mode readability is mandatory; mixed-mode surfaces require documented exceptions.
- Loading, empty, error, success, disabled, and permission states are part of every component contract.
- Mobile and responsive behavior must be designed intentionally, not inherited accidentally from desktop.
- Accessibility is part of design acceptance, not a cleanup pass.
- Internationalization resilience is mandatory for shared patterns.
