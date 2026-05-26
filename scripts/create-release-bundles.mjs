import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();
const tag = `gds-v${version}`;
const outputDir =
  process.env.GDS_RELEASE_BUNDLE_DIR ?? resolve(root, 'dist', 'release-bundles', version);

const workspaces = [
  { name: '@doneisbetter/gds-theme', dev: false },
  { name: '@doneisbetter/gds-core', dev: false },
  { name: '@doneisbetter/gds-admin', dev: false },
  { name: '@doneisbetter/gds-eslint-config', dev: true },
  { name: '@doneisbetter/gds-compliance', dev: true },
];

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const manifest = {
  version,
  tag,
  releaseAssetBaseUrl: `https://github.com/sovereignsquad/general-design-system/releases/download/${tag}`,
  packages: [],
};

for (const workspace of workspaces) {
  const result = execFileSync(
    'npm',
    ['pack', '--json', '--pack-destination', outputDir, '--workspace', workspace.name],
    {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    },
  );

  const packInfo = JSON.parse(result)[0];
  const tarballPath = resolve(outputDir, packInfo.filename);
  const checksum = createHash('sha256')
    .update(readFileSync(tarballPath))
    .digest('hex');

  manifest.packages.push({
    name: workspace.name,
    version,
    filename: packInfo.filename,
    sha256: checksum,
    installGroup: workspace.dev ? 'devDependency' : 'dependency',
    url: `${manifest.releaseAssetBaseUrl}/${packInfo.filename}`,
  });
}

const runtimePackages = manifest.packages.filter((pkg) => pkg.installGroup === 'dependency');
const devPackages = manifest.packages.filter((pkg) => pkg.installGroup === 'devDependency');

const installGuide = `# Temporary Release Bundle Install (${version})

Canonical registry target: npm
Temporary supported install path: public GitHub release assets for tag \`${tag}\`
Verified consumer line: React 19 + Mantine 8.3.x or 9.2.x

Runtime packages:
${runtimePackages.map((pkg) => `- ${pkg.name}: ${pkg.url}`).join('\n')}

Dev packages:
${devPackages.map((pkg) => `- ${pkg.name}: ${pkg.url}`).join('\n')}

Install commands:

\`\`\`bash
npm install ${runtimePackages.map((pkg) => pkg.url).join(' ')}
npm install -D ${devPackages.map((pkg) => pkg.url).join(' ')}
\`\`\`

Required consumer peers:

\`\`\`bash
npm install @mantine/core @mantine/hooks @mantine/modals @mantine/notifications @tabler/icons-react
\`\`\`
`;

writeFileSync(resolve(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(resolve(outputDir, 'INSTALL_FROM_RELEASE_ASSETS.md'), installGuide);

console.log(`Created release bundles for GDS ${version} in ${outputDir}`);
for (const pkg of manifest.packages) {
  console.log(`- ${pkg.filename}`);
}
