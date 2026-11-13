# @sovereignsquad/gds-compliance

Adoption enforcement for apps built on the General Design System (GDS): checks a consumer repository against its `gds-adoption.json` manifest for forbidden imports, raw colors, raw controls and other contract violations, and reports adoption status and exceptions.

## Install

```bash
npm install -D @sovereignsquad/gds-compliance
```

Installs from npmjs.com need no `.npmrc` entry and no token.

## Entry points

- `@sovereignsquad/gds-compliance`: the programmatic API.
- `gds-compliance` command:

```bash
gds-compliance validate-manifest --manifest ./gds-adoption.json
gds-compliance check --manifest ./gds-adoption.json
```

Commands, output formats, strict mode and the manifest contract: https://github.com/sovereignsquad/general-design-system/blob/main/COMPLIANCE_TOOLKIT.md

## License

MIT. See https://github.com/sovereignsquad/general-design-system/blob/main/LICENSE.
