import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';
import { ACCENT_BACKGROUND_VARIABLES } from './generated-accent-background-vars.js';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage']);
const RAW_COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgb[a]?\s*\(/;
const INLINE_COLOR_STYLE_PATTERN = /style\s*=\s*\{\s*\{[\s\S]{0,700}\b(?:color|background|backgroundColor|borderColor|fill|stroke)\s*:\s*['"`](?!var\(|currentColor\b|inherit\b|transparent\b|unset\b|none\b)[^'"`]+['"`]/;
const NON_TOKEN_RADIUS_PATTERN = /\b(?:borderRadius|radius)\s*[:=]\s*(?:\{\s*)?(?:['"]?\d+(?:\.\d+)?(?:px|rem)?['"]?|\d+(?:\.\d+)?)/;
const IMPORT_SOURCE_PATTERN = /(?:import\s+[^'"]*?from\s*|import\s*)['"]([^'"]+)['"]/g;
const DEFAULT_FORBIDDEN_IMPORTS = ['@/components/ui/', '@radix-ui/', 'tailwindcss', 'lucide-react'];
const STRICT_RULE_METADATA = {
  'strict.import.mantine-core': {
    family: 'package-import',
    allowedExceptionCategories: ['package-coverage-gap', 'migration-bridge', 'dependency-boundary'],
    remediation: 'Use package-native GDS primitives instead of direct @mantine/core imports in consumer code.',
  },
  'strict.import.tabler-icons': {
    family: 'package-import',
    allowedExceptionCategories: ['package-coverage-gap', 'migration-bridge', 'dependency-boundary'],
    remediation: 'Use GdsIcon, GdsIcons, or semantic GDS actions instead of direct @tabler/icons-react imports.',
  },
  'strict.raw-control': {
    family: 'raw-control',
    allowedExceptionCategories: ['runtime-constraint', 'package-coverage-gap', 'migration-bridge'],
    remediation: 'Use GDS form, button, action, or public-flow primitives for raw controls.',
  },
  'strict.browser-dialog': {
    family: 'runtime-control',
    allowedExceptionCategories: ['runtime-constraint', 'migration-bridge'],
    remediation: 'Use GDS confirmation and notification contracts instead of alert() or window.confirm().',
  },
  'strict.raw-table': {
    family: 'raw-table',
    allowedExceptionCategories: ['package-coverage-gap', 'migration-bridge'],
    remediation: 'Use AdminDataTable, AdminAnalyticsTable, SimpleDataTable, or AdvancedDataTable.',
  },
  'strict.inline-style': {
    family: 'inline-style',
    allowedExceptionCategories: ['runtime-constraint', 'product-authored-experience', 'package-coverage-gap', 'migration-bridge'],
    remediation: 'Use GdsSafeBox, GdsMediaFrame, GdsOverflowFrame, GdsResponsiveVisibility, GDS layout primitives, or declare a narrow approved exception.',
  },
  'strict.raw-color': {
    family: 'raw-color',
    allowedExceptionCategories: ['product-authored-experience', 'runtime-constraint', 'package-coverage-gap', 'migration-bridge'],
    remediation: 'Move color authority into GDS theme tokens or a reviewed theme ownership lane; consumer code must not contain app-local hex/rgb literals.',
  },
  'strict.inline-color': {
    family: 'inline-color',
    allowedExceptionCategories: ['product-authored-experience', 'runtime-constraint', 'package-coverage-gap', 'migration-bridge'],
    remediation: 'Use semantic GDS tokens, component props, or a governed GDS styling primitive instead of inline color/background/fill/stroke literals.',
  },
  'strict.non-token-radius': {
    family: 'radius-token',
    allowedExceptionCategories: ['product-authored-experience', 'runtime-constraint', 'package-coverage-gap', 'migration-bridge'],
    remediation: 'Use GDS radius tokens or package-native component radius props instead of raw numeric radius values in consumer code.',
  },
  'strict.local-gds-adapter': {
    family: 'local-adapter',
    allowedExceptionCategories: ['package-coverage-gap', 'migration-bridge'],
    remediation: 'Declare the adapter in gds-adoption.json or migrate to a package-native GDS contract.',
  },
  'strict.admin.local-wrapper': {
    family: 'admin-wrapper',
    allowedExceptionCategories: ['package-coverage-gap', 'migration-bridge'],
    remediation: 'Use package-native GDS admin, core, and semantic primitives instead of product-local admin layout, form, card, badge, button, breadcrumb, or field wrappers.',
  },
};
const DEFAULT_STALE_DOCUMENTATION_REFERENCES = [
  '/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM',
  'GENERAL_DESIGN_SYSTEM',
];
const STRICT_COMPLIANCE_FIELDS = [
  'approvedShellPrimitives',
  'approvedDetailPrimitives',
  'approvedListingPrimitives',
  'approvedActionPrimitives',
  'approvedMediaPrimitives',
  'approvedReportingPrimitives',
  'approvedAccessPrimitives',
  'approvedAdminPrimitives',
  'approvedTemporaryExceptions',
  'approvedThemeLanes',
  'themeOwnershipPaths',
];
const DEFAULT_APPROVED_THEME_LANES = [
  'gdsTheme',
  'gdsDarkPublicTheme',
  'gdsFlatSurfaceTheme',
  'gdsEditorialPublicTheme',
  'createPublicBrandTheme',
];
const EXCEPTION_CATEGORIES = new Set([
  'runtime-constraint',
  'product-authored-experience',
  'package-coverage-gap',
  'migration-bridge',
  'dependency-boundary',
]);
const EXCEPTION_STATUSES = new Set(['temporary', 'approved', 'deprecated', 'removed', 'active', 'expired', 'removing']);
const EXCEPTION_REQUIRED_FIELDS = [
  'category',
  'scope',
  'allowedImplementation',
  'mustStillUse',
  'mustNotDo',
  'exitCondition',
  'status',
];
const PRODUCT_AUTHORED_REQUIRED_FIELDS = [
  'a11yRequirements',
  'testingRequirements',
  'observabilityRequirements',
];
const DEPENDENCY_BOUNDARY_REQUIRED_FIELDS = [
  'dependency',
  'replacementIssue',
  'rollbackPlan',
  'riskLevel',
  'enforcementMode',
  'a11yRequirements',
  'testingRequirements',
  'observabilityRequirements',
];
const DEPENDENCY_BOUNDARY_RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const DEPENDENCY_BOUNDARY_ENFORCEMENT_MODES = new Set(['warn', 'error']);
const IDENTITY_PROVIDER_BRANDING_FIELDS = [
  'approvedProviders',
  'forbiddenCustomizations',
  'allowedVariants',
  'colorAuthority',
  'minTouchTargetPx',
  'policyDocument',
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

  const identityProviderBranding = manifest.compliance?.identityProviderBranding;
  if (identityProviderBranding != null) {
    if (typeof identityProviderBranding !== 'object') {
      findings.push({
        rule: 'manifest.invalidComplianceConfig',
        severity: 'error',
        message: 'compliance.identityProviderBranding must be an object when provided.',
      });
    } else {
      if (!Array.isArray(identityProviderBranding.approvedProviders) || identityProviderBranding.approvedProviders.length === 0) {
        findings.push({
          rule: 'manifest.invalidComplianceConfig',
          severity: 'error',
          message: 'compliance.identityProviderBranding.approvedProviders must be a non-empty array.',
        });
      }

      for (const field of IDENTITY_PROVIDER_BRANDING_FIELDS) {
        const value = identityProviderBranding[field];
        if (value == null) {
          continue;
        }

        if ((field === 'forbiddenCustomizations' || field === 'allowedVariants') && !Array.isArray(value)) {
          findings.push({
            rule: 'manifest.invalidComplianceConfig',
            severity: 'error',
            message: `compliance.identityProviderBranding.${field} must be an array when provided.`,
          });
        }
      }

      if (Array.isArray(identityProviderBranding.allowedVariants)) {
        const invalidVariants = identityProviderBranding.allowedVariants.filter((value) => !['solid', 'outline', 'neutral'].includes(String(value).trim().toLowerCase()));
        if (invalidVariants.length > 0) {
          findings.push({
            rule: 'manifest.invalidComplianceConfig',
            severity: 'error',
            message: `compliance.identityProviderBranding.allowedVariants contains invalid values: ${invalidVariants.join(', ')}.`,
          });
        }
      }

      if (Array.isArray(identityProviderBranding.forbiddenCustomizations)) {
        const hasNonStringCustomization = identityProviderBranding.forbiddenCustomizations.some((value) => typeof value !== 'string');
        if (hasNonStringCustomization) {
          findings.push({
            rule: 'manifest.invalidComplianceConfig',
            severity: 'error',
            message: 'compliance.identityProviderBranding.forbiddenCustomizations may only contain strings.',
          });
        }
      }

      if (identityProviderBranding.minTouchTargetPx != null &&
          (typeof identityProviderBranding.minTouchTargetPx !== 'number' || identityProviderBranding.minTouchTargetPx < 24)) {
        findings.push({
          rule: 'manifest.invalidComplianceConfig',
          severity: 'error',
          message: 'compliance.identityProviderBranding.minTouchTargetPx must be >= 24 when provided.',
        });
      }

      if (identityProviderBranding.colorAuthority != null && !['provider', 'gds-outline', 'gds-neutral'].includes(identityProviderBranding.colorAuthority)) {
        findings.push({
          rule: 'manifest.invalidComplianceConfig',
          severity: 'error',
          message: 'compliance.identityProviderBranding.colorAuthority must be one of: provider, gds-outline, gds-neutral.',
        });
      }

      if (identityProviderBranding.policyDocument != null && typeof identityProviderBranding.policyDocument !== 'string') {
        findings.push({
          rule: 'manifest.invalidComplianceConfig',
          severity: 'error',
          message: 'compliance.identityProviderBranding.policyDocument must be a string when provided.',
        });
      }
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

function hasBroadScope(scope) {
  return scope.some((entry) =>
    ['*', '**', 'app/**', 'src/**', './**', '/**'].includes(entry) || /(^|\/)\*\*$/.test(entry));
}

function parseDateInput(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(now, future) {
  return Math.ceil((future.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getCurrentDate(input) {
  return parseDateInput(input) ?? new Date();
}

function validateApprovedExceptions(manifest, currentDate) {
  const findings = [];

  for (const exception of manifest.approvedExceptions ?? []) {
    const missingFields = EXCEPTION_REQUIRED_FIELDS.filter((field) => {
      const value = exception[field];
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return !value;
    });

    if (missingFields.length > 0) {
      findings.push({
        rule: 'exception-required-fields',
        severity: 'error',
        file: exception.surface,
        message: `Approved exception "${exception.surface}" must define ${missingFields.join(', ')}. Upgrade legacy exception entries to the canonical exception-surface contract.`,
      });
      continue;
    }

    if (!EXCEPTION_CATEGORIES.has(exception.category)) {
      findings.push({
        rule: 'exception-invalid-category',
        severity: 'error',
        file: exception.surface,
        message: `Approved exception "${exception.surface}" uses unsupported category "${exception.category}".`,
      });
    }

    if (!EXCEPTION_STATUSES.has(exception.status)) {
      findings.push({
        rule: 'exception-invalid-status',
        severity: 'error',
        file: exception.surface,
        message: `Approved exception "${exception.surface}" uses unsupported status "${exception.status}".`,
      });
    }

    if (hasBroadScope(exception.scope ?? [])) {
      findings.push({
        rule: 'exception-broad-scope',
        severity: 'error',
        file: exception.surface,
        message: `Approved exception "${exception.surface}" has an over-broad scope. Exception scopes must stay narrow and reviewable.`,
      });
    }

    if (exception.category === 'product-authored-experience') {
      const missingProductAuthoredFields = PRODUCT_AUTHORED_REQUIRED_FIELDS.filter((field) => {
        const value = exception[field];
        return !Array.isArray(value) || value.length === 0;
      });

      if (missingProductAuthoredFields.length > 0) {
        findings.push({
          rule: 'exception-product-authored-metadata',
          severity: 'error',
          file: exception.surface,
          message: `Creator-authored experience exception "${exception.surface}" must define ${missingProductAuthoredFields.join(', ')} so accessibility, testing, and observability obligations remain explicit.`,
        });
      }
    }

    if (exception.category === 'dependency-boundary') {
      const missingDependencyFields = DEPENDENCY_BOUNDARY_REQUIRED_FIELDS.filter((field) => {
        const value = exception[field];
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        return !value;
      });

      if (missingDependencyFields.length > 0) {
        findings.push({
          rule: 'dependency-boundary.missing-metadata',
          severity: 'error',
          file: exception.surface,
          message: `Dependency-boundary exception "${exception.surface}" must define ${missingDependencyFields.join(', ')} so dependency drift remains owned, testable, observable, and recoverable.`,
        });
      }

      if (exception.riskLevel && !DEPENDENCY_BOUNDARY_RISK_LEVELS.has(exception.riskLevel)) {
        findings.push({
          rule: 'dependency-boundary.invalid-risk-level',
          severity: 'error',
          file: exception.surface,
          message: `Dependency-boundary exception "${exception.surface}" uses unsupported risk level "${exception.riskLevel}".`,
        });
      }

      if (exception.enforcementMode && !DEPENDENCY_BOUNDARY_ENFORCEMENT_MODES.has(exception.enforcementMode)) {
        findings.push({
          rule: 'dependency-boundary.invalid-enforcement-mode',
          severity: 'error',
          file: exception.surface,
          message: `Dependency-boundary exception "${exception.surface}" uses unsupported enforcement mode "${exception.enforcementMode}".`,
        });
      }

      if (exception.status === 'expired') {
        findings.push({
          rule: 'dependency-boundary.expired',
          severity: 'error',
          file: exception.surface,
          message: `Dependency-boundary exception "${exception.surface}" is expired. Remove the dependency bypass or update it through reviewed governance.`,
        });
      }

      const removeBy = parseDateInput(exception.removeBy);
      if (removeBy) {
        const remainingDays = daysBetween(currentDate, removeBy);
        if (remainingDays < 0) {
          findings.push({
            rule: 'dependency-boundary.remove-by-expired',
            severity: exception.enforcementMode === 'warn' ? 'warn' : 'error',
            file: exception.surface,
            message: `Dependency-boundary exception "${exception.surface}" passed removeBy ${exception.removeBy}. Remove the bypass or renew reviewed governance metadata.`,
          });
        } else if (remainingDays <= 14) {
          findings.push({
            rule: 'dependency-boundary.remove-by-soon',
            severity: 'warn',
            file: exception.surface,
            message: `Dependency-boundary exception "${exception.surface}" reaches removeBy ${exception.removeBy} in ${remainingDays} day(s).`,
          });
        }
      }
    }
  }

  return findings;
}

function summarizeFindingSeverity(findings) {
  return findings.reduce((summary, finding) => {
    if (finding.severity === 'error') {
      summary.errors += 1;
    } else {
      summary.warnings += 1;
    }
    return summary;
  }, { errors: 0, warnings: 0 });
}

export function createExceptionLifecycleReport(manifest, options = {}) {
  const currentDate = getCurrentDate(options.currentDate);
  const exceptions = manifest.approvedExceptions ?? [];
  const dependencyExceptions = exceptions.filter((entry) => entry.category === 'dependency-boundary');
  const items = dependencyExceptions.map((entry) => {
    const removeBy = parseDateInput(entry.removeBy);
    const remainingDays = removeBy ? daysBetween(currentDate, removeBy) : null;
    const expiryBucket =
      entry.status === 'expired' || (remainingDays != null && remainingDays < 0)
        ? 'expired'
        : remainingDays != null && remainingDays <= 14
          ? 'expiring-soon'
          : remainingDays != null
            ? 'scheduled'
            : 'unscheduled';

    return {
      surface: entry.surface,
      owner: entry.owner ?? 'unknown',
      dependency: entry.dependency ?? 'unknown',
      replacementIssue: entry.replacementIssue ?? null,
      status: entry.status ?? 'unknown',
      riskLevel: entry.riskLevel ?? 'unknown',
      enforcementMode: entry.enforcementMode ?? 'error',
      removeBy: entry.removeBy ?? null,
      expiryBucket,
      remainingDays,
    };
  });

  const countsByRisk = {};
  const countsByOwner = {};
  const countsByExpiryBucket = {};

  for (const item of items) {
    countsByRisk[item.riskLevel] = (countsByRisk[item.riskLevel] ?? 0) + 1;
    countsByOwner[item.owner] = (countsByOwner[item.owner] ?? 0) + 1;
    countsByExpiryBucket[item.expiryBucket] = (countsByExpiryBucket[item.expiryBucket] ?? 0) + 1;
  }

  return {
    checkedAt: currentDate.toISOString().slice(0, 10),
    totalExceptions: exceptions.length,
    dependencyBoundaryCount: items.length,
    countsByRisk,
    countsByOwner,
    countsByExpiryBucket,
    items,
  };
}

export function createAdoptionReport(report, options = {}) {
  const lifecycle = createExceptionLifecycleReport(report.manifest, options);
  const { errors, warnings } = summarizeFindingSeverity(report.findings);
  const suppressedExceptionDebt = lifecycle.items.reduce((count, item) => (
    item.expiryBucket === 'expired' || item.expiryBucket === 'expiring-soon' ? count + 1 : count
  ), 0);
  const score = Math.max(0, 100 - (errors * 15) - (warnings * 4) - (suppressedExceptionDebt * 6));
  const status = score >= 90 ? 'excellent' : score >= 70 ? 'at-risk' : 'blocked';

  return {
    checkedAt: lifecycle.checkedAt,
    owner: report.manifest.owner,
    score,
    status,
    findings: {
      errors,
      warnings,
      total: report.findings.length,
    },
    exceptionDebt: {
      total: lifecycle.dependencyBoundaryCount,
      expiringSoon: lifecycle.countsByExpiryBucket['expiring-soon'] ?? 0,
      expired: lifecycle.countsByExpiryBucket.expired ?? 0,
    },
    topRemediationSteps: [
      errors > 0 ? 'Resolve blocking compliance findings before promotion.' : null,
      lifecycle.countsByExpiryBucket.expired ? 'Remove or renew expired dependency-boundary exceptions.' : null,
      lifecycle.countsByExpiryBucket['expiring-soon'] ? 'Backfill replacement work for exceptions nearing removeBy.' : null,
      warnings > 0 ? 'Triage remaining warnings and convert accepted gaps into governed exceptions.' : null,
    ].filter(Boolean),
    lifecycle,
  };
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

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern) {
  const normalized = normalizePath(pattern).replace(/^\.\//, '');
  let source = '';

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    source += escapeRegex(char);
  }

  return new RegExp(`^${source}$`);
}

function matchesScope(relativePath, scopes) {
  const normalizedRelativePath = normalizePath(relativePath).replace(/^\.\//, '');
  return scopes.some((scope) => globToRegExp(scope).test(normalizedRelativePath));
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


// Issue 615 — comments are not code, so no content rule may match inside one.
//
// Two releases went red on exactly this: `#600` in a comment (a GitHub issue reference) matched
// the raw-colour pattern as a three-digit hex, and "`<select>`'s options" in a comment matched
// the raw-control pattern as a native element. A hex in a comment ships nothing and renders
// nothing; it is colour authority to no one. The same holds for every content rule here.
//
// A real lexer state machine rather than a regex, because a regex cannot tell `https://` inside
// a string from the start of a line comment — stripping that would blind the import rules to
// half their inputs. String and template-literal CONTENTS are preserved verbatim; comment bodies
// are replaced with spaces so line numbers and match offsets stay meaningful.
function stripComments(source) {
  let out = '';
  let i = 0;
  let state = 'code'; // code | line | block | single | double | template
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; out += '  '; i += 2; continue; }
      if (ch === '/' && next === '*') { state = 'block'; out += '  '; i += 2; continue; }
      if (ch === "'") state = 'single';
      else if (ch === '"') state = 'double';
      else if (ch === '`') state = 'template';
      out += ch; i += 1; continue;
    }
    if (state === 'line') {
      if (ch === '\n') { state = 'code'; out += ch; } else out += ' ';
      i += 1; continue;
    }
    if (state === 'block') {
      if (ch === '*' && next === '/') { state = 'code'; out += '  '; i += 2; continue; }
      out += ch === '\n' ? ch : ' '; i += 1; continue;
    }
    // Inside a string: escapes never end it, and only its own quote does. Template literals are
    // treated as one span — an expression hole can contain nested comments, but a comment inside
    // a hole is rare enough that keeping it beats mis-lexing nested backticks.
    if (ch === '\\') { out += ch + (next ?? ''); i += 2; continue; }
    if ((state === 'single' && ch === "'") || (state === 'double' && ch === '"') || (state === 'template' && ch === '`')) {
      state = 'code';
    }
    out += ch; i += 1; continue;
  }
  return out;
}

function scanSourceFile(filePath, allowedImports, forbiddenImports) {
  const findings = [];
  const content = stripComments(readFileSync(filePath, 'utf8'));

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
  if (normalized.includes('media') || normalized.includes('upload') || normalized.includes('asset')) return 'media';
  if (normalized.includes('report') || normalized.includes('chart') || normalized.includes('evidence') || normalized.includes('metric')) return 'reporting';
  if (normalized.includes('auth') || normalized.includes('access') || normalized.includes('identity') || normalized.includes('login')) return 'access';
  if (normalized.includes('admin') || normalized.includes('form') || normalized.includes('crud') || normalized.includes('workspace')) return 'admin';
  return null;
}

const ADMIN_LOCAL_WRAPPER_NAMES = [
  'Anchor',
  'Badge',
  'Box',
  'Breadcrumbs',
  'Button',
  'Card',
  'Checkbox',
  'Code',
  'ColorField',
  'Field',
  'FileInput',
  'Grid',
  'Group',
  'Image',
  'Paper',
  'Radio',
  'Select',
  'SimpleGrid',
  'Stack',
  'Text',
  'Textarea',
  'TextInput',
  'Title',
  'UnstyledButton',
];

function isAdminStrictSource({ manifest, filePath }) {
  const normalizedPath = normalizePath(filePath);
  const archetype = String(manifest.productArchetype ?? '').toLowerCase();
  return archetype.includes('admin')
    || archetype.includes('hybrid')
    || /(?:^|\/)(?:app|pages|src|components)\/admin(?:\/|$)/.test(normalizedPath)
    || /(?:^|\/)admin\//.test(normalizedPath);
}

function hasLocalAdminWrapperSignature(content) {
  const wrapperAlternation = ADMIN_LOCAL_WRAPPER_NAMES.join('|');
  const localDefinitionPattern = new RegExp(`(?:function|const|let|var)\\s+(?:${wrapperAlternation})\\b|(?:${wrapperAlternation})\\.Group\\s*=|Grid\\.Col\\s*=`);
  if (localDefinitionPattern.test(content)) {
    return true;
  }

  const localImportPattern = new RegExp(`import\\s+\\{[^}]*\\b(?:${wrapperAlternation})\\b[^}]*\\}\\s+from\\s+['"](?:\\.|\\.\\.|@/|~/|src/|components/)`);
  return localImportPattern.test(content);
}

function runStrictCompliance({ manifest, manifestRoot, sourceFiles }) {
  const findings = [];
  const strict = manifest.compliance ?? {};
  const approvedBySurface = {
    shell: new Set(strict.approvedShellPrimitives ?? []),
    detail: new Set(strict.approvedDetailPrimitives ?? []),
    listing: new Set(strict.approvedListingPrimitives ?? []),
    action: new Set(strict.approvedActionPrimitives ?? []),
    media: new Set(strict.approvedMediaPrimitives ?? []),
    reporting: new Set(strict.approvedReportingPrimitives ?? []),
    access: new Set(strict.approvedAccessPrimitives ?? []),
    admin: new Set(strict.approvedAdminPrimitives ?? []),
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
    const content = stripComments(readFileSync(filePath, 'utf8'));

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
      && !/from\s+['"]@sovereignsquad\/gds-core['"][\s\S]{0,200}\bActionBar\b/.test(content)) {
      findings.push({
        rule: 'strict.action.legacy-wrapper',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local button/action wrapper implementations. Use the canonical GDS ActionBar and semantic actions.',
      });
    }

    if (/export function \w*(Listing|Venue|Event|Community|Product|Card)\w*\s*\(/.test(content)
      && /from\s+['"]@mantine\/core['"][\s\S]{0,240}\bCard\b/.test(content)
      && !/from\s+['"]@sovereignsquad\/gds-core['"][\s\S]{0,260}\b(ListingCard|PublicProductCard|PublicFoodCard|MediaCard)\b/.test(content)) {
      findings.push({
        rule: 'strict.listing.local-card-wrapper',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local listing/card wrappers backed by Mantine Card. Use ListingCard, PublicProductCard, PublicFoodCard, or MediaCard.',
      });
    }

    if (/export function \w*(Upload|Media|Asset|ImagePicker|Dropzone)\w*\s*\(/.test(content)
      && (/<input[^>]+type=["']file["']/.test(content) || /\bDropzone\b/.test(content))
      && !/from\s+['"]@sovereignsquad\/gds-core['"][\s\S]{0,260}\b(MediaField|UploadDropzone)\b/.test(content)) {
      findings.push({
        rule: 'strict.media.local-upload-wrapper',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local media/upload wrappers. Use MediaField and UploadDropzone while keeping storage logic product-owned.',
      });
    }

    if (/export function \w*(Report|Chart|Evidence|Analytics|Metric)\w*\s*\(/.test(content)
      && (/\bChart\b|recharts|chart\.js|<canvas\b|svg\s+role=["']img["']/.test(content))
      && !/from\s+['"]@sovereignsquad\/gds-core['"][\s\S]{0,320}\b(ReportingSection|PeriodSelector|EvidencePanel|ChartTokenPanel|StatsSection|MetricCard)\b/.test(content)) {
      findings.push({
        rule: 'strict.reporting.local-chart-wrapper',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local reporting/chart wrappers without the GDS reporting contract. Use ReportingSection, EvidencePanel, PeriodSelector, and ChartTokenPanel.',
      });
    }

    if (/export function \w*(Auth|Login|Social|AccessDenied|Protected|Recovery)\w*\s*\(/.test(content)
      && (/\b(google|apple|github|microsoft|facebook)\b/i.test(content) || /Access denied|Sign in required|Session expired/i.test(content))
      && !/from\s+['"]@sovereignsquad\/gds-core['"][\s\S]{0,360}\b(AuthShell|ProviderIdentityButton|ProviderIdentityButtonGroup|SocialAuthButtons|AccessSummary|AccessRecoveryPanel)\b/.test(content)) {
      findings.push({
        rule: 'strict.access.local-auth-wrapper',
        severity: 'error',
        file: filePath,
        message: 'Strict mode forbids local auth/access wrappers. Use AuthShell, provider identity controls, AccessSummary, and AccessRecoveryPanel.',
      });
    }

    if (isAdminStrictSource({ manifest, filePath }) && hasLocalAdminWrapperSignature(content)) {
      findings.push({
        rule: 'strict.admin.local-wrapper',
        severity: 'error',
        file: filePath,
        message: STRICT_RULE_METADATA['strict.admin.local-wrapper'].remediation,
      });
    }
  }

  return findings;
}

function validateApprovedExceptionsAgainstRepo({ manifestRoot, manifest, sourceFiles }) {
  const findings = [];
  const normalizedRoot = normalizePath(manifestRoot).replace(/\/$/, '');
  const normalizedSourceFiles = sourceFiles.map((absolutePath) => ({
    absolutePath,
    relativePath: normalizePath(absolutePath).replace(`${normalizedRoot}/`, ''),
  }));

  for (const exception of manifest.approvedExceptions ?? []) {
    const scopes = exception.scope ?? [];
    if (!scopes.length) {
      continue;
    }

    const matchingFiles = normalizedSourceFiles.filter((file) => matchesScope(file.relativePath, scopes));
    if (!matchingFiles.length) {
      findings.push({
        rule: 'exception-scope-no-matches',
        severity: 'error',
        file: exception.surface,
        message: `Approved exception "${exception.surface}" does not match any files in the repository. Remove the stale exception or narrow it to the real implementation path.`,
      });
    }
  }

  for (const adapter of manifest.localAdapters ?? []) {
    if (adapter.status !== 'exception') {
      continue;
    }

    const normalizedAdapterPath = normalizePath(adapter.path).replace(/^\.\//, '');
    const coveredByApprovedException = (manifest.approvedExceptions ?? []).some((exception) =>
      matchesScope(normalizedAdapterPath, exception.scope ?? []));

    if (!coveredByApprovedException) {
      findings.push({
        rule: 'exception-adapter-outside-scope',
        severity: 'error',
        file: adapter.path,
        message: `Local adapter exception "${adapter.contract}" is not covered by any approved exception scope. Tie exception adapters to a reviewed narrow exception instead of leaving local authority unbounded.`,
      });
    }
  }

  return findings;
}

function isCoveredByApprovedException(relativePath, approvedExceptions = []) {
  return approvedExceptions.some((exception) => matchesScope(relativePath, exception.scope ?? []));
}

function getSuppressionDecision({ rule, relativePath, manifest }) {
  const metadata = STRICT_RULE_METADATA[rule];
  if (!metadata) {
    return { suppressed: false, reason: 'Rule has no suppression metadata.' };
  }

  const candidates = (manifest.approvedExceptions ?? []).filter((exception) =>
    matchesScope(relativePath, exception.scope ?? []));

  for (const exception of candidates) {
    if (!['approved', 'temporary'].includes(exception.status)) {
      continue;
    }
    if (!metadata.allowedExceptionCategories.includes(exception.category)) {
      continue;
    }
    return { suppressed: true, exceptionSurface: exception.surface };
  }

  if (candidates.length > 0) {
    return {
      suppressed: false,
      reason: `Matching exception scope exists, but category/status does not allow ${metadata.family}.`,
    };
  }

  return { suppressed: false, reason: 'No approved exception scope matched.' };
}

function pushStrictFinding({ findings, manifest, normalizedRoot, filePath, rule, message, severity = 'error' }) {
  const relativePath = normalizePath(filePath).replace(`${normalizedRoot}/`, '');
  const decision = getSuppressionDecision({ rule, relativePath, manifest });
  if (decision.suppressed) {
    return;
  }
  findings.push({
    rule,
    severity,
    file: relativePath,
    message,
  });
}

function isStrictThemeOwnedPath(relativePath, manifest) {
  return /(?:^|\/)(?:theme|tokens)\//.test(relativePath)
    || matchesScope(relativePath, manifest.compliance?.themeOwnershipPaths ?? []);
}

function scanStrictConsumerViolations({ manifest, sourceFiles, manifestRoot }) {
  const findings = [];
  const normalizedRoot = normalizePath(manifestRoot).replace(/\/$/, '');

  for (const filePath of sourceFiles) {
    const relativePath = normalizePath(filePath).replace(`${normalizedRoot}/`, '');
    const content = stripComments(readFileSync(filePath, 'utf8'));
    const inGdsPackage = /(^|\/)packages\/gds-(?:core|admin|theme)\//.test(relativePath);
    const inDocumentation = /\.(md|mdx)$/.test(relativePath) || /(^|\/)docs\//.test(relativePath);
    const themeOwnedPath = isStrictThemeOwnedPath(relativePath, manifest);

    if (!inGdsPackage && /from\s+['"]@mantine\/core['"]/.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.import.mantine-core',
        message: `${STRICT_RULE_METADATA['strict.import.mantine-core'].remediation}`,
      });
    }

    if (!inGdsPackage && /from\s+['"]@tabler\/icons-react['"]/.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.import.tabler-icons',
        message: `${STRICT_RULE_METADATA['strict.import.tabler-icons'].remediation}`,
      });
    }

    if (!inDocumentation && /<(button|input|select|textarea)\b/i.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.raw-control',
        message: `${STRICT_RULE_METADATA['strict.raw-control'].remediation}`,
      });
    }

    if (/\b(?:window\.)?(?:alert|confirm)\s*\(/.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.browser-dialog',
        message: `${STRICT_RULE_METADATA['strict.browser-dialog'].remediation}`,
      });
    }

    if (!inDocumentation && /<(table|th|td)\b/i.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.raw-table',
        message: `${STRICT_RULE_METADATA['strict.raw-table'].remediation}`,
      });
    }

    if (!inGdsPackage && !inDocumentation && !themeOwnedPath && RAW_COLOR_PATTERN.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.raw-color',
        message: `${STRICT_RULE_METADATA['strict.raw-color'].remediation}`,
      });
    }

    if (!inGdsPackage && !inDocumentation && !themeOwnedPath && INLINE_COLOR_STYLE_PATTERN.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.inline-color',
        message: `${STRICT_RULE_METADATA['strict.inline-color'].remediation}`,
      });
    }

    if (!inGdsPackage && !inDocumentation && !themeOwnedPath && NON_TOKEN_RADIUS_PATTERN.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.non-token-radius',
        message: `${STRICT_RULE_METADATA['strict.non-token-radius'].remediation}`,
      });
    }

    if (/style\s*=\s*\{\s*\{/.test(content)) {
      pushStrictFinding({
        findings,
        manifest,
        normalizedRoot,
        filePath,
        rule: 'strict.inline-style',
        severity: manifest.compliance?.strictMode === true ? 'error' : 'warn',
        message: `${STRICT_RULE_METADATA['strict.inline-style'].remediation}`,
      });
    }

    if (/components\/gds\//.test(relativePath)) {
      const declared = (manifest.localAdapters ?? []).some((adapter) => normalizePath(adapter.path).replace(/^\.\//, '') === relativePath);
      if (!declared) {
        pushStrictFinding({
          findings,
          manifest,
          normalizedRoot,
          filePath,
          rule: 'strict.local-gds-adapter',
          message: `${STRICT_RULE_METADATA['strict.local-gds-adapter'].remediation}`,
        });
      }
    }
  }

  return findings;
}

function normalizeProviderId(value) {
  return String(value).trim().toLowerCase();
}

function parseProviderIdsFromSocialAuthUsage(usageChunk) {
  const providers = new Set();
  const providerObjectRegex = /\b(?:id|provider)\s*:\s*['"]([^'"]+)['"]/g;
  const providerAttributeRegex = /provider\s*=\s*['"]([^'"]+)['"]/g;
  const providerArrayRegex = /providers\s*=\s*\[(.*?)\]/s;

  for (const match of usageChunk.matchAll(providerObjectRegex)) {
    providers.add(normalizeProviderId(match[1]));
  }

  for (const match of usageChunk.matchAll(providerAttributeRegex)) {
    providers.add(normalizeProviderId(match[1]));
  }

  if (providers.size > 0) {
    return providers;
  }

  const arrayMatch = usageChunk.match(providerArrayRegex);
  if (!arrayMatch) {
    return providers;
  }

  const idRegex = /['"]([^'"]+)['"]/g;
  for (const match of arrayMatch[1].matchAll(idRegex)) {
    providers.add(normalizeProviderId(match[1]));
  }

  return providers;
}

function hasForbiddenCustomization(usageChunk, forbiddenCustomizations = []) {
  if (!forbiddenCustomizations.length) {
    return [];
  }

  return forbiddenCustomizations
    .map((customization) => normalizeProviderId(customization))
    .filter((customization) => new RegExp(`\\b${escapeRegex(customization)}\\s*[:=]`, 'i').test(usageChunk));
}

function scanIdentityProviderBranding({ manifest, manifestRoot, sourceFiles }) {
  const findings = [];
  const policy = manifest.compliance?.identityProviderBranding;
  if (!policy || !Array.isArray(policy.approvedProviders) || !policy.approvedProviders.length) {
    return findings;
  }

  const approvedProviders = new Set(policy.approvedProviders.map((provider) => normalizeProviderId(provider)));
  const forbiddenCustomizations = Array.isArray(policy.forbiddenCustomizations)
    ? policy.forbiddenCustomizations
    : [];
  const allowedVariants = Array.isArray(policy.allowedVariants)
    ? new Set(policy.allowedVariants.map((variant) => normalizeProviderId(variant)))
    : null;
  const socialAuthUsages = /<(?:SocialAuthButtons|ProviderIdentityButton|ProviderIdentityButtonGroup)[\s\S]*?(?:\/\s*>|>[\s\S]*?<\/(?:SocialAuthButtons|ProviderIdentityButton|ProviderIdentityButtonGroup)>)/g;
  const providerTextRegex = /\b(google|apple|facebook|github|microsoft|linkedin|discord|\bx\b|email)\b/i;
  const mantineButtonImportRegex = /from\s+['"]@mantine\/core['"][\s\S]{0,240}\bButton\b/;
  const sourceRoot = normalizePath(manifestRoot).replace(/\/$/, '');

  for (const filePath of sourceFiles) {
    const content = stripComments(readFileSync(filePath, 'utf8'));
    const relativePath = normalizePath(filePath).replace(`${sourceRoot}/`, '');

    if (!/(?:SocialAuthButtons|ProviderIdentityButton|ProviderIdentityButtonGroup)/.test(content) && (/\bSocialAuth\b/i.test(content) || providerTextRegex.test(content))) {
      if (mantineButtonImportRegex.test(content) && providerTextRegex.test(content)) {
        findings.push({
          rule: 'identity.provider.custom-controls.warn',
          severity: 'warn',
          file: relativePath,
          message: 'Social identity controls appear to use Mantine primitives directly. Consider using SocialAuthButtons or ProviderIdentityButton/ProviderIdentityButtonGroup and policy-conformant provider rendering.',
        });
      }
      continue;
    }

    const usages = [...content.matchAll(socialAuthUsages)];
    for (const usage of usages) {
      const providerIds = parseProviderIdsFromSocialAuthUsage(usage[0]);
      const forbiddenInUsage = hasForbiddenCustomization(usage[0], forbiddenCustomizations);

      for (const forbidden of forbiddenInUsage) {
        findings.push({
          rule: 'identity.provider.forbidden-customization',
          severity: 'error',
          file: relativePath,
          message: `Social identity usage in ${relativePath} sets forbidden customization "${forbidden}". Use ProviderIdentityButton/ProviderIdentityButtonGroup or SocialAuthButtons instead.`,
        });
      }

      if (allowedVariants) {
        for (const match of usage[0].matchAll(/\bvariant\s*[:=]\s*['"]([^'"]+)['"]/g)) {
          const variant = normalizeProviderId(match[1]);
          if (!allowedVariants.has(variant)) {
            findings.push({
              rule: 'identity.provider.disallowed-variant',
              severity: 'error',
              file: relativePath,
              message: `Social identity usage sets variant "${variant}" outside compliance.identityProviderBranding.allowedVariants.`,
            });
          }
        }
      }

      for (const providerId of providerIds) {
        if (!approvedProviders.has(providerId)) {
          findings.push({
            rule: 'identity.provider.unapproved-id',
            severity: 'error',
            file: relativePath,
            message: `Social identity usage uses provider "${providerId}" not listed in compliance.identityProviderBranding.approvedProviders.`,
          });
        }
      }
    }

    if (/<(?:SocialAuthButtons|ProviderIdentityButton|ProviderIdentityButtonGroup)\b/.test(content) && !usages.length && providerTextRegex.test(content)) {
      findings.push({
        rule: 'identity.provider.missing-provider-list',
        severity: 'warn',
        file: relativePath,
        message: 'Social identity controls are present but provider ids could not be parsed for policy validation. Keep provider ids explicit and canonical.',
      });
    }
  }

  return findings;
}

const DESIGN_RULE_BACKGROUND_KEY_PATTERN = /\b(?:background|backgroundColor|background-color|bg)\s*[:=]/;

/** True if `token` (a `--gds-*` variable name) appears in `text` at a name boundary -- not as a prefix of a longer, unrelated variable name (e.g. `--gds-brand-accent-tint`). Mirrors gds-eslint-config's no-accent-as-background rule (issue #647) -- reimplemented here, not imported, since gds-compliance ships with zero runtime dependencies and importing a devDependency-only package across the publish boundary would add one just for this helper. */
function containsAccentToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`).test(text);
}

/**
 * Scans a consumer's own source for the same accent-as-background misuse issue #647's
 * ESLint rule catches inside this monorepo (issue #652) -- the consumer-facing half of
 * that enforcement, since a consumer app has no obligation to run gds-eslint-config.
 * Also flags a `createBrandTheme(...)` call site with no `designRuleProfile` (issue
 * #648), as an adoption-visibility signal, never a hard requirement.
 *
 * `designRuleProfile.enforced` (manifest, default false) controls only the severity of
 * the accent-as-background finding ('error' vs 'warn') -- the scan itself always runs, so
 * a consumer sees the finding before opting into enforcement, not only after.
 */
function scanDesignRuleUsage({ manifestRoot, manifest, sourceFiles }) {
  const findings = [];
  const enforced = manifest.compliance?.designRuleProfile?.enforced === true;
  const normalizedRoot = normalizePath(manifestRoot).replace(/\/$/, '');

  for (const filePath of sourceFiles) {
    const content = stripComments(readFileSync(filePath, 'utf8'));
    const relativePath = normalizePath(filePath).replace(`${normalizedRoot}/`, '');
    const lines = content.split('\n');

    lines.forEach((lineText, index) => {
      if (!DESIGN_RULE_BACKGROUND_KEY_PATTERN.test(lineText)) return;
      for (const token of ACCENT_BACKGROUND_VARIABLES) {
        if (containsAccentToken(lineText, token)) {
          findings.push({
            rule: 'design-rule.accent-as-background',
            severity: enforced ? 'error' : 'warn',
            file: `${relativePath}:${index + 1}`,
            message: `Token "${token}" is classified accent (issue #644) -- meant to be scarce, never a background fill.`,
          });
        }
      }
    });

    if (/\bcreateBrandTheme\s*\(/.test(content) && !/\bdesignRuleProfile\b/.test(content)) {
      const lineIndex = lines.findIndex((line) => /\bcreateBrandTheme\s*\(/.test(line));
      findings.push({
        rule: 'design-rule.missing-profile',
        severity: 'warn',
        file: `${relativePath}:${lineIndex + 1}`,
        message: 'createBrandTheme(...) call has no designRuleProfile (issue #648) -- adoption-visibility signal, not a hard requirement.',
      });
    }
  }

  return findings;
}

function findThemeOwnershipFiles({ manifestRoot, sourceFiles, themeOwnershipPaths = [] }) {
  if (!themeOwnershipPaths.length) {
    return [];
  }

  const normalizedRoot = normalizePath(manifestRoot).replace(/\/$/, '');
  return sourceFiles.filter((absolutePath) => {
    const relativePath = normalizePath(absolutePath).replace(`${normalizedRoot}/`, '');
    return themeOwnershipPaths.some((scope) => matchesScope(relativePath, [scope]));
  });
}

function scanThemeGovernance({ manifestRoot, manifest, sourceFiles }) {
  const findings = [];
  const approvedThemeLanes = new Set(manifest.compliance?.approvedThemeLanes ?? DEFAULT_APPROVED_THEME_LANES);
  const themeOwnershipPaths = manifest.compliance?.themeOwnershipPaths ?? [];
  const themeFiles = findThemeOwnershipFiles({ manifestRoot, sourceFiles, themeOwnershipPaths });
  const normalizedRoot = normalizePath(manifestRoot).replace(/\/$/, '');

  for (const filePath of themeFiles) {
    const content = stripComments(readFileSync(filePath, 'utf8'));
    const relativePath = normalizePath(filePath).replace(`${normalizedRoot}/`, '');

    if (isCoveredByApprovedException(relativePath, manifest.approvedExceptions ?? [])) {
      continue;
    }

    if (/import\s*\{[^}]*\bextendGdsTheme\b[^}]*\}\s*from\s*['"]@sovereignsquad\/gds(?:-theme)?(?:\/(?:client|server))?['"]/.test(content)) {
      findings.push({
        rule: 'theme.noncanonical-extend-helper',
        severity: 'error',
        file: relativePath,
        message: `Theme ownership file "${relativePath}" imports extendGdsTheme(...). Consumer repos must use approved theme lanes (${[...approvedThemeLanes].join(', ')}) instead of a custom branding-layer helper.`,
      });
    }

    if (/\b(createTheme|mergeMantineTheme|mergeThemeOverrides)\s*\(/.test(content)) {
      findings.push({
        rule: 'theme.parallel-branding-layer',
        severity: 'error',
        file: relativePath,
        message: `Theme ownership file "${relativePath}" creates a local Mantine theme layer outside the approved GDS theme lanes. Use a shipped preset or createPublicBrandTheme(...) instead of a parallel branding authority.`,
      });
    }
  }

  return findings;
}

export function runComplianceCheck({ manifestPath, currentDate }) {
  const absoluteManifestPath = resolve(manifestPath);
  const manifestRoot = dirname(absoluteManifestPath);
  const manifest = JSON.parse(readFileSync(absoluteManifestPath, 'utf8'));
  const resolvedCurrentDate = getCurrentDate(currentDate);
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

  findings.push(...validateApprovedExceptions(manifest, resolvedCurrentDate));
  findings.push(...validateApprovedExceptionsAgainstRepo({ manifestRoot, manifest, sourceFiles }));
  findings.push(...scanThemeGovernance({ manifestRoot, manifest, sourceFiles }));
  findings.push(...scanIdentityProviderBranding({ manifest, manifestRoot, sourceFiles }));
  findings.push(...scanDesignRuleUsage({ manifestRoot, manifest, sourceFiles }));

  if (protectedSurfacePaths.length) {
    const normalizedProtectedSurfacePaths = protectedSurfacePaths.map((value) => normalizePath(resolve(manifestRoot, value)));

    for (const filePath of sourceFiles) {
      const normalizedFilePath = normalizePath(filePath);
      const isProtectedSurface = normalizedProtectedSurfacePaths.some((protectedSurfacePath) =>
        normalizedFilePath === protectedSurfacePath || normalizedFilePath.startsWith(`${protectedSurfacePath}/`));

      if (!isProtectedSurface) {
        continue;
      }

      const content = stripComments(readFileSync(filePath, 'utf8'));
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
    findings.push(...scanStrictConsumerViolations({ manifest, manifestRoot, sourceFiles }));
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

export function formatExceptionLifecycleReport(report, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  if (format === 'md') {
    const rows = report.items.map((item) =>
      `| ${item.surface} | ${item.owner} | ${item.dependency} | ${item.riskLevel} | ${item.enforcementMode} | ${item.status} | ${item.removeBy ?? '-'} | ${item.expiryBucket} |`);
    return [
      '# GDS Exception Lifecycle Report',
      '',
      `Checked at: ${report.checkedAt}`,
      '',
      '| Surface | Owner | Dependency | Risk | Enforcement | Status | Remove by | Expiry bucket |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      ...(rows.length > 0 ? rows : ['| None | - | - | - | - | - | - | - |']),
    ].join('\n');
  }

  if (format === 'html') {
    const rows = report.items.map((item) => `<tr><td>${item.surface}</td><td>${item.owner}</td><td>${item.dependency}</td><td>${item.riskLevel}</td><td>${item.enforcementMode}</td><td>${item.status}</td><td>${item.removeBy ?? '-'}</td><td>${item.expiryBucket}</td></tr>`).join('');
    return `<!doctype html><html><body><h1>GDS Exception Lifecycle Report</h1><p>Checked at: ${report.checkedAt}</p><table><thead><tr><th>Surface</th><th>Owner</th><th>Dependency</th><th>Risk</th><th>Enforcement</th><th>Status</th><th>Remove by</th><th>Expiry bucket</th></tr></thead><tbody>${rows || '<tr><td colspan="8">None</td></tr>'}</tbody></table></body></html>`;
  }

  if (report.items.length === 0) {
    return `GDS exception lifecycle check passed for ${report.checkedAt}; no dependency-boundary exceptions declared.`;
  }

  return [
    `GDS exception lifecycle report (${report.checkedAt})`,
    `- dependency-boundary exceptions: ${report.dependencyBoundaryCount}`,
    ...report.items.map((item) =>
      `- ${item.surface} | owner=${item.owner} | dependency=${item.dependency} | risk=${item.riskLevel} | enforcement=${item.enforcementMode} | status=${item.status} | removeBy=${item.removeBy ?? '-'} | bucket=${item.expiryBucket}`),
  ].join('\n');
}

export function formatAdoptionReport(report, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  if (format === 'md') {
    return [
      '# GDS Adoption Report',
      '',
      `- Checked at: ${report.checkedAt}`,
      `- Owner: ${report.owner}`,
      `- Score: ${report.score}`,
      `- Status: ${report.status}`,
      `- Findings: ${report.findings.total} total (${report.findings.errors} errors, ${report.findings.warnings} warnings)`,
      `- Exception debt: ${report.exceptionDebt.total} total (${report.exceptionDebt.expired} expired, ${report.exceptionDebt.expiringSoon} expiring soon)`,
      '',
      '## Top remediation steps',
      ...report.topRemediationSteps.map((step) => `- ${step}`),
    ].join('\n');
  }

  if (format === 'html') {
    return `<!doctype html><html><body><h1>GDS Adoption Report</h1><p>Checked at: ${report.checkedAt}</p><ul><li>Owner: ${report.owner}</li><li>Score: ${report.score}</li><li>Status: ${report.status}</li><li>Findings: ${report.findings.total} total (${report.findings.errors} errors, ${report.findings.warnings} warnings)</li><li>Exception debt: ${report.exceptionDebt.total} total (${report.exceptionDebt.expired} expired, ${report.exceptionDebt.expiringSoon} expiring soon)</li></ul><h2>Top remediation steps</h2><ul>${report.topRemediationSteps.map((step) => `<li>${step}</li>`).join('')}</ul></body></html>`;
  }

  return [
    `GDS adoption report for ${report.owner}`,
    `- checked at: ${report.checkedAt}`,
    `- score: ${report.score}`,
    `- status: ${report.status}`,
    `- findings: ${report.findings.total} total (${report.findings.errors} errors, ${report.findings.warnings} warnings)`,
    `- exception debt: ${report.exceptionDebt.total} total (${report.exceptionDebt.expired} expired, ${report.exceptionDebt.expiringSoon} expiring soon)`,
    ...report.topRemediationSteps.map((step) => `- remediation: ${step}`),
  ].join('\n');
}

export function ensureManifestExists(manifestPath) {
  const absoluteManifestPath = resolve(manifestPath);
  if (!existsSync(absoluteManifestPath) || !statSync(absoluteManifestPath).isFile()) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  return absoluteManifestPath;
}
