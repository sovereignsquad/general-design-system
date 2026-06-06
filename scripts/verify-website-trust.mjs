import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const appSource = readFileSync(resolve(root, 'apps/playground/src/App.tsx'), 'utf8');
const routesSource = readFileSync(resolve(root, 'apps/playground/src/site-routes.ts'), 'utf8');
const infoPagesSource = readFileSync(resolve(root, 'apps/playground/src/info-pages.tsx'), 'utf8');
const siteCopySource = readFileSync(resolve(root, 'apps/playground/src/site-copy.ts'), 'utf8');
const showcaseSource = readFileSync(resolve(root, 'apps/playground/src/showcase-pages.tsx'), 'utf8');

const failures = [];

const requiredPrimaryLabels = [
  "label: 'What Is GDS'",
  "label: 'Install'",
  "label: 'Patterns'",
  "label: 'Coverage'",
  "label: 'Themes'",
  "label: 'Governance'",
  "label: 'Live Demos'",
  "label: 'Request a Feature'",
];

for (const label of requiredPrimaryLabels) {
  if (!routesSource.includes(label)) {
    failures.push(`Missing required primary navigation label in site-routes.ts: ${label}`);
  }
}

if (!appSource.includes('getAppShellCopy') || !siteCopySource.includes('Only routes listed as fully localized in the official coverage contract ship complete translated copy.')) {
  failures.push('Route-aware locale honesty disclosure is missing from the app-shell i18n contract.');
}

if (!showcaseSource.includes('public runtime showcase')) {
  failures.push('Live demos page must explicitly frame itself as public runtime showcase.');
}

if (!infoPagesSource.includes('overviewCopy') || !siteCopySource.includes('This website is both the public product site and the live runtime proof')) {
  failures.push('Overview page must keep explicit live-demo framing in the site-copy contract.');
}

if (!infoPagesSource.includes('<ReferenceThemeExplorer')) {
  failures.push('Themes page must render ReferenceThemeExplorer as the canonical interactive surface.');
}

const requestFeatureProof = [
  'moldovancsaba+general.design.system@gmail.com',
  'missing-component',
  'missing-pattern',
  'docs-question',
  'compliance-question',
  'unsupported-product-specific',
  'Triage and repository hygiene',
  'Mail-client fallback',
  'Open prefilled feature request email',
];

for (const proof of requestFeatureProof) {
  if (!infoPagesSource.includes(proof)) {
    failures.push(`Request-feature route must include intake/hygiene proof: ${proof}`);
  }
}

if (failures.length > 0) {
  console.error('Website trust verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Website trust verification passed.');
