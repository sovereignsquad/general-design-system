import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import { createGdsConfig } from './index.js';

function getRule(name: string) {
  const base = createGdsConfig()[0];
  return base.plugins.gds.rules[name];
}

const ruleTester = new RuleTester();
ruleTester.run('require-exported-jsdoc', getRule('require-exported-jsdoc'), {
  valid: [
    { code: '/**\n * Does a thing.\n */\nexport function Foo() {}' },
    { code: '/**\n * A component.\n */\nexport const Bar = () => null;' },
    { code: 'function internalHelper() {}' },
    {
      code: 'export function Foo() {}',
      filename: 'Foo.test.ts',
    },
  ],
  invalid: [
    {
      code: 'export function Foo() {}',
      errors: [{ messageId: 'missingJsdoc' }],
    },
    {
      code: 'export const Bar = () => null;',
      errors: [{ messageId: 'missingJsdoc' }],
    },
    {
      code: '// not a JSDoc block\nexport function Foo() {}',
      errors: [{ messageId: 'missingJsdoc' }],
    },
  ],
});

describe('createGdsConfig enforceExportedJsdoc opt-in', () => {
  it('does not enable require-exported-jsdoc by default', () => {
    const config = createGdsConfig();
    expect(config).toHaveLength(1);
    expect(config[0].rules).not.toHaveProperty('gds/require-exported-jsdoc');
  });

  it('enables require-exported-jsdoc only when opted in', () => {
    const config = createGdsConfig({ enforceExportedJsdoc: true });
    expect(config).toHaveLength(2);
    expect(config[1].rules['gds/require-exported-jsdoc']).toBe('error');
  });

  it('scopes the opt-in rule to the provided jsdocFiles glob', () => {
    const config = createGdsConfig({ enforceExportedJsdoc: true, jsdocFiles: ['src/GdsBreadcrumbs.tsx'] });
    expect(config[1].files).toEqual(['src/GdsBreadcrumbs.tsx']);
  });
});
