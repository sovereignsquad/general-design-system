const RAW_COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgb[a]?\s*\(/;
const RAW_SPACING_PATTERN = /\b(?:padding|margin|gap|radius|borderRadius)\s*:\s*['"`]?\d+(?:px|rem)/;
const DEFAULT_FORBIDDEN_IMPORTS = ['@/components/ui/', '@radix-ui/', 'tailwindcss', 'lucide-react'];

function shouldIgnoreFile(filename = '') {
  return /(?:^|\/)(?:dist|coverage|node_modules)\//.test(filename);
}

function isForbiddenImport(source, allowedImports) {
  if (allowedImports.includes(source)) {
    return false;
  }

  return DEFAULT_FORBIDDEN_IMPORTS.some((entry) => {
    if (entry.endsWith('/')) {
      return source.startsWith(entry);
    }
    if (entry === 'tailwindcss') {
      return source === 'tailwindcss' || source.startsWith('tailwindcss/');
    }
    return source === entry;
  });
}

const BACKGROUND_PROP_PATTERN = /\b(?:background|backgroundColor|background-color|bg)\s*[:=]/;

/** True if `token` (a `--gds-*` variable name) appears in `text` at a name boundary -- not as a prefix of a longer, unrelated variable name (e.g. `--gds-brand-accent-tint`). */
function containsAccentToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`).test(text);
}

function createNoAccentAsBackgroundRule(options) {
  const accentVars = options.accentBackgroundVariables ?? [];
  const allowedAccentBackgrounds = options.allowedAccentBackgrounds ?? [];

  if (options.accentBackgroundVariables !== undefined && accentVars.length === 0) {
    throw new Error(
      'gds-eslint-config: no-accent-as-background was configured with accentBackgroundVariables: [] -- ' +
      'an empty list makes the rule fire on nothing. Pass the real list (see ' +
      '@sovereignsquad/gds-eslint-config/generated-accent-background-vars.js) or omit the option to leave the rule off.',
    );
  }

  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid accent-classed GDS tokens (scarce by design intent, issue #644) as a background fill.',
      },
      schema: [],
      messages: {
        accentAsBackground:
          'Token "{{token}}" is classified accent (issue #644) -- meant to be scarce, never a background ' +
          'fill. Use a dominant- or secondary-classed token, or add a reviewed entry to allowedAccentBackgrounds ' +
          'if this is deliberate.',
      },
    },
    create(context) {
      const filename = context.filename ?? '';
      if (shouldIgnoreFile(filename) || accentVars.length === 0) {
        return {};
      }

      const checkText = (node, text) => {
        if (!BACKGROUND_PROP_PATTERN.test(text)) return;
        for (const token of accentVars) {
          if (allowedAccentBackgrounds.includes(token)) continue;
          if (containsAccentToken(text, token)) {
            context.report({ node, messageId: 'accentAsBackground', data: { token } });
          }
        }
      };

      return {
        Property(node) {
          const keyText = node.key.type === 'Identifier' ? node.key.name : node.key.value;
          if (typeof keyText !== 'string' || !/^(?:background|backgroundColor|background-color|bg)$/.test(keyText)) {
            return;
          }
          if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
            checkText(node, `${keyText}: ${node.value.value}`);
          } else if (node.value.type === 'TemplateLiteral') {
            checkText(node, `${keyText}: ${context.sourceCode.getText(node.value)}`);
          }
        },
        TemplateElement(node) {
          checkText(node, node.value.raw);
        },
      };
    },
  };
}

function createRules(options = {}) {
  const allowedImports = options.allowedImports ?? [];

  return {
  'no-raw-design-values': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid raw colors and spacing/radius values in feature UI code.',
      },
      schema: [],
      messages: {
        rawColor: 'Use GDS theme tokens instead of raw color literals in feature UI code.',
        rawSpacing: 'Use GDS spacing and radius tokens instead of hard-coded layout values in feature UI code.',
      },
    },
    create(context) {
      const filename = context.filename ?? '';
      if (shouldIgnoreFile(filename) || /(?:^|\/)(?:theme|tokens)\//.test(filename)) {
        return {};
      }

      const reportNode = (node, messageId) => {
        context.report({ node, messageId });
      };

      return {
        Literal(node) {
          if (typeof node.value !== 'string') {
            return;
          }

          if (RAW_COLOR_PATTERN.test(node.value)) {
            reportNode(node, 'rawColor');
          }

          if (RAW_SPACING_PATTERN.test(node.value)) {
            reportNode(node, 'rawSpacing');
          }
        },
        TemplateElement(node) {
          if (RAW_COLOR_PATTERN.test(node.value.raw)) {
            reportNode(node, 'rawColor');
          }

          if (RAW_SPACING_PATTERN.test(node.value.raw)) {
            reportNode(node, 'rawSpacing');
          }
        },
      };
    },
  },
  'require-exported-jsdoc': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Require a JSDoc comment on top-level exported components, hooks, and functions.',
      },
      schema: [],
      messages: {
        missingJsdoc: 'Exported {{kind}} "{{name}}" needs a JSDoc comment explaining what it does and when to use it.',
      },
    },
    create(context) {
      const filename = context.filename ?? '';
      if (shouldIgnoreFile(filename) || /\.test\.[jt]sx?$/.test(filename)) {
        return {};
      }

      const sourceCode = context.sourceCode ?? context.getSourceCode();

      const hasLeadingJsdoc = (node) => {
        const comments = sourceCode.getCommentsBefore(node);
        const last = comments[comments.length - 1];
        return Boolean(last && last.type === 'Block' && last.value.startsWith('*'));
      };

      const checkDeclaration = (node, kind, name) => {
        if (!name || !hasLeadingJsdoc(node)) {
          if (name) {
            context.report({ node, messageId: 'missingJsdoc', data: { kind, name } });
          }
        }
      };

      return {
        ExportNamedDeclaration(node) {
          const decl = node.declaration;
          if (!decl) return;

          if (decl.type === 'FunctionDeclaration') {
            checkDeclaration(node, 'function', decl.id?.name);
          } else if (decl.type === 'ClassDeclaration') {
            checkDeclaration(node, 'class', decl.id?.name);
          } else if (decl.type === 'TSInterfaceDeclaration') {
            checkDeclaration(node, 'interface', decl.id?.name);
          } else if (decl.type === 'VariableDeclaration') {
            for (const declarator of decl.declarations) {
              if (declarator.id?.type === 'Identifier') {
                checkDeclaration(node, 'export', declarator.id.name);
              }
            }
          }
        },
      };
    },
  },
  'no-forbidden-ui-imports': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid legacy or non-approved UI imports where GDS should be used.',
      },
      schema: [],
      messages: {
        forbiddenImport: 'Import from canonical GDS surfaces instead of {{source}}.',
      },
    },
    create(context) {
      const filename = context.filename ?? '';
      if (shouldIgnoreFile(filename)) {
        return {};
      }

      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (typeof source === 'string' && isForbiddenImport(source, allowedImports)) {
            context.report({
              node,
              messageId: 'forbiddenImport',
              data: { source },
            });
          }
        },
      };
    },
  },
  'no-accent-as-background': createNoAccentAsBackgroundRule(options),
  };
}

export function resolveAllowedImports(manifest = {}) {
  const imports = new Set();
  for (const exception of manifest.approvedExceptions ?? []) {
    if (exception.dependency) {
      imports.add(exception.dependency);
    }
    for (const value of exception.allowImports ?? []) {
      imports.add(value);
    }
  }
  return [...imports];
}

export function createGdsConfig(options = {}) {
  const rules = createRules(options);
  const config = [
    {
      plugins: {
        gds: {
          meta: {
            name: '@sovereignsquad/gds-eslint-config',
          },
          rules,
        },
      },
      rules: {
        'gds/no-raw-design-values': 'error',
        'gds/no-forbidden-ui-imports': 'error',
      },
    },
  ];

  // Opt-in only: not enabled by default yet. Turning this on repo-wide today
  // would fail the zero-tolerance lint gate against the ~891 currently
  // undocumented public exports found by the JSDoc backfill audit (issue
  // #414). A consuming package's own eslint.config.js can enable it early,
  // scoped to files it has already backfilled, via `jsdocFiles`.
  if (options.enforceExportedJsdoc) {
    config.push({
      files: options.jsdocFiles ?? ['**/*.{ts,tsx}'],
      rules: {
        'gds/require-exported-jsdoc': 'error',
      },
    });
  }

  // Opt-in: the rule has no default variable list to check against. Pass
  // accentBackgroundVariables (see generated-accent-background-vars.js) to enable it.
  if (options.accentBackgroundVariables) {
    config.push({
      rules: {
        'gds/no-accent-as-background': 'error',
      },
    });
  }

  return config;
}

export const gdsConfig = createGdsConfig();

export default gdsConfig;
