import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const files = [
  'INSTALLATION_GUIDE.md',
  'COMPATIBILITY_AND_RELEASES.md',
  'VERIFIED_CONSUMER_INSTALL_PROOF.md',
  'RELEASE_PUBLISH.md',
  'CLIENT_UPGRADE_PROMPT.md',
  'apps/playground/src/info-pages.tsx',
  'TEMPLATES/README.md',
  'TEMPLATES/next-app-layout.tsx.template',
  'TEMPLATES/vite-main.tsx.template',
];

const requiredByFile = {
  'INSTALLATION_GUIDE.md': [
    '@doneisbetter/gds@3.0.0',
    '@doneisbetter/gds-theme@3.0.0',
    'ColorSchemeScript',
    'GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published',
    'gds-v3.0.0',
  ],
  'COMPATIBILITY_AND_RELEASES.md': [
    '@doneisbetter/gds@3.0.0',
    '@doneisbetter/gds-theme@3.0.0',
    'Do not mix pre-3.0 package lines with `3.0.0` packages',
    'Bootstrap failure states',
  ],
  'VERIFIED_CONSUMER_INSTALL_PROOF.md': [
    '@doneisbetter/gds@3.0.0',
    '@doneisbetter/gds-theme@3.0.0',
    'npm run verify:published',
    'bounded registry polling',
  ],
  'RELEASE_PUBLISH.md': [
    '@doneisbetter/gds@3.0.0',
    'GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published',
    'retries are bounded',
  ],
  'CLIENT_UPGRADE_PROMPT.md': [
    'GDS upgrade to the 3.0.0 adoption platform release',
    'npm run verify:published',
    '@doneisbetter/gds@3.0.0',
  ],
  'apps/playground/src/info-pages.tsx': [
    "const targetGdsVersion = '3.0.0'",
    'granularInstallCode',
    'nextLayoutCode',
    'viteBootstrapCode',
    'failureRecoveryCode',
    'fallbackInstallCode',
  ],
  'TEMPLATES/README.md': [
    'next-app-layout.tsx.template',
    'vite-main.tsx.template',
  ],
  'TEMPLATES/next-app-layout.tsx.template': [
    'ColorSchemeScript',
    'Providers',
  ],
  'TEMPLATES/vite-main.tsx.template': [
    'GdsProvider',
    '@doneisbetter/gds/client',
  ],
};

const failures = [];

for (const file of files) {
  const contents = readFileSync(resolve(root, file), 'utf8');
  for (const required of requiredByFile[file] ?? []) {
    if (!contents.includes(required)) {
      failures.push(`${file} is missing required install/bootstrap evidence: ${required}`);
    }
  }
}

if (failures.length) {
  console.error('Install/bootstrap documentation verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Install/bootstrap documentation verification passed.');
