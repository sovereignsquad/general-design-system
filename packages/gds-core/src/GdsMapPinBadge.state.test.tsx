import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsMapPinBadge, GDS_PIN_SELECTED_SCALE } from './GdsMapPinBadge';

// Invariant: fill encodes the activity/category; state (hover/select/approximate) is
// carried only by silhouette and scale, never by repainting the accent fill.
describe('GdsMapPinBadge state contract', () => {
  const pinOf = (ui: React.ReactElement) => {
    const { container } = renderWithGds(ui);
    return container.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGSVGElement;
  };

  it('idle is exactly the pre-state rendering: 1.75 stroke, accent, no dash', () => {
    const pin = pinOf(<GdsMapPinBadge accent="ocean" icon="Location" label="x" />);
    expect(pin.getAttribute('stroke-width')).toBe('1.75');
    expect(pin.getAttribute('stroke')).toContain('--gds-accent-ocean-base');
    expect(pin.getAttribute('stroke-dasharray')).toBeNull();
  });

  it('hovered widens the stroke to 2.25 and darkens it ONE step down the same accent ladder', () => {
    const pin = pinOf(<GdsMapPinBadge accent="ocean" icon="Location" label="x" state="hovered" />);
    expect(pin.getAttribute('stroke-width')).toBe('2.25');
    expect(pin.getAttribute('stroke')).toContain('--gds-accent-ocean-deep');
  });

  it('hovered saturates at deepest instead of leaving the ladder', () => {
    const pin = pinOf(
      <GdsMapPinBadge accent="ocean" shade="deepest" icon="Location" label="x" state="hovered" />,
    );
    expect(pin.getAttribute('stroke')).toContain('--gds-accent-ocean-deepest');
  });

  it('selected scales the marker around the TAIL TIP so the anchored point holds still', () => {
    const { container } = renderWithGds(
      <GdsMapPinBadge accent="ocean" icon="Location" label="x" state="selected" />,
    );
    const stack = container.querySelector('[role="img"]') as HTMLElement;
    expect(stack.style.transform).toBe(`scale(${GDS_PIN_SELECTED_SCALE})`);
    expect(stack.style.transformOrigin).toBe('50% 100%');
    const pin = container.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGSVGElement;
    expect(pin.getAttribute('stroke-width')).toBe('2.25');
  });

  it('approximate renders a DASHED NEUTRAL stroke while the icon keeps the accent', () => {
    const { container } = renderWithGds(
      <GdsMapPinBadge accent="ocean" icon="Location" label="x" state="approximate" />,
    );
    const pin = container.querySelector('svg.tabler-icon-gds-badge-shape-pin') as SVGSVGElement;
    expect(pin.getAttribute('stroke-dasharray')).toBe('3 2.5');
    expect(pin.getAttribute('stroke')).not.toContain('--gds-accent');
    const layerColors = [...container.querySelectorAll('[data-gds-badge-stack-layer]')]
      .map((el) => (el as HTMLElement).style.color);
    expect(layerColors.some((c) => c.includes('--gds-accent-ocean-base'))).toBe(true);
  });

  it('NO state repaints the accent fill of a filled pin — the principle itself', () => {
    for (const state of ['idle', 'hovered', 'selected'] as const) {
      const pin = pinOf(
        <GdsMapPinBadge accent="forest" icon="Location" label="x" filled state={state} />,
      );
      expect(pin.getAttribute('fill'), `state=${state}`).toContain('--gds-accent-forest-base');
    }
  });
});
