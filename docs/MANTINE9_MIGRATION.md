# Mantine 9 Migration Guide

GDS ships compatibility smokes for Mantine 7, 8, and 9 (see `scripts/verify-mantine8-compat.mjs`). All three have passed since GDS 3.5.0. This document records the audit findings and any steps required for consumer repos upgrading their Mantine peer dep.

## Smoke test status

| Mantine version | React | GDS 3.5.0 status |
|---|---|---|
| 7.x | 18 | ✅ Pass |
| 8.x | 19 | ✅ Pass |
| 9.x | 19 | ✅ Pass |

Run the smoke at any time: `npm run verify:mantine`

## What changed in Mantine 8 → 9

The Mantine 9 changelog (mantine.dev) introduced several API changes. Below is each change assessed against GDS's component surface.

### Component API changes with GDS impact

| Change | Mantine 9 behavior | GDS impact | Action |
|---|---|---|---|
| `TextInput` / `Textarea` — `icon` prop removed | Use `leftSection` / `rightSection` | GDS wraps these internally via `FormField`; consumers using raw Mantine `TextInput` directly must migrate | Use `leftSection` |
| `Select` / `MultiSelect` — `searchable` prop renamed | No change in Mantine 9 (still present) | None | — |
| `Badge` — `variant="filled"` default changed | Still available; default variant is now `"light"` | `FitScoreChip`, `MeaningBadge` both explicitly set `variant="filled"` — unaffected | — |
| `Card` — `withBorder` still present | No breaking change | GDS cards all use `withBorder radius="lg"` — unaffected | — |
| `ActionIcon` — `loading` prop shape stable | No change | SemanticButton's ActionIcon usage unaffected | — |
| `Combobox` (new in Mantine 7) — API stable in 8/9 | No breaking change | `SearchableSelect` uses Mantine's low-level `Combobox` — unaffected | — |
| `AspectRatio` — stable | No change | `MediaWithFallback` uses `AspectRatio` — unaffected | — |
| `@mantine/modals` — `openContextModal` API stable | No change | GDS modal system unaffected | — |
| `@mantine/notifications` — stable API | No change | `GdsNotificationProvider` unaffected | — |
| CSS layer order — Mantine 9 ships layers | CSS specificity may change | GDS tokens use CSS custom properties, not Mantine class overrides; impact minimal | Verify consumer CSS doesn't fight Mantine layers |

### Peer dep update for consumer repos

```bash
# From Mantine 8
npm install @mantine/core@^9 @mantine/hooks@^9 @mantine/modals@^9 @mantine/notifications@^9

# GDS peer dep range allows ^8 || ^9 — no GDS version bump required
```

### Consumer-side raw Mantine usage to migrate

If your repo uses raw Mantine primitives alongside GDS (which violates GDS governance — migrate to GDS contracts first), the following props need attention for Mantine 9:

```tsx
// Mantine 8 — icon prop (removed in 9)
<TextInput icon={<IconSearch />} />

// Mantine 9 — use leftSection
<TextInput leftSection={<IconSearch />} />
```

```tsx
// Mantine 8 — Loader size="xs" string
<Loader size="xs" />  // still valid in 9

// No change needed
```

### GitHub Actions matrix job (CI)

To add Mantine 9 to the GDS CI matrix, extend `.github/workflows/gds-quality.yml`:

```yaml
strategy:
  matrix:
    mantine: ['8', '9']
steps:
  - name: Install Mantine ${{ matrix.mantine }}
    run: npm install @mantine/core@^${{ matrix.mantine }} ...
  - name: Verify compat
    run: npm run verify:mantine
```

This is tracked as part of GDS [issue #329](https://github.com/sovereignsquad/general-design-system/issues/329).

## Summary

GDS has been Mantine 9 compatible since 3.5.0 — no GDS code changes are needed. Consumer repos should:
1. Upgrade their Mantine peer deps to `^9`
2. Migrate any raw `TextInput icon={}` usages to `leftSection={}`
3. Verify any custom CSS that overrides Mantine classes still works under Mantine 9's CSS layer model
