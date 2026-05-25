import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();
const retries = Number.parseInt(process.env.GDS_REGISTRY_RETRIES ?? '5', 10);
const delayMs = Number.parseInt(process.env.GDS_REGISTRY_DELAY_MS ?? '5000', 10);
const registry = process.env.GDS_NPM_REGISTRY ?? 'https://registry.npmjs.org';

const packages = [
  '@gds/theme',
  '@gds/core',
  '@gds/admin',
  '@gds/eslint-config',
  '@gds/compliance',
];

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function readPublishedVersion(packageName) {
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
}

const failures = [];

for (const packageName of packages) {
  let publishedVersion = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      publishedVersion = readPublishedVersion(packageName);
      if (publishedVersion === version) {
        console.log(`${packageName}@${publishedVersion} is available in ${registry}`);
        break;
      }

      console.warn(
        `${packageName} resolved to ${publishedVersion} on attempt ${attempt}/${retries}; expected ${version}`,
      );
    } catch (error) {
      console.warn(
        `${packageName} was not yet available on attempt ${attempt}/${retries}: ${String(error).trim()}`,
      );
    }

    if (attempt < retries) {
      await sleep(delayMs);
    }
  }

  if (publishedVersion !== version) {
    failures.push(
      `${packageName} did not resolve to ${version} after ${retries} attempt(s); last seen value: ${publishedVersion ?? 'unavailable'}`,
    );
  }
}

if (failures.length) {
  console.error('Registry publication verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Registry publication verification passed for ${version}.`);
