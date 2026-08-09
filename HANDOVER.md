# Handover

Status: Active — current as of this entry
Date: 2026-08-09
Repository: `sovereignsquad/general-design-system`
Written at commit: `1bbefea` (origin/main), version `5.0.2`

This replaces the previous contents of this file, which were a stale,
already-superseded 2026-05-24 snapshot (npmjs-publish era, retired Projects
v2 board). That history is still in git log if needed; it is not repeated
here. `HANDOVER_3_0_0_RELEASE_BLOCKER.md` and `HANDOVER_GITHUB_PENDING.md`
are similarly superseded historical records — both say so at the top — and
are not authoritative for anything below.

This document has two jobs:

1. Tell the next person or agent everything currently known that needs
   covering sooner or later — real gaps, real debt, real open questions.
2. Give a new environment (a fresh agent session, a new contributor, a CI
   runner) everything it needs to actually build, test, and ship changes
   here without re-discovering the same things the hard way.

---

## 1. What this repository is

GDS (`@sovereignsquad/gds*`) is a cross-project design system: governed
Mantine-based React components, tokens, and patterns, published as npm
packages and demonstrated on a live reference site
(`https://sovereignsquad.github.io/general-design-system`). It is consumed
by other Sovereign Squad products, not just documented for its own sake —
see `README.md` → `FOUNDATION.md` → `COMPONENTS_AND_PATTERNS.md` for the
onboarding path, and `llms.txt` for the machine-readable index built
specifically for AI coding agents.

**The standing operating rules are in `CLAUDE.md` at the repo root.** That
file is not optional reading — it is binding on every session working in
this repo, and everything in this handover is written to be consistent
with it, not a replacement for it. Read it first, in full, before making
any change. Highlights relevant to almost everything below:

- **Rule 1**: zero-tolerance quality gate — no warning, deprecation notice,
  or error of any kind reaches `main`. Fix at the source; never suppress.
- **Rule 2**: every change traces to a GitHub issue.
- **Rule 6**: the user operates via mobile with no terminal access and
  cannot run git commands themselves — the agent executes directly.
  `dev`/`preview` branches and (on explicit "commit and push to main"
  phrasing) direct pushes to `main` are pre-authorized; force-push,
  history rewrite, and branch deletion are not.
- **Rule 9**: no AI/model/provider attribution anywhere in commits, PRs,
  issues, code, docs, or config — ever, unless a human explicitly asks.
- **Rule 10**: bugs visible on the GDS reference site (`apps/playground`)
  are fixed in the shared package that renders them, never with a
  page-local workaround. The playground exists specifically to be a real
  consumer of the shared packages, exercising the whole component surface.
- **Rule 11/12**: no guessing, no hallucinated verification claims. Rule 12
  specifically (added 2026-08-09, this session) requires every "fixed" /
  "confirmed" / "legible" / "done" claim to state exactly what was checked
  — which routes, which environment (local build vs. actually deployed),
  which theme × scheme combinations — and forbids minimizing language
  ("under-weighted", "minor", "cosmetic") for real defects. Read the full
  rule; it exists because of a real incident this session where a narrow,
  local-only check was reported as a broad, deployed-and-confirmed fix.

---

## 2. Architecture map (what actually needs to be understood, not just where files are)

### Packages (`packages/*`, npm workspaces)

- **`@sovereignsquad/gds-theme`** — tokens, `GdsProvider` (the required
  root provider), theme presets/vibe themes, the runtime theme-switching
  system, `styles.css` (the single stylesheet every consumer must import
  once, before their own styles).
- **`@sovereignsquad/gds-core`** — the bulk of the component surface:
  shells, cards, forms, badges, reference-site primitives, etc. Has
  subpath exports for large optional pieces (`./rich-text-editor`,
  `./reference-theme-explorer` — see §3 below) that are deliberately kept
  out of the main barrel so consumers who never use them don't pay their
  bundle cost.
- **`@sovereignsquad/gds-admin`** — admin/operator-surface primitives.
- **`@sovereignsquad/gds-a11y`** — small standalone accessibility helper
  package (8 public helpers as of this writing).
- **`@sovereignsquad/gds`** — the umbrella convenience package; installs
  the granular packages as dependencies, recommended install path for most
  consumers.
