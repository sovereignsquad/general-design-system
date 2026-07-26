import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getGdsWebAppManifest, gdsSafeAreaInset } from './pwa';
import { useGdsStandaloneDisplayMode } from './pwa.client';

describe('getGdsWebAppManifest', () => {
  it('applies GDS defaults and snake_case manifest keys', () => {
    const manifest = getGdsWebAppManifest({
      name: 'Cosmic App',
      themeColor: 'rebeccapurple',
      backgroundColor: 'white',
    });
    expect(manifest).toEqual({
      name: 'Cosmic App',
      short_name: 'Cosmic App',
      theme_color: 'rebeccapurple',
      background_color: 'white',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      id: '/',
      icons: [],
    });
  });

  it('honors overrides and optional fields, defaulting id to scope', () => {
    const manifest = getGdsWebAppManifest({
      name: 'App',
      shortName: 'A',
      themeColor: 'black',
      backgroundColor: 'white',
      display: 'fullscreen',
      startUrl: '/home',
      scope: '/app/',
      description: 'desc',
      orientation: 'portrait',
      lang: 'en',
      dir: 'ltr',
      categories: ['productivity'],
      icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    });
    expect(manifest.short_name).toBe('A');
    expect(manifest.display).toBe('fullscreen');
    expect(manifest.start_url).toBe('/home');
    expect(manifest.scope).toBe('/app/');
    expect(manifest.id).toBe('/app/');
    expect(manifest.description).toBe('desc');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.categories).toEqual(['productivity']);
    expect(manifest.icons).toHaveLength(1);
  });

  it('throws when a required name/color is missing or blank', () => {
    expect(() => getGdsWebAppManifest({ name: '  ', themeColor: 'black', backgroundColor: 'white' })).toThrow(/name/);
    expect(() => getGdsWebAppManifest({ name: 'x', themeColor: '', backgroundColor: 'white' })).toThrow(/themeColor/);
    expect(() => getGdsWebAppManifest({ name: 'x', themeColor: 'black', backgroundColor: '' })).toThrow(/backgroundColor/);
  });

  it('serializes to valid JSON for a manifest.webmanifest response', () => {
    const parsed = JSON.parse(
      JSON.stringify(getGdsWebAppManifest({ name: 'App', themeColor: 'black', backgroundColor: 'white' })),
    );
    expect(parsed.display).toBe('standalone');
    expect(parsed.theme_color).toBe('black');
  });
});

describe('gdsSafeAreaInset', () => {
  it('exposes var() strings for all four insets', () => {
    expect(gdsSafeAreaInset).toEqual({
      top: 'var(--gds-safe-area-inset-top)',
      right: 'var(--gds-safe-area-inset-right)',
      bottom: 'var(--gds-safe-area-inset-bottom)',
      left: 'var(--gds-safe-area-inset-left)',
    });
  });
});

describe('useGdsStandaloneDisplayMode', () => {
  const originalMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const mockMatchMedia = (matcher: (query: string) => boolean) => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: matcher(query),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as unknown as typeof window.matchMedia;
  };

  it('reports browser mode when no display-mode matches', () => {
    mockMatchMedia(() => false);
    const { result } = renderHook(() => useGdsStandaloneDisplayMode());
    expect(result.current).toEqual({ isStandalone: false, displayMode: 'browser' });
  });

  it('reports standalone when the standalone display-mode matches', () => {
    mockMatchMedia((query) => query.includes('standalone'));
    const { result } = renderHook(() => useGdsStandaloneDisplayMode());
    expect(result.current.isStandalone).toBe(true);
    expect(result.current.displayMode).toBe('standalone');
  });

  it('treats minimal-ui as not-standalone', () => {
    mockMatchMedia((query) => query.includes('minimal-ui'));
    const { result } = renderHook(() => useGdsStandaloneDisplayMode());
    expect(result.current.isStandalone).toBe(false);
    expect(result.current.displayMode).toBe('minimal-ui');
  });
});
