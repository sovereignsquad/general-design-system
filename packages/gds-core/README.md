# @sovereignsquad/gds-core

Layouts, cards, shells, forms, tables, overlays, charts, page templates, access gates and i18n for the General Design System (GDS).

Most apps install the umbrella [`@sovereignsquad/gds`](https://www.npmjs.com/package/@sovereignsquad/gds) instead, which includes this package. Install granular packages only when the app deliberately separates runtime lanes, and keep every GDS package on the same version.

## Install

```bash
npm install @sovereignsquad/gds-theme @sovereignsquad/gds-core react react-dom
```

Installs from npmjs.com need no `.npmrc` entry and no token. Bootstrap (the stylesheet import and one `GdsProvider`) is in the [installation guide](https://github.com/sovereignsquad/general-design-system/blob/main/INSTALLATION_GUIDE.md#3-root-runtime-setup).

## Entry points

- `@sovereignsquad/gds-core`, `@sovereignsquad/gds-core/client` and `@sovereignsquad/gds-core/server`: the root, interactive and non-interactive structural surfaces.
- `@sovereignsquad/gds-core/rich-text-editor`: `GdsRichTextEditor`, opt-in because of its Tiptap dependency.
- `@sovereignsquad/gds-core/reference-theme-explorer`: `ReferenceThemeExplorer`.
- `@sovereignsquad/gds-core/map` and `@sovereignsquad/gds-core/map.css`: `GdsMap` and its stylesheet ([map system](https://github.com/sovereignsquad/general-design-system/blob/main/docs/MAP_SYSTEM.md)).
- `@sovereignsquad/gds-core/locales/lazy`, `@sovereignsquad/gds-core/locales/lazy/all` and one subpath per locale (`./locales/lazy/es`, `./locales/lazy/hu`, `./locales/lazy/de`, `./locales/lazy/fr`, `./locales/lazy/it`, `./locales/lazy/ru`, `./locales/lazy/he`, `./locales/lazy/ar`, `./locales/lazy/zh`, `./locales/lazy/ja`, `./locales/lazy/ko`): lazy message packs ([i18n runtime](https://github.com/sovereignsquad/general-design-system/blob/main/docs/I18N_RUNTIME.md)).

## Documentation

- Agent entry point: https://github.com/sovereignsquad/general-design-system/blob/main/llms.txt
- Components and patterns: https://github.com/sovereignsquad/general-design-system/blob/main/COMPONENTS_AND_PATTERNS.md
- Page templates: https://github.com/sovereignsquad/general-design-system/blob/main/docs/PAGE_TEMPLATES.md
- API reference: https://sovereignsquad.github.io/general-design-system/api
- Live pattern catalog: https://sovereignsquad.github.io/general-design-system/patterns

## License

MIT. See https://github.com/sovereignsquad/general-design-system/blob/main/LICENSE.
