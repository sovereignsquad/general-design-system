# Service Backbone Implementation Plan

Status: Active SSOT
Version: 4.1.0
Last updated: 2026-07-26

This document turns the General Design System into a reliable cross-project service, not just a policy library. It defines the operating backbone required so products can adopt Mantine-only UI in a followable, replicable, and maintainable way without reinventing rules in each repository.

## Objective

The General Design System must support:

- one reliable Mantine-only authority across projects
- repeatable adoption in both new and legacy repositories
- project-local flexibility without behavior drift
- enforcement that prevents silent regressions
- portfolio-level rollout planning instead of one-project-at-a-time improvisation

The target is a service model where a product team can answer these questions quickly:

- which shared contracts are mandatory for my product type?
- what local files must implement them?
- what is allowed to differ locally?
- how do I prove compliance?
- what do I fix next if my product is not compliant yet?

## Service Backbone Layers

The GDS service backbone has six required layers.

### 1. Authority Layer

Owned by:

- `FOUNDATION.md`
- `COMPONENTS_AND_PATTERNS.md`

Responsibility:

- define the non-negotiable Mantine-only rules
- define component and workflow behavior
- define responsive, accessibility, and state expectations

Failure mode if missing:

- local repos re-interpret the rules
- products fork interaction meaning
- migration work becomes aesthetic rather than contractual

### 2. Pattern Service Layer

Owned by:

- `PATTERN_SERVICE_MODEL.md`

Responsibility:

- convert references such as Mantine UI into governed reusable contracts
- define the lifecycle from problem to contract to enforcement
- define contract maturity and compatibility promises

Failure mode if missing:

- teams copy examples directly into product code
- repeated patterns stay page-local
- products drift while claiming to “follow the design system”

### 3. Adoption Layer

Owned by:

- `GOVERNANCE_AND_ADOPTION.md`
- `PROJECTS/*`

Responsibility:

- define local adapter requirements
- define migration readiness and rollout phases
- define project-specific sequencing and allowed exceptions

Failure mode if missing:

- projects acknowledge the GDS without a practical adoption path
- migrations stall after provider/theme setup
- local exceptions accumulate without removal plans

### 4. Validation Layer

Owned by:

- project-local lint/static checks
- project-local visual/readability checks
- project-local contract inventories

Responsibility:

- block new drift
- prove high-traffic surfaces comply with shared contracts
- catch authority conflicts early

Failure mode if missing:

- teams reintroduce raw CSS, local primitives, or duplicate shells after migration
- “Mantine-only” becomes a claim rather than a verified state

### 5. Portfolio Layer

Owned by:

- `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md`

Responsibility:

- classify projects by current foundation and migration risk
- define recommended sequencing across the portfolio
- identify shared remediation patterns that should be solved once and reused

Failure mode if missing:

- every project solves the same migration problem differently
- high-risk projects consume attention without shared leverage
- roadmap prioritization depends on memory instead of evidence

### 6. Lifecycle Layer

Owned by:

- GDS versioning
- changelog discipline
- contract maturity states
- exception/deprecation process

Responsibility:

- keep the GDS predictable as it evolves
- preserve compatibility expectations
- make breaking changes explicit

Failure mode if missing:

- projects cannot tell whether a change is additive, required, or breaking
- local adapters fall out of sync silently

## Required Contract Maturity Model

Every shared pattern contract must have one maturity state:

| State | Meaning | Allowed Usage |
|---|---|---|
| `reference-only` | useful idea source, not yet a GDS contract | may not be copied broadly |
| `planned` | GDS intends to formalize it | local experiments must stay narrow |
| `pilot` | one project is validating the contract | reuse only with explicit note |
| `active` | approved reusable contract | preferred/default path |
| `required` | must be used when applicable | local alternatives are non-compliant |
| `deprecated` | old contract pending removal | no new usage |

The default target for high-leverage repeated workflows is `required`, not `active forever`.

## Compatibility Promise

The GDS service must promise compatibility at the contract level.

Every active or required contract must define:

- purpose
- semantic slots
- required states
- responsive behavior
- accessibility baseline
- Mantine primitive base
- local adapter responsibility
- known allowed exception scope

Projects may vary:

- content
- local data wiring
- narrow domain-specific secondary actions
- branded imagery where product identity requires it

Projects may not vary:

- the semantic role of the pattern
- the primary action hierarchy
- the default responsive model
- the accessibility/state contract
- the foundational primitive system

## Portfolio Rollout Model

Projects should not all migrate in the same way. The portfolio should be handled by archetype.

### Archetype A: Already Mantine-Rooted, Needs Drift Cleanup

Examples:

- SSO
- KIDEX

Primary work:

- shell normalization
- state-system cleanup
- CSS deletion
- contract enforcement

