// Writes the page-template catalog block in llms.txt and one spec per template in
// docs/templates/, from getGdsPageTemplates() in the built gds-core. --check fails on drift.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const check = process.argv.includes('--check');
const distEntry = resolve(root, 'packages/gds-core/dist/index.mjs');
const llmsPath = resolve(root, 'llms.txt');
const specDir = resolve(root, 'docs/templates');
const START = '<!-- gds:page-templates:start -->';
const END = '<!-- gds:page-templates:end -->';

// Template id -> exported component. Every id from getGdsPageTemplates() must be listed,
// and every component must be a function export of the built package.
const exportNames = {
  'admin-dashboard': 'GdsAdminDashboardTemplate',
  settings: 'GdsSettingsTemplate',
  'resource-manager': 'GdsResourceManagerTemplate',
  'crud-editor': 'GdsCrudEditorTemplate',
  analytics: 'GdsAnalyticsTemplate',
  'public-event': 'GdsPublicEventTemplate',
  'error-page': 'GdsErrorPageTemplate',
  'empty-state-page': 'GdsEmptyStateTemplate',
};

if (!existsSync(distEntry)) {
  console.error('packages/gds-core/dist/index.mjs is missing; build @sovereignsquad/gds-core first.');
  process.exit(1);
}
const core = await import(pathToFileURL(distEntry).href);
const templates = core.getGdsPageTemplates();
const failures = [];

if (templates.length === 0) failures.push('getGdsPageTemplates() returned no templates.');
for (const template of templates) {
  const name = exportNames[template.id];
  if (!name) failures.push(`Template "${template.id}" has no export name in scripts/generate-page-template-docs.mjs.`);
  else if (typeof core[name] !== 'function') failures.push(`${name} is not a function export of @sovereignsquad/gds-core.`);
}
for (const id of Object.keys(exportNames)) {
  if (!templates.some((template) => template.id === id)) failures.push(`Export map lists "${id}", which getGdsPageTemplates() does not return.`);
}
if (failures.length > 0) {
  console.error(`Page template docs generation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

const code = (value) => `\`${value}\``;
const list = (values) => values.map((value) => `- ${value}`).join('\n');

function catalogBlock() {
  const rows = templates.map(
    (template) =>
      `- ${code(exportNames[template.id])} (${code(template.id)}): ${template.description} Component contracts: ${template.componentContracts.map(code).join(', ')}. Spec: docs/templates/${template.id}.md`,
  );
  return [
    START,
    '## Page templates',
    '',
    'Start a full page from a governed page template when one matches the task, before composing primitives. Import templates from `@sovereignsquad/gds` (or `@sovereignsquad/gds-core`). Each takes `title`, an optional `state` and `actions`, plus its own content slots; it renders the header, the state gate and the slots from GDS components. `getGdsPageTemplates()` returns the same catalog at runtime.',
    '',
    ...rows,
    END,
  ].join('\n');
}

function spec(template) {
  return `# ${template.title}

Generated from \`getGdsPageTemplates()\` (\`packages/gds-core/src/GdsPageTemplates.tsx\`) by \`scripts/generate-page-template-docs.mjs\`. Edit the template config, not this file.

- Export: \`${exportNames[template.id]}\` from \`@sovereignsquad/gds\` or \`${template.packageName}\`
- Template id: \`${template.id}\`

${template.description}

## Required data

${list(template.requiredData)}

## States

${list(template.requiredStates.map(code))}

## Component contracts

${list(template.componentContracts.map(code))}

## Task patterns

${list(template.taskPatterns.map(code))}

## Accessibility

${list(template.accessibility)}

## Edge cases

${list(template.edgeCases)}

## Telemetry events

${list(template.telemetryEvents.map(code))}

## Rollback

${template.rollback}

## Props, states and actions

Props are in the API reference (https://sovereignsquad.github.io/general-design-system/api). Shared states, actions and telemetry are in [PAGE_TEMPLATES.md](../PAGE_TEMPLATES.md).
`;
}

const expected = new Map(templates.map((template) => [`${template.id}.md`, spec(template)]));
const llms = readFileSync(llmsPath, 'utf8');
const start = llms.indexOf(START);
const end = llms.indexOf(END);
let nextLlms;
if (start === -1 && end === -1) {
  const anchor = '## Packages';
  const at = llms.indexOf(anchor);
  if (at === -1) {
    console.error('llms.txt has no catalog markers and no "## Packages" heading to insert before.');
    process.exit(1);
  }
  nextLlms = `${llms.slice(0, at)}${catalogBlock()}\n\n${llms.slice(at)}`;
} else if (start === -1 || end < start) {
  console.error('llms.txt has an unpaired page-template catalog marker.');
  process.exit(1);
} else {
  nextLlms = `${llms.slice(0, start)}${catalogBlock()}${llms.slice(end + END.length)}`;
}

if (check) {
  const drift = [];
  if (nextLlms !== llms) drift.push('llms.txt page-template catalog');
  const onDisk = existsSync(specDir) ? readdirSync(specDir).filter((file) => file.endsWith('.md')) : [];
  for (const [file, content] of expected) {
    const path = resolve(specDir, file);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) drift.push(`docs/templates/${file}`);
  }
  for (const file of onDisk) if (!expected.has(file)) drift.push(`docs/templates/${file} (no such template)`);
  if (drift.length > 0) {
    console.error(`Page template docs are stale; run npm run templates:docs.\n- ${drift.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Page template docs are current for ${templates.length} templates.`);
} else {
  writeFileSync(llmsPath, nextLlms);
  mkdirSync(specDir, { recursive: true });
  for (const [file, content] of expected) writeFileSync(resolve(specDir, file), content);
  console.log(`Wrote the llms.txt catalog and ${expected.size} specs in docs/templates/.`);
}