- **`@sovereignsquad/gds-compliance`** — the `gds-compliance` CLI: scans a
  consumer repo for forbidden raw colors, forbidden imports, and other
  governance violations against a `gds-adoption.json` manifest. Also used
  internally in this repo's own `verify:release` chain (`GDS compliance
  check` steps) to scan `apps/playground`'s own source for the same
  violations — **this is what will flag any hardcoded hex/rgb color you
  add outside a token/theme file, including inside a code comment if the
  digits happen to look like a hex color** (yes, this actually happened
  this session — a comment reading "issue #532" tripped the regex because
  `532` is valid hex; write issue references as "issue 532", no `#`, in
  any file this scanner covers).
- **`@sovereignsquad/gds-eslint-config`** — shared lint config.

### Apps (`apps/*`)

- **`apps/playground`** — the public reference site (deployed to GitHub
  Pages). This is not documentation-as-an-afterthought; per Rule 10, it is
  the live, governed demonstration of the shared packages, and every bug
  visible there must be fixed in the package it renders through.
- **`apps/reference-vite`**, **`apps/reference-next`** — minimal real
  consumer apps (Vite and Next.js) used to prove the packages actually
  install and render correctly outside this monorepo's own tooling. Also
  used as a control group — e.g. "does `reference-vite`'s bundle grow when
  `reference-theme-explorer` is imported? No, because it never imports it"
  is how the subpath-extraction pattern (§3) gets proven, not asserted.

### The two token systems — genuinely important, easy to get wrong

This tripped up a real user-facing bug this session (issue #533/#534,
fixed in commits landing as 5.0.1/5.0.2) and is worth understanding before
touching anything theme-related:

1. **`--gds-vibe-*` runtime tokens** — set directly on `<html>` via
   imperative JS (`document.documentElement.style.setProperty(...)`) by
   `theme-runtime.ts`'s `applyDocumentRuntime`, driven by
   `getGdsVibeThemeCssVariables(preset, colorScheme)` in `vibe-themes.ts`.
   This function is **correctly scheme-aware** — it resolves each token's
   light or dark value based on the `colorScheme` argument it's given.
   This is what the Theme Lab (`ReferenceThemeExplorer`,
   `useGdsThemePresetState`) drives live, and it works correctly.
2. **`--gds-*` semantic-role tokens** (`--gds-text-body`,
   `--gds-border-card`, `--gds-brand-primary`, etc.) — these live inside
   a theme object's `other.gdsCssVariables`, built by `createBrandTheme`
   (`brand-tokens.ts`) via its own separate `emitCssVariables(tokens)`
   function, and applied by `GdsProvider` to its wrapper `<Box>` as an
   **inline style**. Until this session, that inline style dumped BOTH
   the light value and a separate `-dark`-suffixed sibling key as flat,
   unrelated CSS custom properties — nothing ever picked the dark one, so
   any CSS reading the base name always got the frozen light value, even
   in dark mode, because an inline style always beats an external
   stylesheet rule. **Fixed** in `GdsProvider.tsx` by resolving the
   `{base, base-dark}` pairs against the live scheme (via Mantine's
   `useComputedColorScheme()`) before applying them — see
   `GdsThemeVariablesScope` in that file and its test coverage in
   `GdsProvider.test.tsx`.

**The trap for next time**: these two systems have **duplicate,
hand-maintained token data** for the same semantic concepts —
`vibe-themes.ts`'s `resolveVibeSemanticCssVariables`/
`brandSemanticCssVariablesByPreset` vs. `brand-tokens.ts`'s own token
tables — kept in sync by hand, not by a single source of truth. If you add
or change a brand token, check both files. This duplication itself is
worth a future cleanup issue (not filed yet — consider filing it).

### The subpath-extraction pattern (bundle-size discipline)

`GdsRichTextEditor` and `ReferenceThemeExplorer` are both deliberately
**not** exported from the main `.`/`./client` package barrels — they live
behind dedicated subpaths (`@sovereignsquad/gds-core/rich-text-editor`,
`@sovereignsquad/gds-core/reference-theme-explorer`) so consumers who never
render them don't bundle their cost. Proven with real measurements each
time (`reference-vite`'s vendor-gds chunk: 561KB→217KB after the
rich-text-editor split; playground's own vendor-gds: 954KB→665KB after the
reference-theme-explorer split). **This is a breaking change** each time
it's done — it removes something from the main barrel — and needs a major
version bump plus a migration-note entry in
`DEPRECATIONS_AND_MIGRATIONS.md`'s "Component-export relocations" section.

**Three-file checklist when adding a new subpath** (missed the third one
once this session and broke 4 test files as a result):

