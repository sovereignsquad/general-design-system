# Adoption & Migration Playbook

Status: Active SSOT
Version: 2.6.4
Last updated: 2026-05-28

This playbook defines the canonical path for adopting GDS through direct package consumption and for migrating repos away from local mirrored adapters or legacy UI systems.

## 1. Target End State

Every governed consumer should converge on this shape:

1. install `@doneisbetter/gds-theme`, `@doneisbetter/gds-core`, `@doneisbetter/gds-admin`, and governance packages from a registry
2. mount `GdsProvider` once at the application root
3. consume shared contracts through documented `server` and `client` entrypoints
4. keep local adapters narrow, temporary, and machine-declared in `gds-adoption.json`
5. validate adoption through build, test, codemods where applicable, and `gds-compliance`

## 2. Adoption Profiles

### Package-first greenfield

Use when the product has little or no existing UI system.

Execution:
1. install packages
2. wire root provider and theme through one approved lane (`gdsTheme`, shipped public preset, or `createPublicBrandTheme(...)`)
3. choose shell, page-header, state-block, card, and action contracts
4. add `gds-adoption.json`
5. enable shared lint/gds-compliance in CI

### Mirrored-local transition

Use when the product already mirrors GDS contracts locally because registry or release readiness was not available earlier.

Execution:
1. record all local mirrored contracts in `gds-adoption.json`
2. replace one mirrored contract family at a time with direct `@doneisbetter/gds-*` consumption
3. delete the local mirror only after build, test, and route verification pass
4. remove temporary import aliases and sibling-repo assumptions
5. use the reference codemods for safe mechanical rewrites before touching bespoke cases manually

### Legacy migration

Use when the product still has a prior design/token/component authority.

Execution:
1. freeze legacy UI expansion
2. establish `GdsProvider` and theme ownership
3. migrate one governed surface family at a time in this order: shell -> navigation -> actions -> listing -> detail -> embeds
4. record exceptions narrowly
5. delete legacy primitives and token sources

## 3. Next.js App Router Contract

### Server files

Use server-safe entrypoints for layouts, metadata builders, and non-interactive composition.

```tsx
import { gdsTheme } from '@doneisbetter/gds-theme/server';
import { BrowseSurface, DocsPageShell, EditorialCard } from '@doneisbetter/gds-core/server';
```

### Client files

Use client entrypoints for providers and interactive widgets.

```tsx
'use client';

import { GdsProvider } from '@doneisbetter/gds-theme/client';
import { ThemeToggle } from '@doneisbetter/gds-core/client';
import { AppShell } from '@doneisbetter/gds-admin/client';
```

### Root bootstrap

`app/layout.tsx` should own:
- `ColorSchemeScript`
- root `lang`
- root `dir`

`app/providers.tsx` should be the only required client boundary for the shared provider.

Theme ownership rule:

- use shipped theme lanes first
- use `createPublicBrandTheme(...)` when a branded public product needs governed overrides
- do not keep a consumer-local `extendGdsTheme(...)` branding layer as the long-term adopter path

## 4. Vite / SPA Contract

Single-runtime apps may consume `@doneisbetter/gds-*/client` directly for interactive surfaces. Keep the provider at the top of the tree and avoid local theme forks.

## 5. Migration Algorithm

```ts
async function migrateConsumerRepo() {
  freezeLegacyUI();
  addGdsProviderAtRoot();
  declareAdoptionManifest();
  runReferenceCodemods();
  replaceOneSurfaceFamilyAtATime();
  runBuildAndCompliance();
  deleteRetiredAdapters();
}
```

Reference codemods currently available:

- `node scripts/codemods/run-codemod.mjs discovery-shell ./src`
- `node scripts/codemods/run-codemod.mjs action-bar ./src`
- `node scripts/codemods/run-codemod.mjs listing-card ./src`

## 6. Required Verification Before Promotion

Run:

```bash
npm install
npm run build
npm run test:run
npm run verify:mantine
gds-compliance check --manifest ./gds-adoption.json
```

Also verify the affected surface against the live public reference when applicable:

- `https://sovereignsquad.github.io/general-design-system/patterns`
- relevant family page for the surface being adopted

This prevents teams from reintroducing local wrappers for already-shipped contracts that are visibly available in the GDS site.

For Next.js consumers, also verify the production build path. For public products, verify at least one high-traffic route and one empty/error state.

Consumer dependency baseline:

- React `19.x` is supported
- Mantine `8.3.x` and `9.2.x` are verified consumer-install lines
- use GitHub release assets only as an operational fallback when npm publication is temporarily unavailable

For true GDS-only repos, enable strict mode in the manifest once the canonical primitives are in place:

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

## 7. Rollback & Recovery

If direct package adoption fails:

1. revert to the last known good package version
2. restore the last working manifest and provider configuration
3. document the blocked contract or entrypoint in the local adapter
4. do not keep both the broken new contract and the restored legacy path active beyond the recovery window

## 8. Documentation Requirements

Every adopter must maintain:

- local adapter document
- `gds-adoption.json`
- validation commands
- approved exceptions
- current consumed GDS version
- strict-mode status and approved primitive lanes if the repo is targeting 100% GDS-only

Approved exceptions should be declared as governed records, not prose-only reminders. At minimum, each exception in `gds-adoption.json` should define:

- `surface`
- `category`
- narrow `scope`
- `reason`
- `allowedImplementation`
- `mustStillUse`
- `mustNotDo`
- `a11yRequirements`
- `testingRequirements`
- `observabilityRequirements`
- `owner`
- `reviewDate`
- `exitCondition`
- `status`

This keeps rollback, review cadence, and compliance enforcement deterministic across repos.

## 9. Anti-Patterns

Do not:
- rely on sibling `file:` links in CI or production-like environments
- preserve local mirrored contracts as permanent hidden authorities
- mix direct package consumption with a second live token system
- skip manifest or compliance setup after package adoption
- introduce new shell/card/button wrappers after the canonical GDS primitive for that surface exists
