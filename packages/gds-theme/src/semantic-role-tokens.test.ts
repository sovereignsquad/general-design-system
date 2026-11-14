import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { getGdsContrastRatio } from './contrast';

// #451: the base gdsTheme must define the structural semantic-role token layer
// in styles.css, and its readable-text pairs must meet the documented WCAG AA
// contrast contract (docs/SEMANTIC_ROLE_TOKENS.md). These values mirror the
// contrast-gated `default` theme so verify:token-contrast-scoring polices them.

const stylesCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'styles.css'), 'utf8');

describe('default semantic-role token layer (#451)', () => {
  const requiredRoles = [
    '--gds-bg-canvas',
    '--gds-bg-page',
    '--gds-bg-surface',
    '--gds-bg-card',
    '--gds-bg-inverse',
    '--gds-border-card',
    '--gds-text-body',
    '--gds-text-primary',
    '--gds-text-meta',
    '--gds-text-secondary',
    '--gds-text-on-inverse',
  ];

  it.each(requiredRoles)('declares %s at :root', (role) => {
    // Anchored to a declaration (`<role>:`), not merely a `var(<role>)` reference.
    expect(stylesCss).toMatch(new RegExp(`${role}\\s*:`));
  });

  it('declares brand and state roles only in the generated default-lane block (#968)', () => {
    // Presets and createBrandTheme override them inline; the :root block serves lanes without a preset.
    const start = stylesCss.indexOf('/* gds:brand-defaults:start');
    const end = stylesCss.indexOf('/* gds:brand-defaults:end */');
    expect(start).toBeGreaterThan(-1);
    const outside = stylesCss.slice(0, start) + stylesCss.slice(end);
    expect(outside).not.toMatch(/^\s*--gds-(brand|state)-[\w-]+\s*:/m);
  });
});

describe('default semantic-role contrast contract (#451)', () => {
  // [foreground, background, minRatio] — light and dark, per docs/SEMANTIC_ROLE_TOKENS.md.
  const readablePairs: Array<[string, string, string, number]> = [
    ['light text-body on surface', '#111827', '#ffffff', 4.5],
    ['light text-body on canvas', '#111827', '#f8fafc', 4.5],
    ['light text-meta on surface', '#64748b', '#ffffff', 4.5],
    ['light text-meta on canvas', '#64748b', '#f8fafc', 4.5],
    ['on-inverse on inverse', '#f8fafc', '#111827', 4.5],
    ['dark text-body on surface', '#f8fafc', '#1e293b', 4.5],
    ['dark text-body on canvas', '#f8fafc', '#0f172a', 4.5],
    ['dark text-meta on surface', '#cbd5e1', '#1e293b', 4.5],
    ['dark text-meta on canvas', '#cbd5e1', '#0f172a', 4.5],
  ];

  it.each(readablePairs)('%s meets WCAG AA', (_label, fg, bg, min) => {
    expect(getGdsContrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
