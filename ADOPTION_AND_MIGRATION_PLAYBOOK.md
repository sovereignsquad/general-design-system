# Adoption & Migration Playbook

Status: Active SSOT
Version: 2.5.0
Last updated: 2026-05-25

This playbook defines the canonical path for adopting GDS through direct package consumption and for migrating repos away from local mirrored adapters or legacy UI systems.

## 1. Target End State

Every governed consumer should converge on this shape:

1. install `@gds/theme`, `@gds/core`, `@gds/admin`, and governance packages from a registry
2. mount `GdsProvider` once at the application root
3. consume shared contracts through documented `server` and `client` entrypoints
4. keep local adapters narrow, temporary, and machine-declared in `gds-adoption.json`
5. validate adoption through build, test, and `gds-compliance`

## 2. Adoption Profiles

### Package-first greenfield

Use when the product has little or no existing UI system.

Execution:
1. install packages
2. wire root provider and theme
3. choose shell, page-header, state-block, and card contracts
4. add `gds-adoption.json`
5. enable shared lint/compliance in CI

### Mirrored-local transition

Use when the product already mirrors GDS contracts locally because registry or release readiness was not available earlier.

Execution:
1. record all local mirrored contracts in `gds-adoption.json`
2. replace one mirrored contract family at a time with direct `@gds/*` consumption
3. delete the local mirror only after build, test, and route verification pass
4. remove temporary import aliases and sibling-repo assumptions

### Legacy migration

Use when the product still has a prior design/token/component authority.

Execution:
1. freeze legacy UI expansion
2. establish `GdsProvider` and theme ownership
3. migrate one governed surface family at a time
4. record exceptions narrowly
5. delete legacy primitives and token sources

## 3. Next.js App Router Contract

### Server files

Use server-safe entrypoints for layouts, metadata builders, and non-interactive composition.

```tsx
import { gdsTheme } from '@gds/theme/server';
import { BrowseSurface, DocsPageShell, EditorialCard } from '@gds/core/server';
```

### Client files

Use client entrypoints for providers and interactive widgets.

```tsx
'use client';

import { GdsProvider } from '@gds/theme/client';
import { ThemeToggle } from '@gds/core/client';
import { AppShell } from '@gds/admin/client';
```

### Root bootstrap

`app/layout.tsx` should own:
- `ColorSchemeScript`
- root `lang`
- root `dir`

`app/providers.tsx` should be the only required client boundary for the shared provider.

## 4. Vite / SPA Contract

Single-runtime apps may consume `@gds/*/client` directly for interactive surfaces. Keep the provider at the top of the tree and avoid local theme forks.

## 5. Migration Algorithm

```ts
async function migrateConsumerRepo() {
  freezeLegacyUI();
  addGdsProviderAtRoot();
  declareAdoptionManifest();
  replaceOneSurfaceFamilyAtATime();
  runBuildAndCompliance();
  deleteRetiredAdapters();
}
```

## 6. Required Verification Before Promotion

Run:

```bash
npm install
npm run build
npm run test
gds-compliance check --manifest ./gds-adoption.json
```

For Next.js consumers, also verify the production build path. For public products, verify at least one high-traffic route and one empty/error state.

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

## 9. Anti-Patterns

Do not:
- rely on sibling `file:` links in CI or production-like environments
- preserve local mirrored contracts as permanent hidden authorities
- mix direct package consumption with a second live token system
- skip manifest or compliance setup after package adoption
