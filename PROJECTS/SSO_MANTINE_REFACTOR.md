# SSO Mantine Refactor

Status: Legacy removal complete, adoption gaps open
Version: 2.0.0
Last updated: 2026-10-01
Project: `moldovancsaba/sso`

Paths below are relative to the SSO repository root.

## Objective

Refactor SSO to a pure Mantine and GDS system with no long-lived bridge between the former local CSS/theme system and the GDS theme.

## Current state (verified 2026-10-01)

Read-only check of a local checkout at `main` `d6c385be`.

- **Packages.** `gds-core`, `gds-theme` and `gds-admin` 6.0.0 in `dependencies` (`package.json:44-46`) and `gds-compliance`, `gds-eslint-config` 6.0.0 in `devDependencies` (`:64-65`), all vendored `file:vendor/gds/` tarballs. `overrides` repeat the runtime three (`:81-83`).
- **Stack.** Next.js Pages Router in plain JavaScript. GDS has no Pages Router recipe, template or install proof at this version; [INSTALLATION_GUIDE.md, "Next.js Pages Router"](../INSTALLATION_GUIDE.md#nextjs-pages-router) states the two root steps that still apply.
- **Provider and theme.** One `GdsProvider` in `pages/_app.js`. The theme comes from `createPublicBrandTheme` (`lib/theme/mantineTheme.js:1,102`), an approved lane. Its overrides still carry raw colour literals and a private radius scale.
- **Stylesheet.** `@sovereignsquad/gds-theme/styles.css` is not imported. `pages/_app.js:1-2` imports the Mantine stylesheets directly, so the `--gds-*` tokens that GDS components read are undefined.
- **Manifest.** `gds-adoption.json` declares `gdsVersion` 6.0.0 and `migrationStatus` `direct`, which is not a value in `schemas/gds-adoption.schema.json`. `compliance.strictMode` is absent, so a zero-finding `gds-compliance` run does not cover the strict rules ([COMPLIANCE_TOOLKIT.md, "What a zero-finding run proves"](../COMPLIANCE_TOOLKIT.md#what-a-zero-finding-run-proves)).
- **Local adapter doc.** `docs/DESIGN_SYSTEM.md:3` reads "Direct package adoption — no local UI authority remains".
- **Surfaces without GDS.** The OAuth consent page (`pages/oauth/consent.js`) imports no GDS package. The magic-link failure responses in `pages/api/admin/magic-login.js` and `pages/api/public/magic-login.js` are standalone HTML strings that reference `--mantine-color-*` variables without loading their stylesheet. The admin pages render no shell component.
- **Auth and dialogs.** No page sets `AuthShell` `intent`. Account and admin flows, including user deletion, use browser `confirm()`, `prompt()` and `alert()`.

### Legacy inventory: deleted

No tracked CSS file remains (`git ls-files '*.css'` is empty).

| Former file | Deleted in |
|---|---|
| `styles/globals.css` | `406218d0` (2026-08-24) |
| `components/ThemeProvider.js` | `533d5070` (2026-05-21) |
| `styles/login.module.css` | `533d5070` (2026-05-21) |
| `styles/docs.module.css` | `e793657a` (2026-05-24) |
| `styles/docs-layout.module.css` | `e793657a` (2026-05-24) |
| `styles/home.module.css` | `533d5070` (2026-05-21) |
| `pages/admin/style-editor.js` | `533d5070` (2026-05-21) |

## Next steps

1. Import `@sovereignsquad/gds-theme/styles.css` once in `pages/_app.js` and remove the direct Mantine stylesheet imports, which it already includes.
2. Redirect the magic-link failure responses to ordinary routes that render inside `pages/_app.js` ([INSTALLATION_GUIDE.md, "Surfaces outside GdsProvider"](../INSTALLATION_GUIDE.md#surfaces-outside-gdsprovider)).
3. Render the OAuth consent page through GDS, starting with `AuthShell`.
4. Set `AuthShell` `intent` on each auth page, and replace browser dialogs with `useGdsConfirm`, which the installed 6.0.0 `gds-core` exports.
5. Set `compliance.strictMode: true`, replace `migrationStatus` with a schema value, and upgrade from 6.0.0 to the current line through the registry install.

Full fix list: `gds_fix_handover.md` at the SSO repository root. It is not committed to the SSO repository.

## Non-Goals

- reintroducing a local token source next to the GDS theme
- reintroducing a runtime theme layer next to `GdsProvider`
- product UI CSS modules as the default path for new work

## Target End State

- one root `GdsProvider` in `pages/_app.js` (done)
- one exported theme file built by an approved lane (done)
- notifications and modals configured centrally (done)
- auth and admin surfaces rendered from GDS and Mantine primitives
- docs surfaces on GDS layout and typography (done)
- old token/theme infrastructure deleted (done)
- `@sovereignsquad/gds-theme/styles.css` loaded once (open)

## Pattern Service Priorities

SSO must use `PATTERN_SERVICE_MODEL.md`, but its contract set should stay intentionally smaller than full product apps.

Required local contracts:

1. **AuthShell**: login, consent, account entry, provider-branded controls, inline errors, and loading states.
2. **AdminShell**: admin navigation, account controls, active route, and CRUD action placement.
3. **DocsShell**: documentation/article layout, readable typography, side navigation where needed, and mobile collapse.
4. **StateBlock**: loading, empty, error, permission, disabled, and success states for auth/admin/docs workflows.

Acceptance requirements:

- SSO does not import a broad product-card or metric system unless a real repeated SSO workflow needs it
- auth/admin/docs shells are the only shell variants
- no product UI CSS modules are reintroduced

## Required Local Adapter

SSO maintains its local adapter note in `docs/DESIGN_SYSTEM.md`. It describes:

- local status
- current foundation
- theme/provider path
- wrapper or direct primitive policy
- validation commands
- known exceptions
- migration backlog

## Phases

### Phase 0: Freeze

Status: complete.

- local docs point to shared SSOT
- no new product UI is added in the legacy system

### Phase 1: Root Mantine Platform

Status: complete.

Implemented in:

- `pages/_app.js`
- `pages/_document.js`
- `lib/theme/mantineTheme.js`

Exit criteria:

- `_app` is GDS-rooted
- one theme file exists and is the only approved token authority for new UI
- notifications and modals are centralized

### Phase 2: Auth Surfaces

Status: complete except the OAuth consent page, which imports no GDS package.

Files:

- `pages/login.js`
- `pages/admin/index.js`
- `pages/admin/callback.js`
- `pages/oauth/consent.js`

Exit criteria:

- login and admin-entry flows no longer depend on legacy auth-page styling
- redirect, re-auth, and provider-login behavior remains correct

### Phase 3: Admin Shell And CRUD

Status: in progress. Admin pages are Mantine-based, but no admin page renders a shell component.

Files:

- `pages/admin/dashboard.js`
- `pages/admin/users.js`
- `pages/admin/oauth-clients.js`
- `pages/admin/activity.js`

Exit criteria:

- the main admin shell and CRUD flows use GDS and Mantine primitives only
- destructive flows use GDS confirmation, not browser dialogs

### Phase 4: Style Editor Decision

Status: complete. Decision: removed, together with `components/ThemeProvider.js`, `lib/styleThemes.mjs`, `pages/api/admin/themes/*` and `pages/api/themes/active.js`.

### Phase 5: Docs Surfaces

Status: complete. Docs pages under `pages/docs/` render `DocsPageShell`.

### Phase 6: Deletion

Status: complete. See [Legacy inventory: deleted](#legacy-inventory-deleted).

## Validation Commands

- `npm run lint`
- `npm run check:docs`
- targeted tests for auth and admin flows affected by UI work

## Enforcement Needed

- ban new product UI CSS modules
- ban new raw HTML inputs/buttons in product UI
- ban new token definitions outside the theme file
