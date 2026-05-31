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
]);
const EXCEPTION_STATUSES = new Set(['temporary', 'approved', 'deprecated', 'removed']);
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

function validateApprovedExceptions(manifest) {
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

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern) {
  const normalized = normalizePath(pattern).replace(/^\.\//, '');
  const escaped = escapeRegex(normalized)
    .replace(/\\\*\\\*/g, '.*')
    .replace(/\\\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`);
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
    const content = readFileSync(filePath, 'utf8');
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

    if (/(?:SocialAuthButtons|ProviderIdentityButton|ProviderIdentityButtonGroup)/.test(content) && !usages.length && providerTextRegex.test(content)) {
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
    const content = readFileSync(filePath, 'utf8');
    const relativePath = normalizePath(filePath).replace(`${normalizedRoot}/`, '');

    if (isCoveredByApprovedException(relativePath, manifest.approvedExceptions ?? [])) {
      continue;
    }

    if (/import\s*\{[^}]*\bextendGdsTheme\b[^}]*\}\s*from\s*['"]@doneisbetter\/gds(?:-theme)?(?:\/(?:client|server))?['"]/.test(content)) {
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

  findings.push(...validateApprovedExceptions(manifest));
  findings.push(...validateApprovedExceptionsAgainstRepo({ manifestRoot, manifest, sourceFiles }));
  findings.push(...scanThemeGovernance({ manifestRoot, manifest, sourceFiles }));
  findings.push(...scanIdentityProviderBranding({ manifest, manifestRoot, sourceFiles }));

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
