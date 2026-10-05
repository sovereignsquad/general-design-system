# Portfolio Adoption Matrix

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

This matrix gives the shared GDS a portfolio-level view of where each project stands, what kind of migration it needs, and what the next practical move should be.

## Evidence

Each table states its own evidence:

- **Audited consumers** (amanoba, camera, fanmass, messmass, savetheworld, sso, step, try-on): verified 2026-10-01 against local checkouts, read-only. Each row cites the consumer files it was read from and the commit it was read at. The per-project record linked from each row carries the detail.
- **Other local repositories** (calvus, moldovancsaba.com, OpenClaw, image.direct, business.direct): checked 2026-10-01 for a package manifest, a GDS dependency and a `gds-adoption.json`. They have not been audited.
- **Repositories not on this machine**: rows carried forward from the 2026-05-23 package-manifest scan or from the per-project record named in the row. Each is marked "not re-verified 2026-10-01".

These tables are maintained by hand. No script reads consumer manifests or compares these rows with them: `scripts/verify-reference-consumers.mjs` reads only the manifests of GDS's own reference apps. A row is accurate as of its evidence date. The `Version:` header follows `VERSION` like every `Active SSOT` document ([docs/DOCUMENTATION_VERSIONING.md](../docs/DOCUMENTATION_VERSIONING.md)) and says nothing about when a row was last checked.

Consumer paths in the tables are relative to that consumer's repository root. Repositories are named as `owner/repo`.

Where evidence is weak, the recommendation is discovery-first.

## Portfolio Priority Rules

Prioritize in this order:

1. projects with active product surfaces and known authority conflicts
2. projects with Mantine already present but still drifting
3. projects with competing framework foundations that will become harder to unwind later
4. projects without enough evidence, which should be triaged before deep planning

## Audited consumers: package state

Verified 2026-10-01 against local checkouts. "Outside the schema" lists values of `productArchetype`, `migrationStatus` and `lastReviewedAt` that `schemas/gds-adoption.schema.json` does not allow; other manifest fields are not checked in this table.

