import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage']);
const RAW_COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgb[a]?\s*\(/;
const IMPORT_SOURCE_PATTERN = /(?:import\s+[^'"]*?from\s*|import\s*)['"]([^'"]+)['"]/g;
const DEFAULT_FORBIDDEN_IMPORTS = ['@/components/ui/', '@radix-ui/', 'tailwindcss', 'lucide-react'];
const DEFAULT_STALE_DOCUMENTATION_REFERENCES = [
  '/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM',
  'GENERAL_DESIGN_SYSTEM',
];
const STRICT_COMPLIANCE_FIELDS = [
  'approvedShellPrimitives',
  'approvedDetailPrimitives',
  'approvedListingPrimitives',
  'approvedActionPrimitives',
  'approvedTemporaryExceptions',
];

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

  for (const [field, value] of Object.entries({
    documentationPaths: manifest.compliance?.documentationPaths ?? [],
    staleDocumentationReferences: manifest.compliance?.staleDocumentationReferences ?? [],
    protectedSurfacePaths: manifest.compliance?.protectedSurfacePaths ?? [],
    bannedImports: manifest.compliance?.bannedImports ?? [],
  })) {
    if (!Array.isArray(value)) {
      findings.push({
        rule: 'manifest.invalidComplianceConfig',
        severity: 'error',
        message: `compliance.${field} must be an array when provided.`,
      });
    }
  }

  if (manifest.compliance?.strictMode != null && typeof manifest.compliance.strictMode !== 'boolean') {
    findings.push({
      rule: 'manifest.invalidComplianceConfig',
      severity: 'error',
      message: 'compliance.strictMode must be a boolean when provided.',
    });
  }

  for (const field of STRICT_COMPLIANCE_FIELDS) {
    const value = manifest.compliance?.[field];
    if (value != null && !Array.isArray(value)) {
      findings.push({
        rule: 'manifest.invalidComplianceConfig',
        severity: 'error',
        message: `compliance.${field} must be an array when provided.`,
      });
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

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function isForbiddenImport(source, allowedImports, forbiddenImports) {
  if (allowedImports.has(source)) {
    return false;
  }

  return forbiddenImports.some((entry) => {
    if (entry.endsWith('/')) {
      return source.startsWith(entry);
    }
    if (entry === 'tailwindcss') {
      return source === 'tailwindcss' || source.startsWith('tailwindcss/');
    }
    return source === entry;
  });
}

function scanSourceFile(filePath, allowedImports, forbiddenImports) {
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
    if (source && isForbiddenImport(source, allowedImports, forbiddenImports)) {
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

function scanDocumentationFile(filePath, staleReferences) {
  const findings = [];
  const content = readFileSync(filePath, 'utf8');

  for (const staleReference of staleReferences) {
    if (staleReference && content.includes(staleReference)) {
      findings.push({
        rule: 'stale-documentation-reference',
        severity: 'error',
        file: filePath,
        message: `Stale GDS reference detected (${staleReference}). Update local docs to the active SSOT structure.`,
      });
    }
  }

  return findings;
}

function inferStrictSurface(contract) {
  const normalized = contract.toLowerCase();
  if (normalized.includes('shell')) return 'shell';
  if (normalized.includes('detail') || normalized.includes('profile')) return 'detail';
  if (normalized.includes('card') || normalized.includes('listing')) return 'listing';
  if (normalized.includes('action') || normalized.includes('button')) return 'action';
  return null;
}

function runStrictCompliance({ manifest, manifestRoot, sourceFiles }) {
  const findings = [];
  const strict = manifest.compliance ?? {};
  const approvedBySurface = {
    shell: new Set(strict.approvedShellPrimitives ?? []),
    detail: new Set(strict.approvedDetailPrimitives ?? []),
    listing: new Set(strict.approvedListingPrimitives ?? []),
    action: new Set(strict.approvedActionPrimitives ?? []),
  };
  const approvedTemporaryExceptions = new Set(strict.approvedTemporaryExceptions ?? []);

  for (const adapter of manifest.localAdapters ?? []) {
    if (!['active', 'exception'].includes(adapter.status)) {
      continue;
    }

    const surface = inferStrictSurface(adapter.contract);
    if (!surface) {
      continue;
    }

    if (approvedBySurface[surface].has(adapter.contract) || approvedTemporaryExceptions.has(adapter.contract)) {
      continue;
    }

    findings.push({
      rule: `strict.${surface}.local-adapter`,
      severity: 'error',
      file: adapter.path,
      message: `Strict mode forbids local ${surface} adapter "${adapter.contract}". Migrate to the approved GDS primitive or declare a reviewed temporary exception.`,
    });
  }

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath, 'utf8');

    if (/AppShell\s+as\s+MantineAppShell|<MantineAppShell\b|from\s+['"]@mantine\/core['"][\s\S]{0,120}AppShell/.test(content)) {
      findings.push({
        rule: 'strict.shell.mantine-app-shell',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local Mantine AppShell wrappers. Use DiscoveryShell or the approved GDS shell wrapper.',
      });
    }

    if (/(interface|type)\s+\w*(ActionBar|ButtonGroup|ButtonStack|Cta)\w*\s*[\{=]|export function \w*(ActionBar|ButtonGroup|ButtonStack|Cta)\w*/.test(content)
      && /from\s+['"]@mantine\/core['"][\s\S]{0,200}\bButton\b/.test(content)
      && !/from\s+['"]@doneisbetter\/gds-core['"][\s\S]{0,200}\bActionBar\b/.test(content)) {
      findings.push({
        rule: 'strict.action.legacy-wrapper',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local button/action wrapper implementations. Use the canonical GDS ActionBar and semantic actions.',
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
  const documentationPaths = manifest.compliance?.documentationPaths ?? [];
  const staleDocumentationReferences = [
    ...DEFAULT_STALE_DOCUMENTATION_REFERENCES,
    ...(manifest.compliance?.staleDocumentationReferences ?? []),
  ];
  const protectedSurfacePaths = manifest.compliance?.protectedSurfacePaths ?? [];
  const forbiddenImports = [
    ...DEFAULT_FORBIDDEN_IMPORTS,
    ...(manifest.compliance?.bannedImports ?? []),
  ];
  const strictMode = manifest.compliance?.strictMode === true;

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

  for (const documentationPath of documentationPaths) {
    const absoluteDocumentationPath = resolve(manifestRoot, documentationPath);
    if (!existsSync(absoluteDocumentationPath)) {
      findings.push({
        rule: 'missing-documentation-path',
        severity: 'error',
        file: documentationPath,
        message: `Declared documentation path does not exist: ${documentationPath}`,
      });
      continue;
    }

    findings.push(...scanDocumentationFile(absoluteDocumentationPath, staleDocumentationReferences));
  }

  for (const protectedSurfacePath of protectedSurfacePaths) {
    const absoluteProtectedSurfacePath = resolve(manifestRoot, protectedSurfacePath);
    if (!existsSync(absoluteProtectedSurfacePath)) {
      findings.push({
        rule: 'missing-protected-surface',
        severity: 'error',
        file: protectedSurfacePath,
        message: `Declared protected surface path does not exist: ${protectedSurfacePath}`,
      });
    }
  }

  const sourceFiles = walk(manifestRoot);
  for (const filePath of sourceFiles) {
    findings.push(...scanSourceFile(filePath, allowedImports, forbiddenImports));
  }

  if (protectedSurfacePaths.length) {
    const normalizedProtectedSurfacePaths = protectedSurfacePaths.map((value) => normalizePath(resolve(manifestRoot, value)));

    for (const filePath of sourceFiles) {
      const normalizedFilePath = normalizePath(filePath);
      const isProtectedSurface = normalizedProtectedSurfacePaths.some((protectedSurfacePath) =>
        normalizedFilePath === protectedSurfacePath || normalizedFilePath.startsWith(`${protectedSurfacePath}/`));

      if (!isProtectedSurface) {
        continue;
      }

      const content = readFileSync(filePath, 'utf8');
      if (/className\s*=\s*["'`][^"'`]*(?:bg-|text-|border-|rounded-|shadow-|grid |flex |px-|py-|mx-|my-)/.test(content)) {
        findings.push({
          rule: 'protected-surface-utility-drift',
          severity: 'warn',
          file: filePath,
          message: 'Protected surface contains utility-style className tokens. Prefer canonical GDS surfaces or Mantine-native styling for governed files.',
        });
      }
    }
  }

  if (strictMode) {
    findings.push(...runStrictCompliance({ manifest, manifestRoot, sourceFiles }));
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
