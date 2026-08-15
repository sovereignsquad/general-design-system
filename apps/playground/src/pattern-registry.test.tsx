import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GDS_ACCENT_NAMES, GDS_ACCENT_SHADES } from '@sovereignsquad/gds-theme';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { PatternFamilyPage, PatternsIndexPage } from './pattern-pages';
import { patternRegistry } from './pattern-registry';
import { TokensPage } from './info-pages';

describe('playground pattern registry', () => {
  it('keeps ids and anchors unique', () => {
    const ids = patternRegistry.map((entry) => entry.id);
    const anchors = patternRegistry.map((entry) => entry.anchor);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('assigns each entry to the expected family route', () => {
    for (const entry of patternRegistry) {
      expect(entry.route).toBe(`/patterns/${entry.family}`);
      expect(entry.anchor).toBe(entry.id);
    }
  });

  // Issue 600. This previously asserted that EVERY entry was 'live-proof', which is not a
  // check — it is the claim itself, restated as a test. It passed while seven entries
  // rendered the "No interactive demo renders here" fallback, because nothing compared the
  // status to what the page actually showed. Requiring the claim is how the claim went wrong.
  //
  // What replaces it is the property the status is supposed to mean. `verify:pattern-live-proof`
  // enforces the same rule over the source at build time; this keeps it true of the runtime
  // registry as well, and fails if a status is invented that neither gate models.
  it('only claims live-proof for patterns the catalog actually renders', () => {
    const demoCases = new Set(
      [...readFileSync(resolve(process.cwd(), 'apps/playground/src/pattern-pages.tsx'), 'utf8')
        .matchAll(/case '([^']+)':/g)].map((match) => match[1]),
    );

    const unproven = patternRegistry
      .filter((entry) => entry.coverageStatus === 'live-proof')
      .filter((entry) => !demoCases.has(entry.id) && !entry.sourceComponent)
      .map((entry) => entry.id);

    expect(unproven).toEqual([]);
    expect(patternRegistry.some((entry) => entry.coverageStatus === 'live-proof')).toBe(true);
    for (const entry of patternRegistry) {
      expect(['live-proof', 'static-reference', 'pending-primitive', 'blocked']).toContain(entry.coverageStatus);
    }
  });

  it('keeps canonical docs and reference-site primitives represented', () => {
    const ids = new Set(patternRegistry.map((entry) => entry.id));
    const requiredReferenceIds = [
      'docs-shell',
      'reference-section',
      'reference-link-grid',
      'reference-locale-notice',
      'reference-theme-explorer',
      'reference-site-shell',
    ];

    for (const id of requiredReferenceIds) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('renders the pattern index page', () => {
    renderWithGds(<PatternsIndexPage />);

    expect(screen.getByText('Pattern Catalog')).toBeTruthy();
    expect(screen.getByText('Foundations')).toBeTruthy();
    expect(screen.getByText('Access & Recovery')).toBeTruthy();
  });

  it('renders a public family page with the documented entries', () => {
    renderWithGds(<PatternFamilyPage family="public" />);

    expect(screen.getAllByText('Public, Editorial, & Docs').length).toBeGreaterThan(0);
    expect(screen.getByText('Public Shells')).toBeTruthy();
    expect(screen.getByText('Editorial Hero')).toBeTruthy();
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(4);
  });

  it('mounts the live GdsSchemaForm demo (checkbox-group + repeatable) in the Forms entry', () => {
    renderWithGds(<PatternFamilyPage family="foundations" />);

    // Schema-generated form title + field labels (checkbox-group and repeatable)
    expect(screen.getByText('Project intake')).toBeTruthy();
    expect(screen.getByText('Notification channels')).toBeTruthy();
    // checkbox-group options render as themed checkboxes
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeTruthy();
    // repeatable row group exposes an add-row control
    expect(screen.getByRole('button', { name: 'Add member' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Submit intake' })).toBeTruthy();
  });

  // Issue 626 consolidated badges, imagery and motion onto the foundations page by design;
  // rendering all six families in jsdom under full-suite contention outgrew the 15s default.
  it('renders every family route with headings and navigable demo links', () => {
    const families = ['foundations', 'public', 'operations', 'data', 'access', 'feedback'] as const;

    for (const family of families) {
      const { unmount } = renderWithGds(<PatternFamilyPage family={family} />);

      expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(3);
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      expect(screen.getByText('How to use this family')).toBeTruthy();
      expect(screen.getByText('Live runtime proof')).toBeTruthy();
      unmount();
    }
  }, 30000);

  it('renders the interactive tokens theme lab', () => {
    renderWithGds(<TokensPage />);

    expect(screen.getByText('Theme Lab')).toBeTruthy();
    expect(screen.getByText('Live Theme Preview')).toBeTruthy();
    expect(screen.getByText('Unsupported lane boundary')).toBeTruthy();
    expect(screen.getAllByLabelText('Preset').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Preview color scheme').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Open theme governance' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open exception-surface rules' })).toBeTruthy();
  });
});

describe('numbers quoted in coverage metadata match the system (issue 605)', () => {
  // Not rendered to visitors, so not a promise to a client — but a number written by hand
  // drifts exactly the way "250+" did, and the next reader trusts it. Cheap to verify, so
  // there is no reason for it to be unverified.
  it('the accent census in the export-coverage rationale matches the constants', () => {
    const source = readFileSync(resolve(process.cwd(), 'apps/playground/src/pattern-export-coverage.ts'), 'utf8');
    const match = /(\d+)\s+accents\s+x\s+(\d+)\s+darker-only levels/.exec(source);
    expect(match, 'the accent census sentence must still be present to be checked').toBeTruthy();
    expect(Number(match![1])).toBe(GDS_ACCENT_NAMES.length);
    expect(Number(match![2])).toBe(GDS_ACCENT_SHADES.length);
  });
});
