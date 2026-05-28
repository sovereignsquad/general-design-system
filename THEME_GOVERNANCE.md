# Theme Governance

Status: Active SSOT
Version: 2.6.4
Last updated: 2026-05-28

This document defines how products may extend `gdsTheme` without creating a second design authority.

## Base rule

- `gdsTheme` is the only shared token authority.
- Product brands may extend it through documented overrides.
- Products may not fork the shared theme into a permanent parallel token system.
- Public and operator accent surfaces must resolve from shared semantic contracts such as `AccentPanel`, not product-local `light-dark(...)` patches or raw `*.0` shade assumptions.

## Allowed extension surfaces

- primary color and semantic brand palette
- typography family where product identity or locale coverage requires it
- shell defaults for dark or light products
- component default props when they remain compatible with shared interaction meaning
- narrow `theme.other` tokens for non-Mantine rendering surfaces such as email, OG images, or certificates

## Not allowed

- changing shared interaction meaning through theme overrides
- declaring a second token layer as the real authority while `gdsTheme` remains nominal
- product-specific page styling that bypasses the theme for repeated surfaces

## White-label and tenant theming

White-label or tenant theming is allowed only when:

- the base product still resolves from `gdsTheme`
- tenant overrides remain scoped to documented brand surfaces
- contrast, readability, and focus states still meet the shared baseline
- switching tenants does not introduce a second runtime provider authority

Recommended model:

1. start from `extendGdsTheme(...)`
2. apply product-level overrides
3. apply tenant-level overrides only on documented brand surfaces

For public/editorial products that want one sanctioned entrypoint instead of ad hoc merging, use `createPublicBrandTheme({ editorialSerif, flatSurfaces, overrides })` from `@doneisbetter/gds-theme`.

## Creator-authored experience theming

Some products need a bounded creator-, editor-, or customer-authored visual canvas. GDS allows this only as a narrow experience override lane, never as a second app-wide theme authority.

Ownership boundary:

- GDS owns app chrome, navigation, shells, shared controls, consent surfaces, legal rows, recovery states, and system messaging.
- The adopting product owns storage, moderation, sanitization, and publish flow for creator-authored presentation data.
- Creator-authored overrides may own only the approved experience canvas.

Allowed override modes:

- scoped class hooks on a bounded canvas root
- scoped CSS injected after base experience styles
- creator-authored media, colors, and decorative presentation inside the approved canvas

Not allowed:

- replacing `PublicShell`, `PublicNav`, `DocsPageShell`, or other GDS-owned chrome
- hiding required consent, legal, or recovery controls
- redefining shared action semantics, focus handling, or system state meaning
- unbounded CSS that leaks into the surrounding page
- treating creator CSS as a second theme authority for the full product

Required render order:

1. render GDS shell and system-owned controls
2. render the approved creator canvas
3. apply creator-scoped overrides after base experience styles only inside that canvas
4. fall back safely to the base GDS presentation if overrides are missing or invalid

Required documentation path:

- declare the exception in `gds-adoption.json` with category `product-authored-experience`
- keep `scope` narrow to the actual canvas files
- include `a11yRequirements`, `testingRequirements`, and `observabilityRequirements`
- describe what shared controls must remain governed outside the canvas

Recommended implementation shape:

```ts
type ExperienceThemeOverrideMode = 'none' | 'css-class' | 'scoped-css';

type ExperienceOverrideContract = {
  mode: ExperienceThemeOverrideMode;
  scopeId: string;
  renderOrder: 'after-base-experience-styles';
  mayOverride: string[];
  mustNotOverride: string[];
};
```

This is a governance contract first. Products still own storage and moderation, but they may not use that as justification for replacing GDS-owned application structure.

## Dark-mode rule

- a product may default to dark when that is part of its deliberate shell identity
- dark products must still provide readable tokens for text, paper, card, alert, table, and link surfaces
- mixed-mode islands remain exceptions, not the default layout strategy

## Appendix: Amanoba dark shell + yellow CTA

Amanoba is a dark-default LMS/game product. Recommended recipe:

```ts
import { extendGdsTheme } from '@doneisbetter/gds-theme/client';

export const amanobaMantineTheme = extendGdsTheme({
  primaryColor: 'amanoba',
  colors: {
    amanoba: [/gds-* yellow scale */],
    amanobaYellow: [/gds-* alias scale */],
    ink: [/gds-* dark grey scale */],
  },
  other: {
    brand: { /gds-* email/OG/chart tokens */ },
    email: { /gds-* transactional email palette */ },
  },
  components: {
    Text: { defaultProps: { c: 'gray.2' } },
    Card: { defaultProps: { bg: 'ink.8', withBorder: true } },
    /gds-* form + modal dark surfaces */
  },
});
```

Rules:

- use `@doneisbetter/gds-theme/client` in client providers; use `@doneisbetter/gds-theme/server` only for SSR-safe theme data
- do not call `withGdsMotion()` unless product marketing explicitly wants shared hover motion
- keep provider-branded OAuth colors in documented exception surfaces, not in `primaryColor`

## Approved preset modes

- `gdsDarkPublicTheme` is the approved preset for products that deliberately default to a dark public shell.
- `gdsFlatSurfaceTheme` is the approved preset for products that need flatter operational surfaces without creating a second token authority.
- `gdsEditorialPublicTheme` is the approved preset for public/editorial products that need serif-forward storytelling and flatter public surfaces without creating a private token branch.
- `createPublicBrandTheme()` is the approved composition helper for branded public products that need to layer serif headings, flat surfaces, and product-local token overrides in one governed merge path.
- the live token/theme lab at `https://sovereignsquad.github.io/general-design-system/tokens` is the public reference surface for testing these shipped preset lanes interactively
- `withGdsMotion()` remains opt-in only. Shared motion is not part of the canonical base theme.
- `AccentPanel` is the approved cross-mode accent-surface primitive. If a product needs emphasis or rollout surfaces, start there before inventing page-local color-mode handling.
