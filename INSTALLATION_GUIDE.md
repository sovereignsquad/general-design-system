# Installation Guide

Status: Active SSOT
Version: 6.7.0
Last updated: 2026-10-01

This guide is the canonical consumer setup path for the public umbrella package `@sovereignsquad/gds`. Granular package lanes remain available when a consumer explicitly wants them.

## Single install surface

GDS publishes current and future releases to GitHub Packages' npm-compatible registry (`https://npm.pkg.github.com`). A frozen `3.9.0` snapshot of the packages also exists on npmjs.com. GDS policy deprecates it and does not support it, but as of 2026-10-01 the registry does not mark it deprecated, so installing it prints no warning (see [Migrating from the legacy npmjs 3.9.0 packages](#migrating-from-the-legacy-npmjs-390-packages) below). All new installs use GitHub Packages. Every install, for every consumer, starts with a one-time `.npmrc` entry:

```ini
# .npmrc (project root)
@sovereignsquad:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` is your own personal access token (a classic PAT with `read:packages` scope is sufficient) or your CI's provisioned token — not a GDS-owned secret. GitHub Packages authenticates every install, and these packages are currently **private** to the `sovereignsquad` org, so a token needs both the `read:packages` scope and read access to the org — a token from an account outside the org gets a `401` even with the scope set. Export the token in your shell (or CI secret store) as `GITHUB_TOKEN` before running any command below; the `.npmrc` above expands `${GITHUB_TOKEN}` from that environment variable. If it is unset or empty, installs fail with `401 unauthenticated`. See [Troubleshooting `401`/`403` on install](#troubleshooting-401403-on-install) for the full checklist, including SAML-SSO token authorization.

### Getting a `read:packages` token

The GDS packages are **private** to the `sovereignsquad` GitHub org. Before generating a token, get read access to the org (or to the specific `@sovereignsquad/*` packages) from the GDS maintainers — a token from an account with no org access will `401` regardless of scope.

**Classic PAT — the simplest path for installing, once you have org access:**

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

**In GitHub Actions, you do not need a PAT at all** — the workflow's built-in `secrets.GITHUB_TOKEN` reads packages when the job has `permissions: packages: read`; see [CI (GitHub Actions) setup](#ci-github-actions-setup). A PAT is only for local development and non-GitHub CI/CD hosts (e.g. Vercel), where you store it as a project-level environment variable — worked recipe below.

### Getting `GITHUB_TOKEN` into a deployment host's build

