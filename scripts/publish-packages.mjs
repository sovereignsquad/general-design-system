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
  '@doneisbetter/gds-eslint-config',
  '@doneisbetter/gds-compliance',
];

function run(command, args) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

console.log(`${dryRun ? 'Dry-run publishing' : 'Publishing'} GDS ${version}`);

for (const workspace of workspaces) {
  const args = ['publish', '--workspace', workspace, '--access', 'public'];
  if (dryRun) {
    args.push('--dry-run');
  }

  console.log(`\n==> ${workspace}`);
  run('npm', args);
}

console.log(`\n${dryRun ? 'Dry-run publish completed' : 'Publish completed'} for GDS ${version}.`);
