import { describe, expect, it } from 'vitest';
import { Card } from '@mantine/core';
import { renderWithGds } from '../../../test-utils/render';
import { GdsShapeScope, getGdsShapeScopeStyle } from './GdsShapeScope';

describe('GdsShapeScope (#953)', () => {
  it('maps each profile role to a step token of the active theme', () => {
    const operations = getGdsShapeScopeStyle('operations');
    expect(operations['--gds-radius-card']).toBe('var(--gds-radius-sm)');
    expect(operations['--gds-radius-input']).toBe('var(--gds-radius-sm)');
    expect(operations['--gds-radius-chip']).toBe('var(--gds-radius-sm)');
    const workspace = getGdsShapeScopeStyle('workspace');
    expect(workspace['--gds-radius-modal']).toBe('var(--gds-radius-lg)');
    // Only the profile's own entries: card stays the theme's role.
    expect(workspace['--gds-radius-card']).toBeUndefined();
    expect(getGdsShapeScopeStyle('default')).toEqual({});
  });

  it('sets the variables on its own element, not the document root, and a Card inside reads the card role', () => {
    const { container } = renderWithGds(
      <GdsShapeScope profile="operations">
        <Card>content</Card>
      </GdsShapeScope>,
    );
    const scope = container.querySelector<HTMLElement>('[data-gds-shape-profile="operations"]');
    expect(scope).not.toBeNull();
    expect(scope!.style.getPropertyValue('--gds-radius-card')).toBe('var(--gds-radius-sm)');
    expect(document.documentElement.style.getPropertyValue('--gds-radius-card')).toBe('');
    const card = scope!.querySelector<HTMLElement>('.mantine-Card-root');
    expect(card?.getAttribute('style') ?? '').toContain('var(--gds-radius-card)');
  });
});
