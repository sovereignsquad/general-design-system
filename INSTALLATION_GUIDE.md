# Installation Guide

Status: Active SSOT
Version: 4.1.10
Last updated: 2026-08-08

This guide is the canonical consumer setup path for the public umbrella package `@sovereignsquad/gds`. Granular package lanes remain available when a consumer explicitly wants them.

## Single install surface

GDS publishes current and future releases to GitHub Packages' npm-compatible registry (`https://npm.pkg.github.com`). A frozen `3.9.0` snapshot of the packages also exists on npmjs.com — it is deprecated and unsupported (see [Migrating from the legacy npmjs 3.9.0 packages](#migrating-from-the-legacy-npmjs-390-packages) below); all new installs use GitHub Packages. Every install, for every consumer, starts with a one-time `.npmrc` entry:

```ini
# .npmrc (project root)
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` is your own personal access token (a classic PAT with `read:packages` scope is sufficient) or your CI's provisioned token — not a GDS-owned secret. GitHub Packages authenticates every install, including of public packages, so a token is needed even though the packages are public. Export the token in your shell (or CI secret store) as `GITHUB_TOKEN` before running any command below; the `.npmrc` above expands `${GITHUB_TOKEN}` from that environment variable. If it is unset or empty, installs fail with `401 unauthenticated`. See [Troubleshooting `401`/`403` on install](#troubleshooting-401403-on-install) for the full checklist, including SAML-SSO token authorization.

### Getting a `read:packages` token

The GDS packages are published **public**, so there is nothing to request from the GDS maintainers and no org invitation involved — each consumer creates their own free token from their own GitHub account, and any authenticated GitHub account can read the packages. (The only hard requirement of this registry is that the consumer *has* a GitHub account.)

**Classic PAT — the simplest path for installing:**

1. GitHub → your avatar (top-right) → **Settings** → **Developer settings** (bottom of the left sidebar) → **Personal access tokens → Tokens (classic)**.
2. **Generate new token (classic)**, give it a name (e.g. "GDS install") and an expiry.
3. Select exactly one scope: **`read:packages`**. No other scope is needed to install.
4. **Generate token** and copy the `ghp_…` value — GitHub shows it only once.
5. **Only if your organization enforces SAML SSO:** on the token row, click **Configure SSO → Authorize** for the relevant org. A member of an SSO-enforced org whose token is not authorized gets a `401` even though the scope is correct.

**Fine-grained PAT (more scoped, more setup):** Developer settings → **Personal access tokens → Fine-grained tokens** → Generate, set the **Resource owner** to the org and grant **Packages: Read-only**. This requires the org to allow fine-grained tokens (and sometimes an approval). Use the classic PAT above unless you specifically need the tighter scope.

**Already have the `gh` CLI signed in? Reuse it instead of making a new PAT.** `gh auth login`'s default token does **not** include `read:packages`, so `npm install` still `401`s even though `gh` itself works — add the scope, then hand the resulting token to npm:

```bash
gh auth refresh -s read:packages    # adds the scope to your existing gh login
export GITHUB_TOKEN=$(gh auth token)
npm install @sovereignsquad/gds
```

(A brand-new login can request the scope up front instead: `gh auth login --scopes read:packages`.) `gh auth refresh` keeps your session's existing scopes and adds `read:packages` alongside them — it does not issue a `read:packages`-only token — so prefer the classic PAT above if you specifically want the narrowest possible scope. SSO authorization (step 5 above) still applies to whichever token you use.

