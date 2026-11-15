import { describe, expect, it } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { GdsBox, GdsColumnGrid, GdsGrid, GdsInline, GdsSidebar, GdsSplit } from './LayoutPrimitives';

// An inline declaration outranks every media rule, so a responsive value must live entirely in
// the generated class rules: base first, then one media rule per breakpoint (#945).
function probe(container: HTMLElement, id: string) {
  const element = container.querySelector<HTMLElement>(`[data-probe="${id}"]`);
  if (!element) throw new Error(`no ${id}`);
  const css = [...container.querySelectorAll('style[data-gds-layout]')].map((style) => style.textContent ?? '').join('');
  const className = [...element.classList].find((name) => css.includes(`.${name}{grid-template-columns`)) ?? [...element.classList].find((name) => name.startsWith('gds-layout-'));
  return { element, className, css };
}

describe('responsive layout primitives (#945)', () => {
  it('GdsSplit puts the collapsed and split tracks in class rules, none inline', () => {
    const { container } = renderWithGds(<GdsSplit data-probe="split" ratio="1:2"><div /><div /></GdsSplit>);
    const { element, className, css } = probe(container, 'split');
    expect(element.style.gridTemplateColumns).toBe('');
    expect(css).toContain(`.${className}{grid-template-columns:minmax(0, 1fr);}`);
    expect(css).toContain(`{.${className}{grid-template-columns:minmax(0, 1fr) minmax(0, 2fr);}}`);
    expect(css.indexOf(`.${className}{grid-template-columns:minmax(0, 1fr);}`)).toBeLessThan(css.indexOf('@media'));
  });

  it('GdsSidebar does the same', () => {
    const { container } = renderWithGds(<GdsSidebar data-probe="sidebar" sidebarWidth="aside"><div /><div /></GdsSidebar>);
    const { element, css } = probe(container, 'sidebar');
    expect(element.style.gridTemplateColumns).toBe('');
    expect(css).toMatch(/\{grid-template-columns:minmax\(0, 1fr\);\}@media/);
  });

  it('GdsGrid and GdsColumnGrid move responsive columns out of the inline style and keep scalar ones inline', () => {
    const { container } = renderWithGds(
      <>
        <GdsGrid data-probe="responsive" columns={{ base: 1, md: 3 }}><div /></GdsGrid>
        <GdsGrid data-probe="scalar" columns={2}><div /></GdsGrid>
        <GdsColumnGrid data-probe="columns" columns={{ base: 4, lg: 12 }}><div /></GdsColumnGrid>
      </>,
    );
    const responsive = probe(container, 'responsive');
    expect(responsive.element.style.gridTemplateColumns).toBe('');
    expect(responsive.css).toContain('grid-template-columns:repeat(1, minmax(0, 1fr));');
    expect(responsive.css).toContain('grid-template-columns:repeat(3, minmax(0, 1fr));');
    expect(probe(container, 'scalar').element.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(probe(container, 'columns').element.style.gridTemplateColumns).toBe('');
  });

  it('GdsInline and GdsBox move responsive wrap and padding to class rules, and an explicit style still wins', () => {
    const { container } = renderWithGds(
      <>
        <GdsInline data-probe="inline" wrap={{ base: 'wrap', md: 'nowrap' }}><span /></GdsInline>
        <GdsBox data-probe="box" padding={{ base: 'md', md: 'xl' }}>x</GdsBox>
        <GdsBox data-probe="explicit" padding={{ base: 'md', md: 'xl' }} style={{ padding: 0 }}>x</GdsBox>
        <GdsBox data-probe="plain" padding="md">x</GdsBox>
      </>,
    );
    expect(probe(container, 'inline').element.style.flexWrap).toBe('');
    const box = probe(container, 'box');
    expect(box.element.style.padding).toBe('');
    expect(box.css).toContain('padding:var(--mantine-spacing-md);');
    expect(box.css).toContain('padding:var(--mantine-spacing-xl);');
    expect(probe(container, 'explicit').element.style.padding).toBe('0px');
    expect(probe(container, 'plain').element.style.padding).toBe('var(--mantine-spacing-md)');
  });
});
