import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();
const dryRun = process.argv.includes('--dry-run');

const workspaces = [
  '@doneisbetter/gds-theme',
  '@doneisbetter/gds-core',
  '@doneisbetter/gds-admin',
  '@doneisbetter/gds',
  '@doneisbetter/gds-eslint-config',
  '@doneisbetter/gds-compliance',
];
const registry = process.env.GDS_NPM_REGISTRY ?? 'https://registry.npmjs.org';

function run(command, args) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

function readPublishedVersion(packageName) {
  try {
    return execFileSync(
      'npm',
      ['view', packageName, 'version', '--registry', registry],
      {
        cwd: root,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
        env: process.env,
      },
    ).trim();
  } catch {
    return null;
  }
}

console.log(`${dryRun ? 'Dry-run publishing' : 'Publishing'} GDS ${version}`);

for (const workspace of workspaces) {
  const publishedVersion = readPublishedVersion(workspace);
  if (publishedVersion === version) {
    console.log(`\n==> ${workspace}`);
    console.log(`Skipping ${workspace}; version ${version} is already published in ${registry}.`);
    continue;
  }

  const args = ['publish', '--workspace', workspace, '--access', 'public'];
  if (dryRun) {
    args.push('--dry-run');
  }

  console.log(`\n==> ${workspace}`);
  run('npm', args);
}

console.log(`\n${dryRun ? 'Dry-run publish completed' : 'Publish completed'} for GDS ${version}.`);
