import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { gdsBadgeAccentShades } from './GdsBadge';
import { GdsGeneratedHero } from './GdsGeneratedHero';

const BADGES = [
  { key: 'soccer', label: 'Soccer', icon: 'Location' as const },
  { key: 'basketball', label: 'Basketball', icon: 'Habit' as const },
  { key: 'gymnastics', label: 'Gymnastics', icon: 'Trophy' as const },
  { key: 'swimming', label: 'Swimming', icon: 'Star' as const },
  { key: 'yoga', label: 'Yoga', icon: 'Flag' as const },
  { key: 'art', label: 'Art', icon: 'Gallery' as const },
  { key: 'music', label: 'Music', icon: 'Message' as const },
];

describe('GdsGeneratedHero (#506)', () => {
  it('always renders role="group" with the required label, unlike GdsGeneratedThumbnail', () => {
    renderWithGds(<GdsGeneratedHero seed="loc-1" label="Sports classes in Riverdale" />);
    expect(screen.getByRole('group', { name: 'Sports classes in Riverdale' })).toBeTruthy();
  });

  it('the SVG background is unconditionally aria-hidden', () => {
    const { container } = renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('caps badges at 6, one per size tier by rank: index 0 large, 1-2 medium, 3-5 small, 6+ dropped', () => {
    const { container } = renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" badges={BADGES} />);
    expect(container.querySelectorAll('[data-gds-generated-hero-badge="large"]').length).toBe(1);
    expect(container.querySelectorAll('[data-gds-generated-hero-badge="medium"]').length).toBe(2);
    expect(container.querySelectorAll('[data-gds-generated-hero-badge="small"]').length).toBe(3);
    // 7th badge ("Music") must not render at all.
    expect(screen.queryByRole('img', { name: 'Music' })).toBeNull();
  });

  it('every rendered badge stays individually accessible with its own real label', () => {
    renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" badges={BADGES.slice(0, 3)} />);
    expect(screen.getByRole('img', { name: 'Soccer' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Basketball' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Gymnastics' })).toBeTruthy();
  });

  it('is deterministic: the same seed always produces the same badge slot assignment', () => {
    const first = renderWithGds(<GdsGeneratedHero seed="loc-42" label="Riverdale" badges={BADGES} />);
    const firstPositions = Array.from(first.container.querySelectorAll('[data-gds-generated-hero-badge]')).map(
      (el) => (el as HTMLElement).style.insetInlineStart,
    );
    first.unmount();

    const second = renderWithGds(<GdsGeneratedHero seed="loc-42" label="Riverdale" badges={BADGES} />);
    const secondPositions = Array.from(second.container.querySelectorAll('[data-gds-generated-hero-badge]')).map(
      (el) => (el as HTMLElement).style.insetInlineStart,
    );

    expect(firstPositions).toEqual(secondPositions);
  });

  it('defaults to the "wash" background with no extra SVG shapes beyond the gradient rect', () => {
    const { container } = renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    // Only the gradient <rect> — no mosaic tiles, no icon-field <g> groups, no region rects.
    expect(svg.querySelectorAll('rect').length).toBe(1);
    expect(svg.querySelectorAll('g').length).toBe(0);
  });

  it('"mosaic-abstract" renders a deterministic seeded set of tinted tiles', () => {
    const { container } = renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" background="mosaic-abstract" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.querySelectorAll('rect').length).toBeGreaterThan(1);
  });

  it('"icon-field" scatters the supplied badge icons and renders nothing when no badges are given', () => {
    const withBadges = renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" background="icon-field" badges={BADGES} />);
    expect(withBadges.container.querySelectorAll('svg g').length).toBeGreaterThan(0);

    const withoutBadges = renderWithGds(<GdsGeneratedHero seed="loc-1" label="Riverdale" background="icon-field" />);
    expect(withoutBadges.container.querySelectorAll('svg g').length).toBe(0);
  });

  it('region-mosaic renders exactly one rect per consumer-supplied region, positioned from normalized fractions', () => {
    const { container } = renderWithGds(
      <GdsGeneratedHero
        seed="loc-1"
        label="Riverdale"
        background={{
          type: 'region-mosaic',
          regions: [
            { x0: 0, y0: 0, x1: 0.5, y1: 0.5 },
            { x0: 0.5, y0: 0.5, x1: 1, y1: 1, weight: 2 },
          ],
        }}
      />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    // 1 gradient rect + 2 region rects.
    expect(svg.querySelectorAll('rect').length).toBe(3);
  });

  it('category mode resolves the gradient to the accent TOKEN, so a category follows the theme (issue 594), same as GdsGeneratedThumbnail', () => {
    const { container } = renderWithGds(
      <GdsGeneratedHero seed="loc-1" label="Riverdale" paletteSource="category" category="magenta" shade="deeper" />,
    );
    const firstStop = container.querySelector('stop');
    expect(firstStop?.getAttribute('stop-color')).toBe(`var(--gds-accent-magenta-deeper, ${gdsBadgeAccentShades.magenta.deeper})`);
  });
});
