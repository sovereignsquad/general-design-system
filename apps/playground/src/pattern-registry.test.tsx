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

  it('keeps the public catalog fully represented as live demos', () => {
    expect(patternRegistry.every((entry) => entry.coverageStatus === 'live-demo')).toBe(true);
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
  });

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
