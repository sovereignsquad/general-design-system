import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsPictogramSystemReference } from './GdsPictogramSystemReference';
import {
  GdsPictogram, gdsActivityPictograms, getGdsActivityPictogramKeys, gdsPictogramUsageRules,
  GDS_PICTOGRAM_HERO_LAYERS, GDS_PICTOGRAM_SCALE_PX, GDS_PICTOGRAM_TREATMENT_SCALE,
} from './pictograms';
import { GdsMapPinBadge } from './GdsMapPinBadge';

describe('GdsPictogramSystemReference (issue 708)', () => {
  it('renders the reference panel root', () => {
    const { container } = renderWithGds(<GdsPictogramSystemReference />);
    expect(container.querySelector('[data-gds-pictogram-system-reference]')).not.toBeNull();
  });

  it('renders every shipped pictogram label, derived from the registry rather than hardcoded', () => {
    const { getAllByText } = renderWithGds(<GdsPictogramSystemReference />);
    for (const key of getGdsActivityPictogramKeys()) {
      expect(getAllByText(gdsActivityPictograms.pictograms[key].label).length).toBeGreaterThan(0);
    }
  });

  it('renders the full treatment × pictogram cross-product (every treatment for every pictogram)', () => {
    const { container } = renderWithGds(<GdsPictogramSystemReference />);
    const keys = getGdsActivityPictogramKeys();
    const treatments = Object.keys(GDS_PICTOGRAM_TREATMENT_SCALE);
    for (const treatment of treatments) {
      const marks = container.querySelectorAll(`svg[data-gds-pictogram-treatment="${treatment}"]`);
      expect(marks.length).toBeGreaterThanOrEqual(keys.length);
    }
  });

  it('renders the full state × pictogram cross-product (every state for every pictogram)', () => {
    const { container } = renderWithGds(<GdsPictogramSystemReference />);
    const keys = getGdsActivityPictogramKeys();
    for (const state of ['default', 'hover', 'selected', 'disabled']) {
      const marks = container.querySelectorAll(`svg[data-gds-pictogram-state="${state}"]`);
      expect(marks.length).toBeGreaterThanOrEqual(keys.length);
    }
  });

  it('renders one hero-layer table row per GDS_PICTOGRAM_HERO_LAYERS entry', () => {
    const { getByText } = renderWithGds(<GdsPictogramSystemReference />);
    expect(getByText(`${GDS_PICTOGRAM_HERO_LAYERS.length} layers, scale/opacity only`, { exact: false })).toBeTruthy();
  });

  it('renders one usage-rule row per gdsPictogramUsageRules entry', () => {
    const { getByText } = renderWithGds(<GdsPictogramSystemReference />);
    for (const rule of gdsPictogramUsageRules) {
      expect(getByText(rule.rule)).toBeTruthy();
    }
  });

  it('derives its scale count from GDS_PICTOGRAM_SCALE_PX rather than a hardcoded number', () => {
    const { getByText } = renderWithGds(<GdsPictogramSystemReference />);
    const scaleCount = Object.keys(GDS_PICTOGRAM_SCALE_PX).length;
    expect(getByText(`${scaleCount} sizes, stroke tuned per size`, { exact: false })).toBeTruthy();
  });
});

describe('GdsPictogram composition with GdsMapPinBadge (issue 708)', () => {
  it('renders inside a map pin and adopts the host accent color through the ReactNode icon slot', () => {
    const { container } = renderWithGds(
      <GdsMapPinBadge
        accent="ocean"
        icon={<GdsPictogram pictogram="soccer" treatment="pin" />}
        label="Riverside Field — soccer"
      />,
    );
    const pictogramSvg = container.querySelector('svg[data-gds-pictogram="soccer"]');
    expect(pictogramSvg).not.toBeNull();
    expect(container.querySelector('[data-gds-badge-shape="pin"], svg')).not.toBeNull();
  });
});
