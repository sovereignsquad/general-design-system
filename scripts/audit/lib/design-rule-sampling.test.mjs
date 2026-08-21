import { describe, expect, it } from 'vitest';
import {
  aggregateProportionCoverage, buildColorToClassLookup, classifyColorToProportionClass, normalizeColor,
} from './design-rule-sampling.mjs';

describe('normalizeColor (issue #649)', () => {
  it('passes plain rgb() through unchanged', () => {
    expect(normalizeColor('rgb(124, 58, 237)')).toBe('rgb(124, 58, 237)');
  });

  it('converts a color(srgb ...) serialization to rgb()', () => {
    expect(normalizeColor('color(srgb 0.486 0.227 0.929)')).toBe('rgb(124, 58, 237)');
  });

  it('converts a color(srgb ... / alpha) serialization to rgba()', () => {
    expect(normalizeColor('color(srgb 0.486 0.227 0.929 / 0.5)')).toBe('rgba(124, 58, 237, 0.5)');
  });

  it('converts a 6-digit hex literal to rgb()', () => {
    expect(normalizeColor('#7c3aed')).toBe('rgb(124, 58, 237)');
  });

  it('converts a 3-digit hex literal to rgb()', () => {
    expect(normalizeColor('#fff')).toBe('rgb(255, 255, 255)');
  });

  it('converts an 8-digit hex literal to rgba()', () => {
    expect(normalizeColor('#7c3aed80')).toBe('rgba(124, 58, 237, 0.5019607843137255)');
  });
});

describe('buildColorToClassLookup / classifyColorToProportionClass (issue #649)', () => {
  const cssVariables = {
    '--gds-bg-page': 'rgb(255, 255, 255)',
    '--gds-brand-primary': 'rgb(20, 20, 20)',
    '--gds-brand-accent': 'rgb(124, 58, 237)',
  };
  const classification = {
    dominant: ['bg.page'],
    secondary: ['brand.primary'],
    accent: ['brand.accent'],
  };

  it('classifies a known dominant color', () => {
    const lookup = buildColorToClassLookup(cssVariables, classification);
    expect(classifyColorToProportionClass('rgb(255, 255, 255)', lookup)).toBe('dominant');
  });

  it('classifies a known accent color, including via the color(srgb ...) serialization', () => {
    const lookup = buildColorToClassLookup(cssVariables, classification);
    expect(classifyColorToProportionClass('color(srgb 0.486 0.227 0.929)', lookup)).toBe('accent');
  });

  it('classifies an unrecognized color as unclassified', () => {
    const lookup = buildColorToClassLookup(cssVariables, classification);
    expect(classifyColorToProportionClass('rgb(1, 2, 3)', lookup)).toBe('unclassified');
  });

  it('matches a hex-declared role variable against a browser-rendered rgb() value', () => {
    // getGdsVibeThemeCssVariables returns hex literals; a captured element's
    // getComputedStyle(...).backgroundColor is always browser-serialized rgb().
    const hexVariables = { '--gds-brand-accent': '#7c3aed' };
    const lookup = buildColorToClassLookup(hexVariables, { dominant: [], secondary: [], accent: ['brand.accent'] });
    expect(classifyColorToProportionClass('rgb(124, 58, 237)', lookup)).toBe('accent');
  });
});

describe('aggregateProportionCoverage (issue #649)', () => {
  const lookup = new Map([
    ['rgb(255, 255, 255)', 'dominant'],
    ['rgb(20, 20, 20)', 'secondary'],
    ['rgb(124, 58, 237)', 'accent'],
  ]);

  it('returns the exact expected percentages for a synthetic fixture, one element per class', () => {
    const elements = [
      { area: 600, visible: true, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
      { area: 300, visible: true, backgroundColor: 'rgb(20, 20, 20)', colorClassLookup: lookup },
      { area: 100, visible: true, backgroundColor: 'rgb(124, 58, 237)', colorClassLookup: lookup },
    ];
    expect(aggregateProportionCoverage(elements)).toEqual({
      dominant: 60, secondary: 30, accent: 10, unclassified: 0,
    });
  });

  it('excludes an invisible element from both numerator and denominator', () => {
    const elements = [
      { area: 600, visible: true, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
      { area: 9000, visible: false, backgroundColor: 'rgb(124, 58, 237)', colorClassLookup: lookup },
    ];
    expect(aggregateProportionCoverage(elements)).toEqual({
      dominant: 100, secondary: 0, accent: 0, unclassified: 0,
    });
  });

  it('excludes a transparent-background element from the denominator, not just the numerator', () => {
    const elements = [
      { area: 600, visible: true, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
      { area: 9000, visible: true, backgroundColor: 'rgba(0, 0, 0, 0)', colorClassLookup: lookup },
    ];
    expect(aggregateProportionCoverage(elements)).toEqual({
      dominant: 100, secondary: 0, accent: 0, unclassified: 0,
    });
  });

  it('excludes a background-image-painted element from the denominator', () => {
    const elements = [
      { area: 600, visible: true, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
      { area: 9000, visible: true, backgroundColor: 'rgb(1, 2, 3)', hasBackgroundImage: true, colorClassLookup: lookup },
    ];
    expect(aggregateProportionCoverage(elements)).toEqual({
      dominant: 100, secondary: 0, accent: 0, unclassified: 0,
    });
  });

  it('classifies an unrecognized solid color as unclassified', () => {
    const elements = [
      { area: 600, visible: true, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
      { area: 400, visible: true, backgroundColor: 'rgb(9, 9, 9)', colorClassLookup: lookup },
    ];
    expect(aggregateProportionCoverage(elements)).toEqual({
      dominant: 60, secondary: 0, accent: 0, unclassified: 40,
    });
  });

  it('the four percentages always sum to exactly 100', () => {
    const elements = [
      { area: 333, visible: true, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
      { area: 333, visible: true, backgroundColor: 'rgb(20, 20, 20)', colorClassLookup: lookup },
      { area: 334, visible: true, backgroundColor: 'rgb(124, 58, 237)', colorClassLookup: lookup },
    ];
    const result = aggregateProportionCoverage(elements);
    expect(result.dominant + result.secondary + result.accent + result.unclassified).toBe(100);
  });

  it('throws when every element is excluded (zero visible area)', () => {
    expect(() => aggregateProportionCoverage([
      { area: 100, visible: false, backgroundColor: 'rgb(255, 255, 255)', colorClassLookup: lookup },
    ])).toThrow(/No visible elements captured/);
  });

  it('throws for an empty input', () => {
    expect(() => aggregateProportionCoverage([])).toThrow(/No visible elements captured/);
  });
});
