# @sovereignsquad/gds

General Design System (GDS): a governed React design system built on Mantine, with components, design tokens, theme presets and runtime systems (forms, tables, overlays, notifications, access gates, i18n). This umbrella package installs and re-exports `@sovereignsquad/gds-core`, `@sovereignsquad/gds-theme` and `@sovereignsquad/gds-admin`.

## Install

```bash
npm install @sovereignsquad/gds react react-dom
```

Installs from npmjs.com need no `.npmrc` entry and no token. npm 7+ installs the peer dependencies (Mantine, Tabler icons, dayjs) automatically; with peer auto-install off, follow the [peer-dependency rule](https://github.com/sovereignsquad/general-design-system/blob/main/INSTALLATION_GUIDE.md#peer-dependencies).

## Bootstrap

Bootstrap is two steps. Both are required; neither replaces the other.

1. Load the GDS stylesheet exactly once at the app entry, before any app styles:

```tsx
import '@sovereignsquad/gds-theme/styles.css';
```

2. Wrap the app once in `GdsProvider`, then compose components:

```tsx
import { GdsProvider, MetricCard, SemanticButton } from '@sovereignsquad/gds';

export default function App() {
  return (
    <GdsProvider defaultColorScheme="light">
      <MetricCard label="Active adopters" value="18 apps" trend={{ tone: 'positive', label: '+2%' }} />
      <SemanticButton action="save" />
    </GdsProvider>
  );
}
```

Never add a second provider or a Mantine `MantineProvider`.

## Entry points

- `@sovereignsquad/gds`: the full surface; use it or `/client` for interactive surfaces.
- `@sovereignsquad/gds/client`: interactive components and provider mounting.
- `@sovereignsquad/gds/server`: non-interactive structural surfaces, for server components.

## For AI coding agents

This package ships `llms.txt`, the agent entry point: install, bootstrap, the non-negotiable composition rules and where to read more. Read `node_modules/@sovereignsquad/gds/llms.txt` before writing UI. In short: compose shipped GDS components and page templates, style through component props and theme tokens, and do not write raw HTML controls, raw CSS values or a parallel component library.

## Documentation

- Installation guide: https://github.com/sovereignsquad/general-design-system/blob/main/INSTALLATION_GUIDE.md
- Agent guide: https://github.com/sovereignsquad/general-design-system/blob/main/docs/AI_AGENT_GUIDE.md
- Components and patterns: https://github.com/sovereignsquad/general-design-system/blob/main/COMPONENTS_AND_PATTERNS.md
- API reference: https://sovereignsquad.github.io/general-design-system/api
- Live pattern catalog: https://sovereignsquad.github.io/general-design-system/patterns
- Changelog: https://github.com/sovereignsquad/general-design-system/blob/main/CHANGELOG.md

## License

MIT. See https://github.com/sovereignsquad/general-design-system/blob/main/LICENSE.