| Project | GDS packages declared | Theme lane | `gds-theme/styles.css` | `gds-adoption.json` | Evidence |
|---|---|---|---|---|---|
| Amanoba (`moldovancsaba/amanoba`) | Two lines: `gds-core`, `gds-theme`, `gds-admin` 6.0.0 (`package.json:117-119`) and `gds-a11y`, `gds-compliance`, `gds-eslint-config` 3.14.17 (`:170-172`), all GitHub Release tarball URLs | `extendGdsTheme` from `/server` (`app/lib/ui/amanoba-gds-theme.ts:1,13`), deprecated for consumers and not an approved lane | Not imported. `app/[locale]/layout.tsx:24-27` imports the Mantine stylesheets and local CSS | `gdsVersion` 6.0.0. `strictMode` absent. Outside the schema: `productArchetype` `lms-game`, `migrationStatus` `enforced` | `main` at `67fb1e28`, 2026-10-01 |
| Camera (`moldovancsaba/camera`) | `gds-core`, `gds-theme`, `gds-admin`, `gds-compliance`, `gds-eslint-config` 6.3.0, vendored `file:vendor/gds/` tarballs (`package.json:79-81`, `:98-99`) | No `theme` prop, so the `gdsTheme` default applies (`components/gds/CameraGdsProvider.tsx:18-22`) | Not imported. `app/layout.tsx:4-7` loads a local copy, `components/gds/gds-theme.css`, instead | `gdsVersion` 6.3.0. `strictMode` absent. Outside the schema: `migrationStatus` `direct-consumption-in-progress` | Branch `docs/prompt-management-release-notes` at `2617e00c`, 2026-10-01 |
| Fanmass (`moldovancsaba/fanmass`) | In `frontend/package.json`: the umbrella `@sovereignsquad/gds` (`:13`) plus `overrides` for `gds-core`, `gds-theme`, `gds-admin` (`:35-37`), all 6.4.0 vendored tarballs. The repository root has no `package.json` | `gdsDarkPublicTheme` (`frontend/src/theme.ts:1-3`) | Not imported. `frontend/src/main.tsx:3-4` imports the Mantine stylesheets | At the repository root; its paths point into `frontend/`. `gdsVersion` 6.4.0. `strictMode` `true`. Outside the schema: `migrationStatus` `gds-spa-primary`, `lastReviewedAt` with a time part | `main` at `3e9414f0`, 2026-10-01 |
| Messmass (`moldovancsaba/messmass`) | `gds-core`, `gds-theme`, `gds-admin`, `gds-compliance` 6.3.0, vendored tarballs (`package.json:146-148`, `:176`), with the runtime three repeated under `overrides` (`:205-207`) | `createPublicBrandTheme` (`lib/ui/mantineTheme.ts:9`) | Imported (`app/layout.tsx:6`) after direct imports of the Mantine stylesheets (`:4-5`), which it already includes | `gdsVersion` 6.3.0. `strictMode` `false`. Checked values within the schema | `main` at `3e3fc847`, 2026-10-01 |
| Save The World (`moldovancsaba/savetheworld`) | `gds-core`, `gds-theme`, `gds-admin`, `gds-compliance`, `gds-eslint-config` 6.3.0, vendored tarballs (`package.json:24-26`, `:36-37`) | A hand-built Mantine theme object, `BRAND_THEME` (`src/components/gds/theme/brandTheme.ts:109`), which is not an approved lane. `createBrandTheme` is called (`:87`) only for its CSS variables | Imported once, before app CSS (`src/app/layout.tsx:9`) | `gdsVersion` 6.3.0. `strictMode` absent. Outside the schema: `migrationStatus` `direct-consumption-in-progress` | `main` at `052ef84e`, 2026-10-01 |
| SSO (`moldovancsaba/sso`) | `gds-core`, `gds-theme`, `gds-admin`, `gds-compliance`, `gds-eslint-config` 6.0.0, vendored tarballs (`package.json:44-46`, `:64-65`), with the runtime three repeated under `overrides` (`:81-83`) | `createPublicBrandTheme` from `/server` (`lib/theme/mantineTheme.js:1,102`) | Not imported. `pages/_app.js:1-2` imports the Mantine stylesheets | `gdsVersion` 6.0.0. `strictMode` absent. Outside the schema: `migrationStatus` `direct` | `main` at `d6c385be`, 2026-10-01 |
| Step (`moldovancsaba/step`) | The umbrella `@sovereignsquad/gds` pinned to 3.9.0 from npmjs, in `apps/web-app/package.json:16` only. No other workspace package declares GDS | No `theme` prop, so the 3.9.0 `gdsTheme` default applies (`apps/web-app/src/main.tsx:19`) | Not imported. `apps/web-app/src/main.tsx:8-9` imports the Mantine stylesheets | None | `main` at `b836eb14`, 2026-10-01 |
| Try-On (`moldovancsaba/try-on`) | `gds-core`, `gds-theme`, `gds-admin` 3.9.0 declared as devDependencies (`package.json:9-11`). The lockfile resolves `@doneisbetter/gds-*` 3.4.3 instead (`pnpm-lock.yaml:11-17`). No first-party JavaScript or TypeScript imports either set | None. The Jinja pages link `studio_tools/static/global.css`, which declares `--gds-vibe-*` names with local values. The Gradio routes take a `gr.themes.Base(...)` theme with raw hex (`app.py:2419`) | Not applicable: a Python app with no bundler | None | `main` at `804f1a45`, 2026-10-01 |

## Audited consumers: portfolio judgement

