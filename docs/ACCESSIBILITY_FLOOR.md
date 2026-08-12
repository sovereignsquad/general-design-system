# Accessibility floor

Minimums no GDS theme may cross, enforced by `npm run verify:a11y-floor` across every preset
in both colour schemes.

**There is no warning tier.** A floor breach fails the build. A warning would make the floor
advisory, and an advisory floor is not a floor.

This file is GENERATED from `packages/gds-theme/src/accessibility-floor.ts`. A floor described
differently from how it is checked is a floor nobody can rely on — run `npm run docs:a11y-floor`.

## Rules (7)

- **focus-ring-min-width** (reaction axis, 2.4.11 Focus Appearance (AA)) — Below 2px a focus ring is not reliably visible, and a keyboard user has no other indication of where they are.
- **focus-ring-is-not-removed** (reaction axis, 2.4.7 Focus Visible (AA)) — A theme must not be able to erase focus indication by setting the ring to none or transparent.
- **control-height-min-target** (density axis, 2.5.5 Target Size (AAA) / 2.5.8 Target Size Minimum (AA)) — A primary control smaller than 44px is unpleasant to hit on a phone and fails the stricter target-size guidance GDS holds itself to.
- **body-line-height-min** (type axis, 1.4.12 Text Spacing (AA)) — Body text below 1.5 line-height is materially harder to read for users with dyslexia or low vision.
- **motion-duration-bounded** (motion axis, 2.2.2 Pause, Stop, Hide (A)) — A transition longer than two seconds is an animation the user cannot skip.
- **reduced-motion-not-overridden** (motion axis, 2.3.3 Animation from Interactions (AAA)) — A theme may make motion calmer than the user asked for; it may never make it louder.
- **disabled-control-still-distinguishable** (color axis, 1.4.1 Use of Color (A)) — A disabled control whose text and background are the same value is invisible rather than merely muted.

## What is not here

Colour contrast is enforced, but not by these rules: `createGdsThemeAccessibilityReport()`
already scores every colour pair across every preset and scheme, and the floor adopts its
blocking findings. A second contrast implementation could disagree with the first, and two
accessibility verdicts on one pair is worse than one.

Rules needing real rendered geometry belong to the runtime harness rather than this token-level
gate. A rule that cannot be evaluated is worse than a missing rule, because it looks like
coverage.
