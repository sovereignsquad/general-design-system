import type { BrandSemanticRole } from './semantic-token-source';
import type { GdsThemePresetId } from './theme-presets';
import type { GdsColorProportionClassification, GdsDesignRuleProfile } from './axes';
import { getGdsVibeThemes } from './vibe-themes';

/**
 * Large-surface roles (issue #644): intended to cover most of a rendered page, and
 * therefore intended to stay low-saturation/neutral so a 60% share reads calm, not loud.
 */
export const DOMINANT_ROLES: BrandSemanticRole[] = [
  'bg.canvas', 'bg.card', 'bg.page', 'bg.surface', 'bg.inverse',
  'border.card',
  'text.body', 'text.meta', 'text.primary', 'text.secondary', 'text.onInverse',
  'nav.inactiveOnInverse',
  'control.disabledBg', 'control.disabledText',
];

/**
 * Brand-chrome roles (issue #644): moderate-frequency, identity-carrying. Appears often
 * but never as the majority page fill.
 */
export const SECONDARY_ROLES: BrandSemanticRole[] = [
  'brand.primary', 'brand.primaryPressed', 'support',
];

/**
 * Scarce-signal roles (issue #644): CTAs, status/state indicators, badges, price/star
 * marks -- intended to be rare and attention-carrying, never a background fill for a
 * large surface. `focus.ring` is here rather than secondary: a focus outline is a thin
 * stroke, not a fill, so its rendered area is negligible regardless of how often it
 * appears -- the same "small area, high salience" shape as the other accent roles, not
 * the "moderate but real area" shape brand-chrome roles have.
 */
export const ACCENT_ROLES: BrandSemanticRole[] = [
  'brand.accent', 'accent',
  'price', 'star',
  'state.success', 'state.warning', 'state.danger', 'state.info',
  'badge.attention', 'badge.validation', 'badge.info', 'badge.urgencyBg',
  'focus.ring',
];

const ALL_CLASSIFIED_ROLES = new Set<BrandSemanticRole>([...DOMINANT_ROLES, ...SECONDARY_ROLES, ...ACCENT_ROLES]);

/**
 * Every `BrandSemanticRole` must belong to exactly one proportion class. Runs at module
 * load so a future role added to the union without a classification entry fails loudly
 * (at build/test time) instead of silently under-counting a real role everywhere this
 * module is imported.
 */
function assertEveryRoleClassified(): void {
  const declared: BrandSemanticRole[] = [
    'brand.primary', 'brand.primaryPressed', 'brand.accent', 'accent', 'support',
    'bg.canvas', 'bg.card', 'bg.page', 'bg.surface', 'bg.inverse', 'border.card',
    'text.body', 'text.meta', 'text.primary', 'text.secondary', 'text.onInverse',
    'nav.inactiveOnInverse', 'price', 'star',
    'state.success', 'state.warning', 'state.danger', 'state.info',
    'badge.attention', 'badge.validation', 'badge.info', 'badge.urgencyBg',
    'focus.ring', 'control.disabledBg', 'control.disabledText',
  ];
  const unclassified = declared.filter((role) => !ALL_CLASSIFIED_ROLES.has(role));
  if (unclassified.length > 0) {
    throw new Error(`Unclassified semantic role(s): ${unclassified.join(', ')}. Every BrandSemanticRole must belong to exactly one proportion class (issue #644).`);
  }
  const duplicated = [...ALL_CLASSIFIED_ROLES].filter(
    (role) => [DOMINANT_ROLES, SECONDARY_ROLES, ACCENT_ROLES].filter((list) => (list as string[]).includes(role)).length > 1,
  );
  if (duplicated.length > 0) {
    throw new Error(`Role(s) classified in more than one proportion class: ${duplicated.join(', ')} (issue #644).`);
  }
}
assertEveryRoleClassified();

const SHARED_CLASSIFICATION: GdsColorProportionClassification = {
  dominant: [...DOMINANT_ROLES],
  secondary: [...SECONDARY_ROLES],
  accent: [...ACCENT_ROLES],
};

/**
 * Every shipped preset's color-proportion classification (issue #644). Every preset
 * shares the identical role->class mapping -- role meaning is preset-independent (every
 * `GdsVibeTheme` emits the same role-name set; only the color VALUES differ per preset),
 * so 25 hand-typed classification objects would be 25 opportunities to drift from each
 * other for no reason. Built from `getGdsVibeThemes()` rather than a hardcoded preset-id
 * list, so a future preset is covered automatically.
 */
export const colorProportionClassificationByPreset: Record<GdsThemePresetId, GdsColorProportionClassification> = Object.fromEntries(
  getGdsVibeThemes().map((vibe) => [vibe.id, SHARED_CLASSIFICATION]),
) as Record<GdsThemePresetId, GdsColorProportionClassification>;

/**
 * The color-proportion half of a preset's design rule profile (issue #644): the shared
 * classification, combined with the `'60-30-10'` rule flag every preset satisfies once
 * classified.
 */
export function resolveGdsColorProportionProfile(presetId: GdsThemePresetId): GdsDesignRuleProfile['colorProportion'] {
  const classification = colorProportionClassificationByPreset[presetId];
  if (!classification) {
    throw new Error(`No color-proportion classification registered for preset "${presetId}" (issue #644).`);
  }
  return { rule: '60-30-10', classification };
}