| Project | Archetype | Risk | Next move | Record |
|---|---|---|---|---|
| Amanoba | Package adoption, partial | High | Import `@sovereignsquad/gds-theme/styles.css` once and drop the direct Mantine stylesheet imports. Replace `extendGdsTheme` with an approved lane. Install all six packages at one version from GitHub Packages. Interim rule until GDS ships a course or progress card: do not map course or progress data onto `PublicProductCard`. Its detail rows carry fixed retail labels ("Pickup", "Availability") and an availability badge (`packages/gds-core/src/PublicProductCard.tsx`), so a screen reader announces retail product information on a course card. `ListingCard` has no eyebrow, highlight, progress or neutral status slot at this version. | [Amanoba Mantine-Only Refactor](AMANOBA_MANTINE_REFACTOR.md) |
| Camera | Shared contract driver | High | Replace the local `components/gds/gds-theme.css` copy with `@sovereignsquad/gds-theme/styles.css`. Replace references to `--gds-*` names that GDS does not define. Move browser `alert()` and `confirm()` calls onto the mounted `useGdsToasts` and `useGdsConfirm`. Set `compliance.strictMode` and renew exceptions past their `reviewDate`. | [Camera Adoption Plan](CAMERA_ADOPTION_PLAN.md) |
| Fanmass | Package adoption, partial (SPA plus server-rendered review page) | High | Import `@sovereignsquad/gds-theme/styles.css` in `frontend/src/main.tsx`. Mount `GdsConfirmProvider` and replace `window.confirm`. Render the manifest's `requiredContracts` or remove them, and bring `migrationStatus` and `lastReviewedAt` into the schema. | [Fanmass Adoption Status](FANMASS_ADOPTION_STATUS.md) |
| Messmass | Package adoption, local token authority remains | High | Retire the `--mm-*` token layer in `app/styles/theme.css` in favour of GDS role tokens. Drop the direct Mantine stylesheet imports. Replace browser `alert()` calls with the mounted GDS confirm and notification surfaces. | [Messmass Mantine Refactor](MESSMASS_MANTINE_REFACTOR.md) |
| Save The World | Package adoption, partial | High | Pass a theme built by an approved lane instead of the hand-built object, which replaces `gdsTheme` instead of extending it. Fix the filled primary button label contrast. Bring `migrationStatus` into the schema and set `strictMode`. | [Save The World Adoption Status](SAVETHEWORLD_ADOPTION_STATUS.md) |
| SSO | Package adoption, partial | High | Import `@sovereignsquad/gds-theme/styles.css` in `pages/_app.js`. Redirect the magic-link failure responses to ordinary routes instead of emitting styled HTML. Render the OAuth consent page through GDS. Upgrade from 6.0.0. | [SSO Mantine Refactor](SSO_MANTINE_REFACTOR.md) |
| Step | Package adoption on the frozen 3.9.0 line | High | Fix keyboard access to the primary navigation and the sign-up switch. Move `apps/web-app` from the npmjs 3.9.0 snapshot to the current line on GitHub Packages. Add `apps/web-app/gds-adoption.json`. | [Step Adoption Status](STEP_ADOPTION_STATUS.md) |
| Try-On | Non-React app, hand-mirrored tokens | Medium (operator-only pages bound to `127.0.0.1`) | Remove the GDS devDependencies the app cannot import. Meet the accessibility duties for pages outside `GdsProvider`. Add a root `gds-adoption.json`. | [Try-On Adoption Status](TRYON_ADOPTION_STATUS.md) |

## Other local repositories

Checked 2026-10-01 for a package manifest, a GDS dependency and a `gds-adoption.json`. Not audited.