1. `packages/gds-core/tsup.config.ts` — add the new entry file to `entry`.
2. `packages/gds-core/package.json` — add the `exports` map entry.
3. **`vitest.config.ts` (repo root)** — add a matching `resolve.alias`
   entry pointing the subpath straight at the source `.ts` file. Vitest
   does not respect `package.json` `exports` for workspace packages here;
   it uses this hand-maintained alias list instead, and a missing entry
   fails with `Failed to resolve import "..."` in every test file that
   imports the new subpath — easy to miss, breaks tests, not a build
   error, so `npm run build` alone won't catch it.

Also: if the new subpath's chunk should get its own bundle chunk in the
playground build (rather than being swept into the monolithic
`vendor-gds` chunk), add a higher-priority group rule in
`apps/playground/vite.config.ts`'s `codeSplitting.groups` — the existing
`vendor-gds-theme-explorer` rule is the template.

---

## 3. Current known gaps — cover sooner or later

Every item below is a real, currently-open GitHub issue as of this
writing (`state: open`), verified live, not from memory:

| Issue | What | Why it's not done yet |
|---|---|---|
| **#532** | Two remaining bundle-size wins in `vendor-gds`: subpath-extracting `GdsSchemaForm`'s and `KanbanBoard`+`AdvancedDataTable`'s demo subtrees (~58KB combined, same pattern as §3 above, another breaking change/major version); lazy-loading gds-core's 12 locale message dictionaries (122.8KB, only 1 ever active per visitor) | The locale fix needs an async/Suspense redesign of `GdsI18nRuntime`'s currently-synchronous message-lookup API (`resolveGdsMessage`, `GdsLocaleText`, `formatGdsPlural`, etc.) — a real API-shape change to a heavily-used public surface, not a quick patch |
| **#534** | Fixed-tone badges (`[data-gds-badge-fixed-tone]` — info/neutral status pills using Mantine's `variant="light"`) fail WCAG contrast (~1.8:1–2.5:1, need 3:1+) in dark mode, **across every theme including default** | Found during this session's Class USA audit but confirmed universal, not brand-specific — needs its own scheme-aware color mapping for the fixed-tone badge lane, separate work from the brand-theme fixes already shipped |
| **#516** | `gds-a11y`'s JSDoc coverage gate reports 100% but actually covers 0/17 exports — the gate itself is broken, not just the docs | Gate logic bug, needs investigation into why it's a false pass before it can be trusted again |
| **#517** | Untranslated English strings leaking into `ar.ts`/`he.ts`/`zh.ts` locale files | Real i18n gap, needs actual translation work |
| **#518** | The site's "What changed in X.Y.Z" copy has been stale since 3.14, across all 9 locales | Needs regenerating/rewriting per-locale, likely mechanical but currently untouched |
| **#519** | `TEMPLATES/README.md`: all 8 template links are broken (double-nested path) | Simple path fix, just not done |
| **#520** | `docs/MANTINE9_MIGRATION.md` describes already-shipped work as a pending TODO, and references the wrong CI filename | Doc drift, needs a pass to bring current |
| **#512** | Ref-level AI-attribution cleanup: 19 `gds-v*` git tags and 1 stray branch still carry old AI-attribution references; the exact fix has already been verified but is **blocked by ref-protection permissions (403)** | Not something the agent can route around — needs a human with elevated repo permissions to actually rewrite/delete the protected refs |
| **#498** | Epic: designer usage-pattern documentation for every GDS component (not just API reference) | Large, ongoing documentation initiative, not a bug |

If you close any of these, close the issue with a reference to the
resolving commit (Rule 2) and update this table in the same change.

### Things noticed but not yet filed as issues (worth doing so before acting on them)

- The dual semantic-token-data duplication between `vibe-themes.ts` and
  `brand-tokens.ts` described in §2 — real maintenance risk, not filed.
- `apps/playground`'s `audit:board` step always soft-warns in this sandbox
  (no `gh` CLI / no `GITHUB_TOKEN` shell access here) — this is
  by-design (the script itself is written to soft-warn and exit 0 rather
  than hard-fail when the GitHub API isn't reachable), not a defect, but
  worth remembering it will always show up in `verify:release` output and
  is not something to try to "fix" from inside a sandboxed agent session.

---

## 4. Release and publish — fully automated, no manual credentials

This repo's actual current flow (confirmed from `RELEASE_PUBLISH.md`,
current as of this writing — ignore anything in the old, explicitly
superseded `HANDOVER_3_0_0_RELEASE_BLOCKER.md` about npmjs auth failures;
that entire approach was abandoned):

