import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const root = process.cwd();
const version = process.env.GDS_PUBLISHED_SMOKE_VERSION ?? readFileSync(resolve(root, 'VERSION'), 'utf8').trim();
const registry = process.env.GDS_NPM_REGISTRY ?? 'https://npm.pkg.github.com';
const registryHost = new URL(registry).host;
const authToken = process.env.NODE_AUTH_TOKEN ?? process.env.GDS_NPM_TOKEN ?? '';
const workspaceRoot = mkdtempSync(join(tmpdir(), 'gds-published-smoke-'));

function run(command, args, cwd = workspaceRoot) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
}

try {
  // Scope-only registry mapping — @sovereignsquad/* resolves from the GDS registry,
  // everything else (react, @mantine/*, typescript, ...) keeps resolving from npm's
  // normal default registry. A blanket `npm_config_registry` override would break
  // those unscoped packages when the GDS registry is GitHub Packages, which only
  // serves packages scoped to this org, not a full npmjs.com mirror.
  writeFileSync(
    join(workspaceRoot, '.npmrc'),
    `@sovereignsquad:registry=${registry}\n//${registryHost}/:_authToken=${authToken}\n`,
  );

  writeFileSync(
    join(workspaceRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'gds-published-consumer-smoke',
        private: true,
        type: 'module',
        scripts: {
          build: 'tsc --noEmit',
          smoke: 'node runtime-smoke.mjs',
        },
        dependencies: {
          '@sovereignsquad/gds': version,
          '@sovereignsquad/gds-theme': version,
          '@sovereignsquad/gds-core': version,
          '@sovereignsquad/gds-admin': version,
          '@sovereignsquad/gds-a11y': version,
          '@sovereignsquad/gds-eslint-config': version,
          '@sovereignsquad/gds-compliance': version,
          '@mantine/core': '8.3.6',
          '@mantine/hooks': '8.3.6',
          '@mantine/modals': '8.3.6',
          '@mantine/notifications': '8.3.6',
          '@mantine/dates': '8.3.6',
          dayjs: '1.11.21',
          '@tabler/icons-react': '3.35.0',
          '@types/node': '24.10.1',
          '@types/react': '19.2.2',
          '@types/react-dom': '19.2.2',
          react: '19.2.0',
          'react-dom': '19.2.0',
          typescript: '6.0.2',
        },
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(workspaceRoot, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          jsx: 'react-jsx',
          moduleResolution: 'Bundler',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: ['node'],
        },
        include: ['index.tsx'],
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(workspaceRoot, 'index.tsx'),
    `import React from 'react';
import { GdsProvider, GdsDataTable, createGdsTableAdapter, GdsSchemaForm, jsonSchemaToGdsFormSchema } from '@sovereignsquad/gds/client';
// ReferenceThemeExplorer left the main barrel in 5.0.0's bundle-size split and now
// resolves only from its dedicated subpath. Importing it from the barrel is what made
// this gate fail on gds-v5.0.0, v5.0.2 and v6.0.0 while the packages published fine
// (issue 553). verify:smoke-import-surface now catches this class before publish.
import { ReferenceThemeExplorer } from '@sovereignsquad/gds-core/reference-theme-explorer';
import { getGdsThemePresets, resolveGdsVibeTheme } from '@sovereignsquad/gds-theme';
import { AccessSummary } from '@sovereignsquad/gds-core';
import { AppShell } from '@sovereignsquad/gds-admin';
import type { GdsTableColumn, GdsSchemaUploadAdapter } from '@sovereignsquad/gds-core/client';

const rows = [{ id: '1', name: 'Published package' }];
const columns: GdsTableColumn<(typeof rows)[number]>[] = [{ key: 'name', label: 'Name', interactive: true }];
const schema = jsonSchemaToGdsFormSchema({
  type: 'object',
  properties: { attachment: { type: 'string', format: 'binary', title: 'Attachment' } },
});
const uploadAdapter: GdsSchemaUploadAdapter = {
  upload: async ({ files }) => files.map((file) => ({ id: file.name, name: file.name })),
};

const app = (
  <GdsProvider>
    <AppShell primaryNavigation={<a href="/">Home</a>}>
      <ReferenceThemeExplorer initialSelection={{ preset: 'athlete-gold', colorScheme: 'dark', theme: {} }} />
      <AccessSummary state="allowed" title="Access" roles={['operator']} />
      <GdsDataTable
        caption="Published smoke table"
        columns={columns}
        rowId={(row) => row.id}
        adapter={createGdsTableAdapter(rows, columns)}
      />
      {schema.schema ? <GdsSchemaForm schema={schema.schema} onSubmit={() => undefined} uploadAdapter={uploadAdapter} /> : null}
    </AppShell>
  </GdsProvider>
);

const athleteGold = resolveGdsVibeTheme('athlete-gold');
const presets = getGdsThemePresets();

console.log(Boolean(app), athleteGold.label, presets.some((preset) => preset.id === 'athlete-gold'));
`,
  );

  writeFileSync(
    join(workspaceRoot, 'runtime-smoke.mjs'),
    `const [
  gds,
  theme,
  core,
  admin,
  a11y,
  compliance,
  eslintConfig,
] = await Promise.all([
  import('@sovereignsquad/gds'),
  import('@sovereignsquad/gds-theme'),
  import('@sovereignsquad/gds-core'),
  import('@sovereignsquad/gds-admin'),
  import('@sovereignsquad/gds-a11y'),
  import('@sovereignsquad/gds-compliance'),
  import('@sovereignsquad/gds-eslint-config'),
]);

if (!gds.GdsProvider || !theme.resolveGdsVibeTheme || !core.GdsDataTable || !admin.AppShell) {
  throw new Error('Runtime exports missing from published packages.');
}

if (!a11y.createGdsA11yReport || typeof compliance !== 'object' || !Array.isArray(eslintConfig.default ?? eslintConfig)) {
  throw new Error('Tooling exports missing from published packages.');
}

if (theme.resolveGdsVibeTheme('athlete-gold').label !== 'Athlete Gold') {
  throw new Error('Athlete Gold vibe theme is not available from npm.');
}

console.log('Published package runtime imports passed.');
`,
  );

  run('npm', ['install', '--ignore-scripts']);
  run('npm', ['run', 'build']);
  run('npm', ['run', 'smoke']);

  console.log(`Published consumer smoke passed for GDS ${version} from ${registry}.`);
} finally {
  rmSync(workspaceRoot, { recursive: true, force: true });
}
