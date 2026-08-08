import { describe, expect, it } from 'vitest';
import { resolveGdsCategoryBadgeIcon } from './category-registry';
import type { GdsCategoryDefinition } from './category-registry';

const soccer: GdsCategoryDefinition = {
  key: 'soccer',
  label: 'Soccer',
  accent: 'forest',
  icon: 'Location',
  emoji: '⚽',
};

const withoutEmoji: GdsCategoryDefinition = {
  key: 'trailhead',
  label: 'Trailhead',
  accent: 'ocean',
  icon: 'Location',
};

describe('resolveGdsCategoryBadgeIcon (#525)', () => {
  it('resolves to tabler regardless of emoji availability when the mode is tabler', () => {
    expect(resolveGdsCategoryBadgeIcon(soccer, 'tabler')).toEqual({ mode: 'tabler', icon: 'Location' });
  });

  it('resolves to emoji when the mode is emoji and the category has one', () => {
    expect(resolveGdsCategoryBadgeIcon(soccer, 'emoji')).toEqual({ mode: 'emoji', emoji: '⚽' });
  });

  it('failsafe: resolves to tabler when the mode is emoji but the category has none', () => {
    expect(resolveGdsCategoryBadgeIcon(withoutEmoji, 'emoji')).toEqual({ mode: 'tabler', icon: 'Location' });
  });
});