`npm install` runs during your deployment host's **build step**, not just at runtime, so the
classic PAT from [Getting a `read:packages` token](#getting-a-readpackages-token) above has to
be present *before* `npm install` runs there — not only in your local shell. This is the step
consumer adoption most often skips, which is what pushes a team toward vendoring a `file:` tarball
instead (see [Common mistakes](#7-common-mistakes) below for what that costs).

**Vercel — dashboard:**

1. Project → **Settings** → **Environment Variables** in the sidebar.
2. **Name**: `GITHUB_TOKEN`. **Value**: the classic PAT (`read:packages` scope, SSO-authorized if
   your org enforces it).
3. Select which [environments](https://vercel.com/docs/deployments/environments) it applies to
   (**Production** and **Preview** at minimum — a build with no `GITHUB_TOKEN` fails `npm install`
   with `401` the same way a local shell does).
4. **Save**, then redeploy — Vercel does not retroactively apply the variable to a deployment that
   already ran.

**Vercel — CLI**, equivalent to the dashboard steps above:

```bash
vercel env add GITHUB_TOKEN production
vercel env add GITHUB_TOKEN preview
```

Vercel marks a production/preview variable `sensitive` by default (unreadable again from the
dashboard or `vercel env ls` after creation) — correct for a PAT; do not pass `--no-sensitive`.

**Every host follows the same principle**, even where the exact menu differs: the token must be
set as a **build-time** environment variable/secret (not runtime-only), scoped to every
environment that runs `npm install` (production and preview/staging alike), and re-applied after
rotation. Netlify, Render, and Docker-based CI/CD builds expose an equivalent "build environment
variable"/`--build-arg` mechanism — consult that host's own docs for the exact steps, and prefer
its native secret store over baking the token into a Dockerfile layer.

The vendor UI engine is still GDS's concern, not yours, once the registry is configured. Install the umbrella package and your own React; the engine arrives as peer dependencies (see [Peer dependencies](#peer-dependencies)):

```bash
npm install @sovereignsquad/gds react react-dom
```

`react` and `react-dom` are on the install line because your app imports them itself. The engine packages are peer dependencies, covered by the rule below.

Use icons through the GDS-owned `GdsIcons` surface (`import { GdsIcons } from '@sovereignsquad/gds'`) — do not import `@tabler/icons-react` directly.

### Peer dependencies

This is the single peer-dependency rule for every GDS install path.

The peers are the `peerDependencies` of `@sovereignsquad/gds` (`packages/gds/package.json`). Print them for the release you install:

```bash
npm view @sovereignsquad/gds@<version> peerDependencies
```

- **Peer auto-install on (npm 7+, pnpm with its default `autoInstallPeers`):** install the umbrella plus `react` and `react-dom`, and list no other peer.
- **Peer auto-install off (npm `--legacy-peer-deps`, pnpm `autoInstallPeers=false`, Yarn classic):** add every package from that output to your install line, at a range it allows.
- Peers are never bundled into GDS output. This keeps one resolved engine instance; all GDS packages pin the same engine range, enforced by `npm run verify:install-surface`.
- Every peer is needed at runtime, including the ones your code never imports. `@sovereignsquad/gds-core` imports `@tabler/icons-react` to render `GdsIcons`, and its root and `/client` entries import `@mantine/dates` (see the date-component note in [Root runtime setup](#3-root-runtime-setup)).

Release-line rule:

- current stable package line: `6.7.0`
- current major line: `6.x`
- do not announce or ask clients to install a new version until `npm run verify:published` confirms availability on GitHub Packages

Public install and reference routes:

- live install page: `https://sovereignsquad.github.io/general-design-system/install`
- live governance page: `https://sovereignsquad.github.io/general-design-system/governance`
- live themes page: `https://sovereignsquad.github.io/general-design-system/themes`
- live pattern catalog: `https://sovereignsquad.github.io/general-design-system/patterns`
- live coverage matrix: `https://sovereignsquad.github.io/general-design-system/coverage`
- live proofs page: `https://sovereignsquad.github.io/general-design-system/live-proofs`
- feature request intake: `https://sovereignsquad.github.io/general-design-system/request-feature`

## 1. Supported consumer baseline

Current verified consumer line:

- React `19.x`
- Mantine `8.3.x` and `9.2.x`
- Next.js `15.x` App Router
- Vite SPA consumers

The Next.js Pages Router is not on the verified line: GDS has no Pages Router recipe, template, reference fixture or recorded install proof at this version. See [Next.js Pages Router](#nextjs-pages-router) for what still applies.

See [COMPATIBILITY_AND_RELEASES.md](COMPATIBILITY_AND_RELEASES.md) and [VERIFIED_CONSUMER_INSTALL_PROOF.md](VERIFIED_CONSUMER_INSTALL_PROOF.md) for the evidence-backed matrix.

### Surfaces outside GdsProvider

Every recipe in this guide assumes a React app that bundles `@sovereignsquad/gds-theme/styles.css` and renders inside one `GdsProvider`. This section covers HTML rendered anywhere else.

| Surface | What GDS ships for it at this version | What to depend on | Contracts that still apply | Interim path |
|---|---|---|---|---|
| Non-React app (server templates, Python, static HTML) | No linkable stylesheet, no token CSS file and no static component markup. `styles.css` opens with bare-specifier `@import`s of the Mantine stylesheets, which only a bundler resolves, so a `<link>` to it does not work. | No GDS runtime package. Do not pin GDS packages the app cannot import. In `gds-adoption.json`, omit `supportedEntryPoints` or declare `[]`. | Accessibility duties and route scanning (below) | Runtime-constrained mirror (below) |
| HTML emitted outside the React tree by a React app (API-route error pages, magic-link failures) | No helper renders a GDS page as a standalone HTML response. | The app's existing GDS packages | Same as the app's routes | Route and redirect (below) |
| Third-party UI runtime that takes a token map instead of CSS (for example a Gradio theme) | No export shaped for third-party theme APIs. `getGdsVibeThemeCssVariables` returns CSS custom properties only. | No GDS runtime package in that runtime | Accessibility duties and route scanning (below) | Runtime-constrained mirror (below), using the same generated values as the page CSS |

**Accessibility duties.** A page outside `GdsProvider` gets none of the system half of the contract, so it meets all of these itself:

- an accessible name for every control and a visible label for every input (WCAG 4.1.2, 3.3.2)
- a `<main>` landmark, one `<h1>` and ordered headings (1.3.1)
- `lang` on `<html>` (3.1.1)
- keyboard operation of every custom widget; a disclosure or toggle exposes its state with `aria-expanded` and `aria-controls`, so a checkbox-hack menu does not conform (2.1.1, 4.1.2)
- the target-size floor `control-height-min-target` in [`docs/ACCESSIBILITY_FLOOR.md`](docs/ACCESSIBILITY_FLOOR.md)
- AA text contrast (1.4.3)
- the consumer duties in [`docs/ACCESSIBILITY_PER_COMPONENT.md`](docs/ACCESSIBILITY_PER_COMPONENT.md)

**Route scanning.** `runGdsAxeScan(page, config)` from `@sovereignsquad/gds-a11y` scans any served route through a Playwright-like `page`, so it works for non-React pages. It needs Node, `@playwright/test` and `axe-core` (optional peers of `@sovereignsquad/gds-a11y`), and axe-core loaded into the page under test. It reports axe findings only; keyboard order needs `expectGdsTabOrder` from the same package, and target size needs a test of its own. See [A11Y_CI_PACKAGE.md](A11Y_CI_PACKAGE.md).

**Runtime-constrained mirror.** A consumer that can never import the packages may mirror GDS token values only as the bounded, generated, time-limited profile in [ADOPTION_AND_MIGRATION_PLAYBOOK.md, "Runtime-constrained mirror"](ADOPTION_AND_MIGRATION_PLAYBOOK.md#runtime-constrained-mirror). The values come from `getGdsVibeThemeCssVariables(presetId, colorScheme)` on `@sovereignsquad/gds-theme/server`, called in a Node build step; that entry loads `@mantine/core` and `react` at import time, so the build step needs both installed.

**Route and redirect for HTML outside the React tree.** Never send a styled HTML string from an API route or route handler. Never reference `--mantine-*` or `--gds-*` variables in a document that does not load their stylesheet: a `var()` with no fallback that names an undefined variable makes the whole declaration invalid, so the property falls back to its inherited or initial value. Redirect to an ordinary route instead, which renders inside the root layout, stylesheet and `GdsProvider`:

```ts
// Next.js App Router: app/api/auth/magic-login/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const valid = await verifyMagicLink(request); // the app's own check
  if (!valid) {
    return NextResponse.redirect(new URL('/auth/link-expired', request.url), 303);
  }
  // ...
}
```

```ts
// Next.js Pages Router: pages/api/auth/magic-login.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const valid = await verifyMagicLink(req); // the app's own check
  if (!valid) {
    res.redirect(303, '/auth/link-expired');
    return;
  }
  // ...
}
```

```tsx
// app/auth/link-expired/page.tsx (App Router) or pages/auth/link-expired.tsx (Pages Router)
'use client';

import { useRouter } from 'next/navigation'; // Pages Router: 'next/router'
import { GdsErrorPageTemplate, SemanticButton } from '@sovereignsquad/gds/client';

export default function LinkExpiredPage() {
  const router = useRouter();
  return (
    <GdsErrorPageTemplate
      title="This sign-in link has expired"
      description="Request a new link to continue."
      recovery={<SemanticButton action="login" onClick={() => router.push('/login')} />}
    />
  );
}
```

`GdsErrorPageTemplate` renders the `<main>` landmark, the `<h1>` and the recovery action. For a session or permission failure inside an existing page, `AccessRecoveryPanel` (`@sovereignsquad/gds/client`) supplies localized copy and the sign-in, retry and back actions. Where a redirect is not acceptable, render `GdsErrorPageTemplate` from the framework's own error pages (Pages Router `pages/_error`, App Router `not-found.tsx` / `error.tsx`), never from an HTML string.

No GDS artifact covers error HTML served before the React app can boot (edge middleware, CDN error pages).

## 2. Canonical install commands

All commands below assume the `.npmrc` from "Single install surface" is already in place.

Preferred `6.7.0` runtime package:

```bash
npm install @sovereignsquad/gds@6.7.0
```

Governance packages:

```bash
npm install -D @sovereignsquad/gds-eslint-config@6.7.0 @sovereignsquad/gds-compliance@6.7.0 @sovereignsquad/gds-a11y@6.7.0
```

Granular runtime packages when package separation is intentional:

```bash
npm install @sovereignsquad/gds-theme@6.7.0 @sovereignsquad/gds-core@6.7.0 @sovereignsquad/gds-admin@6.7.0
npm install -D @sovereignsquad/gds-eslint-config@6.7.0 @sovereignsquad/gds-compliance@6.7.0 @sovereignsquad/gds-a11y@6.7.0
```

Peers: with peer auto-install on, these commands need no peer list. With it off, add the peers as described in [Peer dependencies](#peer-dependencies).

## 3. Root runtime setup

Every React root needs two separate steps. `GdsProvider` does not perform the first one.

1. **The stylesheet.** Import `@sovereignsquad/gds-theme/styles.css` exactly once, in the app entry, before your own app styles. It supplies the Mantine core and notifications stylesheets, the bundled Inter font, the default `--gds-*` role, overlay and motion tokens, the theme-preset rules, and the global `:focus-visible`, `forced-colors` and `prefers-reduced-motion` rules.
2. **The provider.** Mount one `GdsProvider` at the root. It supplies the Mantine theme and its `--mantine-*` variables, color-scheme handling, direction, locale, modals and notifications, and any `--gds-*` variables the theme itself carries (`theme.other.gdsCssVariables`).

> **Mandatory:** import `@sovereignsquad/gds-theme/styles.css` exactly once, before your own app styles. Without it, GDS surfaces — including dropdown/menu/overlay backgrounds — render unstyled (transparent dropdowns).

> **Do not import the Mantine stylesheets yourself.** `styles.css` already `@import`s `@mantine/core/styles.css` and `@mantine/notifications/styles.css`. Importing either one next to `styles.css` loads it twice; importing it instead of `styles.css` leaves out every GDS rule.

> **Date components:** `styles.css` does not include the Mantine dates stylesheet. If you render `GdsDateInput`, `GdsDateTimeInput`, `GdsDateRangeInput`, or a `GdsSchemaForm` `date` field, also `import '@sovereignsquad/gds-theme/dates.css';` once, next to `styles.css`. The `@mantine/dates` and `dayjs` packages are needed whether or not you render a date component: the root and `/client` entries of `@sovereignsquad/gds-core`, which the umbrella re-exports, include the date inputs, and those import `@mantine/dates`, which in turn needs `dayjs`. Both are peers of the umbrella, so the [peer rule](#peer-dependencies) installs them.

### Next.js App Router

Use the server/client split explicitly. The layout owns the color-scheme script and the provider file owns the single client boundary.

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

GDS exports no `ColorSchemeScript` at this version, so the layout imports Mantine's. With `compliance.strictMode` on, `gds-compliance check` reports that import as `strict.import.mantine-core` unless an approved exception covers the layout file; the exception categories that rule accepts are its `allowedExceptionCategories` in `packages/gds-compliance/index.js`. Every other Mantine component import follows [DEPENDENCY_GOVERNANCE.md, "Mantine boundary"](DEPENDENCY_GOVERNANCE.md#mantine-boundary).

### Next.js Pages Router

GDS has no Pages Router recipe, template or reference fixture at this version, and no recorded install proof covers the Pages Router ([VERIFIED_CONSUMER_INSTALL_PROOF.md](VERIFIED_CONSUMER_INSTALL_PROOF.md) records the App Router fixture). The two root steps still apply:

- import `@sovereignsquad/gds-theme/styles.css` once, in `pages/_app`. The Pages Router accepts global CSS imports only from the custom App.
- mount one `GdsProvider` in `pages/_app`, around the page component.

GDS documents no `pages/_document` wiring for Mantine's `ColorSchemeScript`. An app that uses both routers imports the stylesheet once per router root: `app/layout` and `pages/_app`.

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

### Stylesheet troubleshooting

**Load check.** Run this in the browser console on a page of the running app, against the dev server and against a production build:

```js
getComputedStyle(document.documentElement).getPropertyValue('--gds-overlay-surface')
```

A non-empty result means `styles.css` is applied. `--gds-overlay-surface` is declared by `styles.css` and written by no GDS runtime code, so a theme, brand or preset cannot make the check pass on its own. Role tokens such as `--gds-bg-page` are not a reliable probe, because preset and brand runtimes also write them.

An empty result is an accessibility defect: the page has lost the opaque overlay surfaces, the global `:focus-visible` rules, and the `forced-colors` and `prefers-reduced-motion` rules.

| Symptom | Cause and fix |
|---|---|
| `Module not found` / `Can't resolve '@sovereignsquad/gds-theme/styles.css'` with only the umbrella installed | The umbrella exports no stylesheet subpath (`@sovereignsquad/gds/styles.css` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`), and a package manager with an isolated linker (pnpm by default) does not expose the umbrella's own dependencies to the app. Add `@sovereignsquad/gds-theme` as a direct dependency at the same version as the umbrella. |
| Vite: check fails | Confirm the import sits in the entry module (`main.tsx`), once, above app CSS. GDS's own reference site imports `styles.css` this way in `apps/playground/src/main.tsx` and builds it with `vite build` in `npm run build`. |
| Next.js with webpack: check fails | App Router: import it in `app/layout`. Pages Router: only `pages/_app` may import global CSS. No GDS gate runs `next build` against the stylesheet (the `reference-next` fixture's `build` script is `tsc --noEmit`). |
| Next.js with Turbopack: build or dev error on the stylesheet | No GDS build or recorded install proof exercises Turbopack. Record the exact error and the Next.js version and file a GDS issue. Next.js 16 is outside the verified line in [section 1](#1-supported-consumer-baseline). |
| Check passes in dev, fails in production | `packages/gds-theme/package.json` declares `"sideEffects": false`. A bundler that applies that flag to a side-effect-only CSS import removes the stylesheet from production output. File a GDS issue with the bundler and version. |

Never copy `styles.css` into the app, whole or in part, to get past a bundler error. A copy stays at the version it was taken from, receives no fixes, and keeps any font `@import` it carried.

### Common setup mistakes

| Mistake | What goes wrong | Fix |
|---|---|---|
| The GDS stylesheet is never imported | `GdsProvider` renders, but every `--gds-*` default, the overlay surfaces, the Inter font, the preset rules and the accessibility rules listed in step 1 above are missing. At this version nothing reports it at runtime, and `gds-compliance check` has no rule for it. | Import `@sovereignsquad/gds-theme/styles.css` once in the entry file, then run the [load check](#stylesheet-troubleshooting). |
| Mantine stylesheets imported directly | Imported instead of `styles.css`: the GDS layer is missing. Imported next to it: the Mantine sheets load twice. | Remove `@mantine/core/styles.css` and `@mantine/notifications/styles.css` imports; keep only `styles.css` (plus `dates.css` when date components render). |
| A second provider | `GdsProvider` already renders Mantine's `MantineProvider`, `ModalsProvider` and `Notifications` (`packages/gds-theme/src/GdsProvider.tsx`). Another `MantineProvider` gives its subtree a different theme and can write its own `--mantine-*` variables to `:root`; another `Notifications` adds a second notification region. | Mount exactly one `GdsProvider` per React root and none of those three components yourself. |
| The deprecated theme factory | `extendGdsTheme(...)` is `@deprecated` and kept for internal composition only. In a file listed in `compliance.themeOwnershipPaths`, `gds-compliance` reports it as `theme.noncanonical-extend-helper`, and a call to Mantine's `createTheme`, `mergeMantineTheme` or `mergeThemeOverrides` as `theme.parallel-branding-layer`. Outside those files nothing reports either. | Use a canonical theme lane: `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme` or `createPublicBrandTheme(...)`. |
| A hand-copied fork of `styles.css` | The app gets none of the stylesheet's later fixes or tokens. Rules and tokens the fork lacks behave as if the stylesheet were missing. | Delete the fork and import the package stylesheet. |
| Inter loaded again | `styles.css` already loads Inter (see [Font lanes](#font-lanes)). A second load through `next/font`, a `<link>` or an `@import` requests the same family twice. | Remove the second load. |

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

Fonts follow [Font lanes](#font-lanes) below.

Mantine components: the names GDS re-exports from `@mantine/core`, and the replacements for names it does not, are in [DEPENDENCY_GOVERNANCE.md, "Mantine boundary"](DEPENDENCY_GOVERNANCE.md#mantine-boundary).

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

### Font lanes

`styles.css` loads one font: Inter, through the `fonts.googleapis.com` `@import` at the top of `packages/gds-theme/styles.css`, which also sets the requested weights. That import requests Inter only. The default `inter` lane's stack (`resolveGdsFontLane('inter').body`) names Noto families after Inter for scripts Inter does not cover, and those render only where the device already has them. Do not load Inter again through `next/font`, a `<link>` or an `@import`; GDS has no option to drop its own Inter import at this version.

- `getGdsFontLanes()` returns the registered lanes, each with its fallback stack, locale coverage, `source`, `loadStrategy` and, for web fonts, `cssImportUrl`. It is the list; this guide does not copy it.
- `resolveGdsFontLane(id)` falls back to `inter` for an unknown or empty id, and `isGdsFontLaneId(id)` tests one. A stored preference (cookie, database row) holds a lane id, never a family name.
- `applyGdsFontLane(theme, laneId)` writes the lane's body, heading and mono stacks into a theme override. It loads nothing. `useGdsThemePresetState` adds the lane's stylesheet link when the lane is switched at runtime; an app that binds a non-default lane without it links the lane's `cssImportUrl` itself. `getGdsFontLaneStylesheetUrls()` lists every lane URL for preloading.
- `resolveGdsTypographyTokens(axis, themeId, knownLaneIds)` throws `GdsAxisError` for a lane id outside `knownLaneIds`.
- Do not add local font catalogs, route-local `@font-face`, or Google Fonts links outside the registry, except under the exception below.

#### Unregistered brand font

The lane registry is closed to consumers at this version. No exported function registers a lane, and `GdsFontLaneSource` in `packages/gds-theme/src/font-lanes.ts` has only the `'system'` and `'google-fonts-compatible'` sources, so self-hosted files, `next/font` output and licensed faces cannot become lanes. `createBrandTheme`'s `fonts` and `createPublicBrandTheme`'s `overrides` accept any family string; GDS neither checks it against the registry nor loads it.

A product whose brand face is not a lane uses it only under an approved exception:

1. Add an `approvedExceptions` entry to `gds-adoption.json` with `category: "package-coverage-gap"` and a `scope` that lists only the files that load or apply the font. It needs the fields the schema requires (`schemas/gds-adoption.schema.json`) and those `gds-compliance` requires (`EXCEPTION_REQUIRED_FIELDS` in `packages/gds-compliance/index.js`); `gds-compliance validate-manifest` names any that are missing. Name the locales the face covers in `reason`, and set `exitCondition` to the face becoming a registered lane.
2. Load the face with `font-display: swap` (`display: 'swap'` in `next/font`), so text is never invisible while it loads.
3. Hand the family to the theme through a CSS custom property defined on `<html>`. Mantine declares `--mantine-font-family` on `:root` (`GdsProvider`'s `cssVariablesSelector` defaults to `:root`), so a variable defined on a lower element does not reach it.
4. Keep a lane stack after the brand family and give the `var()` a fallback. Non-Latin text then still renders, and an undefined variable resolves to the lane stack. Without the fallback, an undefined variable invalidates the whole declaration and the text inherits the browser's default font.

```ts
// theme.ts
import { createPublicBrandTheme, resolveGdsFontLane } from '@sovereignsquad/gds-theme/client';

const lane = resolveGdsFontLane('inter');

export const appTheme = createPublicBrandTheme({
  overrides: {
    headings: { fontFamily: `var(--font-brand-display, ${lane.heading}), ${lane.heading}` },
  },
});
```

Per-tenant or per-page faces (a partner face on one report) have no lane mechanism; scope the exception to that surface.

#### `next/font`

`next/font` output is not a lane. Use it only for an unregistered brand face under the exception above: set `display: 'swap'` and a `variable`, put the font's `variable` class on `<html>` in the root layout, and read the variable in the theme as shown above. Do not use it for Inter, which `styles.css` already loads, or for a face that is already a lane.

```tsx
// app/layout.tsx (excerpt)
import { Anton } from 'next/font/google';

const brandDisplay = Anton({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-brand-display' });

// <html lang="en" className={brandDisplay.variable}>
```

## 5. Required governance setup

Every consumer **must** add a `gds-adoption.json` manifest and run `gds-compliance` as a standing
CI check on every PR — not a one-time local command run during adoption and never wired in
afterward. `gds-compliance` installed as a dependency with no CI step calling it enforces nothing;
a real `gds-adoption.json` manifest has been found sitting unwired for an extended period with
dozens of accumulated, unaddressed findings before, precisely because nothing was ever going to
surface them.

Minimum CI contract:

```bash
npm run lint
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

Add it as an actual CI step, not just a command a developer might remember to run locally —
extend the [CI (GitHub Actions) setup](#ci-github-actions-setup) job below with:

```yaml
  - run: npm run lint
  - run: npx gds-compliance validate-manifest --manifest ./gds-adoption.json
  - run: npx gds-compliance check --manifest ./gds-adoption.json
```

If the check currently fails on adoption day, that is not a reason to skip wiring it in — see
[Required verification before adoption](#6-required-verification-before-adoption)'s "compliance
failure" guidance below for how to land the CI gate before the repo is fully clean.

**Known issue:** a `var(--token, #fallback)` CSS-variable-with-literal-fallback pattern could
false-positive on the raw-color check before issue #670 shipped (fixed: the check now excludes a
hex/rgb literal used solely as a `var()` fallback). If `gds-compliance check` reports a
`forbidden-color`/`strict.raw-color` finding on a line that already reads a token via `var()` and
you are on a version predating that fix, upgrade rather than stripping the fallback — the
fallback is correct, defensive code, not a violation.

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

The official GitHub Pages site in `apps/playground` follows this same direction. Treat it as the public proof that docs, pattern catalogs, theme exploration, and live proofs can be shipped through GDS-owned contracts instead of local Mantine-heavy composition.

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

- peer conflict: run `npm ls <peer>` for each package in the [peer list](#peer-dependencies), then reinstall the supported peer line instead of forcing resolution
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

A `403` means GitHub Packages accepted the credentials and refused the request. Two causes:

1. **No read access to the package.** The token's account, or for `secrets.GITHUB_TOKEN` the workflow's repository, cannot read the `@sovereignsquad` package. A workflow token reads a private organization package only when its repository is granted access under the package's **Manage Actions access** settings, or inherits it ([GitHub: configuring a package's access control and visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)). This fails for that one token or repository.
2. **The organization's GitHub Packages usage is blocked.** GitHub blocks usage once an account has used its included quota and has no payment method that allows more ([GitHub: GitHub Packages billing](https://docs.github.com/en/billing/concepts/product-billing/github-packages)). Every token in the organization fails at once, including tokens that worked the day before, local and CI alike.

To tell them apart, run `npm view @sovereignsquad/gds version` with a second token from another organization member, or in CI. If only one token or repository fails, it is cause 1. If every token fails and no token, scope or package setting changed, ask an organization owner or billing manager to check the organization's GitHub Packages usage in its billing settings; while it is blocked, see [Registry outage: bounded vendored fallback](#registry-outage-bounded-vendored-fallback).

In GitHub Actions, prefer the workflow's own `secrets.GITHUB_TOKEN` (with `permissions: packages: read`) as `NODE_AUTH_TOKEN` rather than a personal token; see [CI setup](#ci-github-actions-setup) below.

### Registry outage: bounded vendored fallback

Use this only while installs from GitHub Packages fail for every token (cause 2 above). It is temporary by definition: once its removal date passes, it is the permanent vendoring that [Common mistakes](#7-common-mistakes) forbids.

1. **Tarballs.** Download the tarballs of the exact version the app already runs from the GitHub Release of its `gds-v<VERSION>` tag ([section 8](#8-release-visibility-artifacts-not-an-install-path)). Release assets are served by GitHub Releases, not GitHub Packages:

   ```bash
   gh release download gds-v<VERSION> --repo sovereignsquad/general-design-system --pattern '*.tgz' --pattern manifest.json --dir vendor/gds
   shasum -a 256 vendor/gds/*.tgz   # compare with the sha256 values in vendor/gds/manifest.json
   ```

2. **Dependencies.** Point each `@sovereignsquad/*` package the app uses at its tarball (`"file:vendor/gds/<filename>"`) in `dependencies` or `devDependencies`, and repeat the runtime entries under `overrides`, so the packages' own `@sovereignsquad/*` dependencies and peers resolve to the same tarballs instead of the registry.
3. **Record.** Add an `approvedExceptions` entry to `gds-adoption.json`: `category: "runtime-constraint"`, `status: "temporary"`, an `owner`, a `reviewDate` that is the removal date, and an `exitCondition` that names the registry recovery. `gds-compliance validate-manifest` names any other required field you omit.
4. **Exit.** When `npm view @sovereignsquad/gds version` succeeds again, restore the registry versions, remove the `overrides` entries, delete `vendor/gds/`, reinstall, and remove the exception.

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

The `@sovereignsquad/*` `3.9.0` listings on npmjs.com are a frozen snapshot that receives no updates, and GDS policy deprecates them. As of 2026-10-01 none of them is marked deprecated on the registry, so installing them prints no warning. Check the current state with:

```bash
npm view @sovereignsquad/gds@3.9.0 deprecated --@sovereignsquad:registry=https://registry.npmjs.org
```

Empty output means the version is not marked. The scoped flag is needed because `--registry` does not override an `@sovereignsquad:registry` line in `.npmrc`.

An app still on `@doneisbetter/*` first renames its imports with the package mapping in [MIGRATION_TO_SOVEREIGNSQUAD.md](MIGRATION_TO_SOVEREIGNSQUAD.md), then follows the steps below to the current release on GitHub Packages, not to the npmjs `3.9.0` snapshot.

Install-path steps:

1. **Registry.** Add the `@sovereignsquad:registry` line and token line to `.npmrc` ([Single install surface](#single-install-surface)).
2. **CI token.** Give each workflow that installs `permissions: packages: read`, `registry-url` and `NODE_AUTH_TOKEN` ([CI setup](#ci-github-actions-setup)), and set `GITHUB_TOKEN` on every deployment host that builds ([deployment hosts](#getting-github_token-into-a-deployment-hosts-build)).
3. **Install.** Switch to the umbrella at the current version: `npm install @sovereignsquad/gds@6.7.0`. It re-exports `gds-core`, `gds-theme` and `gds-admin`. To keep the split packages, install `@sovereignsquad/gds-core@6.7.0` and `@sovereignsquad/gds-theme@6.7.0` instead. Apply the [peer rule](#peer-dependencies): `@mantine/dates` and `dayjs` became peers of `gds-core` and the umbrella in `3.12.0`.
4. **Lockfile.** Regenerate the lockfile, then confirm the declared, locked and installed versions agree with `npm ls @sovereignsquad/gds` (or `pnpm list @sovereignsquad/gds`). Remove any `3.9.0` entries from pnpm's `minimumReleaseAgeExclude`.

Export names: comparing the root, `/client` and `/server` entries of `@sovereignsquad/gds`, `gds-core`, `gds-theme` and `gds-admin` at the tags `gds-v3.9.0` and `gds-v6.7.0`, the only removed names are the `5.0.0` `ReferenceThemeExplorer` relocation below. Every other name `3.9.0` exported, such as `OverlayManagerProvider`, `useOverlayManager`, `DiscoveryShell` and `SidebarNavItem`, is still exported from the same entry. The full rename list is the "3.9.0 to current" entry in [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md#390-to-current).

#### Changes to budget for between 3.9.0 and the current line

Each item names its release, the action, and where it is recorded. Items marked **accessibility** change rendered output that contrast or zoom checks measure; re-run those checks after upgrading.

| Release | Change | Action | Record |
|---|---|---|---|
| `3.11.0` | **Accessibility.** `gdsTheme` floors the font size of Mantine `Input`-based controls at the `xs`, `sm` and default sizes (`components.Input.vars` in `packages/gds-theme/src/theme.ts`), so iOS no longer zooms the page on input focus. Inputs at those sizes render larger text with no code change. | None required. Re-check input-height screenshots and snapshot tests. | `CHANGELOG.md` `3.11.0`; [`docs/PWA_VIEWPORT_POLICY.md`](docs/PWA_VIEWPORT_POLICY.md) |
| `3.12.0` | `@mantine/dates` and `dayjs` became peer dependencies of `@sovereignsquad/gds` and `@sovereignsquad/gds-core`. | With peer auto-install off, add them to the install line. | [Peer dependencies](#peer-dependencies) |
| `3.13.0` | `GdsPageTemplateAction.pending` renamed to `loading`. `pending` still works as a deprecated alias with a development-only warning. | Rename `pending` to `loading`. | [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md#gdspagetemplateactionpending-renamed-to-loading-3130) |
| `3.14.0` | `styles.css` no longer `@import`s the Mantine dates stylesheet; it moved to `@sovereignsquad/gds-theme/dates.css`. | If you render a GDS date component, import `dates.css` next to `styles.css`. | `CHANGELOG.md` `3.14.0`; [Root runtime setup](#3-root-runtime-setup) |
| `3.14.9` | **Accessibility.** `styles.css` defines the default semantic-role layer (`--gds-bg-*`, `--gds-text-*`, `--gds-border-card`) at `:root`. Components that fell back to per-component values now read governed defaults. Requires the stylesheet import. | Confirm the stylesheet is imported ([load check](#stylesheet-troubleshooting)), then re-run contrast checks. | `CHANGELOG.md` `3.14.9`; [`docs/SEMANTIC_ROLE_TOKENS.md`](docs/SEMANTIC_ROLE_TOKENS.md) |
| `4.0.0` | **Accessibility.** Every theme preset defines the full semantic role set (`--gds-state-*`, `--gds-badge-*`, `--gds-brand-*` and the rest), so role values that previously fell back under a preset now resolve to contrast-gated values. The major version number itself marks no breaking change: everything in `4.0.0` is additive. | Re-run contrast checks on preset-themed routes. | `CHANGELOG.md` `4.0.0`; [`docs/SEMANTIC_ROLE_TOKENS.md`](docs/SEMANTIC_ROLE_TOKENS.md) |
| `5.0.0` | **Breaking.** `ReferenceThemeExplorer` and its three types moved from the `gds-core` root and `/client` entries to `@sovereignsquad/gds-core/reference-theme-explorer`. | Change the import path. | [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md#referencethemeexplorer-moved-to-a-dedicated-subpath-500) |
| `6.0.0` | **Breaking, accessibility.** The `class-usa` lane was re-based: `ClassUsaColorRampName` members and the `classUsa*` Mantine color keys were renamed, and every emitted `class-usa` color value changed. | Rename ramp keys and color keys; re-verify anything styled against the old palette, including contrast. | [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md#class-usa-re-based-onto-its-v2-palette-classusacolorrampname-and-classusa-mantine-keys-renamed-600) |
| `6.1.0` | `PublicShell` header heights read the new `--gds-shell-height-*` tokens (`resolveGdsShellHeightTokens`, wired through `resolveGdsAxisTokens`). Rendered heights are unchanged. | None. | `CHANGELOG.md` `6.1.0`; [THEME_GOVERNANCE.md](THEME_GOVERNANCE.md) |
| `6.1.0` | `gdsBadgeAccentColors` and `gdsBadgeAccentShades` are deprecated in favour of the `--gds-accent-*` tokens. | Read `var(--gds-accent-<name>-<shade>)` instead. | [DEPRECATIONS_AND_MIGRATIONS.md](DEPRECATIONS_AND_MIGRATIONS.md#gdsbadgeaccentcolors-and-gdsbadgeaccentshades-derived-from-the-accent-axis-610) |

No gate checks this table against `CHANGELOG.md` or `DEPRECATIONS_AND_MIGRATIONS.md`. Read the `CHANGELOG.md` entries from `3.10.0` to the version you install for everything else that changed.

## 7. Common mistakes

Root setup mistakes (stylesheet, providers, theme factory, fonts) are in [Common setup mistakes](#common-setup-mistakes).

Do not:

- assume GitHub Packages allows anonymous installs — every install needs the `.npmrc` token, and these packages are private, so the token also needs org read access
- use sibling `file:` links in CI or hosted builds — this is not a theoretical warning: several
  real GDS consumers have vendored a `file:vendor/gds/*.tgz` copy as their **primary**, permanent
  install mechanism rather than a one-off workaround. `npm outdated`/Dependabot cannot track a
  `file:` dependency the way they track a registry semver range, so nothing ever prompts an
  upgrade — the vendored copy just gets older. Use the [deployment-host build step
  recipe](#getting-github_token-into-a-deployment-hosts-build) above instead of vendoring; it
  solves the same underlying problem (getting the token into a hosted build) without losing
  update visibility. The one exception is the [registry-outage
  fallback](#registry-outage-bounded-vendored-fallback), which is recorded with an owner, a
  removal date and an exit condition; a fallback still in place after its removal date is this
  mistake.
- keep a second active token or primitive system alive
- invent local shell, card, or action wrappers when the canonical GDS primitive already exists
- mix `server` and `client` entrypoints arbitrarily
- enable strict mode before the canonical primitives are actually adopted
- assume a missing local implementation means the GDS contract does not exist; check the live pattern catalog and SSOT first
- reimplement `gds-compliance`'s checks by hand because installing the real package hit friction
  (registry auth, environment constraints) — a hand-rolled duplicate never receives upstream
  fixes (for example, issue #670's raw-color false-positive fix) and drifts from the real rule
  set silently. If the installed package is genuinely unavailable in some environment, say so and
  file the gap rather than forking the logic.

## 8. Release-visibility artifacts (not an install path)

Each `gds-v<VERSION>` tag (for example `gds-v6.7.0`) also gets a GitHub Release page with `.tgz` tarballs attached, generated by `.github/workflows/release-bundles.yml`. This exists for release-notes visibility and offline/audit purposes — it is **not** a supported consumer install path: it carries no update signal at all, so a consumer installing from a Release tarball URL can drift multiple major versions behind with nothing ever prompting an upgrade. Install from GitHub Packages as described above. The only sanctioned use of these tarballs in a consumer is the time-boxed [registry-outage fallback](#registry-outage-bounded-vendored-fallback).

See [RELEASE_PUBLISH.md](RELEASE_PUBLISH.md) for the full publish/release process.
