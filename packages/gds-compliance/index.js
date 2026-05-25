import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage']);
const RAW_COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgb[a]?\s*\(/;
const IMPORT_SOURCE_PATTERN = /(?:import\s+[^'"]*?from\s*|import\s*)['"]([^'"]+)['"]/g;
const DEFAULT_FORBIDDEN_IMPORTS = ['@/components/ui/', '@radix-ui/', 'tailwindcss', 'lucide-react'];

export function validateManifest(manifest) {
  const findings = [];

  const requiredFields = [
    'schemaVersion',
    'gdsVersion',
    'productArchetype',
    'requiredContracts',
    'localAdapters',
    'approvedExceptions',
    'migrationStatus',
    'owner',
    'lastReviewedAt',
  ];

  for (const field of requiredFields) {
    if (!(field in manifest)) {
      findings.push({
        rule: 'manifest.missingField',
        severity: 'error',
        message: `Missing required manifest field: ${field}`,
      });
    }
  }

  for (const exception of manifest.approvedExceptions ?? []) {
    for (const field of ['surface', 'reason', 'owner', 'reviewDate']) {
      if (!exception[field]) {
        findings.push({
          rule: 'manifest.invalidException',
          severity: 'error',
          message: `Approved exception is missing ${field}.`,
        });
      }
    }
  }

  return findings;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      walk(join(dir, entry.name), files);
      continue;
    }

    if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function isForbiddenImport(source, allowedImports) {
  if (allowedImports.has(source)) {
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

function scanSourceFile(filePath, allowedImports) {
  const findings = [];
  const content = readFileSync(filePath, 'utf8');

  if (!/(?:^|\/)(?:theme|tokens)\//.test(filePath) && RAW_COLOR_PATTERN.test(content)) {
    findings.push({
      rule: 'forbidden-color',
      severity: 'error',
      file: filePath,
      message: 'Raw color literal found outside approved theme/token files.',
    });
  }

  for (const match of content.matchAll(IMPORT_SOURCE_PATTERN)) {
    const source = match[1];
    if (source && isForbiddenImport(source, allowedImports)) {
      findings.push({
        rule: 'forbidden-import',
        severity: 'error',
        file: filePath,
        message: `Forbidden UI import detected (${source}); use canonical GDS surfaces instead.`,
      });
    }
  }

  return findings;
}

export function runComplianceCheck({ manifestPath }) {
  const absoluteManifestPath = resolve(manifestPath);
  const manifestRoot = dirname(absoluteManifestPath);
  const manifest = JSON.parse(readFileSync(absoluteManifestPath, 'utf8'));
  const findings = validateManifest(manifest);
  const allowedImports = new Set();

  for (const exception of manifest.approvedExceptions ?? []) {
    if (exception.dependency) {
      allowedImports.add(exception.dependency);
    }
    for (const value of exception.allowImports ?? []) {
      allowedImports.add(value);
    }
  }

  for (const adapter of manifest.localAdapters ?? []) {
    if (adapter.status === 'active' || adapter.status === 'exception') {
      const adapterPath = resolve(manifestRoot, adapter.path);
      if (!existsSync(adapterPath)) {
        findings.push({
          rule: 'missing-adapter',
          severity: 'error',
          file: adapter.path,
          message: `Declared adapter path does not exist: ${adapter.path}`,
        });
      }
    }
  }

  const sourceFiles = walk(manifestRoot);
  for (const filePath of sourceFiles) {
    findings.push(...scanSourceFile(filePath, allowedImports));
  }

  return {
    manifest,
    findings,
  };
}

export function formatReport(report, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  if (!report.findings.length) {
    return `GDS compliance check passed for ${report.manifest.owner}.`;
  }

  return [
    `GDS compliance check found ${report.findings.length} issue(s):`,
    ...report.findings.map((finding) => {
      const location = finding.file ? ` (${finding.file})` : '';
      return `- [${finding.severity}] ${finding.rule}${location}: ${finding.message}`;
    }),
  ].join('\n');
}

export function ensureManifestExists(manifestPath) {
  const absoluteManifestPath = resolve(manifestPath);
  if (!existsSync(absoluteManifestPath) || !statSync(absoluteManifestPath).isFile()) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  return absoluteManifestPath;
}
