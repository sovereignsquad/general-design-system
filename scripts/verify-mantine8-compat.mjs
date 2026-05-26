import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

const workspaces = ['@gds/theme', '@gds/core', '@gds/admin'];

for (const workspace of workspaces) {
  execFileSync('npm', ['pack', '--pack-destination', packsDir, '--workspace', workspace], {
    cwd: root,
    stdio: 'ignore',
  });
}

writeFileSync(
  join(appDir, 'package.json'),
  JSON.stringify(
    {
      name: 'gds-mantine8-smoke',
      private: true,
      type: 'module',
      scripts: {
        build: 'tsc --noEmit',
      },
      dependencies: {
        '@gds/theme': `file:../packs/gds-theme-${version}.tgz`,
        '@gds/core': `file:../packs/gds-core-${version}.tgz`,
        '@gds/admin': `file:../packs/gds-admin-${version}.tgz`,
        '@mantine/core': '8.3.6',
        '@mantine/hooks': '8.3.6',
        '@mantine/modals': '8.3.6',
        '@mantine/notifications': '8.3.6',
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
import { GdsProvider } from '@gds/theme/client';
import { BrowseSurface, EditorialHero, MediaField } from '@gds/core/client';
import { AppShell, PageHeader, ResponsiveDataView } from '@gds/admin/client';

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
  execFileSync('npm', ['install', '--silent'], { cwd: appDir, stdio: 'inherit' });
  execFileSync('npm', ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
  console.log('Mantine 8 / React 19 compatibility smoke passed.');
} finally {
  rmSync(workspaceRoot, { recursive: true, force: true });
}