- **Registry**: GitHub Packages (`https://npm.pkg.github.com`), not
  npmjs.com. npmjs listings are frozen at `3.9.0` and explicitly
  deprecated — see `DEPRECATIONS_AND_MIGRATIONS.md`.
- **No local npm auth step, ever.** Publishing runs exclusively through
  `.github/workflows/publish-github-packages.yml`, authenticated by that
  workflow run's own ambient `GITHUB_TOKEN`. There is no `npm
  whoami`/`npm adduser` precondition, and no repository secret to manage.
- **The whole release is just a normal push to `main` that changes the
  root `VERSION` file.** A workflow watches for that, creates/pushes the
  matching `gds-v<VERSION>` tag automatically, which fans out into
  building and publishing all seven packages. No maintainer runs `git
  tag` or drafts a GitHub release manually for a routine version bump.
- **Board**: GitHub Issues filtered by `status:`/`priority:`/`area:`
  labels (see `PROJECT_BOARD.md`), not a Projects v2 board — the old
  org-level Projects v2 board (`sovereignsquad#11`) is retired. This
  session's toolset explicitly has **no Projects v2 board API** — don't
  claim to create or update one.

**Practical implication for version bumps**: when bumping the version,
update `VERSION` (the extensionless root file — easy to miss in a
grep-and-sed pass scoped to `*.md`/`*.json`/`*.ts` file globs; it happened
this session), every package's `package.json`, `compatibility.matrix.json`,
and every doc header referencing the old version, then run `npm install
--package-lock-only` to regenerate `package-lock.json` consistently
before running `verify:release`.

---

## 5. `verify:release` — what it actually checks, and how to run it sanely

The full chain (see `package.json`'s `verify:release` script for the exact
current composition): release-alignment check → full multi-package build
→ export-contract check → boundary (type/install-surface/CSS-selector)
checks → vendor-pin governance → lint → full test suite → a long list of
`verify:*` gates (references, a11y-package, theme-accessibility,
theme-tokens, DTCG tokens, token-contrast-scoring, forced-colors-runtime,
theme-trust-runtime, input-zoom-guard-runtime, kanban-drag-accessibility-
runtime) → dependency audit → board audit (soft-warns, see §3) → Mantine
compatibility smoke (7/8/9 × React 18/19) → component-catalog parity.

It takes several minutes end-to-end (the `*-runtime` gates spin up a real
preview server and a headless Chrome instance each). Run it in the
background and check the real exit code and log content, not just a task
notification summary — **this session hit a case where a background task
notification reported "exit code 0" when the actual script had failed**,
because the command was piped through `tee` without `set -o pipefail`, so
the reported exit code was `tee`'s, not the script's. Always run release
verification with `set -o pipefail` before the `tee`, and always grep the
actual log for `fail|error|warn` afterward rather than trusting a
notification summary.

**A known, real flake pattern**: `verify:forced-colors-runtime` (and
similar `*-runtime` gates) can fail intermittently under Chrome/resource
contention, especially if multiple browser-driven scripts are running
concurrently in the same sandbox. When one of these gates fails, don't
assume it's a real regression and don't assume it's a flake either —
**reproduce it in isolation** (run that one script alone, e.g. `CHROME_PATH=... node scripts/verify-forced-colors-runtime.mjs`) before deciding
either way. This happened twice this session; both times it was a genuine
flake, confirmed by isolated re-run, never assumed.

---

## 6. Detailed prompt: bootstrapping a new agent/environment to maintain and develop GDS

Everything below is written to be handed directly to a fresh agent session
(or read by a new human contributor) as a standalone bootstrap brief — it
does not assume the reader has any of the context above already loaded,
though reading §§1–5 first will help.

