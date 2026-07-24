import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GdsDensityProvider, useGdsCardContract, useGdsDensity } from './GdsDensity';

describe('GdsDensityProvider / useGdsDensity', () => {
  it('defaults to comfortable outside any provider', () => {
    const { result } = renderHook(() => useGdsDensity());
    expect(result.current).toBe('comfortable');
  });

  it('reads the ambient density set by the nearest provider', () => {
    const { result } = renderHook(() => useGdsDensity(), {
      wrapper: ({ children }) => <GdsDensityProvider density="compact">{children}</GdsDensityProvider>,
    });
    expect(result.current).toBe('compact');
  });
});

describe('useGdsCardContract', () => {
  it('falls back to the ambient density instead of a hardcoded default', () => {
    const { result } = renderHook(() => useGdsCardContract(), {
      wrapper: ({ children }) => <GdsDensityProvider density="spacious">{children}</GdsDensityProvider>,
    });
    expect(result.current.density).toBe('spacious');
  });

  it('lets an explicit density override the ambient value', () => {
    const { result } = renderHook(() => useGdsCardContract({ density: 'compact' }), {
      wrapper: ({ children }) => <GdsDensityProvider density="spacious">{children}</GdsDensityProvider>,
    });
    expect(result.current.density).toBe('compact');
  });
});
