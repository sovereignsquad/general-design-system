import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsRatingDisplay } from './GdsRatingDisplay';

describe('GdsRatingDisplay (#642)', () => {
  it('exposes one accessible name for the whole rating, not one per star', () => {
    renderWithGds(<GdsRatingDisplay value={4.5} count={128} />);
    const img = document.querySelector('[role="img"]') as HTMLElement;
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('aria-label', '4.5 out of 5 stars, 128 ratings');
    expect(document.querySelectorAll('svg[aria-label]').length).toBe(0);
  });

  it('states the value without a count when none is given', () => {
    renderWithGds(<GdsRatingDisplay value={3} max={5} />);
    const img = document.querySelector('[role="img"]') as HTMLElement;
    expect(img).toHaveAttribute('aria-label', '3 out of 5 stars');
  });

  it('accepts an explicit label override', () => {
    renderWithGds(<GdsRatingDisplay value={3} max={5} label="Custom label" />);
    const img = document.querySelector('[role="img"]') as HTMLElement;
    expect(img).toHaveAttribute('aria-label', 'Custom label');
  });

  it('clamps out-of-range values into the label', () => {
    renderWithGds(<GdsRatingDisplay value={9} max={5} />);
    const img = document.querySelector('[role="img"]') as HTMLElement;
    expect(img).toHaveAttribute('aria-label', '5 out of 5 stars');

    renderWithGds(<GdsRatingDisplay value={-2} max={5} />);
    const negative = document.querySelectorAll('[role="img"]');
    expect(negative[negative.length - 1]).toHaveAttribute('aria-label', '0 out of 5 stars');
  });

  it('renders exactly `max` glyphs', () => {
    renderWithGds(<GdsRatingDisplay value={2} max={5} />);
    const img = document.querySelector('[role="img"]') as HTMLElement;
    expect(img.querySelectorAll('svg').length).toBe(5);
  });

  it('supports a scale other than 5', () => {
    renderWithGds(<GdsRatingDisplay value={3} max={5} label="3 out of 5 stars" />);
    const img = document.querySelector('[role="img"]') as HTMLElement;
    expect(img.querySelectorAll('svg').length).toBe(5);
  });
});
