import { describe, expect, it } from 'vitest';
import { contrastRatio } from './color-math';
import { checkGdsContrast } from './contrast';
import { validateGdsDesignRuleProfile, GDS_DEFAULT_DESIGN_RULE_PROFILE, GdsAxisError } from './axes';
import { gdsAccessibilityFloorRules, validateGdsAccessibilityFloor } from './accessibility-floor';
import { createGdsTokenGraph, validateGdsTokenGraph } from './token-operations';
import { getGdsAiAccentLane, getGdsVibeThemeCssVariables, getGdsVibeThemes } from './vibe-themes';
import { YOUR_FIELD_ROLES } from './your-field';

// The Scout AI sub-brand accent lane (issue 697): ai.gradient/ai.panel/ai.accent, reserved to
// the your-field preset. Covers emission, dark-collapse, absence on every other preset, the
// JS-readable accessor, token-graph classification, the report-severity floor rule, and the
// reservedAccents profile validation.

const AI_BASE_NAMES = ['--gds-ai-gradient', '--gds-ai-panel', '--gds-ai-accent'];

describe('ai accent lane (issue 697)', () => {
  it('carries the Your Field handoff\'s light values verbatim', () => {
    const lane = getGdsAiAccentLane('your-field');
    expect(lane).toBeTruthy();
    expect(lane!.gradient.light).toBe('linear-gradient(135deg, #FF6B35 0%, #FF9055 100%)');
    expect(lane!.panel.light).toBe('linear-gradient(124deg, #0D2340 0%, #1A3A6A 100%)');
    expect(lane!.accent.light).toBe('#FF6B35');
  });

  it('agrees byte-for-byte with the pre-existing theme.other.yourField gradient values', () => {
    // Two independent delivery paths carry the same brand gradients (see vibe-themes.ts's
    // `your-field` entry comment): the legacy Mantine theme.other.yourField roles, and this
    // governed --gds-ai-* lane. Both derive from the same your-field.ts constants, so they
    // must never silently disagree.
    const lane = getGdsAiAccentLane('your-field')!;
    expect(lane.gradient.light).toBe(YOUR_FIELD_ROLES.aiGradient);
    expect(lane.panel.light).toBe(YOUR_FIELD_ROLES.aiPanelGradient);
    expect(lane.accent.light).toBe(YOUR_FIELD_ROLES.aiAccent);
  });

  it('authors a dark sibling for every field, never reusing the light value', () => {
    const lane = getGdsAiAccentLane('your-field')!;
    expect(lane.gradient.dark).not.toBe(lane.gradient.light);
    expect(lane.panel.dark).not.toBe(lane.panel.light);
    expect(lane.accent.dark).not.toBe(lane.accent.light);

    // Each dark value must itself be a real, resolvable colour a rendering engine can paint —
    // not a placeholder string.
    expect(contrastRatio('#ffffff', lane.accent.dark, lane.accent.dark)).not.toBeNull();
  });

  it('emits all six --gds-ai-* variables for your-field in light mode', () => {
    const light = getGdsVibeThemeCssVariables('your-field', 'light');
    expect(light['--gds-ai-gradient']).toBe('linear-gradient(135deg, #FF6B35 0%, #FF9055 100%)');
    expect(light['--gds-ai-gradient-dark']).toBeTruthy();
    expect(light['--gds-ai-panel']).toBe('linear-gradient(124deg, #0D2340 0%, #1A3A6A 100%)');
    expect(light['--gds-ai-panel-dark']).toBeTruthy();
    expect(light['--gds-ai-accent']).toBe('#FF6B35');
    expect(light['--gds-ai-accent-dark']).toBeTruthy();
  });

  it('collapses the -dark values onto their base names in dark mode', () => {
    const lane = getGdsAiAccentLane('your-field')!;
    const dark = getGdsVibeThemeCssVariables('your-field', 'dark');
    expect(dark['--gds-ai-gradient']).toBe(lane.gradient.dark);
    expect(dark['--gds-ai-panel']).toBe(lane.panel.dark);
    expect(dark['--gds-ai-accent']).toBe(lane.accent.dark);
    // The -dark keys themselves stay present too, matching every other semantic role pair.
    expect(dark['--gds-ai-gradient-dark']).toBe(lane.gradient.dark);
  });

  it('emits zero --gds-ai-* keys for every preset that does not declare the lane', () => {
    for (const vibe of getGdsVibeThemes()) {
      if (vibe.id === 'your-field') continue;
      for (const scheme of ['light', 'dark'] as const) {
        const vars = getGdsVibeThemeCssVariables(vibe.id, scheme);
        for (const base of AI_BASE_NAMES) {
          expect(vars[base], `${vibe.id} (${scheme}) unexpectedly carries ${base}`).toBeUndefined();
          expect(vars[`${base}-dark`], `${vibe.id} (${scheme}) unexpectedly carries ${base}-dark`).toBeUndefined();
        }
      }
    }
  });

  it('getGdsAiAccentLane: presence for exactly one preset, absence for every other', () => {
    const presetsWithLane = getGdsVibeThemes().filter((vibe) => getGdsAiAccentLane(vibe.id) !== undefined);
    expect(presetsWithLane.map((vibe) => vibe.id)).toEqual(['your-field']);

    for (const vibe of getGdsVibeThemes()) {
      const hasLane = getGdsAiAccentLane(vibe.id) !== undefined;
      const emitsAiVars = AI_BASE_NAMES.some((base) => getGdsVibeThemeCssVariables(vibe.id, 'light')[base] !== undefined);
      expect(hasLane, `${vibe.id}: accessor presence disagrees with emission`).toBe(emitsAiVars);
    }
  });

  it('does not change any other preset\'s emitted token set', () => {
    for (const vibe of getGdsVibeThemes()) {
      if (vibe.id === 'your-field') continue;
      for (const scheme of ['light', 'dark'] as const) {
        const keys = Object.keys(getGdsVibeThemeCssVariables(vibe.id, scheme));
        expect(keys.some((key) => key.startsWith('--gds-ai-'))).toBe(false);
      }
    }
  });

  it('classifies ai-gradient/ai-panel as effect and ai-accent as color in the token graph', () => {
    const graph = createGdsTokenGraph();
    const yourFieldNodes = graph.nodes.filter((node) => node.themeId === 'your-field' && node.lane === 'semantic');
    const byRole = new Map(yourFieldNodes.map((node) => [node.role, node]));

    expect(byRole.get('ai-gradient')?.category).toBe('effect');
    expect(byRole.get('ai-panel')?.category).toBe('effect');
    expect(byRole.get('ai-accent')?.category).toBe('color');
  });

  it('produces a token graph with zero validation errors', () => {
    const report = validateGdsTokenGraph();
    expect(report.ok).toBe(true);
    expect(report.errorCount).toBe(0);
  });

  it('the ai-accent-text-contrast floor rule exists at report severity', () => {
    const rule = gdsAccessibilityFloorRules.find((r) => r.id === 'ai-accent-text-contrast');
    expect(rule).toBeTruthy();
    expect(rule!.axis).toBe('color');
  });

  it('reports (never fails) white on your-field\'s ai.accent, measured below 4.5:1', () => {
    const tokens = getGdsVibeThemeCssVariables('your-field', 'light');
    const found = validateGdsAccessibilityFloor({ presetId: 'your-field', scheme: 'light', tokens });
    const finding = found.find((v) => v.ruleId === 'ai-accent-text-contrast');
    expect(finding).toBeTruthy();
    expect(finding!.severity).toBe('report');

    const ratio = contrastRatio('#ffffff', tokens['--gds-ai-accent'], tokens['--gds-ai-accent']);
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeLessThan(4.5);
    expect(checkGdsContrast('#ffffff', tokens['--gds-ai-accent']).passes).toBe(false);
  });

  it('stays silent when --gds-ai-accent is absent (every non-your-field preset)', () => {
    for (const vibe of getGdsVibeThemes()) {
      if (vibe.id === 'your-field') continue;
      const tokens = getGdsVibeThemeCssVariables(vibe.id, 'light');
      expect(tokens['--gds-ai-accent']).toBeUndefined();
      const found = validateGdsAccessibilityFloor({ presetId: vibe.id, scheme: 'light', tokens });
      expect(found.find((v) => v.ruleId === 'ai-accent-text-contrast')).toBeUndefined();
    }
  });

  it('canary: a deliberately failing ai.accent value is reported by the rule', () => {
    const canaryTokens = { ...getGdsVibeThemeCssVariables('default', 'light'), '--gds-ai-accent': '#ffee00' };
    const found = validateGdsAccessibilityFloor({ presetId: 'canary', scheme: 'light', tokens: canaryTokens });
    const finding = found.find((v) => v.ruleId === 'ai-accent-text-contrast');
    expect(finding).toBeTruthy();
    expect(finding!.severity).toBe('report');
  });

  it('reservedAccents: rejects a duplicate role', () => {
    expect(() => validateGdsDesignRuleProfile({
      ...GDS_DEFAULT_DESIGN_RULE_PROFILE,
      reservedAccents: [
        { role: 'ai.gradient', surfaces: ['AISearchCard'] },
        { role: 'ai.gradient', surfaces: ['ChatThread'] },
      ],
    }, 'probe')).toThrow(GdsAxisError);
  });

  it('reservedAccents: rejects an entry with no surfaces', () => {
    expect(() => validateGdsDesignRuleProfile({
      ...GDS_DEFAULT_DESIGN_RULE_PROFILE,
      reservedAccents: [{ role: 'ai.accent', surfaces: [] }],
    }, 'probe')).toThrow(GdsAxisError);
  });

  it('reservedAccents: a valid declaration passes', () => {
    expect(() => validateGdsDesignRuleProfile({
      ...GDS_DEFAULT_DESIGN_RULE_PROFILE,
      reservedAccents: [
        { role: 'ai.gradient', surfaces: ['AISearchCard'] },
        { role: 'ai.panel', surfaces: ['AIPromoPanel'] },
      ],
    }, 'probe')).not.toThrow();
  });

  it('the your-field preset declares its own reservation, and it validates clean', () => {
    const profile = getGdsVibeThemes().find((vibe) => vibe.id === 'your-field')?.axes?.designRuleProfile;
    expect(profile?.reservedAccents?.length).toBeGreaterThan(0);
    expect(() => validateGdsDesignRuleProfile(profile!, 'your-field')).not.toThrow();

    const roles = profile!.reservedAccents!.map((r) => r.role).sort();
    expect(roles).toEqual(['ai.accent', 'ai.gradient', 'ai.panel']);
  });
});
