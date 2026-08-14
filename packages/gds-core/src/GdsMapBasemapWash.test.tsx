import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsMapBasemapWash, GDS_MAP_WASH_TINT, GDS_MAP_WASH_SATURATION } from './GdsMapBasemapWash';

describe('GdsMapBasemapWash (#549)', () => {
  it('wraps its children and paints a wash layer above them', () => {
    const { container } = renderWithGds(
      <GdsMapBasemapWash><div data-testid="tiles">tiles</div></GdsMapBasemapWash>,
    );
    const host = container.querySelector('[data-gds-map-basemap-wash-host]') as HTMLElement;
    const wash = container.querySelector('[data-gds-map-basemap-wash]') as HTMLElement;
    expect(host).not.toBeNull();
    expect(wash).not.toBeNull();
    expect(host.style.position).toBe('relative');
    // The wash follows its content in source order, so it paints above the tiles.
    expect(host.lastElementChild).toBe(wash);
  });

  it('reads the ACTIVE theme canvas as a live var — never a resolved literal', () => {
    const { container } = renderWithGds(<GdsMapBasemapWash><div /></GdsMapBasemapWash>);
    const wash = container.querySelector('[data-gds-map-basemap-wash]') as HTMLElement;
    expect(wash.style.background).toContain('var(--gds-vibe-canvas, var(--gds-bg-canvas))');
    expect(wash.style.background).toContain(`${Math.round(GDS_MAP_WASH_TINT * 100)}%`);
    expect(wash.style.backdropFilter).toBe(`saturate(${GDS_MAP_WASH_SATURATION})`);
  });

  it('never intercepts map interaction or enters the accessibility tree', () => {
    const { container } = renderWithGds(<GdsMapBasemapWash><div /></GdsMapBasemapWash>);
    const wash = container.querySelector('[data-gds-map-basemap-wash]') as HTMLElement;
    expect(wash.style.pointerEvents).toBe('none');
    expect(wash.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders nothing without children, so a state block can never be washed', () => {
    const { container } = renderWithGds(<GdsMapBasemapWash />);
    expect(container.querySelector('[data-gds-map-basemap-wash]')).toBeNull();
    expect(container.querySelector('[data-gds-map-basemap-wash-host]')).toBeNull();
  });
});
