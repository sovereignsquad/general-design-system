import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const fixture = mkdtempSync(join(tmpdir(), 'gds-codemods-'));

try {
  const actionFile = join(fixture, 'Actions.tsx');
  writeFileSync(actionFile, `
import { CtaButtonGroup } from '@doneisbetter/gds-core';
import { SemanticButton } from '@doneisbetter/gds-core';

export function Actions() {
  return <CtaButtonGroup primary={<SemanticButton action="save" />} secondary={<SemanticButton action="cancel" />} tertiary={<SemanticButton action="help" />} />;
}
`);

  const actionOutput = execFileSync('node', ['scripts/codemods/run-codemod.mjs', 'action-bar', actionFile, '--write'], {
    cwd: root,
    encoding: 'utf8',
  });
  const actionReport = JSON.parse(actionOutput);
  const actionResult = readFileSync(actionFile, 'utf8');

  if (actionReport.changedFiles.length !== 1 || !actionResult.includes('<ActionBar primary={{ action:')) {
    throw new Error('action-bar codemod did not rewrite the supported fixture.');
  }

  const listingFile = join(fixture, 'Listing.tsx');
  writeFileSync(listingFile, `
import { PublicProductCard } from '@doneisbetter/gds-core';
export function Listing() { return <PublicProductCard title="Venue" />; }
`);

  const listingOutput = execFileSync('node', ['scripts/codemods/run-codemod.mjs', 'listing-card', listingFile, '--write'], {
    cwd: root,
    encoding: 'utf8',
  });
  const listingReport = JSON.parse(listingOutput);
  const listingResult = readFileSync(listingFile, 'utf8');

  if (listingReport.changedFiles.length !== 1 || !listingResult.includes('ListingCard')) {
    throw new Error('listing-card codemod did not rewrite the supported fixture.');
  }

  console.log('Codemod verification passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
