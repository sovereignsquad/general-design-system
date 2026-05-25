# Amanoba-Blocking Contract Scaffolds

Status: Working coordination (GDS issue #80)  
Version: 2.3.2  
Last updated: 2026-05-25

Contracts below unblock deletion of permanent Amanoba-only forks after `mvp-factory-control` epic #868.

## Shipped in GDS packages (2.3.0–2.3.2)

| Contract | Package | Maturity |
| --- | --- | --- |
| AuthShell, PublicShell, ArticleShell | `@gds/core` | active |
| MetricCard, ProgressCard, StateBlock | `@gds/core` | active |
| ProductCard (base) | `@gds/core` | active |
| DataToolbar, ResponsiveDataView | `@gds/admin` | active |
| GameBoardTile | `@gds/core` | active (2.3.2) |
| extendGdsTheme / client+server entrypoints | `@gds/theme` | required |

## Remaining (target for 2.3.x)

### LearnerAppShell — `required` for LMS apps

**Problem:** Full learner chrome (nav, account, locale, mobile nav, consent offset) is duplicated per product.

**Slots:** `logo`, `primaryNav`, `accountMenu`, `localeControl`, `pageHeader`, `actions`, `children`.

**States:** signed-in, signed-out (marketing subset), mobile drawer open/closed.

**Package path (planned):** `@gds/core/client` → `LearnerAppShell`.

### Course card variants — `required` where courses are listed

Compose from `ProductCard`:

- `CourseCatalogCard`
- `EnrolledCourseCard`
- `CourseProgressCard`
- `AdminCourseCard`

### CourseAccessRecoveryPanel — `active`

**Problem:** Protected lesson/quiz routes need sign-in, back, and retry without conflating `AccessSummary`.

**Actions:** sign-in CTA, navigate back, retry fetch.

### Gamification list cards — `active`

Quest step progress, reward catalog card, leaderboard row (mobile: one primary action).

## Amanoba adoption pointer

- Consumer: `moldovancsaba/amanoba` — `docs/product/DESIGN_UPDATE.md`
- Upstream tracking: [general-design-system#80](https://github.com/sovereignsquad/general-design-system/issues/80)
