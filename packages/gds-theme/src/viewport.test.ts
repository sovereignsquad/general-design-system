import { describe, expect, it } from 'vitest';
import { getGdsPwaViewportMetaContent } from './viewport';

describe('getGdsPwaViewportMetaContent', () => {
  it('defaults to the browser-default zoom policy with no zoom restrictions', () => {
    expect(getGdsPwaViewportMetaContent()).toBe('width=device-width, initial-scale=1');
  });

  it('adds maximum-scale and user-scalable=no only for the app-shell-fixed policy', () => {
    expect(getGdsPwaViewportMetaContent({ zoomPolicy: 'app-shell-fixed' })).toBe(
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    );
    expect(getGdsPwaViewportMetaContent({ zoomPolicy: 'browser-default' })).toBe(
      'width=device-width, initial-scale=1',
    );
  });

  it('appends viewport-fit only when explicitly requested', () => {
    expect(getGdsPwaViewportMetaContent({ viewportFit: 'cover' })).toBe(
      'width=device-width, initial-scale=1, viewport-fit=cover',
    );
    expect(
      getGdsPwaViewportMetaContent({ zoomPolicy: 'app-shell-fixed', viewportFit: 'cover' }),
    ).toBe('width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  });
});
