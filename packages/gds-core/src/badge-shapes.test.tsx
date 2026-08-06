import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import {
  GdsBadgeShapeCircle,
  GdsBadgeShapePin,
  GdsBadgeShapeShield,
  GdsBadgeShapes,
} from './badge-shapes';

describe('badge shapes (#487)', () => {
  it('renders on the icon contract: 24x24 viewBox, currentColor stroke, no fill', () => {
    const { container } = renderWithGds(<GdsBadgeShapeShield />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('fill')).toBe('none');
  });

  it('exposes the full prop surface GdsIcon withholds: className, style, ref, rest-spread', () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = renderWithGds(
      <GdsBadgeShapeCircle ref={ref} className="composed" data-layer="base" size={40} stroke={1.75} />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(ref.current).toBe(svg);
    expect(svg.classList.contains('composed')).toBe(true);
    expect(svg.getAttribute('data-layer')).toBe('base');
    expect(svg.getAttribute('width')).toBe('40');
    expect(svg.getAttribute('stroke-width')).toBe('1.75');
  });

  it('keeps the pin as the balloon silhouette only, with no decorative inner dot', () => {
    const { container } = renderWithGds(<GdsBadgeShapePin />);
    expect(container.querySelectorAll('svg path')).toHaveLength(1);
  });

  it('maps exactly the six approved shape names in the GdsBadgeShapes dictionary', () => {
    expect(Object.keys(GdsBadgeShapes).sort()).toEqual([
      'circle',
      'hexagon',
      'pin',
      'rosette',
      'shield',
      'squircle',
    ]);
  });
});
