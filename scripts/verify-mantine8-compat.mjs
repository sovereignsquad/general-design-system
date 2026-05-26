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

const workspaces = ['@doneisbetter/gds-theme', '@doneisbetter/gds-core', '@doneisbetter/gds-admin'];
const matrices = [
  {
    label: 'Mantine 8 / React 19',
    mantineVersion: '8.3.6',
  },
  {
    label: 'Mantine 9 / React 19',
    mantineVersion: '9.2.1',
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
import { GdsProvider } from '@doneisbetter/gds-theme/client';
import { BrowseSurface, EditorialHero, MediaField } from '@doneisbetter/gds-core/client';
import { AppShell, PageHeader, ResponsiveDataView } from '@doneisbetter/gds-admin/client';

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
            '@doneisbetter/gds-theme': `file:../packs/doneisbetter-gds-theme-${version}.tgz`,
            '@doneisbetter/gds-core': `file:../packs/doneisbetter-gds-core-${version}.tgz`,
            '@doneisbetter/gds-admin': `file:../packs/doneisbetter-gds-admin-${version}.tgz`,
            '@mantine/core': matrix.mantineVersion,
            '@mantine/hooks': matrix.mantineVersion,
            '@mantine/modals': matrix.mantineVersion,
            '@mantine/notifications': matrix.mantineVersion,
            '@tabler/icons-react': '3.35.0',
            next: '15.5.18',
            react: '19.2.0',
            'react-dom': '19.2.0',
          },
          devDependencies: {
            '@types/node': '24.10.1',
            '@types/react': '19.2.2',
            '@types/react-dom': '19.2.2',
            typescript: '6.0.2',
          },
        },
        null,
        2,
      ),
    );

    execFileSync('npm', ['install', '--silent'], { cwd: appDir, stdio: 'inherit' });
    execFileSync('npm', ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
    console.log(`${matrix.label} compatibility smoke passed.`);
  }
} finally {
  rmSync(workspaceRoot, { recursive: true, force: true });
}
