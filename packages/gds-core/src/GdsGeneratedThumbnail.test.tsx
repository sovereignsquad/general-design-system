import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { gdsBadgeAccentShades } from './GdsBadge';
import { GdsGeneratedThumbnail } from './GdsGeneratedThumbnail';

const CATEGORIES = [
  { key: 'soccer', label: 'Soccer', icon: 'Location' as const },
  { key: 'basketball', label: 'Basketball', icon: 'Habit' as const },
  { key: 'gymnastics', label: 'Gymnastics', icon: 'Trophy' as const },
  { key: 'swimming', label: 'Swimming', icon: 'Star' as const },
];

describe('GdsGeneratedThumbnail (#505)', () => {
  it('has no root role/label by default, but the SVG background is unconditionally aria-hidden', () => {
    const { container } = renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} />);
    const root = container.querySelector('[data-gds-generated-thumbnail]');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-hidden');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders role="group" with the label when used standalone, without hiding the individual badges', () => {
    renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} label="Riverside Field — soccer" />);
    expect(screen.getByRole('group', { name: 'Riverside Field — soccer' })).toBeTruthy();
    expect(screen.getByText('Soccer')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Basketball' })).toBeTruthy();
  });

  it('renders the lead category as real, readable text (not just an icon)', () => {
    renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} />);
    expect(screen.getByText('Soccer')).toBeTruthy();
  });

  it('renders secondary categories as icon-only badges with an accessible label', () => {
    renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} maxBadges={3} />);
    expect(screen.getByRole('img', { name: 'Basketball' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Gymnastics' })).toBeTruthy();
    // maxBadges=3 caps at 1 lead + 2 secondary — "Swimming" (4th) must not render.
    expect(screen.queryByText('Swimming')).toBeNull();
    expect(screen.queryByRole('img', { name: 'Swimming' })).toBeNull();
  });

  it('throws a clear error when categories is empty', () => {
    expect(() => renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={[]} />)).toThrow(
      /must contain at least one entry/,
    );
  });

  it('is deterministic: the same seed always produces the same motif transform', () => {
    const first = renderWithGds(<GdsGeneratedThumbnail seed="listing-42" categories={CATEGORIES} />);
    const firstTransform = first.container.querySelector('svg g')?.getAttribute('transform');
    first.unmount();

    const second = renderWithGds(<GdsGeneratedThumbnail seed="listing-42" categories={CATEGORIES} />);
    const secondTransform = second.container.querySelector('svg g')?.getAttribute('transform');

    expect(firstTransform).toBeTruthy();
    expect(firstTransform).toBe(secondTransform);
  });

  it('different seeds produce different motif transforms', () => {
    const a = renderWithGds(<GdsGeneratedThumbnail seed="listing-a" categories={CATEGORIES} />);
    const b = renderWithGds(<GdsGeneratedThumbnail seed="listing-b" categories={CATEGORIES} />);
    const transformA = a.container.querySelector('svg g')?.getAttribute('transform');
    const transformB = b.container.querySelector('svg g')?.getAttribute('transform');
    expect(transformA).not.toBe(transformB);
  });

  it('theme mode (default) resolves the gradient to CSS var-reference strings, not literal hex', () => {
    const { container } = renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} />);
    const firstStop = container.querySelector('stop');
    expect(firstStop?.getAttribute('stop-color')).toMatch(/^var\(--gds-brand-primary, #[0-9a-f]{6}\)$/);
  });

  it('category mode resolves the gradient to the accent TOKEN, so a category follows the theme (issue 594)', () => {
    const { container } = renderWithGds(
      <GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} paletteSource="category" category="forest" shade="deep" />,
    );
    const firstStop = container.querySelector('stop');
    expect(firstStop?.getAttribute('stop-color')).toBe(`var(--gds-accent-forest-deep, ${gdsBadgeAccentShades.forest.deep})`);
  });

  it('an explicit colors override wins over paletteSource', () => {
    const { container } = renderWithGds(
      <GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} paletteSource="category" colors={{ primary: '#112233', accent: '#445566' }} />,
    );
    const firstStop = container.querySelector('stop');
    expect(firstStop?.getAttribute('stop-color')).toBe('#112233');
  });

  it('the lead badge background is darkened via color-mix, guaranteeing safe contrast for fixed white text regardless of the resolved theme color', () => {
    const { container } = renderWithGds(<GdsGeneratedThumbnail seed="listing-1" categories={CATEGORIES} />);
    const leadBadge = container.querySelector('[data-gds-generated-thumbnail-badge="lead"]') as HTMLElement;
    expect(leadBadge.style.background).toMatch(/^color-mix\(in srgb, .+ 30%, black\)$/);
  });
});
