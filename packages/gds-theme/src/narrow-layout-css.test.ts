import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const stylesCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'styles.css'), 'utf8');

describe('narrow-container layout rules in styles.css (#982)', () => {
  it('never lets text break anywhere: anywhere drops min-content to one character', () => {
    expect(stylesCss).not.toMatch(/overflow-wrap:\s*anywhere/);
    expect(stylesCss).toMatch(/\.mantine-Anchor-root:where\(:not\(\[data-gds-fixed-tone\]\)\) \{\s*overflow-wrap: break-word;/);
  });

  it('caps stack and non-growing group children at the container width', () => {
    expect(stylesCss).toMatch(/\.mantine-Stack-root > \*,\s*\.mantine-Group-root:not\(\[data-grow\]\) > \* \{\s*max-width: 100%;/);
  });

  it('keeps inline code whole on its line', () => {
    expect(stylesCss).toMatch(/\.mantine-Code-root:not\(\[data-block\]\) \{\s*display: inline-block;\s*max-width: 100%;/);
  });

  it('does not compound insets for nested containers and nested section panels on compact screens', () => {
    const compact = stylesCss.slice(stylesCss.indexOf('@media (max-width: 47.99em) {\n  .mantine-Container-root > .mantine-Container-root'));
    expect(compact).toMatch(/\.mantine-Container-root > \.mantine-Container-root \{\s*padding-inline: 0;/);
    expect(compact).toMatch(/\[data-gds-section-panel\] \[data-gds-section-panel\] \{\s*padding-inline: 0;\s*border-inline-width: 0;/);
  });
});
