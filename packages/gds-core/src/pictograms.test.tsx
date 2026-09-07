import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGdsDevWarnings } from '@sovereignsquad/gds-theme';
import { renderWithGds } from '../../../test-utils/render';
import {
  GdsPictogram, createGdsPictogramFamily, gdsActivityPictograms, getGdsActivityPictogramKeys,
  isGdsActivityPictogramKey, resolveGdsActivityPictogramLabel, gdsPictogramUsageRules,
  GDS_PICTOGRAM_GRID, GDS_PICTOGRAM_SCALE_PX, GDS_PICTOGRAM_STROKE_BY_SCALE,
  GDS_PICTOGRAM_TREATMENT_SCALE, GDS_PICTOGRAM_HERO_LAYERS, GDS_PICTOGRAM_DISABLED_OPACITY,
  type GdsPictogramFamily, type GdsPictogramTreatment,
} from './pictograms';
import { es } from './locales/es';

const rawHexPattern = /#[0-9a-fA-F]{3,8}\b/;

describe('gdsActivityPictograms (issue 708)', () => {
  it('ships exactly the 11 governed activity keys', () => {
    expect(getGdsActivityPictogramKeys().sort()).toEqual([
      'athletics', 'baseball', 'basketball', 'camps', 'flag-football', 'hockey',
      'lacrosse', 'martial-arts', 'soccer', 'swimming', 'tennis',
    ]);
  });

  it('every shipped drawing satisfies the family rules: single valid path, kebab-case key, non-empty label', () => {
    for (const key of getGdsActivityPictogramKeys()) {
      const definition = gdsActivityPictograms.pictograms[key];
      expect(definition.key).toBe(key);
      expect(definition.label.trim().length).toBeGreaterThan(0);
      expect(definition.path).toMatch(/^\s*[Mm]/);
      // The full injection-guard charset — no letters outside valid path commands, no markup.
      expect(definition.path).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]+$/);
      // Re-validating each real path through the public constructor proves it is accepted,
      // not merely shaped like a string that matches a regex here.
      expect(() => createGdsPictogramFamily({ id: 'probe', pictograms: { [key]: definition } })).not.toThrow();
    }
  });

  it('isGdsActivityPictogramKey recognizes shipped keys and rejects unknown ones', () => {
    expect(isGdsActivityPictogramKey('soccer')).toBe(true);
    expect(isGdsActivityPictogramKey('flag-football')).toBe(true);
    expect(isGdsActivityPictogramKey('cricket')).toBe(false);
    expect(isGdsActivityPictogramKey('')).toBe(false);
  });
});

