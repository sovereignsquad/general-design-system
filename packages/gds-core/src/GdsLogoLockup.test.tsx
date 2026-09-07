import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { GdsLogoLockup } from './GdsLogoLockup';

describe('GdsLogoLockup (issue 713)', () => {
  it('renders mark + wordmark + badge', () => {
    const { container } = renderWithGds(
      <GdsLogoLockup src="/brand/mark.svg" alt="" wordmark="Your Field" badge="NYC" />,
    );
    const img = container.querySelector('[data-gds-logo-lockup-mark]') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/brand/mark.svg');
    expect(screen.getByText('Your Field')).toBeInTheDocument();
    expect(screen.getByText('NYC')).toBeInTheDocument();
  });

  it('renders mark-only when wordmark is omitted', () => {
    const { container } = renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="Your Field" />);
    expect(container.querySelector('[data-gds-logo-lockup-mark]')).toBeTruthy();
    expect(container.querySelector('[data-gds-logo-lockup-badge]')).toBeFalsy();
  });

  it('suppresses the badge when wordmark is not given, even if badge is passed', () => {
    const { container } = renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="Your Field" badge="NYC" />);
    expect(screen.queryByText('NYC')).not.toBeInTheDocument();
    expect(container.querySelector('[data-gds-logo-lockup-badge]')).toBeFalsy();
  });

  it('exposes alt text and keeps layout when the mark image is broken (native img behavior)', () => {
    const { container } = renderWithGds(
      <GdsLogoLockup src="/does-not-exist.svg" alt="Your Field" wordmark="Your Field" />,
    );
    const img = container.querySelector('[data-gds-logo-lockup-mark]') as HTMLImageElement;
    expect(img.getAttribute('alt')).toBe('Your Field');
    // The wordmark renders regardless of whether the mark image loaded.
    expect(screen.getByText('Your Field')).toBeInTheDocument();
  });

  it('accepts an arbitrary mark node instead of src', () => {
    renderWithGds(<GdsLogoLockup mark={<svg data-testid="custom-mark" />} wordmark="Your Field" />);
    expect(screen.getByTestId('custom-mark')).toBeInTheDocument();
  });

  it('throws in development when src and mark are both given', () => {
    expect(() =>
      renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="" mark={<svg />} />),
    ).toThrow(/pass either `src` or `mark`/);
  });

  it('throws in development when src is given without alt', () => {
    expect(() =>
      renderWithGds(<GdsLogoLockup src="/brand/mark.svg" />),
    ).toThrow(/`alt` is required with `src`/);
  });

  it('accepts alt="" for a decorative mark inside an already-labelled context', () => {
    expect(() => renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="" />)).not.toThrow();
  });

  it('renders the framed presentation with card surface, border, radius, and elevation', () => {
    const { container } = renderWithGds(
      <GdsLogoLockup src="/brand/mark.svg" alt="" wordmark="Your Field" framed />,
    );
    const frame = container.querySelector('[data-gds-logo-lockup-frame]') as HTMLElement;
    expect(frame).toBeTruthy();
    expect(frame.style.background).toBe('var(--gds-bg-card)');
    expect(frame.style.borderRadius).toBe('var(--gds-radius-card)');
    expect(frame.style.boxShadow).toBe('var(--gds-elevation-card)');
  });

  it('swaps wordmark/badge colors for the onInverse variant', () => {
    renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="" wordmark="Your Field" badge="NYC" onInverse />);
    const wordmark = screen.getByText('Your Field');
    expect(wordmark.style.color).toBe('var(--gds-text-on-inverse)');
  });

  it('never wraps or hard-clips a long wordmark — single-line with ellipsis instead', () => {
    const longWordmark = 'Your Field Family Activity Discovery Platform of Greater New York City';
    renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="" wordmark={longWordmark} />);
    const wordmark = screen.getByText(longWordmark);
    expect(wordmark.style.whiteSpace).toBe('nowrap');
    expect(wordmark.style.textOverflow).toBe('ellipsis');
  });

  it('defaults the mark size to 2.25em and accepts a numeric override in px', () => {
    const { container, rerender } = renderWithGds(<GdsLogoLockup src="/brand/mark.svg" alt="" />);
    let img = container.querySelector('[data-gds-logo-lockup-mark]') as HTMLImageElement;
    expect(img.style.width).toBe('2.25em');

    rerender(<GdsLogoLockup src="/brand/mark.svg" alt="" size={40} />);
    img = container.querySelector('[data-gds-logo-lockup-mark]') as HTMLImageElement;
    expect(img.style.width).toBe('40px');
  });
});
