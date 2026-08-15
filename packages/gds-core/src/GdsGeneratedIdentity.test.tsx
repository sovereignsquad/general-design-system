import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsGeneratedAvatar, gdsAvatarInitials } from './GdsGeneratedAvatar';
import { GdsGeneratedMark } from './GdsGeneratedMark';

describe('GdsGeneratedAvatar (#565)', () => {
  it('derives initials without guessing: first + last word, one word one initial, never empty logic', () => {
    expect(gdsAvatarInitials('Ada Lovelace')).toBe('AL');
    expect(gdsAvatarInitials('Ada Byron Lovelace')).toBe('AL');
    expect(gdsAvatarInitials('Ada')).toBe('A');
    expect(gdsAvatarInitials('  ')).toBe('');
    expect(gdsAvatarInitials('日本 花子')).toBe('日花');
  });

  it('is a named image with aria-hidden initials — the name carries the meaning once', () => {
    const { container } = renderWithGds(<GdsGeneratedAvatar name="Ada Lovelace" />);
    const img = container.querySelector('[data-gds-generated-avatar]') as HTMLElement;
    expect(img.getAttribute('role')).toBe('img');
    expect(img.getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(img.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(img.textContent).toBe('AL');
  });

  it('is deterministic per seed and varies geometry, not the theme hue', () => {
    const a1 = renderWithGds(<GdsGeneratedAvatar name="Ada Lovelace" seed="user-1" />);
    const a2 = renderWithGds(<GdsGeneratedAvatar name="Ada Lovelace" seed="user-1" />);
    const b = renderWithGds(<GdsGeneratedAvatar name="Ada Lovelace" seed="user-2" />);
    const grad = (c: HTMLElement) => {
      const g = c.querySelector('linearGradient') as SVGElement;
      return `${g.getAttribute('x1')}|${g.getAttribute('y1')}|${g.getAttribute('x2')}|${g.getAttribute('y2')}`;
    };
    expect(grad(a1.container)).toBe(grad(a2.container));
    expect(grad(a1.container)).not.toBe(grad(b.container));
    // Hue belongs to the theme: both seeds paint from the same live palette refs.
    const stop = (c: HTMLElement) => (c.querySelector('linearGradient stop') as SVGElement).getAttribute('stop-color');
    expect(stop(a1.container)).toBe(stop(b.container));
    expect(stop(a1.container)).toContain('var(');
  });
});

describe('GdsGeneratedMark (#565)', () => {
  it('is decorative by default and a named image only when it stands alone', () => {
    const inline = renderWithGds(<GdsGeneratedMark seed="acme" icon="Habit" />);
    const mark = inline.container.querySelector('[data-gds-generated-mark]') as HTMLElement;
    expect(mark.getAttribute('aria-hidden')).toBe('true');
    const standalone = renderWithGds(<GdsGeneratedMark seed="acme" icon="Habit" label="Acme" />);
    const named = standalone.container.querySelector('[data-gds-generated-mark]') as HTMLElement;
    expect(named.getAttribute('role')).toBe('img');
    expect(named.getAttribute('aria-label')).toBe('Acme');
  });

  it('renders the motif prominently with a bounded seeded tilt, from live theme refs', () => {
    const { container } = renderWithGds(<GdsGeneratedMark seed="acme" icon="Habit" />);
    const motifHost = [...container.querySelectorAll('[data-gds-generated-mark] span')].pop() as HTMLElement;
    const tilt = /rotate\((-?\d+)deg\)/.exec(motifHost.style.transform);
    expect(tilt).not.toBeNull();
    expect(Math.abs(Number(tilt![1]))).toBeLessThanOrEqual(20);
    expect(container.querySelector('[data-gds-icon="Habit"]')).not.toBeNull();
    const stop = container.querySelector('linearGradient stop') as SVGElement;
    expect(stop.getAttribute('stop-color')).toContain('var(');
  });
});
