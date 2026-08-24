import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();

const files = [
  'INSTALLATION_GUIDE.md',
  'COMPATIBILITY_AND_RELEASES.md',
  'VERIFIED_CONSUMER_INSTALL_PROOF.md',
  'RELEASE_PUBLISH.md',
  'CLIENT_UPGRADE_PROMPT.md',
  'apps/playground/src/info-pages.tsx',
  'apps/playground/src/site-copy.ts',
  'TEMPLATES/README.md',
  'TEMPLATES/next-app-layout.tsx.template',
  'TEMPLATES/vite-main.tsx.template',
  'docs/CLASSSCOUT_INTEGRATION.md',
  'docs/AI_AGENT_GUIDE.md',
];

// The GDS stylesheet import is the single mandatory integration step that paints
// every GDS surface (including dropdown/overlay backgrounds). Every consumer
// integration path must document it or the build fails here (issue 344).
const MANDATORY_STYLESHEET_IMPORT = '@sovereignsquad/gds-theme/styles.css';

const requiredByFile = {
  'INSTALLATION_GUIDE.md': [
    `@sovereignsquad/gds@${version}`,
    `@sovereignsquad/gds-theme@${version}`,
    'ColorSchemeScript',
    'GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published:availability',
    'npm run verify:published:consumer',
    `gds-v${version}`,
    MANDATORY_STYLESHEET_IMPORT,
  ],
  'COMPATIBILITY_AND_RELEASES.md': [
    `@sovereignsquad/gds@${version}`,
    `@sovereignsquad/gds-theme@${version}`,
    `Do not mix pre-3.0 package lines with \`${version}\` packages`,
    'Bootstrap failure states',
  ],
  'VERIFIED_CONSUMER_INSTALL_PROOF.md': [
    `@sovereignsquad/gds@${version}`,
    `@sovereignsquad/gds-theme@${version}`,
    'npm run verify:published',
    'bounded registry polling',
  ],
  'RELEASE_PUBLISH.md': [
    `@sovereignsquad/gds@${version}`,
    'GDS_REGISTRY_RETRIES=8 GDS_REGISTRY_DELAY_MS=7000 npm run verify:published',
    'retries are bounded',
  ],
  'CLIENT_UPGRADE_PROMPT.md': [
    `GDS upgrade to the ${version} adoption platform release`,
    'npm run verify:published',
    `@sovereignsquad/gds@${version}`,
  ],
  'apps/playground/src/info-pages.tsx': [
    'granularInstallCode',
    'nextLayoutCode',
    'viteBootstrapCode',
    'failureRecoveryCode',
    'fallbackInstallCode',
    MANDATORY_STYLESHEET_IMPORT,
  ],
  'apps/playground/src/site-copy.ts': [
    `export const targetGdsVersion = '${version}'`,
    `export const stableGdsVersion = '${version}'`,
  ],
  'TEMPLATES/README.md': [
    'next-app-layout.tsx.template',
    'vite-main.tsx.template',
  ],
  'TEMPLATES/next-app-layout.tsx.template': [
    'ColorSchemeScript',
    'Providers',
    MANDATORY_STYLESHEET_IMPORT,
  ],
  'TEMPLATES/vite-main.tsx.template': [
    'GdsProvider',
    '@sovereignsquad/gds/client',
    MANDATORY_STYLESHEET_IMPORT,
  ],
  'docs/CLASSSCOUT_INTEGRATION.md': [
    MANDATORY_STYLESHEET_IMPORT,
  ],
  'docs/AI_AGENT_GUIDE.md': [
    MANDATORY_STYLESHEET_IMPORT,
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