> You are working in `sovereignsquad/general-design-system`, a design-system
> monorepo (npm workspaces: `packages/*` + `apps/*`) that ships governed
> React/Mantine components consumed by other real products. Before making
> any change, read `CLAUDE.md` in full — it is the binding operating
> contract for this repo (zero-tolerance quality gate, issue-driven work,
> no AI attribution anywhere, GDS-page bugs fixed in the shared package
> never page-locally, no guessing/hallucinated verification claims). Then
> read `README.md` → `FOUNDATION.md` → `COMPONENTS_AND_PATTERNS.md` for
> what the system actually is, and this `HANDOVER.md` for current state.
>
> **Required tools and access for this environment:**
>
> - **Node.js and npm** — this repo has been run under Node `v22.x` and
>   npm `10.x`; there's no `.nvmrc`/`engines` pin, but stay on a current
>   LTS-or-newer Node 22. Run `npm ci` (or `npm install`) at the repo root
>   once — it installs all workspaces.
> - **A headless-capable Chromium/Chrome binary**, plus the `CHROME_PATH`
>   environment variable pointed at it. Multiple `verify:*-runtime` gates
>   in `npm run verify:release`, and most manual live-verification work,
>   spin up real headless Chrome via CDP (`scripts/lib/browser-runtime.mjs`).
>   If a pre-installed Chromium exists under a path like
>   `/opt/pw-browsers/chromium` (a stable symlink, if present, is more
>   durable across Playwright-version bumps than a versioned path like
>   `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`), point
>   `CHROME_PATH` at it; otherwise install one. Without this, the entire
>   `*-runtime` gate family and any live CDP-based verification (the
>   primary way this repo confirms visual/contrast fixes actually work,
>   per Rule 12) cannot run at all.
> - **GitHub access** — issue read/write, PR read/write, and repo push
>   access to `sovereignsquad/general-design-system`. In a Claude Code
>   session this is normally the GitHub MCP server's tools; verify they're
>   available (`list_issues`, `issue_write`, `create_pull_request`, etc.)
>   before assuming issue-driven workflow (Rule 2) can be followed. No
>   `NPM_TOKEN`/npm registry credential is ever needed locally — see §4.
> - **Outbound network policy awareness** — this environment may route
>   outbound HTTPS through a policy proxy (check for an `HTTPS_PROXY` env
>   var and a CA bundle). If so, note that a **headless Chrome instance
>   launched for CDP verification will not automatically honor
>   `HTTPS_PROXY`** — it needs an explicit `--proxy-server=<value>` launch
>   flag (and likely `--ignore-certificate-errors` for a TLS-intercepting
>   proxy) to reach any external URL. This matters only if you need to
>   verify the actual **live**, deployed site rather than a local build —
>   for verifying a local build (the normal case, see below), Chrome talks
>   to `127.0.0.1` and this doesn't apply.
> - **A scratch/temp working area** you're allowed to write freely to, for
>   verification scripts, screenshots, and build artifacts — don't litter
>   the repo itself with throwaway files.
>
> **The standard local-verification pattern used throughout this repo's
> history** (build once, serve it exactly as GitHub Pages would, verify
> live via CDP, never trust a visual impression alone — computed styles
> and contrast-ratio math are ground truth):
>
> 1. `npm run build --workspace=@sovereignsquad/gds-theme` then, in
>    dependency order, `gds-core` → `gds-admin` → `gds-a11y` → `gds` →
>    `playground` (see `package.json`'s root `build` script for the exact
>    order — packages depend on each other's `dist/` output).
> 2. Create a temp directory, and inside it create a symlink literally
>    named `general-design-system` pointing at `apps/playground/dist` —
>    this exactly mirrors the live site's `/general-design-system/...`
>    base path so every asset reference resolves identically to
>    production. Serve that temp directory with
>    `python3 -m http.server <port> --bind 127.0.0.1`.
> 3. Launch headless Chrome (via `scripts/lib/browser-runtime.mjs`'s
>    `launchBrowser`/`createCdpClient` helpers, or equivalent), navigate to
>    `http://127.0.0.1:<port>/general-design-system/<route>`, set
>    `localStorage` for theme selection / tour-seen flags as needed, and
>    read `getComputedStyle(...)` values directly rather than eyeballing
>    a screenshot — screenshots are for the human, computed styles (and
>    real WCAG contrast-ratio math, not "looks fine") are for deciding
>    whether something actually passes.
> 4. Kill the temp server and Chrome instance when done; don't leave
>    orphaned processes holding ports across verification runs.
>
> **Before claiming any fix is done**: run the full `npm run verify:release`
> chain clean (§5), state exactly what you verified and where (Rule 12 —
> local build vs. deployed, which routes, which theme × scheme
> combinations), get explicit push authorization if none has been given
> yet for this specific change (Rule 6), then push and say plainly that
> GitHub Pages deployment is a separate, asynchronous step you have not
> independently confirmed unless you actually checked it.
