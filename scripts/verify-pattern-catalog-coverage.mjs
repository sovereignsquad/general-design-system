import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const registryPath = resolve(root, 'apps/playground/src/pattern-registry.ts');
const ssotPath = resolve(root, 'COMPONENTS_AND_PATTERNS.md');

const registrySource = readFileSync(registryPath, 'utf8');
const ssotSource = readFileSync(ssotPath, 'utf8');

const registryIds = new Set(
  [...registrySource.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]),
);

const ssotTitleToId = {
  'Discovery Shell': 'discovery-shell',
  'Sidebar Navigation': 'sidebar-navigation',
  'Action Bar': 'action-bar',
  'Listing Card': 'listing-card',
  'Share Button Group': 'share-button-group',
  'Public Food Card': 'public-food-card',
  'Food Menu Section': 'food-menu-section',
  'Map Panel': 'map-panel',
  'Detail Profile Shell': 'detail-profile-shell',
  'Public Flow Shell': 'public-flow-shell',
  'Playback Surface': 'playback-surface',
  'Reference Section': 'reference-section',
  'Reference Link Grid': 'reference-link-grid',
  'Reference Locale Notice': 'reference-locale-notice',
  'Reference Theme Explorer': 'reference-theme-explorer',
  'Reference Site Shell': 'reference-site-shell',
  'Docs Shell': 'docs-shell',
  'Public Shells': 'public-shells',
  'Public Nav': 'public-nav',
  'Auth Shells': 'auth-shells',
  'Social Auth Buttons': 'social-auth-buttons',
  'Article Shells': 'article-shells',
  'Docs Page Shell': 'docs-page-shell',
  'Editorial Hero': 'editorial-hero',
  'Feature Band': 'feature-band',
  'Browse Surface': 'browse-surface',
  'Editorial Cards': 'editorial-cards',
  'Consumer Sections': 'consumer-sections',
  'Consumer Dashboard Grid': 'consumer-dashboard-grid',
  'Media Fields': 'media-fields',
  'Content Operations Editor': 'content-operations-editor',
  'Section Panels': 'section-panels',
  'Public Brand Footer': 'public-brand-footer',
  'Filter Drawer': 'filter-drawer',
  'Docs Code Blocks': 'docs-code-blocks',
  'CTA Button Groups': 'cta-button-groups',
  'Upload Surfaces': 'upload-surfaces',
  'Access Summaries': 'access-summaries',
  'Access Recovery Panels': 'access-recovery-panels',
  'Placeholder Panels': 'placeholder-panels',
  'Simple Data Tables': 'simple-data-tables',
  'Stats Sections': 'stats-sections',
};

const requiredTitles = Object.keys(ssotTitleToId);
const titleFailures = [];
const idFailures = [];

for (const title of requiredTitles) {
  const tableRowMarker = `| **${title}** |`;
  if (!ssotSource.includes(tableRowMarker)) {
    titleFailures.push(`Missing SSOT component row title: ${title}`);
    continue;
  }

  const expectedId = ssotTitleToId[title];
  if (!registryIds.has(expectedId)) {
    idFailures.push(`Missing registry coverage for SSOT title "${title}" (expected id: ${expectedId})`);
  }
}

if (titleFailures.length || idFailures.length) {
  console.error('Pattern catalog coverage verification failed:');
  for (const failure of [...titleFailures, ...idFailures]) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Pattern catalog coverage verification passed.');
