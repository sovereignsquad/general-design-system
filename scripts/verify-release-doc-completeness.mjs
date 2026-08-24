import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Release-doc completeness gate (issue 446).
//
// The recurring failure this guards against: a feature ships and its
// human-facing doc (COMPONENTS_AND_PATTERNS.md, docs/*) is updated, but the
// two *release-surface index* docs — `llms.txt` (AI-facing) and `README.md`
// (human-facing "What You Can Find Here") — are forgotten, so they silently
// go stale and no gate catches it.
//
// The rule: every entry below names a marker string that MUST appear verbatim
// in BOTH `llms.txt` and `README.md`. When a release adds a user-facing
// surface, the author adds one line here — which then fails CI until both
// index docs mention it. Adding the marker without updating the docs cannot
// pass, so the docs cannot fall behind the shipped surface again.
//
// Keep markers to durable, literal API/prop/import tokens (not prose), so the
// check stays deterministic and low-maintenance across releases.

const root = process.cwd();

const RELEASE_DOC_FILES = ['llms.txt', 'README.md'];

const RELEASE_DOC_SURFACE = [
  // 3.14.0 — KanbanBoard server-pagination / footer / collapsible
  { marker: 'totalCount', since: '3.14.0', surface: 'KanbanBoard server-paginated column count badge' },
  { marker: 'renderColumnFooter', since: '3.14.0', surface: 'KanbanBoard per-column footer (load-more/pagination)' },
  { marker: 'collapsible', since: '3.14.0', surface: 'KanbanBoard opt-in collapsible columns' },
  // 3.14.0 — GdsSchemaForm field types + opt-in date CSS
  { marker: 'checkbox-group', since: '3.14.0', surface: 'GdsSchemaForm grouped multi-select field type' },
  { marker: 'repeatable', since: '3.14.0', surface: 'GdsSchemaForm add-another-row field type' },
  { marker: 'dates.css', since: '3.14.0', surface: 'opt-in @sovereignsquad/gds-theme/dates.css import for date field types' },
];

const contentsByFile = Object.fromEntries(
  RELEASE_DOC_FILES.map((file) => [file, readFileSync(resolve(root, file), 'utf8')]),
);

const failures = [];

for (const { marker, since, surface } of RELEASE_DOC_SURFACE) {
  for (const file of RELEASE_DOC_FILES) {
    if (!contentsByFile[file].includes(marker)) {
      failures.push(
        `${file} does not mention \`${marker}\` (${surface}, since ${since}). ` +
          'Both llms.txt and README.md must describe every shipped release surface.',
      );
    }
  }
}

if (failures.length) {
  console.error('Release-doc completeness verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Release-doc completeness verification passed: ${RELEASE_DOC_SURFACE.length} release-surface markers present in ${RELEASE_DOC_FILES.join(' + ')}.`,
);
