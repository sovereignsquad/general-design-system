import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  getGdsVibeThemes, resolveGdsColorProportionProfile, resolveGdsTypeScaleProfile,
  resolveGdsColorHarmonyProfile, NAMED_TYPE_SCALE_RATIO_LABELS,
} from '@sovereignsquad/gds-theme';
import { GdsDesignRuleProfilePanel } from './GdsDesignRuleProfilePanel';
import { designRuleCoverageByPreset } from './generated-design-rule-coverage';
import { renderWithGds } from '../../../test-utils/render';

const ALL_PRESET_IDS = getGdsVibeThemes().map((v) => v.id);

describe('GdsDesignRuleProfilePanel (issue #651)', () => {
  it('renders without error for every shipped preset', () => {
    for (const preset of ALL_PRESET_IDS) {
      const { unmount } = renderWithGds(<GdsDesignRuleProfilePanel preset={preset} />);
      unmount();
    }
  });

  it('shows the real declared role counts for a known preset (issue #644), never a fabricated number', () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="default" />);
    const declared = resolveGdsColorProportionProfile('default');
    expect(screen.getAllByText(new RegExp(`${declared.classification.dominant.length} dominant`)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`${declared.classification.secondary.length} secondary`)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`${declared.classification.accent.length} accent roles`)).length).toBeGreaterThan(0);
  });

  it('shows the real measured percentages for a known preset (issue #649/#650), never a fabricated number', () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="default" />);
    const measured = designRuleCoverageByPreset.default!;
    expect(screen.getAllByText(new RegExp(`${measured.dominant}% dominant`)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`${measured.unclassified}% unclassified`)).length).toBeGreaterThan(0);
  });

  it('shows the correct type-scale and color-harmony badges for a known preset (issue #645/#646)', () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="default" />);
    const typeScale = resolveGdsTypeScaleProfile('default');
    const harmony = resolveGdsColorHarmonyProfile('default');
    expect(screen.getByText(`Type scale: ${typeScale.ratio} (${NAMED_TYPE_SCALE_RATIO_LABELS[typeScale.ratio]})`)).toBeInTheDocument();
    expect(screen.getByText(`Color harmony: ${harmony}`)).toBeInTheDocument();
  });

  it("labels the declared chart's summary as declared/intended, never implying it is the measured value", () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="default" />);
    expect(screen.getAllByText(/^Declared\/intended token-role classification/).length).toBeGreaterThan(0);
  });

  it("labels the measured chart's summary as measured/rendered, never implying it is the declared value", () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="default" />);
    expect(screen.getAllByText(/^Measured\/rendered pixel-area coverage/).length).toBeGreaterThan(0);
  });

  it('renders every declared numeric claim inside its own summary text (accessibility: screen-reader parity)', () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="editorial" />);
    const declared = resolveGdsColorProportionProfile('editorial');
    const summary = screen.getAllByText(/^Declared\/intended/)[0];
    expect(summary.textContent).toContain(String(declared.classification.dominant.length));
    expect(summary.textContent).toContain(String(declared.classification.secondary.length));
    expect(summary.textContent).toContain(String(declared.classification.accent.length));
  });

  it('renders every measured numeric claim inside its own summary text (accessibility: screen-reader parity)', () => {
    renderWithGds(<GdsDesignRuleProfilePanel preset="editorial" />);
    const measured = designRuleCoverageByPreset.editorial!;
    const summary = screen.getAllByText(/^Measured\/rendered/)[0];
    expect(summary.textContent).toContain(`${measured.dominant}%`);
    expect(summary.textContent).toContain(`${measured.secondary}%`);
    expect(summary.textContent).toContain(`${measured.accent}%`);
    expect(summary.textContent).toContain(`${measured.unclassified}%`);
  });

  it('renders a "no measurement recorded yet" state, not a blank panel, for a preset absent from the generated coverage module', async () => {
    // Simulates a future preset not yet swept by issue #649's audit (all 25 real presets
    // currently have coverage) -- mocks only the generated data module, not the real
    // #644-#646 resolvers, which still need a real, valid preset id to not throw.
    vi.doMock('./generated-design-rule-coverage', () => ({ designRuleCoverageByPreset: {} }));
    vi.resetModules();
    const { GdsDesignRuleProfilePanel: PanelWithMock } = await import('./GdsDesignRuleProfilePanel');
    renderWithGds(<PanelWithMock preset="default" />);
    expect(screen.getAllByText(/no measurement recorded yet/).length).toBeGreaterThan(0);
    vi.doUnmock('./generated-design-rule-coverage');
    vi.resetModules();
  });
});
