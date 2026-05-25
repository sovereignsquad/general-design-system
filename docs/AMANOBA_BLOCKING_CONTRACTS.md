# Amanoba-Blocking Contract Scaffolds

Status: Decision record after issue split (`#97`, `#99`)  
Version: 2.4.1  
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
| AccessRecoveryPanel | `@gds/core` | active (2.4.1) |
| extendGdsTheme / client+server entrypoints | `@gds/theme` | required |

## Decision: Learner shell stays local for now

`LearnerAppShell` is **not promoted into GDS** at this time.

Reason:

- current evidence in this repo does not prove a second LMS/guided-learning product with the same structural shell contract
- shipping it now would likely encode Amanoba information architecture into core
- the correct GDS behavior today is to compose learner-local shells from `PublicShell`, `PageHeader`, `AuthShell`, `ProductCard`, and other existing primitives

Next trigger for re-evaluation:

- promote only after a second product proves the same slot structure and mobile navigation model
- track this through [general-design-system#99](https://github.com/sovereignsquad/general-design-system/issues/99)

## Intentional local-only surfaces for now

### Course card variants

- `CourseCatalogCard`
- `EnrolledCourseCard`
- `CourseProgressCard`
- `AdminCourseCard`

These remain Amanoba-local until a second product proves the same structural card family.

### Gamification list cards

Quest, reward, and leaderboard list cards remain local until broader reuse is proven.

## Canonical replacement for course access recovery

Protected lesson and quiz recovery should now use `@gds/core` `AccessRecoveryPanel`.

## Amanoba adoption pointer

- Consumer: `moldovancsaba/amanoba` — `docs/product/DESIGN_UPDATE.md`
- Upstream tracking:
  - [general-design-system#97](https://github.com/sovereignsquad/general-design-system/issues/97)
  - [general-design-system#99](https://github.com/sovereignsquad/general-design-system/issues/99)