describe('createGdsPictogramFamily validation (zero/one/many)', () => {
  it('rejects an empty family (zero case)', () => {
    expect(() => createGdsPictogramFamily({ id: 'empty', pictograms: {} })).toThrow(/at least one pictogram/);
  });

  it('accepts a one-entry family (one case)', () => {
    const family = createGdsPictogramFamily({
      id: 'solo',
      pictograms: { widget: { key: 'widget', label: 'Widget', path: 'M3 3L21 21' } },
    });
    expect(Object.keys(family.pictograms)).toEqual(['widget']);
  });

  it('accepts the shipped 11-entry family (many case)', () => {
    expect(() => createGdsPictogramFamily({ ...gdsActivityPictograms })).not.toThrow();
  });

  it('rejects a definition key that disagrees with its map key', () => {
    expect(() => createGdsPictogramFamily({
      id: 'mismatch',
      pictograms: { a: { key: 'b', label: 'A', path: 'M1 1L2 2' } },
    })).toThrow(/must match map key/);
  });

  it('rejects a non-kebab-case key', () => {
    expect(() => createGdsPictogramFamily({
      id: 'bad-key',
      pictograms: { Soccer: { key: 'Soccer', label: 'Soccer', path: 'M1 1L2 2' } },
    })).toThrow(/kebab-case/);
  });

  it('rejects a blank label', () => {
    expect(() => createGdsPictogramFamily({
      id: 'blank-label',
      pictograms: { widget: { key: 'widget', label: '   ', path: 'M1 1L2 2' } },
    })).toThrow(/non-empty label/);
  });

  it('rejects a fallbackKey that does not exist in the family', () => {
    expect(() => createGdsPictogramFamily<string>({
      id: 'bad-fallback',
      fallbackKey: 'missing',
      pictograms: { widget: { key: 'widget', label: 'Widget', path: 'M1 1L2 2' } },
    })).toThrow(/fallbackKey "missing" must exist/);
  });

  it('accepts a valid fallbackKey', () => {
    const family = createGdsPictogramFamily({
      id: 'with-fallback',
      fallbackKey: 'widget',
      pictograms: { widget: { key: 'widget', label: 'Widget', path: 'M1 1L2 2' } },
    });
    expect(family.fallbackKey).toBe('widget');
  });

  describe('injection guard', () => {
    it('rejects path data carrying markup', () => {
      expect(() => createGdsPictogramFamily({
        id: 'markup',
        pictograms: { widget: { key: 'widget', label: 'Widget', path: 'M1 1L2 2<script>alert(1)</script>' } },
      })).toThrow(/not valid SVG path data/);
    });

    it('rejects path data carrying an event-handler-shaped string', () => {
      expect(() => createGdsPictogramFamily({
        id: 'handler',
        pictograms: { widget: { key: 'widget', label: 'Widget', path: 'javascript:alert(1)' } },
      })).toThrow(/not valid SVG path data/);
    });

    it('rejects an empty path', () => {
      expect(() => createGdsPictogramFamily({
        id: 'empty-path',
        pictograms: { widget: { key: 'widget', label: 'Widget', path: '' } },
      })).toThrow(/not valid SVG path data/);
    });

    it('rejects path data with no leading moveto command', () => {
      expect(() => createGdsPictogramFamily({
        id: 'no-moveto',
        pictograms: { widget: { key: 'widget', label: 'Widget', path: 'L1 1L2 2' } },
      })).toThrow(/not valid SVG path data/);
    });
  });
});

