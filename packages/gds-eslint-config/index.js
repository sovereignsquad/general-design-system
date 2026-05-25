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
  return [
    {
      plugins: {
        gds: {
          meta: {
            name: '@gds/eslint-config',
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
}

export const gdsConfig = createGdsConfig();

export default gdsConfig;
