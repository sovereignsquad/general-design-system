import { patternExportCoverage, type ExportCoveragePackage, type ExportCoverageStatus } from './pattern-export-coverage';

export type ApiAudience = 'developer' | 'product-owner' | 'operator';
export type ApiExportKind = 'component' | 'provider' | 'hook' | 'helper' | 'registry' | 'theme' | 'type';
export type ApiRuntimeLane = 'client' | 'server' | 'universal' | 'tooling';

export interface ApiReferenceEntry {
  packageName: ExportCoveragePackage | '@doneisbetter/gds';
  exportName: string;
  exportKind: ApiExportKind;
  runtimeLane: ApiRuntimeLane;
  importPath: string;
  status: ExportCoverageStatus;
  registryId: string;
  audience: ApiAudience[];
  summary: string;
  contract: string;
  accessibility: string;
  states: string[];
  testing: string;
  docsPath: string;
}

export const apiReferenceEntries: ApiReferenceEntry[] = patternExportCoverage.map((entry) => ({
  packageName: entry.packageName,
  exportName: entry.exportName,
  exportKind: inferExportKind(entry.packageName, entry.exportName),
  runtimeLane: inferRuntimeLane(entry.packageName, entry.exportName),
  importPath: `${entry.packageName}${inferRuntimeLane(entry.packageName, entry.exportName) === 'server' ? '/server' : ''}`,
  status: entry.status,
  registryId: entry.registryId,
  audience: inferAudience(entry.packageName, entry.exportName),
  summary: entry.rationale,
  contract: buildContract(entry.packageName, entry.exportName),
  accessibility: buildAccessibility(entry.exportName, entry.status),
  states: inferStates(entry.exportName, entry.status),
  testing: `Covered by pattern export coverage and ${entry.status === 'live-demo' ? 'live route rendering' : 'API contract verification'}.`,
  docsPath: `/patterns/${entry.registryId}`,
}));

export const apiReferencePackages = [
  '@doneisbetter/gds-theme',
  '@doneisbetter/gds-core',
  '@doneisbetter/gds-admin',
  '@doneisbetter/gds',
] as const;

export function getApiReferenceEntries(packageName?: string) {
  const entries = packageName
    ? apiReferenceEntries.filter((entry) => entry.packageName === packageName)
    : apiReferenceEntries;

  return [...entries].sort((a, b) => `${a.packageName}:${a.exportName}`.localeCompare(`${b.packageName}:${b.exportName}`));
}

export function getApiReferenceSummary() {
  return apiReferenceEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.packageName] = (acc[entry.packageName] ?? 0) + 1;
    acc[entry.status] = (acc[entry.status] ?? 0) + 1;
    acc[entry.runtimeLane] = (acc[entry.runtimeLane] ?? 0) + 1;
    return acc;
  }, {});
}

function inferExportKind(packageName: ExportCoveragePackage, exportName: string): ApiExportKind {
  if (packageName === '@doneisbetter/gds-theme') {
    if (exportName.includes('Provider')) return 'provider';
    if (exportName.startsWith('use')) return 'hook';
    if (exportName.includes('Theme')) return 'theme';
    return 'helper';
  }

  if (exportName.startsWith('use')) return 'hook';
  if (exportName.endsWith('Provider')) return 'provider';
  if (exportName.startsWith('create') || exportName.startsWith('emit') || exportName.startsWith('get') || exportName.startsWith('resolve') || exportName.startsWith('validate') || exportName.startsWith('is')) return 'helper';
  if (exportName.includes('Registry')) return 'registry';
  if (exportName.endsWith('Types') || exportName.endsWith('Reasons')) return 'registry';
  if (/^[A-Z]/.test(exportName)) return 'component';
  return 'type';
}

function inferRuntimeLane(packageName: ExportCoveragePackage, exportName: string): ApiRuntimeLane {
  if (packageName === '@doneisbetter/gds-theme') return exportName.startsWith('use') || exportName === 'GdsProvider' ? 'client' : 'universal';
  if (packageName === '@doneisbetter/gds-admin') return 'client';
  if (exportName.startsWith('use') || exportName.includes('Provider') || exportName.includes('Palette') || exportName.includes('Toast')) return 'client';
  if (exportName.endsWith('client')) return 'client';
  return 'universal';
}

function inferAudience(packageName: ExportCoveragePackage, exportName: string): ApiAudience[] {
  if (packageName === '@doneisbetter/gds-admin') return ['developer', 'operator'];
  if (exportName.includes('Theme') || exportName.includes('Compliance') || exportName.includes('Registry')) return ['developer', 'product-owner'];
  return ['developer'];
}

function buildContract(packageName: ExportCoveragePackage, exportName: string) {
  return `${exportName} is a published ${packageName} contract. Consumers must import it from the documented package path, keep UI composition inside GDS primitives, and avoid product-local replacements for the same capability.`;
}

function buildAccessibility(exportName: string, status: ExportCoverageStatus) {
  if (status === 'support-api') {
    return `${exportName} supports accessible UI indirectly through the documented primitive or registry family. Do not use it to bypass semantic labels, focus states, contrast, or reduced-motion rules.`;
  }

  return `${exportName} must preserve keyboard operation, accessible names, visible focus, non-color-only state, and GDS theme contrast in every consumer implementation.`;
}

function inferStates(exportName: string, status: ExportCoverageStatus) {
  if (status === 'support-api') return ['ready', 'invalid configuration', 'fallback'];
  if (exportName.includes('Table') || exportName.includes('Data')) return ['loading', 'empty', 'error', 'ready', 'filtered'];
  if (exportName.includes('Form') || exportName.includes('Field')) return ['idle', 'dirty', 'invalid', 'submitting', 'success', 'error'];
  if (exportName.includes('Modal') || exportName.includes('Drawer') || exportName.includes('Dialog')) return ['closed', 'opening', 'open', 'submitting', 'recovering'];
  return ['loading', 'empty', 'error', 'ready'];
}
