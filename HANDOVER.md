# Maintainer Notes

Status: Active reference
Last updated: 2026-11-18

Working notes for anyone changing this repository: the commands, the conventions that are easy to get wrong, and how to read gate output. Contribution rules are in [CONTRIBUTING.md](CONTRIBUTING.md); release history is in [CHANGELOG.md](CHANGELOG.md) and the GitHub issues. Earlier revisions of this file were session logs; they remain in git history.

## 1. Commands

```bash
npm run preflight                  # the gate before any push: clean tree before, full chain, clean tree after
npm run preflight -- --mantine-9   # also runs CI's Mantine 9 / React 19 leg on HEAD in a throwaway worktree
npm run build                      # full monorepo build of all workspaces (packages/* and apps/*)
npm run lint
npm run test:run
npm run verify:release             # the chain alone; preflight wraps it with the clean-tree checks
npm run artifacts:refresh          # regenerates every generated artifact, in dependency order
```

CI (`.github/workflows/quality.yml`) runs `verify:release` on Mantine 7 and on Mantine 9 with React 19, on pushes to `main` and on pull requests. It installs with `npm ci --omit=optional`, then the Linux native build bindings. `preflight -- --mantine-9` reads those steps from the workflow file, so the local leg matches CI.

## 2. Conventions and gotchas

- **Build the whole monorepo.** A scoped `npm run build --workspace=…` can pass while a consuming workspace (the playground, the reference apps) has a type error. Use the root `npm run build`.
- **Generated artifacts come only from their generators.** Never hand-edit anything under `tokens/`, `audit/`, `__snapshots__/`, `apps/playground/src/generated-*`, `apps/playground/public/release-notes/` or `apps/playground/public/pattern-usage.json`. Run `npm run artifacts:refresh`; its order matters, because the registry indexes the other generated files and the audit traces read the registry.
- **Translations need the network.** `artifacts:refresh` translates new copy through `translate.googleapis.com`. The endpoint rate-limits automated traffic: a run that fails more than 10% of its calls stops, preserves the committed translations, and asks for a retry. Wait and rerun; never write translations by hand into generated site packs.
- **Package message packs are source.** `packages/gds-core/src/locales/<locale>.ts` values may be corrected by hand; the generator appends new keys and never overwrites an existing value. Machine translation picks the wrong sense of short labels ("Table" as furniture), so check new short labels against an existing message for the same concept in the same pack.
- **A CHANGELOG edit regenerates the release notes.** `verify:release-notes` fails when `apps/playground/public/release-notes/` is stale; run `node scripts/generate-release-notes.mjs` or `artifacts:refresh`.
- **Budgets are a ratchet with 10% slack.** `scripts/verify-budgets.mjs` (`DEFAULT_SLACK = 0.10`) reports a measurement worse than its budget as exceeded and one better than the slack band as unclaimed. Tighten a budget to the measured value, and prepend an evidence-based `justifiedBy` entry for every change; never delete earlier entries.
- **Some allowlists are keyed by file and line.** `scripts/density-token-adoption.config.mjs` keys entries by `file:line`, so an unrelated edit that shifts lines orphans an entry. Move the key to the new line; do not widen a budget instead. `scripts/shape-token-adoption.config.mjs` keys by source text and survives line shifts.
- **Recorded gate outputs change with the code.** Gates such as `verify:generated-imagery-only`, `verify:obligation-coverage` and the mutation suite (`verify:gates`) write their results under `audit/`. When a change alters what they measure, run them and commit their output before preflight, or preflight fails its clean-tree check at the end.
- **The mutation stage plants defects.** While `verify:gates` runs, it edits source files on purpose and restores them as each mutant finishes. Do not commit or edit the tree during a preflight; a killed run can leave a planted edit behind.
- **Layout props take tokens.** `GdsStack` `gap` and similar props take `GdsResponsiveValue<GdsLayoutToken>`; `GdsGrid` `minColumnWidth` takes a `GdsLayoutSize` (`aside`, `content`, `narrow`, `page`, `wide`, `full` or a layout token). See `packages/gds-core/src/LayoutPrimitives.tsx`.
- **Icons come from real icon sets.** Use `@tabler/icons-react` first (check the export exists under `node_modules/@tabler/icons-react/dist/esm/icons/`), then an iconify.design collection. Never hand-draw an icon path.
- **Issue numbers in playground code literals.** `gds-compliance` reads `#NNN` inside a string or JSX literal in `apps/*` as a hex colour; write `issue NNN` there. Comments and Markdown are not affected.
- **Verify before reusing a reference.** Line numbers, counts and states quoted in issues and docs drift. Re-read the source before acting on one.

## 3. Live verification

Runtime gates drive Chrome through the DevTools protocol with the helpers in `scripts/lib/browser-runtime.mjs`:

- `startPreviewServer` serves `apps/playground/dist` on port 4173 unless a base URL is passed in the environment.
- `launchBrowser` and `createCdpClient` start and connect to Chrome.
- `waitForReady` waits until the page has rendered a GDS surface with text, then for webfonts (`document.fonts.ready`), so measurements use the final font.
- `evaluate` runs an expression in the page and awaits promises.

Most runtime gates sweep every route that `scripts/lib/pattern-routes.mjs` reads from `apps/playground/src/App.tsx`, in light and dark, at the widths the gate declares. To check a fix by hand, build, start a preview (`npx vite preview` in `apps/playground`), and measure computed styles in a browser rather than judging screenshots alone.

## 4. Reading gate output

- A line that starts with `FAIL` is not always a failure: several tests and gates run deliberate self-checks that print `FAIL` for a planted defect. Read the process exit code and the runner's summary line.
- "Preflight passed" and "CI passed" are separate claims. A push to `main` is complete when CI's GDS Quality run and the Pages deploy have finished; report their actual conclusions.
- A runner-environment failure (for example a DevTools connection timeout after `Failed to connect to the bus` messages) on one Mantine leg while the other passes on the same commit is worth one rerun before investigating code. If it recurs across commits, check the runner image and the workflow file.
