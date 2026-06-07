# Theme Governance

Status: Active SSOT
Version: 3.4.6
Last updated: 2026-06-06

This document defines the approved adopter-facing theme lanes for products that need branding without creating a second design authority.

## Base rule

- `gdsTheme` is the only shared token authority.
- Adopters must use one of the approved theme lanes:
  - `gdsTheme`
  - `gdsDarkPublicTheme`
  - `gdsFlatSurfaceTheme`
  - `gdsEditorialPublicTheme`
  - `createPublicBrandTheme(...)`
- Products may not fork the shared theme into a permanent parallel token system.
- Public and operator accent surfaces must resolve from shared semantic contracts such as `AccentPanel`, not product-local `light-dark(...)` patches or raw `*.0` shade assumptions.
- `extendGdsTheme(...)` is no longer a canonical adopter path. It remains temporarily exported only for bounded internal/runtime composition inside GDS-controlled implementation.

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

## Identity provider branding policy

Identity providers are part of the same governance envelope as theme authority. Adopters that render social auth must use `SocialAuthButtons` and pass providers from the approved policy list in `gds-adoption.json`.

- approved providers are declared under `compliance.identityProviderBranding.approvedProviders`
- forbidden customizations are declared under `compliance.identityProviderBranding.forbiddenCustomizations`
- allowed visual variants are declared under `compliance.identityProviderBranding.allowedVariants`
- minimum accessible touch target is declared under `compliance.identityProviderBranding.minTouchTargetPx`
- color authority is declared under `compliance.identityProviderBranding.colorAuthority`

Allowed policy:

- keep visual identity within policy-approved SocialAuth behavior
- never implement local third-party-branded auth controls that bypass GDS action semantics
- do not mutate provider icon/mark, loading, disabled, or label mechanics via per-product wrappers unless approved in policy
- use `getSupportedProviderIdentityIds()` and `getProviderIdentityPolicy(provider)` when a consumer needs runtime audit or logging metadata
- represent tenant-disabled and provider-error states through the shipped provider props, not local disabled button wrappers

Recommended model:

1. start from the closest shipped lane
2. use `createPublicBrandTheme(...)` when a branded public product needs governed overrides
3. apply tenant-level overrides only on documented brand surfaces and only through the approved lane

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
import { createPublicBrandTheme } from '@doneisbetter/gds-theme/client';

