import { describe, expect, it } from 'vitest';
import { checkGdsContrast } from './contrast';
import { getGdsThemePresets } from './theme-presets';
import { deriveVibeSemanticCssVariables, getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';

describe('vibe-theme / preset-catalog parity', () => {
  it('registers a vibe theme for every catalog preset id, and no orphans', () => {
    const presetIds = getGdsThemePresets()
      .map((preset) => preset.id)
      .sort();
    const vibeIds = getGdsVibeThemes()
      .map((vibe) => vibe.id)
      .sort();

    expect(vibeIds).toEqual(presetIds);
  });
});

const SEMANTIC_ROLE_BASE_NAMES = [
  '--gds-brand-primary',
  '--gds-brand-primary-pressed',
  '--gds-brand-accent',
  '--gds-brand-accent-action',
  '--gds-accent',
  '--gds-support',
  '--gds-bg-canvas',
  '--gds-bg-card',
  '--gds-bg-page',
  '--gds-bg-surface',
  '--gds-bg-inverse',
  '--gds-border-card',
  '--gds-text-body',
  '--gds-text-meta',
  '--gds-text-primary',
  '--gds-text-secondary',
  '--gds-text-on-inverse',
  '--gds-nav-inactiveOnInverse',
  '--gds-price',
  '--gds-star',
  '--gds-state-success',
  '--gds-state-warning',
  '--gds-state-danger',
  '--gds-state-info',
  '--gds-badge-attention',
  '--gds-badge-validation',
  '--gds-badge-info',
  '--gds-badge-urgencyBg',
  '--gds-bg-info-tag',
  '--gds-brand-accent-tint',
  '--gds-focus-ring',
  '--gds-control-disabledBg',
  '--gds-control-disabledText',
];

describe('vibe-theme semantic role tokens (badge-system foundation)', () => {
  it('gives every one of the 25 presets a full semantic role variable set in both light and dark mode', () => {
    const presetIds = getGdsThemePresets().map((preset) => preset.id);
    expect(presetIds.length).toBe(25);

    for (const id of presetIds) {
      for (const mode of ['light', 'dark'] as const) {
        const variables = getGdsVibeThemeCssVariables(id, mode);
        for (const base of SEMANTIC_ROLE_BASE_NAMES) {
          expect(variables[base], `${id} (${mode}) missing ${base}`).toBeTruthy();
        }
      }
    }
  });

  it('clears WCAG AA on the badge-critical pairs for every preset, in both modes', () => {
    for (const vibe of getGdsVibeThemes()) {
      for (const mode of ['light', 'dark'] as const) {
        const variables = getGdsVibeThemeCssVariables(vibe.id, mode);
        const bgSurface = variables['--gds-bg-surface'];
        const bgInverse = variables['--gds-bg-inverse'];

        const textPairs: Array<[string, string, string]> = [
          ['text-on-inverse on bg-inverse', variables['--gds-text-on-inverse'], bgInverse],
        ];
        const nonTextPairs: Array<[string, string, string]> = [
          ['state-danger on bg-surface', variables['--gds-state-danger'], bgSurface],
        ];

        for (const [label, fg, bg] of textPairs) {
          const result = checkGdsContrast(fg, bg);
          expect(result.passes, `${vibe.id} (${mode}) ${label}: ${fg} on ${bg} = ${result.ratio}:1`).toBe(true);
        }
        for (const [label, fg, bg] of nonTextPairs) {
          const result = checkGdsContrast(fg, bg, { size: 'large' });
          expect(result.passes, `${vibe.id} (${mode}) ${label}: ${fg} on ${bg} = ${result.ratio}:1`).toBe(true);
        }
      }
    }
  });

  it('does not touch class-usa/gold-athlete\'s existing hand-authored values', () => {
    const classUsaLight = getGdsVibeThemeCssVariables('class-usa', 'light');
    const goldAthleteLight = getGdsVibeThemeCssVariables('gold-athlete', 'light');

    // class-usa v2 re-base (issue 536): navy anchor moved #0b223e -> #0f2c4a.
    expect(classUsaLight['--gds-brand-primary']).toBe('#0f2c4a');
    expect(classUsaLight['--gds-state-danger']).toBe('#b3261e');
    expect(goldAthleteLight['--gds-brand-primary']).toBe('#12161c');
    expect(goldAthleteLight['--gds-state-danger']).toBe('#b3261e');
  });

  it('splits class-usa\'s accent light/dark by ramp anchor, not a reused value (v2 re-base, issue 536)', () => {
    const classUsaLight = getGdsVibeThemeCssVariables('class-usa', 'light');
    const classUsaDark = getGdsVibeThemeCssVariables('class-usa', 'dark');

    expect(classUsaLight['--gds-accent']).toBe('#c24a0a');
    expect(classUsaDark['--gds-accent']).toBe('#f5793b');
    expect(classUsaLight['--gds-bg-canvas']).toBe('#faf7f1');
    // Dark canvas is neutral charcoal, not a navy-dark tint.
    expect(classUsaDark['--gds-bg-canvas']).toBe('#14171c');
  });

  it('derives a deterministic, complete variable set for a preset with no hand-authored one', () => {
    const forest = getGdsVibeThemes().find((vibe) => vibe.id === 'forest');
    expect(forest).toBeTruthy();

    const derived = deriveVibeSemanticCssVariables(forest!);
    for (const base of SEMANTIC_ROLE_BASE_NAMES) {
      expect(derived[base]).toBeTruthy();
      expect(derived[`${base}-dark`]).toBeTruthy();
    }

    // Fixed alarm anchors are never preset-tinted.
    expect(derived['--gds-state-danger']).toBe('#b3261e');
    expect(derived['--gds-state-danger-dark']).toBe('#f2786f');
    expect(derived['--gds-state-warning-dark']).toBe('#e0a23c');
  });

  it('pairs --gds-text-on-support with --gds-support at WCAG AA for every preset and scheme (issue #537)', () => {
    // The regression this guards: ChoiceChip's selected state paired
    // `--gds-text-on-inverse` (designed to sit on `bg.inverse`) with `--gds-support`,
    // two roles never designed to meet. It measured 1.89:1 in class-usa dark against a
    // 4.5:1 requirement and passed every existing gate, because every existing gate
    // checked DESIGNED pairings and this pairing was never designed at all.
    //
    // Asserting all 25 presets x both schemes rather than sampling is deliberate: the
    // fix itself introduced a 4.1:1 failure in class-usa light (the hand-authored
    // `support` override winning over a foreground derived against the derived
    // `support`), and only exhaustive checking surfaced it.
    const presetIds = getGdsThemePresets().map((preset) => preset.id);
    expect(presetIds.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const id of presetIds) {
      for (const scheme of ['light', 'dark'] as const) {
        const vars = getGdsVibeThemeCssVariables(id, scheme);
        const background = vars['--gds-support'];
        const foreground = vars['--gds-text-on-support'];

        // A missing token is a failure, not a skip: the brand lanes previously omitted
        // this role entirely, which is how the defect reached production.
        if (!background || !foreground) {
          failures.push(`${id}/${scheme}: missing token (support=${background}, on-support=${foreground})`);
          continue;
        }

        const result = checkGdsContrast(foreground, background, { level: 'AA', size: 'normal' });
        if (!result.passes) {
          failures.push(`${id}/${scheme}: ${foreground} on ${background} = ${result.ratio}:1`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