### Archetype B: Mixed Foundation, Mantine Already Present

Examples:

- Amanoba

Primary work:

- finish replacing Tailwind/Radix product primitives
- define local contracts
- delete hybrid authority

### Archetype C: Custom Local System, No Real Mantine Runtime Yet

Examples:

- Messmass

Primary work:

- resolve local authority conflicts
- install/centralize Mantine runtime
- migrate shared admin/reporting/analytics primitives first

### Archetype D: Alternate UI Framework Present

Examples:

- Launchmass (MUI detected from package manifest)

Primary work:

- decide whether a true Mantine migration is approved now
- if yes, treat as full replacement rather than bridge
- if no, document temporary non-compliance explicitly at portfolio level

### Archetype E: Tailwind-First Apps Without Mantine

Detected from package manifests:

- Cardmass
- Everytest
- Mosaic

Primary work:

- phase-0 governance freeze
- define root Mantine runtime plan
- choose one high-value surface for first migration

### Archetype F: Unknown Foundation / Discovery Required

Examples detected without enough UI evidence:

- Blockmass
- Fanmass
- Kormanyvalto
- Manus
- Misisimi
- Narimato
- Openclaw
- Opencode
- Paperclip
- Partnerfonts
- Sovereign

Primary work:

- do not guess
- create a one-page discovery note
- identify whether the project is product UI, internal tooling, content-heavy, or infra-first
- only then schedule migration work

## Implementation Phases For The GDS Itself

### Phase 1: Authority Hardening

Deliverables:

- Mantine-only SSOT language is consistent across all root documents
- no local-wrapper-first or hybrid-authority language remains in shared rules
- required reading order is explicit

Exit criteria:

- a project cannot honestly read the GDS and conclude that two UI foundations are allowed

### Phase 2: Service Model Hardening

Deliverables:

- `PATTERN_SERVICE_MODEL.md` defines lifecycle, maturity, and compatibility
- repeated pattern families have explicit service ownership
- borrowing rules are operational rather than aspirational

Exit criteria:

- a product team knows how to promote an idea into a contract without inventing a process

### Phase 3: Portfolio Matrix

Deliverables:

- a current inventory of projects, foundation signals, archetypes, risks, and next actions
- project-specific migration docs for confirmed high-priority apps

Exit criteria:

- portfolio planning can be driven from one matrix instead of scattered memory

### Phase 4: Local Adapter Standardization

Deliverables:

- every active app has a documented local adapter path
- every adapter lists contract paths, status, exceptions, and backlog

Exit criteria:

- GDS reviewers can locate a project's real implementation points quickly

### Phase 5: Guardrail Standardization

Deliverables:

- standard lint/static rules recommended for all projects
- mode/readability validation expectations
- contract-inventory expectation for high-traffic surfaces

Exit criteria:

- “compliant” means provable, not rhetorical

### Phase 6: Portfolio Review Cadence

Deliverables:

- monthly or release-based portfolio review
- stale exception cleanup
- migration status updates in project plans

Exit criteria:

- the GDS remains operationally current instead of becoming a static repository

## Required Project Fix Patterns

The same classes of issues should be fixed consistently across projects.

### 1. Authority Conflict

Symptom:

- local docs say Mantine is desired later, but local wrappers/CSS are still treated as current authority

Fix:

- update local docs immediately
- mark legacy UI as frozen
- define exact provider/theme paths

### 2. Hybrid Primitive Drift

Symptom:

- Mantine exists, but Tailwind/Radix/MUI/local primitives still compete in feature code

Fix:

- freeze new non-Mantine product UI
- migrate highest-traffic shared surfaces first
- enforce import boundaries

### 3. Pattern Reinvention

Symptom:

- each page creates its own shell, card, metric, table toolbar, or state block

Fix:

- identify the repeated workflow
- promote a contract into GDS or local adapter
- delete competing variants

### 4. CSS Authority Leakage

Symptom:

- local CSS files or modules still drive product layout, spacing, color, or states

Fix:

- move decisions into Mantine theme and component APIs
- keep CSS only for narrow structural or non-product exceptions

## Operating Cadence

The GDS should be reviewed on this cadence:

- every normative contract addition: update `CHANGELOG.md`
- every project kickoff: review `PROJECTS/PORTFOLIO_ADOPTION_MATRIX.md`
- every migration phase completion: update the relevant project plan
- every month or release train: review stale exceptions, stale status, and missing adapters

## Definition Of Success

The service backbone is working when:

- projects adopt Mantine-only rules without reinterpretation
- a new project can start from a clear, finite checklist
- legacy migrations follow a repeatable path
- cross-project patterns are promoted once and reused broadly
- compliance is validated through local adapter paths and guardrails
- portfolio planning highlights the next highest-leverage migrations clearly
