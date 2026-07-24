import { describe, expect, it } from 'vitest';
import { gdsZIndexToken } from './z-index';

describe('gdsZIndexToken', () => {
  it('defers to Mantine\'s own published z-index CSS variable scale', () => {
    expect(gdsZIndexToken).toEqual({
      app: 'var(--mantine-z-index-app)',
      modal: 'var(--mantine-z-index-modal)',
      popover: 'var(--mantine-z-index-popover)',
      overlay: 'var(--mantine-z-index-overlay)',
      max: 'var(--mantine-z-index-max)',
    });
  });
});
