import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { StreamingIndicator } from './ChatSurface';

// Resolved from the workspace root: vitest serves this file over an http-scheme URL, so
// `new URL(..., import.meta.url)` is not a file path here.
const STYLES = readFileSync(resolve(process.cwd(), 'packages/gds-theme/styles.css'), 'utf8');

describe('StreamingIndicator (issue 592)', () => {
  it('animates keyframes that actually exist', () => {
    // The defect: `animation: gds-chat-typing 1s infinite` shipped while the repo contained
    // ZERO @keyframes, so three static dots rendered. jsdom cannot run the animation, so the
    // assertion is the one that would have caught it — the name is declared AND defined.
    render(<MantineProvider><StreamingIndicator /></MantineProvider>);
    const dot = document.querySelector('.gds-chat-typing-dot') as HTMLElement;
    expect(dot).toBeTruthy();
    expect(dot.style.animation).toContain('gds-chat-typing');
    expect(STYLES).toContain('@keyframes gds-chat-typing');
  });

  it('carries data-gds-motion so reduced motion can neutralise it', () => {
    // Verified live as well: under prefers-reduced-motion the computed animation-name is
    // `none` and getAnimations() returns 0, against 1 without it.
    render(<MantineProvider><StreamingIndicator /></MantineProvider>);
    const dots = document.querySelectorAll('.gds-chat-typing-dot');
    expect(dots.length).toBe(3);
    for (const dot of dots) expect(dot.hasAttribute('data-gds-motion')).toBe(true);
    expect(STYLES).toMatch(/\[data-gds-motion\][^}]*\{[^}]*animation:\s*none/s);
  });

  it('takes its duration and stagger from the governed scale, not a literal', () => {
    render(<MantineProvider><StreamingIndicator /></MantineProvider>);
    const dots = [...document.querySelectorAll('.gds-chat-typing-dot')] as HTMLElement[];
    for (const dot of dots) expect(dot.style.animation).toContain('--gds-motion-duration-ambient');
    // The stagger scales with the token rather than being a second hardcoded number.
    expect(dots[1].style.animationDelay).toContain('--gds-motion-duration-ambient');
    expect(dots[0].style.animationDelay).toMatch(/\* 0\)?/);
  });

  it('announces itself, so the meaning does not depend on seeing motion', () => {
    render(<MantineProvider><StreamingIndicator /></MantineProvider>);
    expect(screen.getByLabelText('Assistant is typing')).toBeTruthy();
  });
});
