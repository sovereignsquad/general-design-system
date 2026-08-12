import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useRef } from 'react';
import { GdsThemeBoundary } from './GdsThemeBoundary';
import { computeGdsThemeIdentity } from './theme-identity';

function MountCounter({ onMount }: { onMount: () => void }) {
  const mounted = useRef(false);
  if (!mounted.current) { mounted.current = true; onMount(); }
  return <span>content</span>;
}

describe('GdsThemeBoundary (issue 561)', () => {
  it('re-creates its subtree when the theme identity changes', () => {
    // The whole guarantee: a value captured at mount cannot survive a switch.
    const onMount = vi.fn();
    const { rerender } = render(
      <GdsThemeBoundary preset="default" colorScheme="light"><MountCounter onMount={onMount} /></GdsThemeBoundary>,
    );
    expect(onMount).toHaveBeenCalledTimes(1);

    rerender(<GdsThemeBoundary preset="default" colorScheme="dark"><MountCounter onMount={onMount} /></GdsThemeBoundary>);
    expect(onMount).toHaveBeenCalledTimes(2);
  });

  it('does NOT re-create when the theme resolves identically', () => {
    // Repainting the world to arrive at the same pixels is cost without benefit.
    const onMount = vi.fn();
    const { rerender } = render(
      <GdsThemeBoundary preset="default" colorScheme="light"><MountCounter onMount={onMount} /></GdsThemeBoundary>,
    );
    rerender(<GdsThemeBoundary preset="default" colorScheme="light"><MountCounter onMount={onMount} /></GdsThemeBoundary>);
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('re-creates when an extra themed input changes, not just preset or scheme', () => {
    const onMount = vi.fn();
    const { rerender } = render(
      <GdsThemeBoundary preset="default" colorScheme="light" extra={{ radius: 'soft' }}><MountCounter onMount={onMount} /></GdsThemeBoundary>,
    );
    rerender(
      <GdsThemeBoundary preset="default" colorScheme="light" extra={{ radius: 'sharp' }}><MountCounter onMount={onMount} /></GdsThemeBoundary>,
    );
    expect(onMount).toHaveBeenCalledTimes(2);
  });

  it('does not introduce a layout box', () => {
    // `display: contents` — a boundary that changed layout would be unusable inside a grid
    // or flex row, which is exactly where themed surfaces live.
    const { container } = render(
      <GdsThemeBoundary preset="default" colorScheme="light"><span>content</span></GdsThemeBoundary>,
    );
    const el = container.querySelector('[data-gds-theme-boundary]') as HTMLElement;
    expect(el.style.display).toBe('contents');
    expect(el.getAttribute('data-gds-theme-boundary')).toBe(computeGdsThemeIdentity({ preset: 'default', colorScheme: 'light' }));
  });
});
