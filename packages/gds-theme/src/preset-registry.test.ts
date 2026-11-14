import { describe, expect, it } from 'vitest';
import { gdsThemePresetRegistry } from './presets';
import { defineGdsThemePreset } from './presets/define';
import { neutralVibe } from './presets/default';
import { classUsaThemePreset, getGdsThemePresets, goldAthleteThemePreset, partnerDiscoveryThemePreset, resolveGdsThemePreset } from './theme-presets';
import { getGdsVibeThemes, resolveGdsVibeTheme } from './vibe-themes';
import { gdsTheme } from './theme';

describe('theme preset registry (#961)', () => {
  const ids = gdsThemePresetRegistry.map((preset) => preset.id);

  it('registers each id once', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives the catalog and the vibe list from the registry, in registry order', () => {
    expect(getGdsThemePresets().map((preset) => preset.id)).toEqual(ids);
    expect(getGdsVibeThemes().map((vibe) => vibe.id)).toEqual(ids);
    for (const preset of gdsThemePresetRegistry) {
      expect(getGdsThemePresets().find((entry) => entry.id === preset.id)).toEqual({ id: preset.id, ...preset.catalog });
      expect(resolveGdsVibeTheme(preset.id)).toBe(preset.vibe);
    }
  });

  it('resolves each registered Mantine lane once and keeps the public preset objects', () => {
    for (const preset of gdsThemePresetRegistry) {
      if (preset.id === 'brand') continue;
      expect(resolveGdsThemePreset(preset.id)).toBe(resolveGdsThemePreset(preset.id));
    }
    expect(resolveGdsThemePreset('default')).toBe(gdsTheme);
    expect(partnerDiscoveryThemePreset).toBe(resolveGdsThemePreset('partner-discovery'));
    expect(classUsaThemePreset).toBe(resolveGdsThemePreset('class-usa'));
    expect(goldAthleteThemePreset).toBe(resolveGdsThemePreset('gold-athlete'));
  });

  it('composes the brand lane from its options on every call', () => {
    const blue = resolveGdsThemePreset('brand');
    const grape = resolveGdsThemePreset('brand', { brandPrimary: 'grape' });
    expect(blue.primaryColor).toBe('blue');
    expect(grape.primaryColor).toBe('grape');
  });

  it('carries hand-authored semantic roles only for the branded lanes that declare them', () => {
    const withOverrides = gdsThemePresetRegistry.filter((preset) => preset.semanticOverrides).map((preset) => preset.id);
    expect(withOverrides).toEqual(['class-usa', 'gold-athlete']);
  });

  it('rejects a definition whose vibe id differs from the preset id', () => {
    expect(() => defineGdsThemePreset({
      id: 'example',
      catalog: { label: 'Example', description: 'Example lane.', runtimeLane: 'resolveGdsThemePreset(example)' },
      vibe: { ...neutralVibe, id: 'other' } as unknown as typeof neutralVibe & { id: 'example' },
    })).toThrow('Theme preset "example" declares vibe id "other".');
  });
});
