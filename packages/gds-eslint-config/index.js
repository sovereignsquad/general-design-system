const RAW_COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgb[a]?\s*\(/;
const RAW_SPACING_PATTERN = /\b(?:padding|margin|gap|radius|borderRadius)\s*:\s*['"`]?\d+(?:px|rem)/;
const FORBIDDEN_IMPORT_PATTERN = /^(?:@\/components\/ui\/|@radix-ui\/|tailwindcss(?:\/|$)|lucide-react$)/;

function shouldIgnoreFile(filename = '') {
  return /(?:^|\/)(?:dist|coverage|node_modules)\//.test(filename);
}

const rules = {
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
          if (typeof source === 'string' && FORBIDDEN_IMPORT_PATTERN.test(source)) {
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

export const gdsPlugin = {
  meta: {
    name: '@gds/eslint-config',
  },
  rules,
};

export const gdsConfig = [
  {
    plugins: {
      gds: gdsPlugin,
    },
    rules: {
      'gds/no-raw-design-values': 'error',
      'gds/no-forbidden-ui-imports': 'error',
    },
  },
];

export default gdsConfig;