export const amanobaMantineTheme = createPublicBrandTheme({
  flatSurfaces: true,
  overrides: {
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
- `extendGdsTheme()` is deprecated for consumer use and should not appear in adopter docs, templates, or theme ownership files.
- the live token/theme lab at `https://sovereignsquad.github.io/general-design-system/themes` is the public reference surface for testing these shipped preset lanes interactively
- `withGdsMotion()` remains opt-in only. Shared motion is not part of the canonical base theme.
- `AccentPanel` is the approved cross-mode accent-surface primitive. If a product needs emphasis or rollout surfaces, start there before inventing page-local color-mode handling.

## CSS VibeThemes

GDS must provide expressive color lanes for real products. Light mode and dark mode are scheme choices, not the full theme offering. A VibeTheme is a package-owned visual contract that combines a Mantine theme preset with CSS variables for canvas, shell, surface, border, text, muted text, primary, accent, glow, gradient, and hero treatments.

Approved colorful preset ids:

- `sunset` - warm orange product energy
- `oceanic` - cool cyan-blue product clarity
- `forest` - grounded green product trust
- `ruby` - bold red high-attention product surfaces
- `amber` - golden operational warmth
- `neon-night` - dark-forward lime campaign surfaces
- `skyline` - indigo technology surfaces
- `aurora` - teal-cyan optimistic app surfaces
- `coral` - expressive creator, commerce, and social surfaces
- `mint` - clean growth, health, and learning surfaces
- `orchid` - grape editorial and premium surfaces
- `royal` - confident violet SaaS and professional surfaces
- `cosmic` - highly saturated blue-violet-cyan-magenta launch and showcase surfaces

Usage rule:

```ts
import {
  getGdsVibeThemes,
  resolveGdsThemePreset,
  resolveGdsVibeTheme,
  useGdsThemePresetState,
} from '@doneisbetter/gds-theme/client';

const theme = resolveGdsThemePreset('coral');
const vibe = resolveGdsVibeTheme('coral');
const availableVibes = getGdsVibeThemes();

const { selection, setPreset, setScheme, setFontLane, reset } = useGdsThemePresetState();
```

Runtime rule:

- `useGdsThemePresetState(...)` must set `data-gds-theme-preset`, `data-gds-theme-runtime`, `data-gds-font-lane`, `data-mantine-color-scheme`, and the `--gds-vibe-*` CSS variables on the document root.
- The official site must use the selected VibeTheme across the whole shell, not only inside the Theme Lab card.
- VibeTheme visuals must be CSS-only: gradients, color-mix, surface variables, and component tokens are allowed; pixel/image backgrounds are not the default theme mechanism.
- `cosmic` is the sanctioned high-saturation reference lane. If teams need a dramatic multicolour app vibe, start from `cosmic` instead of building route-local image or gradient systems.

Do not create a product-local theme catalog to achieve colorful branding. If a color lane is missing, add it to the GDS preset registry and VibeTheme registry, document the intended product use, add live Theme Lab coverage, and verify the lane through package tests.

Avoid:

- route-local theme state that resets on navigation
- hardcoded app-only gradients outside the GDS VibeTheme registry
- using image backgrounds as the theme identity
- changing only `primaryColor` while leaving shell, controls, cards, nav, focus, and page canvas visually neutral
- consumer-owned `createTheme(...)`, `mergeMantineTheme(...)`, or `extendGdsTheme(...)` theme catalogs

## 3.0.0 theme explorer proof contract

The GitHub Pages theme route must prove all approved lanes before the 3.0.0 release:

- preset selection for `gdsTheme`, `gdsDarkPublicTheme`, `gdsFlatSurfaceTheme`, `gdsEditorialPublicTheme`, and `createPublicBrandTheme(...)`
- light, dark, and auto color-scheme proof copy
- comparison mode between two shipped lanes
- reset behavior that returns to the baseline `gdsTheme` lane
- explicit unsupported-lane guidance that explains why `extendGdsTheme(...)`, `createTheme(...)`, and `mergeMantineTheme(...)` are prohibited in consumer-owned theme files

If any lane regresses contrast or keyboard/focus visibility, block the release and keep consumers on the previous stable package line until the lane is fixed.

## Runtime persistence contract

Theme selection is part of the public reference-site runtime contract, not temporary page state.

The official website and any governed adopter that offers theme or typography switching must preserve the selected runtime across:

- internal navigation
- direct links to nested routes
- GitHub Pages or static-host SPA fallback reloads
- full browser refreshes
- remounting the theme explorer after visiting another route

Required implementation:

1. Store only serializable theme intent:
   - preset id
   - effective color scheme
   - font lane id
   - brand primary id
   - governed brand flags
   - runtime key
2. Reconstruct the Mantine theme from GDS helpers on startup:
   - `resolveGdsThemePreset(...)`
   - `applyGdsFontLane(...)`
   - or use the canonical `useGdsThemePresetState(...)` hook, which performs the same validation, reconstruction, persistence, and root attribute application
3. Apply the reconstructed runtime to the root provider before route content depends on it.
4. Set root runtime attributes for inspection and regression checks:
   - `data-mantine-color-scheme`
   - `data-gds-theme-runtime`
   - `data-gds-font-lane`
5. Pass the active runtime selection back into `ReferenceThemeExplorer` so controls reflect the whole-site runtime instead of resetting to local defaults.
6. Treat storage as best-effort. If `localStorage` is blocked, theme application must still work for the current session.
7. Add regression coverage that selects a non-default preset and non-default font lane, remounts the app on a nested route, and verifies the selected runtime survives.

What ruins the system:

- keeping theme selection only in component-local `useState`
- storing a full Mantine theme object instead of serializable intent
- rebuilding the root provider from `gdsTheme` defaults on every direct route load
- letting `/themes` controls own a private runtime that differs from the site shell
- using route-local CSS, `light-dark(...)` patches, or page-specific providers to fake runtime changes
- persisting only color scheme while dropping preset, font lane, or brand-generator options
- allowing static-host 404 fallback loads to reset the runtime
- using `extendGdsTheme(...)`, `createTheme(...)`, or `mergeMantineTheme(...)` in consumer-owned theme files as a shortcut around the approved lane contract

Preferred reference-site shape:

```ts
const {
  selection,
  setSelection,
  setPreset,
  setScheme,
  setFontLane,
  reset,
} = useGdsThemePresetState({ storageKey: 'gds-reference-theme-selection' });

<GdsProvider
  theme={selection.theme}
  defaultColorScheme={selection.colorScheme}
  forceColorScheme={selection.colorScheme === 'auto' ? undefined : selection.colorScheme}
>
  <ReferenceThemeExplorer
    initialSelection={selection}
    onSelectionChange={setSelection}
  />
</GdsProvider>;
```

Review checklist for runtime-theme work:

- Can a visitor choose `Oceanic wave`, switch to dark mode, choose `Space Grotesk`, then open `/live-demos/surfaces` directly without losing the runtime?
- Do direct links and static-host fallback pages serve the same persisted runtime as normal internal navigation?
- Are font files or imports available for every advertised font lane?
- Does the test harness use a real in-memory storage implementation instead of a no-op storage mock?
- Does CI fail if the persistence contract is removed from the official reference app?
