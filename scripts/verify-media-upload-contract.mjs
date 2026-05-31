import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const mediaFieldSource = readFileSync(resolve(root, 'packages/gds-core/src/MediaField.tsx'), 'utf8');
const uploadDropzoneSource = readFileSync(resolve(root, 'packages/gds-core/src/UploadDropzone.tsx'), 'utf8');
const patternPagesSource = readFileSync(resolve(root, 'apps/playground/src/pattern-pages.tsx'), 'utf8');
const componentsSource = readFileSync(resolve(root, 'COMPONENTS_AND_PATTERNS.md'), 'utf8');
const playbookSource = readFileSync(resolve(root, 'ADOPTION_AND_MIGRATION_PLAYBOOK.md'), 'utf8');

const failures = [];

const requiredMediaStates = [
  'empty',
  'drag-active',
  'selected',
  'preview-loading',
  'uploading',
  'upload-failed',
  'unsupported-type',
  'too-large',
  'removed',
  'saved',
  'invalid',
  'readonly',
];

const requiredUploadStates = [
  'idle',
  'drag-active',
  'selected',
  'upload-pending',
  'upload-failed',
  'unsupported-type',
  'too-large',
  'removed',
  'readonly',
];

for (const state of requiredMediaStates) {
  if (!mediaFieldSource.includes(`'${state}'`)) {
    failures.push(`MediaField is missing state: ${state}`);
  }
}

for (const state of requiredUploadStates) {
  if (!uploadDropzoneSource.includes(`'${state}'`)) {
    failures.push(`UploadDropzone is missing state: ${state}`);
  }
}

for (const prop of ['acceptedTypes', 'maxSize', 'progress', 'replaceAction', 'retryAction', 'removeAction', 'resetAction', 'readonly']) {
  if (!mediaFieldSource.includes(prop)) {
    failures.push(`MediaField is missing contract prop: ${prop}`);
  }
}

for (const prop of ['acceptedTypesLabel', 'maxSizeLabel', 'selectedFiles', 'policyText', 'retryAction', 'removeAction', 'readonly']) {
  if (!uploadDropzoneSource.includes(prop)) {
    failures.push(`UploadDropzone is missing contract prop: ${prop}`);
  }
}

for (const required of [
  'Media/Upload State Matrix',
  '`upload-failed`',
  '`unsupported-type`',
  '`too-large`',
  '`readonly`',
  'must never own network transport',
]) {
  if (!componentsSource.includes(required)) {
    failures.push(`COMPONENTS_AND_PATTERNS.md is missing media/upload evidence: ${required}`);
  }
}

for (const required of ['Media and upload migration', 'replace local asset field wrappers with `MediaField`', 'replace local drop/select surfaces with `UploadDropzone`']) {
  if (!playbookSource.includes(required)) {
    failures.push(`ADOPTION_AND_MIGRATION_PLAYBOOK.md is missing media/upload migration evidence: ${required}`);
  }
}

for (const required of ['state="uploading"', 'state="too-large"', 'readonly', 'Retry upload', 'Remove asset']) {
  if (!patternPagesSource.includes(required)) {
    failures.push(`Pattern pages are missing live media/upload demo evidence: ${required}`);
  }
}

if (failures.length > 0) {
  console.error('Media/upload contract verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Media/upload contract verification passed.');
