import { describe, expect, it } from 'vitest';
import { getGdsThemePresets } from './theme-presets';
import { getGdsVibeThemes } from './vibe-themes';

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
