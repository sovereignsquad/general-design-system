# @sovereignsquad/gds-a11y

Playwright and axe accessibility test helpers for apps built on the General Design System (GDS). Playwright and axe are optional peer dependencies, so a product repository adds browser-test weight only where it runs these checks.

## Install

```bash
npm install -D @sovereignsquad/gds-a11y @playwright/test axe-core
```

Installs from npmjs.com need no `.npmrc` entry and no token.

## Entry points

- `@sovereignsquad/gds-a11y`: `createGdsA11yTest`, `runGdsAxeScan`, `expectGdsTabOrder`, `expectGdsFocusTrap`, `runGdsContrastGate` and the report helpers.
- `gds-a11y` command.

Usage, report format and suppressions: https://github.com/sovereignsquad/general-design-system/blob/main/A11Y_CI_PACKAGE.md

## License

MIT. See https://github.com/sovereignsquad/general-design-system/blob/main/LICENSE.