| Project | Observed | Classification | Next move | Evidence |
|---|---|---|---|---|
| Calvus (`moldovancsaba/calvus`) | Static HTML client prototypes with inline CSS. The only package manifest, `business-direct/app/package.json`, declares no UI or GDS dependency. Some prototype pages under `business-direct/` and `discountdirect/` declare `--gds-*` custom properties with local literal values | Not a GDS consumer. Candidate for a static token lane | GDS ships no framework-free token stylesheet at this version: `@sovereignsquad/gds-theme/styles.css` opens with `@import`s of the Mantine stylesheets, which only a bundler resolves. See [Surfaces outside GdsProvider](../INSTALLATION_GUIDE.md#surfaces-outside-gdsprovider) | `main` at `722609f8`, 2026-10-01 |
| moldovancsaba.com (`moldovancsaba/moldovancsaba.com`) | Dependency-free static site for GitHub Pages: `index.html`, `assets/styles.css`, `assets/script.js`. No package manifest, no `--gds-*` names | Not a GDS consumer. Candidate for a static token lane | Same as Calvus | `main` at `29d762bc`, 2026-10-01 |
| OpenClaw | Agent runtime data folder (`.openclaw/` with agent, state and workspace directories). Not a git repository; no package manifest and no UI source | Not a UI project | None | Folder listing, 2026-10-01 |
| image.direct (`moldovancsaba/image.direct`) | `@sovereignsquad/gds` `^6.7.0` (`package.json:22`), installed 6.7.0 from GitHub Packages. Imports `@sovereignsquad/gds-theme/styles.css` (`src/app/layout.tsx:2`); one `GdsProvider` (`src/app/providers.tsx:6`). No `gds-adoption.json` | GDS consumer, not audited | Add `gds-adoption.json`, run `gds-compliance`, then audit | `main` at `d19ec262`, 2026-10-01 |
| business.direct (`moldovancsaba/business.direct`) | `@mantine/core` and `@mantine/hooks` (`package.json:29-30`) on Next.js. No GDS dependency and no `gds-adoption.json` | Mantine without GDS | Make an explicit adoption decision | Branch `feat/bd-e00-901-single-source` at `31cb7e5a`, 2026-10-01 |

## Repositories not on this machine

Not re-verified 2026-10-01. Each row keeps the evidence it was written from.

| Project | Observed Foundation Signal | Archetype | Risk | Recommendation | Evidence |
|---|---|---|---|---|---|
| KIDEX | Mantine detected; active project plan exists | Mantine-rooted drift cleanup | Medium | Keep mobile shell, dashboard, and child-registry normalization as the next priority; focus on action hierarchy and responsive consistency. | Package-manifest scan 2026-05-23; [KIDEX Mantine Refactor](KIDEX_MANTINE_REFACTOR.md). Not re-verified 2026-10-01 |
| ClassScout | Mantine-only refactor plan in progress | Per project record | Unknown | Re-verify against the repository before planning. | [ClassScout Mantine-Only Refactor](CLASSSCOUT_MANTINE_REFACTOR.md), 2026-05-23. Not re-verified 2026-10-01 |
| Impact / sovereignsquad | Mantine 7 + Vite MPA; local shell/state adapters; vendored theme behavior | Mantine-rooted contract gap | Medium | Publish package install path first, then align public shell, docs shell, state/upload surfaces, and dark-mode policy. | [Impact Mantine Refactor](IMPACT_MANTINE_REFACTOR.md), 2026-05-24. Not re-verified 2026-10-01 |
| Launchmass | MUI detected from package manifest | Alternate UI framework | High | Make an explicit portfolio decision: approve a true Mantine migration or record temporary non-compliance. Do not allow silent long-lived MUI divergence. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Cardmass | Tailwind detected from package manifest | Tailwind-first | Medium | Freeze new Tailwind product primitives and plan a Phase 0/1 Mantine adoption path around one high-value surface. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Everytest | Tailwind detected from package manifest | Tailwind-first | Medium | Same as Cardmass: start with governance freeze and root runtime plan before broad migration. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Mosaic | Tailwind detected from package manifest | Tailwind-first | Medium | Same as Cardmass/Everytest; classify the primary user workflows before choosing the first migrated surface. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Blockmass | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Inspect runtime, page shell, and dependency model before assigning a migration class. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Kormanyvalto | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Manus | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Misisimi | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Narimato | Mantine 7 + vendored `@sovereignsquad/gds-core` / `@sovereignsquad/gds-theme`; local adapter `docs/GDS_ADOPTION.md` | Mantine-rooted enforcement | Low | Keep packages synced (`npm run gds:sync`); extend CI guard. | [Narimato](NARIMATO.md), 2026-05-27. Not re-verified 2026-10-01 |
| Pesti Est / budapest-night | Mantine-first product with local brand theme extension and strong i18n/RTL needs; adoption plan in progress | Mantine-rooted enforcement | Medium | Close package publishing, theme-extension, discovery-shell, and RTL adapter gaps so local duplicates can shrink. | [Pesti Est Mantine Refactor](PESTIEST_MANTINE_REFACTOR.md), 2026-05-24. Not re-verified 2026-10-01 |
| Management | `gds-core`/`gds-theme` `^6.1.0` via the documented GitHub Packages install path; `gds:check` is a local fork of `gds-compliance`; `GITHUB_TOKEN` set in GitHub Actions and both Vercel projects (`management`, `padel-africa`) | Package adoption, actively governed | Low | Routine version bump. Upstream `gds-compliance` fixes need a manual re-port into the local fork. | [Management Adoption Plan](MANAGEMENT_ADOPTION_PLAN.md), 2026-08-25. Not re-verified 2026-10-01 |
| Sales Lead Generator | `gds-*` `^6.7.0` via the documented registry install; real `gds-compliance` adopted; `GITHUB_TOKEN` set in GitHub Actions; Vercel project not confirmed | Package adoption, actively governed | Medium | Set `GITHUB_TOKEN` in the repository's Vercel project before the next deploy. | [Sales Lead Generator Adoption Plan](SALESLEADGENERATOR_ADOPTION_PLAN.md), 2026-08-25. Not re-verified 2026-10-01 |
| Opencode | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Paperclip | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Partnerfonts | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |
| Sovereign | No clear UI framework signal from package manifest alone | Discovery required | Unknown | Same discovery-first path. | Package-manifest scan 2026-05-23. Not re-verified 2026-10-01 |

## Project-Specific Fix Recommendations

The audited consumers' full fix lists live in each consumer's own `gds_fix_handover.md` at its repository root. That file is not committed to the consumer repository. The per-project records in this directory summarise the current state and the next steps.

### Messmass

Required fix:

- retire the `--mm-*` custom-property layer (`app/styles/theme.css`) as the styling source; no stylesheet in the repository reads a `--gds-*` token

Known conflict to resolve:

- `docs/coding-standards.md:16` names `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM` as the SSOT, a path that does not exist. The same document already declares the local token-and-wrapper system a frozen compatibility layer (`:21`).

Corrective direction:

- migrate the shared admin/reporting/analytics surface family onto GDS components and role tokens
- see [Messmass Mantine Refactor](MESSMASS_MANTINE_REFACTOR.md)

### Amanoba

Required fix:

- load `@sovereignsquad/gds-theme/styles.css` and move the theme onto an approved lane
- stop rendering course and progress data through `PublicProductCard` (interim rule in the table above)

Corrective direction:

- see [Amanoba Mantine-Only Refactor](AMANOBA_MANTINE_REFACTOR.md)

### SSO

Required fix:

- load `@sovereignsquad/gds-theme/styles.css`; the legacy CSS and theme stack is already deleted

Corrective direction:

- keep the contract set intentionally small
- see [SSO Mantine Refactor](SSO_MANTINE_REFACTOR.md)

### KIDEX

Not re-verified 2026-10-01.

Required fix:

- convert “Mantine present” into “Mantine governed”

Corrective direction:

- mobile shell, dashboard priority, and data-view consistency should lead, not cosmetic cleanup

### Sales Lead Generator

Not re-verified 2026-10-01. Recorded 2026-08-25: migrated to the documented GitHub Packages install path at `6.7.0`, adopted the real `@sovereignsquad/gds-compliance` package, and retired `scripts/audit-gds-style.mjs`.

Remaining: the repository's Vercel project needs `GITHUB_TOKEN` set.

### Launchmass

Not re-verified 2026-10-01.

Required fix:

- explicit governance decision on MUI versus Mantine-only GDS

Corrective direction:

- do not let MUI remain as an undeclared competing design authority

### Tailwind-First Projects

Not re-verified 2026-10-01.

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

### Static sites

Projects:

- Calvus
- moldovancsaba.com

GDS has no install path for a static site at this version: no linkable stylesheet and no token CSS file. [INSTALLATION_GUIDE.md, "Surfaces outside GdsProvider"](../INSTALLATION_GUIDE.md#surfaces-outside-gdsprovider) states what still applies. Calvus pages that declare `--gds-*` names with local values are not governed by GDS.

## Operational Use

Use this matrix:

- during portfolio planning
- before adding a new project-specific migration plan
- before deciding which project should receive the next GDS enforcement investment

Update this file when:

- a project gains a local migration plan
- a project's foundation materially changes
- a project moves from discovery to an explicit archetype
- a row is re-verified against its repository: record the commit and date in its evidence cell. A row that was not re-checked keeps its original evidence date.
