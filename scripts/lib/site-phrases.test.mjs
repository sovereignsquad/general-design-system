import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TARGET_FILES, extractPhrases } from './site-phrases.mjs';

const coreSrc = resolve(import.meta.dirname, '../../packages/gds-core/src');

describe('site phrase sources', () => {
  it('include the .shared sibling of every listed module that has one', () => {
    const shared = readdirSync(coreSrc).filter((f) => f.endsWith('.shared.ts'));
    for (const file of shared) {
      const stem = `packages/gds-core/src/${file.replace(/\.shared\.ts$/, '')}`;
      const listed = TARGET_FILES.some((t) => t === `${stem}.tsx` || t === `${stem}.ts` || t === `${stem}.client.tsx`);
      if (listed) expect(TARGET_FILES).toContain(`packages/gds-core/src/${file}`);
    }
  });

  it('list each file once', () => {
    expect(new Set(TARGET_FILES).size).toBe(TARGET_FILES.length);
  });

  it('extract the page-template copy that lives in GdsPageTemplates.shared.ts', () => {
    const source = readFileSync(resolve(coreSrc, 'GdsPageTemplates.shared.ts'), 'utf8');
    expect(extractPhrases(source).size).toBeGreaterThan(0);
  });
});
