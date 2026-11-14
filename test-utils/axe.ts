import axe from 'axe-core';

/**
 * Runs axe-core on a rendered container under jsdom. Colour contrast is excluded because jsdom
 * computes no layout or cascade; contrast is gated by the accessibility floor and the CDP gates.
 */
export async function expectNoAxeViolations(container: Element) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  const violations = result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  if (violations.length > 0) throw new Error(`axe violations:\n${violations.join('\n')}`);
}
