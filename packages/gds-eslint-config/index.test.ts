import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { Linter, RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { createGdsConfig } from './index.js';
import { ACCENT_BACKGROUND_VARIABLES } from './generated-accent-background-vars.js';

function getRule(name: string, options = {}) {
  const base = createRulesFor(options);
  return base[name];
}

function createRulesFor(options: Record<string, unknown>) {
  return createGdsConfig(options)[0].plugins.gds.rules;
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

const noAccentAsBackground = getRule('no-accent-as-background', {
  accentBackgroundVariables: ['--gds-brand-accent', '--gds-state-danger'],
});
ruleTester.run('no-accent-as-background', noAccentAsBackground, {
  valid: [
    // Accent token used as text color, not background -- explicitly allowed (issue #647).
    { code: "const style = { color: 'var(--gds-brand-accent)' };" },
    // A dominant-classed token as background is exactly the intended usage.
    { code: "const style = { background: 'var(--gds-bg-page)' };" },
    // Substring of a longer, unrelated variable name -- must not match at a name boundary.
    { code: "const style = { background: 'var(--gds-brand-accent-tint)' };" },
  ],
  invalid: [
    {
      code: "const style = { background: 'var(--gds-brand-accent)' };",
      errors: [{ messageId: 'accentAsBackground', data: { token: '--gds-brand-accent' } }],
    },
    {
      code: "const style = { backgroundColor: 'var(--gds-state-danger)' };",
      errors: [{ messageId: 'accentAsBackground', data: { token: '--gds-state-danger' } }],
    },
    {
      code: "const css = `background: var(--gds-brand-accent);`;",
      errors: [{ messageId: 'accentAsBackground', data: { token: '--gds-brand-accent' } }],
    },
  ],
});

const noAccentAsBackgroundWithException = getRule('no-accent-as-background', {
  accentBackgroundVariables: ['--gds-brand-accent'],
  allowedAccentBackgrounds: ['--gds-brand-accent'],
});
ruleTester.run('no-accent-as-background (with allowedAccentBackgrounds)', noAccentAsBackgroundWithException, {
  valid: [
    { code: "const style = { background: 'var(--gds-brand-accent)' };" },
  ],
  invalid: [],
});

describe('no-accent-as-background configuration', () => {
  it('is absent from createGdsConfig when accentBackgroundVariables is not provided', () => {
    const config = createGdsConfig();
    expect(config).toHaveLength(1);
    expect(config[0].rules).not.toHaveProperty('gds/no-accent-as-background');
  });

  it('is enabled once accentBackgroundVariables is provided', () => {
    const config = createGdsConfig({ accentBackgroundVariables: ACCENT_BACKGROUND_VARIABLES });
    const accentConfig = config.find((entry) => entry.rules?.['gds/no-accent-as-background']);
    expect(accentConfig?.rules['gds/no-accent-as-background']).toBe('error');
  });

  it('throws at config-build time for an explicitly empty accentBackgroundVariables list', () => {
    expect(() => createRulesFor({ accentBackgroundVariables: [] })).toThrow(/makes the rule fire on nothing/);
  });

  it('does not throw when accentBackgroundVariables is simply omitted', () => {
    expect(() => createRulesFor({})).not.toThrow();
  });
});

describe('no-accent-as-background against real monorepo source (issue #647)', () => {
  const root = resolve(import.meta.dirname, '../..');

  function collectSourceFiles(dir: string) {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...collectSourceFiles(fullPath));
      } else if (/\.tsx?$/.test(entry) && !/\.test\.[jt]sx?$/.test(entry)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  function lintFiles(files: string[], options: Record<string, unknown>) {
    const linter = new Linter({ cwd: root });
    const rule = getRule('no-accent-as-background', options);
    const parser = tseslint.parser;
    const findings: Array<{ file: string; message: string }> = [];
    for (const file of files) {
      const code = readFileSync(file, 'utf8');
      const relativeFile = file.slice(root.length + 1);
      const messages = linter.verify(code, [{
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: { parser, ecmaVersion: 2022, sourceType: 'module' },
        plugins: { gds: { rules: { 'no-accent-as-background': rule } } },
        rules: { 'gds/no-accent-as-background': 'error' },
      }], relativeFile);
      for (const message of messages) {
        if (message.ruleId !== 'gds/no-accent-as-background') continue;
        findings.push({ file, message: message.message });
      }
    }
    return findings;
  }

  const sourceFiles = [
    ...collectSourceFiles(resolve(root, 'packages/gds-core/src')),
    ...collectSourceFiles(resolve(root, 'packages/gds-admin/src')),
    ...collectSourceFiles(resolve(root, 'apps/playground/src')),
  ];

  it('flags exactly the known deliberate accent-as-background usage without an exception', () => {
    const findings = lintFiles(sourceFiles, { accentBackgroundVariables: ACCENT_BACKGROUND_VARIABLES });
    const files = new Set(findings.map((f) => f.file.split('/').pop()));
    // Every one of these is a small, scarce, high-signal fill -- a CTA button
    // (SemanticButton), an active-tab indicator (BottomTabBar), and two compact Badge
    // components (FitScoreChip, MeaningBadge) whose entire purpose is to render an
    // accent-classed color as a small chip. This is the textbook intended use of an
    // accent token, not a violation of 60-30-10's scarcity intent -- confirmed by
    // reading each definition site (issue #647). Documented, reviewed exceptions below.
    expect(files).toEqual(new Set(['BottomTabBar.tsx', 'FitScoreChip.tsx', 'MeaningBadge.tsx', 'SemanticButton.tsx']));
  });

  it('produces zero findings once the reviewed exceptions are declared', () => {
    const findings = lintFiles(sourceFiles, {
      accentBackgroundVariables: ACCENT_BACKGROUND_VARIABLES,
      // --gds-brand-accent: CTA button fill (SemanticButton) and active-tab/badge fills
      // (BottomTabBar, FitScoreChip). --gds-state-success: a Badge success-variant fill
      // (MeaningBadge), reached via a var() fallback chain.
      allowedAccentBackgrounds: ['--gds-brand-accent', '--gds-state-success'],
    });
    expect(findings).toEqual([]);
  });
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