**Use the token without committing it:** keep the `${GITHUB_TOKEN}` indirection in `.npmrc` (never paste the literal `ghp_…` value into the file) and export it in the environment:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx
npm install
```

**In GitHub Actions, you do not need a PAT at all** — the workflow's built-in `secrets.GITHUB_TOKEN` reads packages when the job has `permissions: packages: read`; see [CI (GitHub Actions) setup](#ci-github-actions-setup). A PAT is only for local development and non-GitHub CI (e.g. Vercel), where you store it as a `GITHUB_TOKEN` secret.

The vendor UI engine is still GDS's concern, not yours, once the registry is configured. Install the umbrella package and your own React; the engine is pulled in automatically:

```bash
npm install @sovereignsquad/gds react react-dom
```

`@sovereignsquad/gds` declares the engine (`@mantine/*`, `@tabler/icons-react`) as peer dependencies, and npm 7+ installs peers automatically — so you do **not** list them yourself. They stay peers (not bundled) on purpose: that guarantees a single resolved engine instance and avoids dual-instance/version-skew failures. All GDS packages pin the **same** engine range, enforced by `npm run verify:install-surface`.

Use icons through the GDS-owned `GdsIcons` surface (`import { GdsIcons } from '@sovereignsquad/gds'`) — do not import `@tabler/icons-react` directly.

> If your installer uses `--legacy-peer-deps` (which disables peer auto-install), add the engine to your install line explicitly; see the granular lane below.

Release-line rule:

- current stable package line: `4.1.10`
- current major line: `3.0.x`
- do not announce or ask clients to install a new version until `npm run verify:published` confirms availability on GitHub Packages

Public install and reference routes:

- live install page: `https://sovereignsquad.github.io/general-design-system/install`
- live governance page: `https://sovereignsquad.github.io/general-design-system/governance`
- live themes page: `https://sovereignsquad.github.io/general-design-system/themes`
- live pattern catalog: `https://sovereignsquad.github.io/general-design-system/patterns`
- live coverage matrix: `https://sovereignsquad.github.io/general-design-system/coverage`
- live demos page: `https://sovereignsquad.github.io/general-design-system/live-demos`
- feature request intake: `https://sovereignsquad.github.io/general-design-system/request-feature`

## 1. Supported consumer baseline

Current verified consumer line:

- React `19.x`
- Mantine `8.3.x` and `9.2.x`
- Next.js `15.x` App Router or Pages Router
- Vite SPA consumers

See [COMPATIBILITY_AND_RELEASES.md](COMPATIBILITY_AND_RELEASES.md) and [VERIFIED_CONSUMER_INSTALL_PROOF.md](VERIFIED_CONSUMER_INSTALL_PROOF.md) for the evidence-backed matrix.

## 2. Canonical install commands

All commands below assume the `.npmrc` from "Single install surface" is already in place.

Preferred `4.1.10` runtime package:

```bash
npm install @sovereignsquad/gds@4.1.10
```

Governance packages:

```bash
npm install -D @sovereignsquad/gds-eslint-config@4.1.10 @sovereignsquad/gds-compliance@4.1.10 @sovereignsquad/gds-a11y@4.1.10
```

Granular runtime packages when package separation is intentional:

```bash
npm install @sovereignsquad/gds-theme@4.1.10 @sovereignsquad/gds-core@4.1.10 @sovereignsquad/gds-admin@4.1.10
npm install -D @sovereignsquad/gds-eslint-config@4.1.10 @sovereignsquad/gds-compliance@4.1.10 @sovereignsquad/gds-a11y@4.1.10
```

Required peers:

```bash
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
```

## 3. Root runtime setup

### Next.js App Router

Use the server/client split explicitly. The layout owns the color-scheme script and the provider file owns the single client boundary.

> **Mandatory:** import `@sovereignsquad/gds-theme/styles.css` exactly once, before your own app styles. Without it, GDS surfaces — including dropdown/menu/overlay backgrounds — render unstyled (transparent dropdowns).

> **Date components are opt-in (#433):** the mandatory `styles.css` does **not** pull in the Mantine dates stylesheet, so consumers that never render a GDS date component need neither `@mantine/dates` nor `dayjs`. If you use `GdsDateInput`, `GdsDateTimeInput`, `GdsDateRangeInput`, or a `GdsSchemaForm` `date` field, also `import '@sovereignsquad/gds-theme/dates.css';` (once, alongside `styles.css`) and install `@mantine/dates` + `dayjs` — they are required peers of `@sovereignsquad/gds-core` (where the date components live), so you already have them whenever you render a GDS date component.

```tsx
// app/layout.tsx
import '@sovereignsquad/gds-theme/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/providers.tsx
'use client';

import { GdsProvider } from '@sovereignsquad/gds/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GdsProvider>{children}</GdsProvider>;
}
```

### Vite / SPA

Mount one provider at the application root:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@sovereignsquad/gds-theme/styles.css'; // mandatory: load once, before app styles
import { GdsProvider } from '@sovereignsquad/gds/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GdsProvider>
    <App />
  </GdsProvider>,
);
```

### Viewport meta (including PWA app shells)

Set `<meta name="viewport">` once, outside React render, using `getGdsPwaViewportMetaContent(...)` from `@sovereignsquad/gds-theme` instead of hand-writing the content string:

```tsx
// Next.js App Router — app/layout.tsx
import { getGdsPwaViewportMetaContent } from '@sovereignsquad/gds-theme';

export function generateViewport() {
  return { other: { viewport: getGdsPwaViewportMetaContent() } };
}
```

```html
<!-- Vite / SPA — index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

The default (`zoomPolicy: 'browser-default'`) leaves pinch-zoom untouched — required for nearly every product. See [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md) before opting an installed PWA app shell into the `'app-shell-fixed'` (zoom-disabled) lane; it is a reviewed exception with required accessibility mitigations, not a default.

## 4. How to use the packages correctly

Use the package lanes intentionally:

- `@sovereignsquad/gds` for the simplest public install path across provider, public, discovery, detail, and admin primitives
- `@sovereignsquad/gds-core/client` for interactive cookbook surfaces such as `GdsLayoutTemplatePreview`
- `@sovereignsquad/gds-core/server` or `@sovereignsquad/gds-core` for starter schema registry helpers such as `getGdsLayoutTemplates()` and `getGdsLayoutTemplate(id)`
- `@sovereignsquad/gds-theme` for consumers that want only the provider/theme lane
- `@sovereignsquad/gds-core` for consumers that want only shared/public/editorial/discovery/detail primitives
- `@sovereignsquad/gds-admin` for consumers that want only authenticated operational shells and admin scaffolds

Use the runtime entrypoints intentionally:

- `@sovereignsquad/gds/server` for non-interactive structural surfaces
- `@sovereignsquad/gds/client` for interactive components and provider mounting
- granular `@sovereignsquad/gds-*/server` and `@sovereignsquad/gds-*/client` lanes remain supported when needed

Use the theme lanes intentionally:

- `gdsTheme` for the canonical base lane
- `gdsDarkPublicTheme` for dark-default public products
- `gdsFlatSurfaceTheme` for flatter operational surfaces
- `gdsEditorialPublicTheme` for serif-forward editorial/public surfaces
- `createPublicBrandTheme(...)` when a branded public product needs governed overrides on top of the shipped lanes

Do not treat `extendGdsTheme(...)` as a consumer branding-layer API. It remains temporarily exported for bounded internal/runtime composition only and should be considered non-canonical for adopters.

Use font lanes intentionally:

- `getGdsFontLanes()` lists the approved 10+ font lanes with fallback stacks, locale coverage, source metadata, and loading strategy
- `resolveGdsFontLane(...)` and `isGdsFontLaneId(...)` recover safely from unknown stored values
- `getGdsFontLaneStylesheetUrls()` exposes the approved non-blocking stylesheet URLs when a host app wants to preload fonts
- `applyGdsFontLane(theme, laneId)` binds typography into the same provider-owned theme lane as colors and surfaces
- do not add local font catalogs, route-local `@font-face`, or unmanaged Google Fonts links outside the registry

Prefer canonical primitives over local reinvention:

- `DiscoveryShell` for sidebar-first applications
- `SidebarNav` for sidebar IA
- `ActionBar` for semantic button stacks
- `ListingCard` for discovery cards
- `MapPanel` for sanctioned embeds
- `DetailProfileShell` for page/drawer detail surfaces
- `useGdsForm` + `FormErrorSummary` for deterministic form-state, validation, and submit behavior
- `OverlayManagerProvider` + `useOverlayManager` for deterministic layered overlay close behavior
- `CommandRegistryProvider` + `useCommandLauncher` for keyboard-first quick-action execution
- `GdsTelemetryProvider` + `useGdsTelemetry` + `emitGdsEvent` for standardized UI observability events
- `createGdsTelemetryAdapter` for vendor-neutral analytics sinks with bounded retry, timeout, adapter-unavailable, payload-rejected, sampling-disabled, sampled-out, emitted, and dropped states

Before introducing a new local surface contract, verify the live catalog first:

- `.../patterns/foundations` for shells, navigation, actions, controls, and shared workflow guidance
- `.../patterns/public` for public, editorial, docs, listing, and footer surfaces
- `.../patterns/operations` for dashboards, section panels, content editors, and detail patterns
- `.../patterns/data` for search, toolbars, tables, browse, and reporting rhythm
- `.../patterns/access` for auth, upload, recovery, sharing, and staged public flows
- `.../patterns/feedback` for state messaging, alerts, badges, modals, drawers, and responsive ergonomics

## 5. Required governance setup

Every mature consumer should add a `gds-adoption.json` manifest and run shared compliance checks in CI.

Minimum CI contract:

```bash
npm run lint
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

