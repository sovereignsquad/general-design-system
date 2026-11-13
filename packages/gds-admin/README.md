# @sovereignsquad/gds-admin

Operator scaffolds for the General Design System (GDS): `AppShell`, `PageHeader`, `ContentOpsEditor`, `ResponsiveDataView` and the other authenticated operational shells.

Most apps install the umbrella [`@sovereignsquad/gds`](https://www.npmjs.com/package/@sovereignsquad/gds) instead, which includes this package. Install granular packages only when the app deliberately separates runtime lanes, and keep every GDS package on the same version.

## Install

```bash
npm install @sovereignsquad/gds-theme @sovereignsquad/gds-core @sovereignsquad/gds-admin react react-dom
```

Installs from npmjs.com need no `.npmrc` entry and no token. Bootstrap is in the [installation guide](https://github.com/sovereignsquad/general-design-system/blob/main/INSTALLATION_GUIDE.md#3-root-runtime-setup).

## Entry points

- `@sovereignsquad/gds-admin`, `@sovereignsquad/gds-admin/client` and `@sovereignsquad/gds-admin/server`: the root, interactive and non-interactive structural surfaces.

## Documentation

- Agent entry point: https://github.com/sovereignsquad/general-design-system/blob/main/llms.txt
- Components and patterns: https://github.com/sovereignsquad/general-design-system/blob/main/COMPONENTS_AND_PATTERNS.md
- API reference: https://sovereignsquad.github.io/general-design-system/api

## License

MIT. See https://github.com/sovereignsquad/general-design-system/blob/main/LICENSE.
