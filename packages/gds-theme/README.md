# @sovereignsquad/gds-theme

Design tokens, theme presets, VibeThemes, font lanes, the motion system and the GDS stylesheet for the General Design System (GDS).

Most apps install the umbrella [`@sovereignsquad/gds`](https://www.npmjs.com/package/@sovereignsquad/gds) instead, which includes this package. Install granular packages only when the app deliberately separates runtime lanes, and keep every GDS package on the same version.

## Install

```bash
npm install @sovereignsquad/gds-theme react react-dom
```

Installs from npmjs.com need no `.npmrc` entry and no token.

## Stylesheet

Load the stylesheet exactly once at the app entry, before any app styles:

```tsx
import '@sovereignsquad/gds-theme/styles.css';
```

Apps that render a GDS date component also import `@sovereignsquad/gds-theme/dates.css`. The provider setup is in the [installation guide](https://github.com/sovereignsquad/general-design-system/blob/main/INSTALLATION_GUIDE.md#3-root-runtime-setup).

## Entry points

- `@sovereignsquad/gds-theme`, `@sovereignsquad/gds-theme/client` and `@sovereignsquad/gds-theme/server`: tokens, presets and theme factories.
- `@sovereignsquad/gds-theme/styles.css` and `@sovereignsquad/gds-theme/dates.css`: stylesheets.
- `gds-theme-tokens` command: `graph`, `validate` and `compatibility` reports over the token graph ([API reference](https://github.com/sovereignsquad/general-design-system/blob/main/API_REFERENCE.md)).

## Documentation

- Theme governance (color scheme, presets, creator and tenant styling): https://github.com/sovereignsquad/general-design-system/blob/main/THEME_GOVERNANCE.md
- Safe styling and scale steps: https://github.com/sovereignsquad/general-design-system/blob/main/docs/SAFE_STYLING.md
- DTCG tokens: https://github.com/sovereignsquad/general-design-system/blob/main/docs/DESIGN_TOKENS_DTCG.md
- API reference: https://sovereignsquad.github.io/general-design-system/api

## License

MIT. See https://github.com/sovereignsquad/general-design-system/blob/main/LICENSE.
