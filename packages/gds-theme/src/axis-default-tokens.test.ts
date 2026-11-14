import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GDS_MIN_TARGET_PX, resolveGdsAxisTokens } from './axes';
import { createBrandTheme, deriveBrandSemanticTokens } from './brand-tokens';
import { createPublicBrandTheme, gdsDarkPublicTheme, gdsTheme } from './theme';
import { contrastRatio } from './color-math';
import { GDS_GREY_WHEN_TEXT_ROLES } from './semantic-token-source';
import { getGdsDefaultLaneCssVariables, getGdsVibeThemeCssVariables } from './vibe-themes';

const stylesCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'styles.css'), 'utf8');
const START = '/* gds:axis-defaults:start';
const END = '/* gds:axis-defaults:end */';

function declarationsIn(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/(--gds-[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

const block = stylesCss.slice(stylesCss.indexOf(START), stylesCss.indexOf(END));
const declared = declarationsIn(block);
const axisDefaults = resolveGdsAxisTokens(undefined);

const brandOptions = {
  brandColors: { navy: '#0b223e', terracotta: '#ca8570', sage: '#90a287', cream: '#faf7f1', slate: '#434c59' },
  fonts: { display: 'Bogart', body: 'Garet' },
};

describe('default axis tokens in styles.css (#765)', () => {
  it('declares every resolveGdsAxisTokens(undefined) key with the identical value', () => {
    expect(block.length).toBeGreaterThan(0);
    for (const [name, value] of Object.entries(axisDefaults)) {
      expect(declared[name], name).toBe(value);
    }
  });

  it('uses the default preset focus ring, which --gds-focus-ring-color resolves through', () => {
    expect(axisDefaults['--gds-focus-ring-color']).toBe('var(--gds-focus-ring)');
    const light = getGdsVibeThemeCssVariables('default', 'light')['--gds-focus-ring'];
    const dark = getGdsVibeThemeCssVariables('default', 'dark')['--gds-focus-ring'];
    expect(declared['--gds-focus-ring']).toBe(`light-dark(${light}, ${dark})`);
  });

  it('declares no axis key a second time outside the generated block', () => {
    const outside = declarationsIn(stylesCss.replace(block, ''));
    for (const name of Object.keys(axisDefaults)) {
      expect(outside[name], name).toBeUndefined();
    }
  });

  it('gives the NavLink floor a resolved value: --gds-control-height-md is the minimum target size', () => {
    expect(gdsTheme.components.NavLink.styles.root.minHeight).toBe('var(--gds-control-height-md)');
    expect(declared['--gds-control-height-md']).toBe(`${GDS_MIN_TARGET_PX}px`);
  });
});

describe('default badge, brand and state roles in styles.css (#968)', () => {
  const lane = getGdsDefaultLaneCssVariables();
  const pair = (name: string) => {
    const dark = lane[`${name}-dark`] ?? lane[name];
    return lane[name] === dark ? lane[name] : `light-dark(${lane[name]}, ${dark})`;
  };
  const blockOf = (marker: string) => declarationsIn(stylesCss.slice(stylesCss.indexOf(`/* gds:${marker}:start`), stylesCss.indexOf(`/* gds:${marker}:end */`)));

  it('declares every default-lane badge role as its light/dark pair', () => {
    const badges = blockOf('badge-defaults');
    const names = Object.keys(lane).filter((name) => name.startsWith('--gds-badge-') && !name.endsWith('-dark'));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(badges[name], name).toBe(pair(name));
  });

  it('declares brand and state roles, with brand primary and state info on the muted grey', () => {
    const brand = blockOf('brand-defaults');
    for (const name of ['--gds-brand-primary', '--gds-brand-primary-fg', '--gds-brand-accent', '--gds-brand-accent-action-fg', '--gds-state-success', '--gds-state-danger', '--gds-state-info']) {
      expect(brand[name], name).toBe(pair(name));
    }
    for (const role of GDS_GREY_WHEN_TEXT_ROLES) {
      expect(lane[role]).toBe(lane['--gds-text-meta']);
      const dark = lane[`${role}-dark`];
      expect(contrastRatio(dark, lane['--gds-bg-card-dark'], lane['--gds-bg-card-dark']) ?? 0).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('never paints brand primary or state info with the body text colour', () => {
    for (const suffix of ['', '-dark']) {
      const text = lane[`--gds-text-body${suffix}`];
      for (const role of GDS_GREY_WHEN_TEXT_ROLES) {
        expect(lane[`${role}${suffix}`], `${role}${suffix}`).not.toBe(text);
        expect(contrastRatio(lane[`${role}${suffix}`], text, text) ?? 0, `${role}${suffix} vs body text`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('keeps brand primary legible as a fill and as text on the card in both schemes', () => {
    for (const suffix of ['', '-dark']) {
      const fill = lane[`--gds-brand-primary${suffix}`];
      const card = lane[`--gds-bg-card${suffix}`];
      expect(contrastRatio(lane[`--gds-brand-primary-fg${suffix}`], fill, fill) ?? 0).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(fill, card, card) ?? 0).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the default lane carries the default preset values (#970)', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const preset = getGdsVibeThemeCssVariables('default', scheme);
      for (const role of ['--gds-brand-primary', '--gds-state-info', '--gds-badge-solid-info']) {
        expect(scheme === 'light' ? lane[role] : lane[`${role}-dark`] ?? lane[role], `${role} ${scheme}`).toBe(preset[role]);
      }
    }
  });
});

describe('lanes without the preset runtime (#765)', () => {
  it('generic createBrandTheme carries every axis key and leaves its semantic roles as they were', () => {
    const { cssVariables } = createBrandTheme(brandOptions);
    for (const [name, value] of Object.entries(axisDefaults)) {
      expect(cssVariables[name], name).toBe(value);
    }
    const semanticKeys = Object.keys(cssVariables).filter((name) => !(name in axisDefaults));
    expect(semanticKeys.length).toBeGreaterThanOrEqual(Object.keys(deriveBrandSemanticTokens(brandOptions.brandColors)).length);
  });

  it('gdsTheme, gdsDarkPublicTheme and createPublicBrandTheme inject no axis tokens inline; the :root defaults serve them', () => {
    for (const lane of [gdsTheme, gdsDarkPublicTheme, createPublicBrandTheme(), createPublicBrandTheme({ editorialSerif: true })]) {
      expect((lane.other as { gdsCssVariables?: unknown } | undefined)?.gdsCssVariables).toBeUndefined();
    }
  });

  it('the flat lane keeps the default elevation tokens, like the flat presets do', () => {
    const flat = createPublicBrandTheme({ flatSurfaces: true });
    expect((flat.other as { gdsCssVariables?: unknown } | undefined)?.gdsCssVariables).toBeUndefined();
    expect(declared['--gds-elevation-card']).not.toBe('none');
    for (const preset of ['high-contrast', 'padel-africa', 'your-field'] as const) {
      expect(getGdsVibeThemeCssVariables(preset, 'light')['--gds-elevation-card']).not.toBe('none');
    }
  });
});
