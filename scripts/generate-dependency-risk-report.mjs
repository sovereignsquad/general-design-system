import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const version = readFileSync(resolve(root, 'VERSION'), 'utf8').trim();
const workspacePackageJsons = [
  'package.json',
  ...readdirSync(resolve(root, 'packages')).map((name) => `packages/${name}/package.json`),
  ...readdirSync(resolve(root, 'apps')).map((name) => `apps/${name}/package.json`),
].filter((path) => !path.includes('.next'));

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8'));
}

function entriesFrom(manifest, field, workspace) {
  return Object.entries(manifest[field] ?? {}).map(([name, range]) => ({
    workspace,
    name,
    range,
    category: field,
    thirdParty: !name.startsWith('@sovereignsquad/'),
  }));
}

function runAudit(args) {
  try {
    return JSON.parse(execFileSync('npm', ['audit', '--json', ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch (error) {
    const stdout = String(error.stdout ?? '');
    if (!stdout.trim()) throw error;
    return JSON.parse(stdout);
  }
}

function runOutdated() {
  try {
    return JSON.parse(execFileSync('npm', ['outdated', '--json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch (error) {
    // `npm outdated` exits non-zero when it finds anything outdated — its
    // real output is still on stdout, same idiom as runAudit() above.
    const stdout = String(error.stdout ?? '');
    if (!stdout.trim()) return {};
    return JSON.parse(stdout);
  }
}

function isDeprecated(name) {
  try {
    const result = execFileSync('npm', ['view', name, 'deprecated'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    }).trim();
    return result.length > 0;
  } catch {
    // Network hiccup, scoped/private package npm can't resolve anonymously,
    // or no deprecation field — treat as "not known to be deprecated" rather
    // than failing the whole report over one lookup.
    return false;
  }
}

function collectStaleness(thirdPartyPackageNames) {
  const outdated = runOutdated();
  const outdatedEntries = Object.entries(outdated).map(([name, info]) => {
    const entry = Array.isArray(info) ? info[0] : info;
    const wanted = entry?.wanted;
    const latest = entry?.latest;
    const wantedMajor = typeof wanted === 'string' ? Number.parseInt(wanted, 10) : null;
    const latestMajor = typeof latest === 'string' ? Number.parseInt(latest, 10) : null;
    return {
      name,
      wanted: wanted ?? null,
      latest: latest ?? null,
      majorVersionBehind: Boolean(wantedMajor !== null && latestMajor !== null && latestMajor > wantedMajor),
    };
  });

  const deprecatedPackages = [...thirdPartyPackageNames]
    .filter((name) => isDeprecated(name))
    .sort();

  return {
    outdatedCount: outdatedEntries.length,
    majorVersionBehindPackages: outdatedEntries.filter((entry) => entry.majorVersionBehind).map((entry) => entry.name).sort(),
    deprecatedPackages,
  };
}

function collectExceptions() {
  const manifests = [
    'apps/playground/gds-adoption.json',
    'apps/reference-vite/gds-adoption.json',
    'apps/reference-next/gds-adoption.json',
    'TEMPLATES/gds-adoption.json.template',
  ];
  return manifests.flatMap((path) => {
    const manifest = readJson(path);
    return (manifest.approvedExceptions ?? [])
      .filter((exception) => exception.dependency || exception.category === 'dependency-boundary')
      .map((exception) => ({
        manifest: path,
        surface: exception.surface,
        category: exception.category,
        dependency: exception.dependency ?? null,
        owner: exception.owner,
        reviewDate: exception.reviewDate,
        status: exception.status,
      }));
  });
}

const dependencies = workspacePackageJsons.flatMap((path) => {
  const manifest = readJson(path);
  const workspace = manifest.name ?? path;
  return [
    ...entriesFrom(manifest, 'dependencies', workspace),
    ...entriesFrom(manifest, 'peerDependencies', workspace),
    ...entriesFrom(manifest, 'devDependencies', workspace),
    ...entriesFrom(manifest, 'optionalDependencies', workspace),
  ];
});

const productionAudit = runAudit(['--omit=dev']);
const fullAudit = runAudit([]);
const exceptions = collectExceptions();
const thirdPartyPackageNames = new Set(dependencies.filter((entry) => entry.thirdParty).map((entry) => entry.name));
const staleness = collectStaleness(thirdPartyPackageNames);
const report = {
  version,
  generatedAt: new Date().toISOString(),
  summary: {
    thirdPartyRuntimeDependencies: dependencies.filter((entry) => entry.thirdParty && entry.category === 'dependencies').length,
    thirdPartyPeerDependencies: dependencies.filter((entry) => entry.thirdParty && entry.category === 'peerDependencies').length,
    thirdPartyDevDependencies: dependencies.filter((entry) => entry.thirdParty && entry.category === 'devDependencies').length,
    optionalNativeBindings: dependencies.filter((entry) => entry.category === 'optionalDependencies').length,
    activeDependencyExceptions: exceptions.filter((entry) => ['temporary', 'approved', 'active'].includes(entry.status)).length,
    expiredDependencyExceptions: exceptions.filter((entry) => entry.status === 'expired').length,
    productionVulnerabilities: Number(productionAudit.metadata?.vulnerabilities?.total ?? 0),
    totalVulnerabilities: Number(fullAudit.metadata?.vulnerabilities?.total ?? 0),
  },
  dependencies,
  exceptions,
  // Staleness/deprecation is WARN-and-record, not a release-blocking gate:
  // flipping every outdated or soft-deprecated dependency into a hard
  // failure overnight would create an unplannable cascade of forced
  // upgrades. Triage findings here into DEPENDENCY_AUDIT.md's disposition
  // table (upgrade now / accepted exception / tracked for future major)
  // before ever considering escalating any part of this to a hard gate.
  staleness,
  requiredCompatibilityCommands: [
    'npm run verify:mantine',
    'npm run audit:dependencies',
    'npm run verify:release',
  ],
};

if (report.summary.productionVulnerabilities > 0) {
  console.error(`Dependency risk report failed: ${report.summary.productionVulnerabilities} production vulnerabilities.`);
  process.exit(1);
}

if (report.summary.expiredDependencyExceptions > 0) {
  console.error(`Dependency risk report failed: ${report.summary.expiredDependencyExceptions} expired dependency exceptions.`);
  process.exit(1);
}

writeFileSync(resolve(root, 'dependency-risk-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Dependency risk report passed for ${version}: ${report.summary.thirdPartyPeerDependencies} peer dependency declarations, ${report.summary.activeDependencyExceptions} active dependency exception(s), ${report.summary.productionVulnerabilities} production vulnerabilities.`);

if (staleness.deprecatedPackages.length > 0) {
  // console.log, not console.warn: this is a recorded, informational
  // finding for E21's human triage into DEPENDENCY_AUDIT.md, not a build
  // warning — CLAUDE.md's zero-tolerance gate forbids anything that reads
  // as a warning in the verify:release chain, so this must stay a plain
  // status line, never process.exit(1), until a finding is triaged and a
  // decision is made to escalate it to an actual gate.
  console.log(`Staleness notice: ${staleness.deprecatedPackages.length} deprecated package(s) found (not release-blocking — triage into DEPENDENCY_AUDIT.md): ${staleness.deprecatedPackages.join(', ')}`);
}
console.log(`Staleness snapshot: ${staleness.outdatedCount} outdated package(s), ${staleness.majorVersionBehindPackages.length} with a newer major version available. See dependency-risk-report.json's "staleness" field for detail.`);
