import { describe, expect, it } from 'vitest';
import {
  GDS_DEFAULT_SHAPE_AXIS,
  GDS_RADIUS_ROLES,
  GDS_SHAPE_PROFILE_NAMES,
  GDS_SHAPE_PROFILES,
  GdsAxisError,
  resolveGdsShapeProfileRoles,
  resolveGdsShapeTokens,
} from './axes';
import { createBrandTheme } from './brand-tokens';
import { GDS_CLASS_USA_SHAPE_AXIS } from './semantic-token-source';
import { gdsTheme } from './theme';
import { getGdsVibeThemeCssVariables } from './vibe-themes';

describe('shape profiles (#953)', () => {
  it('default matches what the components render: card and panel lg, badge xl, chip pill, drawer none, the rest md', () => {
    const tokens = resolveGdsShapeTokens();
    const scale = GDS_DEFAULT_SHAPE_AXIS.scale;
    expect(tokens['--gds-radius-card']).toBe(scale.lg);
    expect(tokens['--gds-radius-panel']).toBe(scale.lg);
    expect(tokens['--gds-radius-badge']).toBe(scale.xl);
    expect(tokens['--gds-radius-chip']).toBe(scale.pill);
    expect(tokens['--gds-radius-drawer']).toBe(scale.none);
    for (const role of ['button', 'input', 'modal', 'sheet'] as const) expect(tokens[`--gds-radius-${role}`]).toBe(scale.md);
  });

  it('operations and workspace layer over default and only use declared steps', () => {
    for (const profile of GDS_SHAPE_PROFILE_NAMES) {
      const roles = resolveGdsShapeProfileRoles(profile);
      for (const role of Object.keys(GDS_SHAPE_PROFILES.default)) expect(roles[role as keyof typeof roles]).toBeDefined();
      for (const role of Object.keys(roles)) expect(GDS_RADIUS_ROLES).toContain(role);
    }
    const scale = GDS_DEFAULT_SHAPE_AXIS.scale;
    expect(resolveGdsShapeTokens({ ...GDS_DEFAULT_SHAPE_AXIS, profile: 'operations' })['--gds-radius-card']).toBe(scale.sm);
    expect(resolveGdsShapeTokens({ ...GDS_DEFAULT_SHAPE_AXIS, profile: 'workspace' })['--gds-radius-modal']).toBe(scale.lg);
    expect(resolveGdsShapeTokens({ ...GDS_DEFAULT_SHAPE_AXIS, profile: 'operations', roles: { card: 'xl' } })['--gds-radius-card']).toBe(scale.xl);
  });

  it('rejects an unknown profile', () => {
    expect(() => resolveGdsShapeTokens({ ...GDS_DEFAULT_SHAPE_AXIS, profile: 'dense' as never })).toThrow(GdsAxisError);
  });

  it('gdsTheme components read the radius roles', () => {
    const components = gdsTheme.components as Record<string, { defaultProps?: { radius?: string } }>;
    expect(components.Card.defaultProps?.radius).toBe('var(--gds-radius-card)');
    expect(components.Paper.defaultProps?.radius).toBe('var(--gds-radius-panel)');
    expect(components.Button.defaultProps?.radius).toBe('var(--gds-radius-button)');
    expect(components.TextInput.defaultProps?.radius).toBe('var(--gds-radius-input)');
    expect(components.Badge.defaultProps?.radius).toBe('var(--gds-radius-badge)');
    expect(components.Chip.defaultProps?.radius).toBe('var(--gds-radius-chip)');
    expect(components.Modal.defaultProps?.radius).toBe('var(--gds-radius-modal)');
    expect(components.Drawer.defaultProps?.radius).toBe('var(--gds-radius-drawer)');
  });

  it('class-usa feeds its Mantine radius scale and its radius tokens from one shape axis', () => {
    const { mantineTheme, cssVariables } = createBrandTheme('class-usa');
    const preset = getGdsVibeThemeCssVariables('class-usa', 'light');
    for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      expect((mantineTheme.radius as Record<string, string>)[step]).toBe(GDS_CLASS_USA_SHAPE_AXIS.scale[step]);
      expect(cssVariables[`--gds-radius-${step}`]).toBe(GDS_CLASS_USA_SHAPE_AXIS.scale[step]);
      expect(preset[`--gds-radius-${step}`]).toBe(GDS_CLASS_USA_SHAPE_AXIS.scale[step]);
    }
  });

  it('class-usa and gold-athlete components read the roles, so a shape scope reaches them', () => {
    for (const lane of ['class-usa', 'gold-athlete'] as const) {
      const components = createBrandTheme(lane).mantineTheme.components as Record<string, { defaultProps?: { radius?: string } }>;
      expect(components.Button.defaultProps?.radius, lane).toBe('var(--gds-radius-button)');
      expect(components.Card.defaultProps?.radius, lane).toBe('var(--gds-radius-card)');
      expect(components.Paper.defaultProps?.radius, lane).toBe('var(--gds-radius-panel)');
      expect(components.Badge.defaultProps?.radius, lane).toBe('var(--gds-radius-badge)');
    }
    expect(createBrandTheme('gold-athlete').cssVariables['--gds-radius-button']).toBe(GDS_DEFAULT_SHAPE_AXIS.scale.xl);
  });

  it('presets with a non-md default radius carry it on the modal role', () => {
    expect(getGdsVibeThemeCssVariables('high-contrast', 'light')['--gds-radius-modal']).toBe(GDS_DEFAULT_SHAPE_AXIS.scale.sm);
    expect(getGdsVibeThemeCssVariables('gold-athlete', 'light')['--gds-radius-modal']).toBe(GDS_DEFAULT_SHAPE_AXIS.scale.lg);
    expect(createBrandTheme('gold-athlete').cssVariables['--gds-radius-modal']).toBe(GDS_DEFAULT_SHAPE_AXIS.scale.lg);
  });
});
