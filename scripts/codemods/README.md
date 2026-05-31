# GDS Codemods

Reference codemods live here. They are intentionally narrow and only rewrite patterns that are mechanically safe.

Current transforms:

- `discovery-shell`
- `listing-card`
- `action-bar`

Dry run:

```bash
node scripts/codemods/run-codemod.mjs discovery-shell ./src
```

Write changes:

```bash
node scripts/codemods/run-codemod.mjs listing-card ./src --write
```

Unsupported files are reported and skipped instead of being partially rewritten.

Verification:

```bash
node scripts/verify-codemods.mjs
```

The verifier exercises supported dry-run/write paths for the stable transforms so broad or unsafe rewrites cannot be added silently.
