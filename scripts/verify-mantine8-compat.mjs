import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const version = execFileSync('cat', ['VERSION'], { cwd: root, encoding: 'utf8' }).trim();
const workspaceRoot = mkdtempSync(join(tmpdir(), 'gds-m8-'));
const packsDir = join(workspaceRoot, 'packs');
const appDir = join(workspaceRoot, 'app');

mkdirSync(packsDir, { recursive: true });
mkdirSync(appDir, { recursive: true });

const workspaces = ['@sovereignsquad/gds-theme', '@sovereignsquad/gds-core', '@sovereignsquad/gds-admin', '@sovereignsquad/gds'];
const matrices = [
  {
    label: 'Mantine 7 / React 18',
    mantineVersion: '7.17.8',
    reactVersion: '18.3.1',
    reactTypesVersion: '18.3.31',
    reactDomTypesVersion: '18.3.7',
  },
  {
    label: 'Mantine 8 / React 19',
    mantineVersion: '8.3.6',
    reactVersion: '19.2.0',
    reactTypesVersion: '19.2.2',
    reactDomTypesVersion: '19.2.2',
  },
  {
    label: 'Mantine 9 / React 19',
    mantineVersion: '9.2.1',
    reactVersion: '19.2.0',
    reactTypesVersion: '19.2.2',
    reactDomTypesVersion: '19.2.2',
  },
];

for (const workspace of workspaces) {
  execFileSync('npm', ['pack', '--pack-destination', packsDir, '--workspace', workspace], {
    cwd: root,
    stdio: 'ignore',
  });
}

writeFileSync(
  join(appDir, 'tsconfig.json'),
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
  join(appDir, 'index.tsx'),
  `import React from 'react';
import { AppShell, BrowseSurface, EditorialHero, GdsProvider, MediaField, PageHeader, ResponsiveDataView } from '@sovereignsquad/gds/client';

const demo = (
  <GdsProvider>
    <AppShell primaryNavigation={<a href="/">Home</a>}>
      <PageHeader title="Records" description="Shared admin contract" />
      <BrowseSurface title="Browse" content={<div>Results</div>} />
      <EditorialHero title="Hero" />
      <MediaField label="Media" uploadControl={<button type="button">Upload</button>} />
      <ResponsiveDataView columns={[{ key: 'name', label: 'Name' }]} data={[]} renderCard={() => <div />} />
    </AppShell>
  </GdsProvider>
);

console.log(Boolean(demo));
`,
);

try {
  for (const matrix of matrices) {
    if (existsSync(join(appDir, 'node_modules'))) {
      rmSync(join(appDir, 'node_modules'), { recursive: true, force: true });
    }
    if (existsSync(join(appDir, 'package-lock.json'))) {
      rmSync(join(appDir, 'package-lock.json'), { force: true });
    }

    writeFileSync(
      join(appDir, 'package.json'),
      JSON.stringify(
        {
          name: 'gds-mantine-compat-smoke',
          private: true,
          type: 'module',
          scripts: {
            build: 'tsc --noEmit',
          },
          dependencies: {
            '@sovereignsquad/gds': `file:../packs/sovereignsquad-gds-${version}.tgz`,
            '@sovereignsquad/gds-theme': `file:../packs/sovereignsquad-gds-theme-${version}.tgz`,
            '@sovereignsquad/gds-core': `file:../packs/sovereignsquad-gds-core-${version}.tgz`,
            '@sovereignsquad/gds-admin': `file:../packs/sovereignsquad-gds-admin-${version}.tgz`,
            '@mantine/core': matrix.mantineVersion,
            '@mantine/hooks': matrix.mantineVersion,
            '@mantine/modals': matrix.mantineVersion,
            '@mantine/notifications': matrix.mantineVersion,
            '@mantine/dates': matrix.mantineVersion,
            dayjs: '1.11.21',
            '@tabler/icons-react': '3.35.0',
            react: matrix.reactVersion,
            'react-dom': matrix.reactVersion,
          },
          devDependencies: {
            '@types/node': '24.10.1',
            '@types/react': matrix.reactTypesVersion,
            '@types/react-dom': matrix.reactDomTypesVersion,
            typescript: '6.0.2',
          },
        },
        null,
        2,
      ),
    );

    execFileSync('npm', ['install'], { cwd: appDir, stdio: 'inherit' });
    execFileSync('npm', ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
    console.log(`${matrix.label} compatibility smoke passed.`);
  }
} finally {
  rmSync(workspaceRoot, { recursive: true, force: true });
}