For repos targeting true GDS-only enforcement:

```json
{
  "compliance": {
    "strictMode": true,
    "approvedShellPrimitives": ["DiscoveryShell"],
    "approvedDetailPrimitives": ["DetailProfileShell"],
    "approvedListingPrimitives": ["ListingCard"],
    "approvedActionPrimitives": ["ActionBar"]
  }
}
```

The official GitHub Pages site in `apps/playground` follows this same direction. Treat it as the public proof that docs, pattern catalogs, theme exploration, and live demos can be shipped through GDS-owned contracts instead of local Mantine-heavy composition.

For theme-governance enforcement, add explicit theme ownership paths once the repo is ready:

```json
{
  "compliance": {
    "approvedThemeLanes": [
      "gdsTheme",
      "gdsDarkPublicTheme",
      "gdsFlatSurfaceTheme",
      "gdsEditorialPublicTheme",
      "createPublicBrandTheme"
    ],
    "themeOwnershipPaths": ["src/providers.tsx", "src/theme.ts"]
  }
}
```

## 6. Required verification before adoption

Run:

```bash
npm install
npm run build
npm run test:run
npm run verify:mantine
npm run audit:dependencies
gds-compliance check --manifest ./gds-adoption.json
```

Expected failure handling:

- peer conflict: run `npm ls @mantine/core @mantine/hooks @mantine/modals @mantine/notifications react react-dom`, then reinstall the supported peer line instead of forcing resolution
- `401`/`403` on install: see [Troubleshooting `401`/`403` on install](#troubleshooting-401403-on-install) below
- registry propagation after publish: rerun `GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published:availability`, then `npm run verify:published:consumer`
- compliance failure: keep `strictMode` disabled until the failing local shell/card/action/detail adapter is migrated or declared as a temporary exception with owner, review date, tests, and exit condition

### Troubleshooting `401`/`403` on install

A `401 unauthenticated: User cannot be authenticated with the token provided` means GitHub Packages rejected the token outright. Work through these in order — they are listed most-common first:

1. **`$GITHUB_TOKEN` is empty or unset.** The `.npmrc` line `//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}` only works if that environment variable is exported and non-empty. Run `echo $GITHUB_TOKEN` (or `printenv GITHUB_TOKEN`) — a blank result means npm sent an empty token, which reads as `401`. Export a real token first: `export GITHUB_TOKEN=ghp_...`.
2. **Missing `read:packages` scope.** A classic PAT needs at least `read:packages`. Regenerate or edit the token's scopes.
3. **SAML SSO not authorized for the org.** If `sovereignsquad` (or your own org) enforces SAML single sign-on, a correctly-scoped token still `401`s until it is explicitly authorized: open the token's settings page and use **Configure SSO → Authorize** for the org. This is the most common cause when the token *looks* correct.
4. **Fine-grained PAT without the right access.** A fine-grained token must grant the resource owner (the org) and **Packages: read** permission, and the org must allow fine-grained tokens. If in doubt, use a classic PAT with `read:packages`.
5. **`.npmrc` scope/registry lines missing.** Confirm both lines from [Single install surface](#single-install-surface) are present (`@sovereignsquad:registry=...` and the `_authToken` line).

In GitHub Actions, prefer the workflow's own `secrets.GITHUB_TOKEN` (with `permissions: packages: read`) as `NODE_AUTH_TOKEN` rather than a personal token; see [CI setup](#ci-github-actions-setup) below.

### CI (GitHub Actions) setup

In a consumer repo's workflow, authenticate the ambient token to GitHub Packages and grant read permission:

```yaml
permissions:
  contents: read
  packages: read
steps:
  - uses: actions/setup-node@v6
    with:
      node-version: 24
      registry-url: https://npm.pkg.github.com
      scope: "@sovereignsquad"
  - run: npm ci
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

For **local development**, each developer uses their own classic PAT (`read:packages`, SSO-authorized if required), exported as `GITHUB_TOKEN`. Do not commit tokens; keep the `${GITHUB_TOKEN}` indirection in `.npmrc` so the file carries no secret.

### Migrating from the legacy npmjs 3.9.0 packages

If your app currently installs `@sovereignsquad/gds-core@3.9.0` / `@sovereignsquad/gds-theme@3.9.0` (or the `@sovereignsquad/gds@3.9.0` umbrella) from **npmjs.com**, those listings are a frozen, deprecated snapshot that will not receive updates. Move to GitHub Packages:

1. Add the `.npmrc` and token from [Single install surface](#single-install-surface).
2. Switch to the recommended umbrella at the current version: `npm install @sovereignsquad/gds@4.1.10` (it re-exports `gds-core`, `gds-theme`, and `gds-admin`, so you depend on one package instead of several). If you prefer to keep the split packages, install `@sovereignsquad/gds-core@4.1.10` / `@sovereignsquad/gds-theme@4.1.10` instead — both resolve from GitHub Packages.
3. The exports the 3.9.0 line exposed remain available at 3.14.x (for example `OverlayManagerProvider`, `useOverlayManager`, `DiscoveryShell`, and `SidebarNavItem` from `@sovereignsquad/gds-core`), so import paths that used the split package names keep working; the umbrella re-exports them under `@sovereignsquad/gds` as well.

#### Behavioral changes to budget for between 3.9.0 and the current line

The registry move above is the only *install-path* change. Separately, real
product behavior changed across the releases in between — each one is
individually additive/backward-compatible on its own terms, but a consumer
jumping straight from 3.9.0 to current will see all of them at once. None
require a rewrite; each has a concrete, bounded action (or none):

- **Mobile inputs render larger text, with no code change (3.11.0, #379/#380).**
  `gdsTheme` now floors the effective font-size of every Mantine
  `Input`-based control (`TextInput`, `Textarea`, `NativeSelect`, `Select`,
  `PasswordInput`, `NumberInput`, `MultiSelect`, `Autocomplete`, `TagsInput`,
  and `gds-admin`'s `AdminTextInput`/`AdminTextarea`/`AdminSelect`) to at
  least 16px at the `xs`/`sm`/default sizes, to stop iOS Safari/Chrome's
  forced page-zoom on input focus. Any `xs`/`sm`/default-size input goes
  from 12–14px to 16px text purely from the version bump — a real visual
  diff, not a regression. `md`/`lg`/`xl` sizes (already ≥16px) are
  unchanged. See [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md).
  **Action:** none required; re-check any pixel-perfect input-height
  screenshots/snapshot tests.
- **`GdsPageTemplateAction.pending` renamed to `loading` (3.13.0, #405).**
  Matches every other GDS action/button API. `pending` is still honored as
  a backward-compatible alias (mapped to `loading`, with a one-time
  dev-only deprecation warning) and will be removed in a future major.
  **Action:** none required to keep working; rename `pending` → `loading`
  at your own pace before the next major to avoid the removal later.
- **`gds-theme`'s date-component stylesheet became opt-in (3.14.0, #433).**
  `@sovereignsquad/gds-theme/styles.css` no longer unconditionally
  `@import`s `@mantine/dates/styles.css`. If you render `GdsDateInput`,
  `GdsDateTimeInput`, `GdsDateRangeInput`, or a `GdsSchemaForm` `date`
  field, **action required:** add
  `import '@sovereignsquad/gds-theme/dates.css';` alongside your existing
  `styles.css` import, or those components render unstyled. Consumers who
  render no date component need neither this import nor the
  `@mantine/dates`/`dayjs` packages.
- **The `4.0.0` major bump was a release-process artifact, not a breaking
  API change.** A pre-release `3.15.0` (a subset of the badge-system epic)
  had already been published to the registry the same day the epic's
  remaining work landed; a published package version is immutable, so
  shipping the rest of that work required a new version number, and the
  next available one was a major. Every change actually shipped in `4.0.0`
  is additive and backward compatible — budget it like any other minor,
  not like a real breaking-change major.

Consult `CHANGELOG.md` for the full release-by-release detail; the four
items above are the ones with real user-visible or action-required impact
between 3.9.0 and the current line.

## 7. Common mistakes

Do not:

- assume GitHub Packages allows anonymous installs — every install needs the `.npmrc` token, even for public packages
- use sibling `file:` links in CI or hosted builds
- keep a second active token or primitive system alive
- invent local shell, card, or action wrappers when the canonical GDS primitive already exists
- mix `server` and `client` entrypoints arbitrarily
- enable strict mode before the canonical primitives are actually adopted
- assume a missing local implementation means the GDS contract does not exist; check the live pattern catalog and SSOT first

## 8. Release-visibility artifacts (not an install path)

Each `gds-v<VERSION>` tag (for example `gds-v4.1.10`) also gets a GitHub Release page with `.tgz` tarballs attached, generated by `.github/workflows/release-bundles.yml`. This exists for release-notes visibility and offline/audit purposes — it is **not** a documented or supported consumer install path. Install from GitHub Packages as described above.

See [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md) for the full publish/release process.
