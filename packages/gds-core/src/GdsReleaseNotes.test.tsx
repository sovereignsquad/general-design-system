import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { expectNoAxeViolations } from '../../../test-utils/axe';
import { GdsReleaseNotes, type GdsRelease } from './GdsReleaseNotes.client';

const releases: GdsRelease[] = [
  {
    version: '2.0.0',
    date: '2026-11-16',
    title: 'Neutral presets',
    sections: [
      {
        heading: [{ kind: 'text', text: 'Theme presets renamed (#985)' }],
        blocks: [
          { kind: 'paragraph', content: [{ kind: 'text', text: 'Use ' }, { kind: 'code', text: 'harbor' }, { kind: 'text', text: ' now.' }] },
          {
            kind: 'list',
            ordered: false,
            items: [
              { content: [{ kind: 'strong', children: [{ kind: 'text', text: 'Old ids' }] }, { kind: 'text', text: ' still resolve.' }], children: [{ kind: 'list', ordered: false, items: [{ content: [{ kind: 'text', text: 'Until 8.0.0.' }] }] }] },
            ],
          },
          { kind: 'table', header: [[{ kind: 'text', text: 'Old' }], [{ kind: 'text', text: 'New' }]], rows: [[[{ kind: 'text', text: 'class-usa' }], [{ kind: 'text', text: 'harbor' }]]] },
        ],
      },
    ],
  },
  { version: '1.0.0', sections: [] },
  { version: '1.0.0', title: 'part 2', sections: [] },
];

describe('GdsReleaseNotes (#978)', () => {
  it('renders each release with its title, date, sections, lists, code and tables, and passes axe', async () => {
    const { container } = renderWithGds(<GdsReleaseNotes releases={releases} issueHref={(issue) => `https://example.com/issues/${issue}`} />);
    expect(screen.getByRole('heading', { level: 2, name: '2.0.0 — Neutral presets' })).toBeInTheDocument();
    expect(screen.getByText('2026-11-16')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Theme presets renamed/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#985' })).toHaveAttribute('href', 'https://example.com/issues/985');
    expect(screen.getByText('harbor', { selector: 'code' })).toBeInTheDocument();
    expect(screen.getByText(/Until 8\.0\.0\./)).toBeInTheDocument();
    const markers = container.querySelectorAll('[data-gds-release-marker]');
    expect(markers).toHaveLength(2);
    for (const marker of markers) {
      expect(marker).toHaveAttribute('aria-hidden', 'true');
      expect(marker.textContent).toBe('• ');
    }
    expect(within(screen.getByRole('table')).getByText('class-usa')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('gives a repeated version a distinct anchor', () => {
    const { container } = renderWithGds(<GdsReleaseNotes releases={releases} />);
    expect(container.querySelector('#release-1-0-0')).toBeTruthy();
    expect(container.querySelector('#release-1-0-0-2')).toBeTruthy();
  });

  it('leaves issue references as text without issueHref', () => {
    renderWithGds(<GdsReleaseNotes releases={releases} />);
    expect(screen.queryByRole('link', { name: '#985' })).toBeNull();
  });
});
