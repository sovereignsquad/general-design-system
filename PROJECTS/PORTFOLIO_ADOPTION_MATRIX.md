# Portfolio Adoption Matrix

Status: Active SSOT
Version: 3.14.14
Last updated: 2026-07-26

This matrix gives the shared GDS a portfolio-level view of where each project stands, what kind of migration it needs, and what the next practical move should be.

Evidence sources:

- project-specific plans already tracked in `PROJECTS/`
- package-manifest signals gathered from local repositories on 2026-05-23
- known local repo documentation where available

Where evidence is weak, this document marks the recommendation as discovery-first rather than pretending certainty.

## Portfolio Priority Rules

Prioritize in this order:

1. projects with active product surfaces and known authority conflicts
2. projects with Mantine already present but still drifting
3. projects with competing framework foundations that will become harder to unwind later
4. projects without enough evidence, which should be triaged before deep planning

## Matrix

| Project | Observed Foundation Signal | Archetype | Risk | Recommendation |
|---|---|---|---|---|
| Amanoba | `@sovereignsquad/gds-*` adopted on `main`; patterns in `patterns/gds/`; shared `AccessRecoveryPanel`; learner shell/course cards remain intentional locals pending wider reuse proof | Package adoption in progress | High | Bump to latest GDS line; delete recovery local now; keep learner shell and course/gamification cards local until a second product proves the same contract. |
| KIDEX | Mantine detected; active project plan exists | Mantine-rooted drift cleanup | Medium | Keep mobile shell, dashboard, and child-registry normalization as the next priority; focus on action hierarchy and responsive consistency. |
| SSO | Mantine detected; active project plan exists | Mantine-rooted drift cleanup | Medium | Finish docs/editorial migration and delete the remaining legacy CSS/gds-theme stack. |
| Impact / sovereignsquad | Mantine 7 + Vite MPA; local shell/state adapters; vendored theme behavior | Mantine-rooted contract gap | Medium | Publish package install path first, then align public shell, docs shell, state/upload surfaces, and dark-mode policy. |
| Camera | Shared-system candidate with admin/public/media/editor requirements; framework upgrade pressure | Shared contract driver | High | Prioritize compatibility, SSR-safe exports, admin contract strengthening, and media/editor/access pattern families. |
| Messmass | No Mantine package detected; active product repo with local custom UI system; local coding standards still contain stale hybrid-authority language | Custom local system | Critical | Create root Mantine runtime, rewrite local authority docs, and migrate shared admin/reporting/analytics shells and primitives first. |
| Launchmass | MUI detected from package manifest | Alternate UI framework | High | Make an explicit portfolio decision: approve a true Mantine migration or record temporary non-compliance. Do not allow silent long-lived MUI divergence. |
| Cardmass | Tailwind detected from package manifest | Tailwind-first | Medium | Freeze new Tailwind product primitives and plan a Phase 0/1 Mantine adoption path around one high-value surface. |
| Everytest | Tailwind detected from package manifest | Tailwind-first | Medium | Same as Cardmass: start with governance freeze and root runtime plan before broad migration. |
| Mosaic | Tailwind detected from package manifest | Tailwind-first | Medium | Same as Cardmass/Everytest; classify the primary user workflows before choosing the first migrated surface. |
| Blockmass | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Inspect runtime, page shell, and dependency model before assigning a migration class. |
| Fanmass | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Kormanyvalto | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Manus | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Misisimi | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Narimato | Mantine 7 + vendored `@sovereignsquad/gds-core` / `@sovereignsquad/gds-theme`; local adapter `docs/GDS_ADOPTION.md` | Mantine-rooted enforcement | Low | Keep packages synced (`npm run gds:sync`); extend CI guard; see `PROJECTS/NARIMATO.md` |
| Pesti Est / budapest-night | Mantine-first product with local brand theme extension and strong i18n/RTL needs; adoption plan now in progress | Mantine-rooted enforcement | Medium | Close package publishing, theme-extension, discovery-shell, and RTL adapter gaps so local duplicates can shrink. |
| Openclaw | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Opencode | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Paperclip | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Partnerfonts | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |
| Sovereign | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. |

## Project-Specific Fix Recommendations

### Messmass

Required fix:

- local documentation must stop treating the pre-Mantine wrapper/token system as the implementation authority

Known conflict to resolve:

- `/Users/moldovancsaba/Projects/messmass/docs/coding-standards.md` still contains stale language that treats the local system as authoritative “until a full repo-approved Mantine migration is actually implemented”

Corrective direction:

- replace that with explicit Mantine-only authority language
- freeze page-local UI invention
- migrate the shared admin/reporting/analytics surface family through Mantine primitives and local adapters

### Amanoba

Required fix:

- complete the migration from mixed Mantine/Tailwind/Radix to Mantine-only

Corrective direction:

- continue deleting remaining legacy primitive dependencies rather than normalizing the hybrid

### SSO

Required fix:

- finish the docs shell and deletion phases

Corrective direction:

- keep the contract set intentionally small
- remove remaining legacy CSS files as soon as docs migration closes

### KIDEX

Required fix:

- convert “Mantine present” into “Mantine governed”

Corrective direction:

- mobile shell, dashboard priority, and data-view consistency should lead, not cosmetic cleanup

### Launchmass

Required fix:

- explicit governance decision on MUI versus Mantine-only GDS

Corrective direction:

- do not let MUI remain as an undeclared competing design authority

### Tailwind-First Projects

Projects:

- Cardmass
- Everytest
- Mosaic

Required fix:

- stop adding new Tailwind-defined product primitives

Corrective direction:

- phase-0 freeze
- define root Mantine runtime
- migrate one high-traffic surface first

## Operational Use

Use this matrix:

- during portfolio planning
- before adding a new project-specific migration plan
- before deciding which project should receive the next GDS enforcement investment

Update this file when:

- a project gains a local migration plan
- a project's foundation materially changes
- a project moves from discovery to an explicit archetype
