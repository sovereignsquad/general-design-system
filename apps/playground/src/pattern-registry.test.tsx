import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { PatternFamilyPage, PatternsIndexPage } from './pattern-pages';
import { patternRegistry } from './pattern-registry';

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

  it('renders the pattern index page', () => {
    renderWithGds(<PatternsIndexPage />);

    expect(screen.getByText('Pattern Catalog')).toBeTruthy();
    expect(screen.getByText('Foundations')).toBeTruthy();
    expect(screen.getByText('Access & Recovery')).toBeTruthy();
  });

  it('renders a public family page with live and reference coverage', () => {
    renderWithGds(<PatternFamilyPage family="public" />);

    expect(screen.getByText('Public, Editorial, & Docs')).toBeTruthy();
    expect(screen.getByText('Public Shells')).toBeTruthy();
    expect(screen.getByText('Editorial Hero')).toBeTruthy();
    expect(screen.getAllByText(/Live demo|Reference guidance|Pending primitive|Blocked/).length).toBeGreaterThan(0);
  });
});
