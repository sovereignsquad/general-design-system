# Theme Governance

Status: Active SSOT
Version: 2.4.0
Last updated: 2026-05-25

This document defines how products may extend `gdsTheme` without creating a second design authority.

## Base rule

- `gdsTheme` is the only shared token authority.
- Product brands may extend it through documented overrides.
- Products may not fork the shared theme into a permanent parallel token system.

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

## Dark-mode rule

- a product may default to dark when that is part of its deliberate shell identity
- dark products must still provide readable tokens for text, paper, card, alert, table, and link surfaces
- mixed-mode islands remain exceptions, not the default layout strategy

## Appendix: Amanoba dark shell + yellow CTA

Amanoba is a dark-default LMS/game product. Recommended recipe:

```ts
import { extendGdsTheme } from '@gds/theme/client';

export const amanobaMantineTheme = extendGdsTheme({
  primaryColor: 'amanoba',
  colors: {
    amanoba: [/* yellow scale */],
    amanobaYellow: [/* alias scale */],
    ink: [/* dark grey scale */],
  },
  other: {
    brand: { /* email/OG/chart tokens */ },
    email: { /* transactional email palette */ },
  },
  components: {
    Text: { defaultProps: { c: 'gray.2' } },
    Card: { defaultProps: { bg: 'ink.8', withBorder: true } },
    /* form + modal dark surfaces */
  },
});
```

Rules:

- use `@gds/theme/client` in client providers; use `@gds/theme/server` only for SSR-safe theme data
- do not call `withGdsMotion()` unless product marketing explicitly wants shared hover motion
- keep provider-branded OAuth colors in documented exception surfaces, not in `primaryColor`

## Approved preset modes

- `gdsDarkPublicTheme` is the approved preset for products that deliberately default to a dark public shell.
- `gdsFlatSurfaceTheme` is the approved preset for products that need flatter operational surfaces without creating a second token authority.
- `withGdsMotion()` remains opt-in only. Shared motion is not part of the canonical base theme.
