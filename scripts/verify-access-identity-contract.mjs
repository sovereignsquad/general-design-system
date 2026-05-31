import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const files = {
  authShell: readFileSync(resolve(root, 'packages/gds-core/src/AuthShell.tsx'), 'utf8'),
  providers: readFileSync(resolve(root, 'packages/gds-core/src/ProviderIdentityButtons.tsx'), 'utf8'),
  socialAuth: readFileSync(resolve(root, 'packages/gds-core/src/SocialAuthButtons.tsx'), 'utf8'),
  accessSummary: readFileSync(resolve(root, 'packages/gds-core/src/AccessSummary.tsx'), 'utf8'),
  accessRecovery: readFileSync(resolve(root, 'packages/gds-core/src/AccessRecoveryPanel.tsx'), 'utf8'),
  compliance: readFileSync(resolve(root, 'packages/gds-compliance/index.js'), 'utf8'),
  complianceTests: readFileSync(resolve(root, 'packages/gds-compliance/index.test.js'), 'utf8'),
  pages: readFileSync(resolve(root, 'apps/playground/src/pattern-pages.tsx'), 'utf8'),
  components: readFileSync(resolve(root, 'COMPONENTS_AND_PATTERNS.md'), 'utf8'),
  themeGovernance: readFileSync(resolve(root, 'THEME_GOVERNANCE.md'), 'utf8'),
  toolkit: readFileSync(resolve(root, 'COMPLIANCE_TOOLKIT.md'), 'utf8'),
  playbook: readFileSync(resolve(root, 'ADOPTION_AND_MIGRATION_PLAYBOOK.md'), 'utf8'),
};

const failures = [];

for (const required of ['sign-in', 'sign-up', 'account-linking', 'guest-entry', 'guestAction', 'supportAction', 'role="alert"']) {
  if (!files.authShell.includes(required)) {
    failures.push(`AuthShell is missing ${required}`);
  }
}

for (const required of ['policyNote', 'error', 'tenantDisabledReason', 'getSupportedProviderIdentityIds', 'getProviderIdentityPolicy', 'minTouchTargetPx']) {
  if (!files.providers.includes(required)) {
    failures.push(`ProviderIdentityButtons is missing ${required}`);
  }
}

for (const required of ['policyNote', 'error', 'tenantDisabledReason']) {
  if (!files.socialAuth.includes(required)) {
    failures.push(`SocialAuthButtons is missing ${required}`);
  }
}

for (const required of ['permission-limited', 'owner', 'recoveryHint', 'Forbidden', 'Expired']) {
  if (!files.accessSummary.includes(required)) {
    failures.push(`AccessSummary is missing ${required}`);
  }
}

for (const required of ['timeout', 'Request timed out', 'expired-session', 'forbidden', 'missing', 'unavailable']) {
  if (!files.accessRecovery.includes(required)) {
    failures.push(`AccessRecoveryPanel is missing ${required}`);
  }
}

for (const required of ['identity.provider.disallowed-variant', 'allowedVariants', 'identityProviderBranding']) {
  if (!files.compliance.includes(required) || !files.complianceTests.includes(required)) {
    failures.push(`gds-compliance is missing provider-brand enforcement evidence: ${required}`);
  }
}

for (const required of ['Continue as guest', 'tenant policy', 'state="timeout"', 'state="permission-limited"']) {
  if (!files.pages.includes(required)) {
    failures.push(`Pattern pages are missing access/identity demo evidence: ${required}`);
  }
}

for (const required of ['Access, Auth, and Identity Rules', '`timeout`', '`permission-limited`', 'getSupportedProviderIdentityIds()', 'getProviderIdentityPolicy(provider)']) {
  if (!files.components.includes(required)) {
    failures.push(`COMPONENTS_AND_PATTERNS.md is missing access/identity documentation: ${required}`);
  }
}

for (const required of ['allowed visual variants', 'getSupportedProviderIdentityIds()', 'tenant-disabled']) {
  if (!files.themeGovernance.includes(required)) {
    failures.push(`THEME_GOVERNANCE.md is missing provider governance evidence: ${required}`);
  }
}

if (!files.toolkit.includes('variant` outside `allowedVariants`')) {
  failures.push('COMPLIANCE_TOOLKIT.md must document allowedVariants enforcement.');
}

if (!files.playbook.includes('Auth, identity, and access migration')) {
  failures.push('ADOPTION_AND_MIGRATION_PLAYBOOK.md must document auth/access migration.');
}

if (failures.length > 0) {
  console.error('Access/identity contract verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Access/identity contract verification passed.');