describe('GdsPictogram rendering', () => {
  it('renders exactly one <path>, fill="none", stroke="currentColor", round caps/joins, and the scale stroke width', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="soccer" scale="md" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${GDS_PICTOGRAM_GRID} ${GDS_PICTOGRAM_GRID}`);
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-linecap')).toBe('round');
    expect(svg.getAttribute('stroke-linejoin')).toBe('round');
    expect(svg.getAttribute('stroke-width')).toBe(String(GDS_PICTOGRAM_STROKE_BY_SCALE.md));
    expect(container.querySelectorAll('svg path')).toHaveLength(1);
  });

  it('a fillMode: "fill" pictogram renders fill="currentColor", stroke="none", and no stroke-width/linecap/linejoin', () => {
    expect(gdsActivityPictograms.pictograms.lacrosse.fillMode).toBe('fill');
    const { container } = renderWithGds(<GdsPictogram pictogram="lacrosse" scale="md" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('stroke')).toBe('none');
    expect(svg.getAttribute('stroke-width')).toBeNull();
    expect(svg.getAttribute('stroke-linecap')).toBeNull();
    expect(svg.getAttribute('stroke-linejoin')).toBeNull();
    expect(container.querySelectorAll('svg path')).toHaveLength(1);
  });

  it('exactly two shipped pictograms use fillMode: "fill" (lacrosse, martial-arts); the other nine default to stroke', () => {
    const fillKeys = getGdsActivityPictogramKeys().filter((key) => gdsActivityPictograms.pictograms[key].fillMode === 'fill');
    expect(fillKeys.sort()).toEqual(['lacrosse', 'martial-arts']);
    const strokeKeys = getGdsActivityPictogramKeys().filter((key) => gdsActivityPictograms.pictograms[key].fillMode !== 'fill');
    expect(strokeKeys).toHaveLength(9);
  });

  it.each(Object.keys(GDS_PICTOGRAM_SCALE_PX) as Array<keyof typeof GDS_PICTOGRAM_SCALE_PX>)(
    'renders %s at its own pixel size and stroke width',
    (scale) => {
      const { container } = renderWithGds(<GdsPictogram pictogram="hockey" scale={scale} />);
      const svg = container.querySelector('svg') as SVGSVGElement;
      expect(svg.getAttribute('width')).toBe(String(GDS_PICTOGRAM_SCALE_PX[scale]));
      expect(svg.getAttribute('height')).toBe(String(GDS_PICTOGRAM_SCALE_PX[scale]));
      expect(svg.getAttribute('stroke-width')).toBe(String(GDS_PICTOGRAM_STROKE_BY_SCALE[scale]));
    },
  );

  it('defaults each treatment to its own scale, and an explicit scale overrides it', () => {
    for (const [treatment, scale] of Object.entries(GDS_PICTOGRAM_TREATMENT_SCALE)) {
      const { container } = renderWithGds(
        <GdsPictogram pictogram="camps" treatment={treatment as GdsPictogramTreatment} />,
      );
      const svg = container.querySelector('svg') as SVGSVGElement;
      expect(svg.getAttribute('width')).toBe(String(GDS_PICTOGRAM_SCALE_PX[scale]));
    }
    const { container } = renderWithGds(<GdsPictogram pictogram="camps" treatment="list" scale="lg" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('width')).toBe(String(GDS_PICTOGRAM_SCALE_PX.lg));
  });

  it('the drawing never changes across treatments — identical path data', () => {
    const paths = (['list', 'detail', 'hero', 'pin'] as GdsPictogramTreatment[]).map((treatment) => {
      const { container } = renderWithGds(<GdsPictogram pictogram="lacrosse" treatment={treatment} />);
      return container.querySelector('svg path')?.getAttribute('d');
    });
    expect(new Set(paths).size).toBe(1);
    expect(paths[0]).toBe(gdsActivityPictograms.pictograms.lacrosse.path);
  });

  it('hero treatment renders the bounded layer recipe as multiple copies of the same path, never a second color', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="basketball" treatment="hero" />);
    const paths = container.querySelectorAll('svg path');
    expect(paths).toHaveLength(GDS_PICTOGRAM_HERO_LAYERS.length);
    const dValues = new Set(Array.from(paths).map((p) => p.getAttribute('d')));
    expect(dValues.size).toBe(1);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.outerHTML).not.toMatch(rawHexPattern);
  });
});

describe('GdsPictogram interaction state', () => {
  it('default and hover both render currentColor — hover changes no drawing color', () => {
    const { container: defaultContainer } = renderWithGds(<GdsPictogram pictogram="tennis" state="default" />);
    const { container: hoverContainer } = renderWithGds(<GdsPictogram pictogram="tennis" state="hover" />);
    const defaultSvg = defaultContainer.querySelector('svg') as SVGSVGElement;
    const hoverSvg = hoverContainer.querySelector('svg') as SVGSVGElement;
    expect(defaultSvg.getAttribute('stroke')).toBe('currentColor');
    expect(hoverSvg.getAttribute('stroke')).toBe('currentColor');
  });

  it('selected resolves color from the semantic accent token role, not a raw hex', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="tennis" state="selected" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('stroke')).toContain('var(--gds-accent');
    expect(svg.getAttribute('stroke')).not.toMatch(rawHexPattern);
  });

  it('disabled applies the reduced-opacity treatment and keeps the neutral stroke color', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="tennis" state="disabled" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.style.opacity).toBe(String(GDS_PICTOGRAM_DISABLED_OPACITY));
  });

  it('no rendered attribute for any state carries a raw hex color', () => {
    for (const state of ['default', 'hover', 'selected', 'disabled'] as const) {
      const { container } = renderWithGds(<GdsPictogram pictogram="soccer" state={state} />);
      const svg = container.querySelector('svg') as SVGSVGElement;
      expect(svg.outerHTML).not.toMatch(rawHexPattern);
    }
  });

  it('interaction state resolves through fill, not stroke, for a fillMode: "fill" pictogram', () => {
    const { container: defaultContainer } = renderWithGds(<GdsPictogram pictogram="lacrosse" state="default" />);
    const { container: selectedContainer } = renderWithGds(<GdsPictogram pictogram="lacrosse" state="selected" />);
    const { container: disabledContainer } = renderWithGds(<GdsPictogram pictogram="lacrosse" state="disabled" />);
    const defaultSvg = defaultContainer.querySelector('svg') as SVGSVGElement;
    const selectedSvg = selectedContainer.querySelector('svg') as SVGSVGElement;
    const disabledSvg = disabledContainer.querySelector('svg') as SVGSVGElement;
    expect(defaultSvg.getAttribute('fill')).toBe('currentColor');
    expect(defaultSvg.getAttribute('stroke')).toBe('none');
    expect(selectedSvg.getAttribute('fill')).toContain('var(--gds-accent');
    expect(selectedSvg.getAttribute('fill')).not.toMatch(rawHexPattern);
    expect(selectedSvg.getAttribute('stroke')).toBe('none');
    expect(disabledSvg.getAttribute('fill')).toBe('currentColor');
    expect(disabledSvg.style.opacity).toBe(String(GDS_PICTOGRAM_DISABLED_OPACITY));
  });
});

describe('GdsPictogram accessibility', () => {
  it('is decorative (aria-hidden) by default with no label', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="hockey" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.hasAttribute('role')).toBe(false);
    expect(svg.hasAttribute('aria-label')).toBe(false);
  });

  it('becomes informative (role="img" + aria-label) when a label is supplied', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="hockey" label="Hockey" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Hockey');
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
  });

  it('decorative={false} with no label falls back to the resolved default label', () => {
    const { container } = renderWithGds(<GdsPictogram pictogram="hockey" decorative={false} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Hockey');
  });

  it('resolves the shipped family default label through the active locale', () => {
    const { container } = renderWithGds(
      <GdsPictogram pictogram="soccer" decorative={false} />,
      { locale: 'es', messages: es },
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('aria-label')).toBe('Fútbol');
  });

  it('resolveGdsActivityPictogramLabel falls back to the given fallback for a non-shipped key', () => {
    const t = (_id: string, defaultMessage: string) => defaultMessage;
    expect(resolveGdsActivityPictogramLabel('cricket', t, 'Cricket')).toBe('Cricket');
  });
});

describe('GdsPictogram fallback behavior', () => {
  beforeEach(() => {
    resetGdsDevWarnings();
  });

  it('renders a layout-stable empty slot with no <path> when no fallbackKey is set, and warns once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = renderWithGds(<GdsPictogram pictogram="not-a-real-key" scale="md" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('width')).toBe(String(GDS_PICTOGRAM_SCALE_PX.md));
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelectorAll('svg path')).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // A second miss on the same family logs no further warning (fires once).
    renderWithGds(<GdsPictogram pictogram="also-not-real" scale="md" />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('renders the fallbackKey pictogram when the family declares one', () => {
    const family: GdsPictogramFamily = createGdsPictogramFamily({
      id: 'with-fallback-render',
      fallbackKey: 'widget',
      pictograms: { widget: { key: 'widget', label: 'Widget', path: 'M3 3L21 21' } },
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = renderWithGds(<GdsPictogram family={family} pictogram="missing" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(container.querySelectorAll('svg path')).toHaveLength(1);
    expect(svg.querySelector('path')?.getAttribute('d')).toBe('M3 3L21 21');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('a custom family renders its own English label without going through the shipped locale switch', () => {
    const family: GdsPictogramFamily = createGdsPictogramFamily({
      id: 'consumer-family',
      pictograms: { widget: { key: 'widget', label: 'Widget Sport', path: 'M3 3L21 21' } },
    });
    const { container } = renderWithGds(<GdsPictogram family={family} pictogram="widget" decorative={false} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('aria-label')).toBe('Widget Sport');
  });
});

describe('gdsPictogramUsageRules', () => {
  it('carries the documented constraints from the source guidelines', () => {
    const rules = gdsPictogramUsageRules.map((r) => r.rule).join(' ');
    expect(rules).toMatch(/One icon per card/);
    expect(rules).toMatch(/never a stock photo/);
    expect(rules).toMatch(/Never add labels inside the pin/);
    expect(rules).toMatch(/scale and opacity/i);
    expect(rules).toMatch(/no new hues/i);
  });

  it('every rule names a real treatment or the family scope', () => {
    const validTreatments = new Set(['list', 'detail', 'hero', 'pin', 'family']);
    for (const rule of gdsPictogramUsageRules) {
      expect(validTreatments.has(rule.treatment)).toBe(true);
    }
  });
});
