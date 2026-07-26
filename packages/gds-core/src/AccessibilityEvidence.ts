/** Verification state of an accessibility-evidence entry or AT/browser test row. */
export type GdsAccessibilityEvidenceState =
  | 'verified'
  | 'partial'
  | 'known-limitation'
  | 'not-applicable'
  | 'expired';

/** Documented keyboard behavior for a component or pattern. */
export interface GdsKeyboardBehavior {
  /** How focus moves through the component via Tab/Shift+Tab. */
  tabSequence: string;
  /** How the primary action is triggered (Enter/Space/etc.). */
  activation: string;
  /** Behavior of the Escape key, when relevant. */
  escapeBehavior?: string;
  /** Additional keyboard shortcuts. */
  shortcuts?: string[];
}

/** Documented screen-reader behavior: what is announced and which semantics are exposed. */
export interface GdsScreenReaderNote {
  summary: string;
  /** Roles/states/properties exposed to assistive technology. */
  semantics: string[];
  /** Live/dynamic announcements the component makes. */
  announcements: string[];
}

/** A single WCAG success-criterion mapping. */
export interface GdsWcagMapping {
  /** WCAG criterion number, e.g. `'1.3.1'`. */
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  note: string;
}

/** A recorded assistive-technology/browser test result for an evidence entry. */
export interface GdsAtBrowserStatus {
  assistiveTechnology: string;
  browser: string;
  os: string;
  status: GdsAccessibilityEvidenceState;
  /** ISO date the AT/browser combination was last verified. */
  verifiedAt: string;
  note: string;
}

/** A documented known accessibility limitation and its remediation path. */
export interface GdsKnownLimitation {
  title: string;
  impact: string;
  owner: string;
  /** Recommended alternative/replacement while the limitation stands. */
  replacementPath: string;
  followUpIssue?: string;
}

/** Full accessibility-evidence record for a governed component or pattern. */
export interface GdsAccessibilityEvidence {
  id: string;
  title: string;
  kind: 'component' | 'pattern';
  /** Route where the evidence can be reviewed. */
  route?: string;
  packageName?: string;
  owner: string;
  status: GdsAccessibilityEvidenceState;
  /** ISO date the evidence was last updated; drives staleness checks. */
  updatedAt: string;
  evidenceSource: string;
  summary: string;
  keyboard: GdsKeyboardBehavior;
  focusBehavior: string;
  screenReader: GdsScreenReaderNote;
  wcagMappings: GdsWcagMapping[];
  atBrowserStatus: GdsAtBrowserStatus[];
  knownLimitations?: GdsKnownLimitation[];
  /** How users recover from failure/error states. */
  recovery: string;
}

/** Aggregate counts across a set of accessibility-evidence entries. */
export interface GdsAccessibilityEvidenceSummary {
  total: number;
  verified: number;
  partial: number;
  knownLimitation: number;
  notApplicable: number;
  expired: number;
  withKnownLimitations: number;
  /** Count of AT/browser rows by their individual status. */
  atStatuses: Record<GdsAccessibilityEvidenceState, number>;
}

/** Result of validating a set of evidence entries: pass/fail, messages, and the summary. */
export interface GdsAccessibilityEvidenceValidationResult {
  ok: boolean;
  failures: string[];
  summary: GdsAccessibilityEvidenceSummary;
}

const staleEvidenceDays = 180;
const requiredWcagCriteria = ['1.3.1', '1.4.3', '2.1.1', '2.4.7', '4.1.2'];

/** Builds a lookup of evidence entries keyed by their `id`. */
export function createGdsAccessibilityEvidenceIndex(entries: GdsAccessibilityEvidence[]) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<string, GdsAccessibilityEvidence>;
}

/** Looks up a single evidence entry by `id` from either an array or an index record. */
export function getGdsAccessibilityEvidence(
  entries: GdsAccessibilityEvidence[] | Record<string, GdsAccessibilityEvidence>,
  id: string,
) {
  if (Array.isArray(entries)) {
    return entries.find((entry) => entry.id === id);
  }

  return entries[id];
}

/** Computes aggregate counts (by status and AT/browser row) across the given evidence entries. */
export function getGdsAccessibilityEvidenceSummary(entries: GdsAccessibilityEvidence[]): GdsAccessibilityEvidenceSummary {
  const atStatuses: Record<GdsAccessibilityEvidenceState, number> = {
    verified: 0,
    partial: 0,
    'known-limitation': 0,
    'not-applicable': 0,
    expired: 0,
  };

  for (const entry of entries) {
    for (const atStatus of entry.atBrowserStatus) {
      atStatuses[atStatus.status] += 1;
    }
  }

  return {
    total: entries.length,
    verified: entries.filter((entry) => entry.status === 'verified').length,
    partial: entries.filter((entry) => entry.status === 'partial').length,
    knownLimitation: entries.filter((entry) => entry.status === 'known-limitation').length,
    notApplicable: entries.filter((entry) => entry.status === 'not-applicable').length,
    expired: entries.filter((entry) => entry.status === 'expired').length,
    withKnownLimitations: entries.filter((entry) => (entry.knownLimitations?.length ?? 0) > 0).length,
    atStatuses,
  };
}

function diffDays(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const age = Date.now() - date.getTime();
  return Math.floor(age / (1000 * 60 * 60 * 24));
}

/**
 * Validates evidence entries against the governance rules — required fields,
 * unique ids, the mandatory WCAG criteria, staleness (older than 180 days must
 * be marked expired), and consistency of known-limitation records — returning
 * the pass/fail result, failure messages, and the summary.
 */
export function validateGdsAccessibilityEvidence(entries: GdsAccessibilityEvidence[]): GdsAccessibilityEvidenceValidationResult {
  const failures: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      failures.push(`Duplicate accessibility evidence entry: ${entry.id}`);
    }
    seen.add(entry.id);

    if (!entry.title.trim()) failures.push(`${entry.id} is missing a title.`);
    if (!entry.summary.trim()) failures.push(`${entry.id} is missing a summary.`);
    if (!entry.owner.trim()) failures.push(`${entry.id} is missing an owner.`);
    if (!entry.evidenceSource.trim()) failures.push(`${entry.id} is missing an evidence source.`);
    if (!entry.route?.trim()) failures.push(`${entry.id} is missing a route.`);
    if (!entry.focusBehavior.trim()) failures.push(`${entry.id} is missing focus behavior.`);
    if (!entry.recovery.trim()) failures.push(`${entry.id} is missing recovery guidance.`);
    if (!entry.keyboard.tabSequence.trim()) failures.push(`${entry.id} is missing keyboard tab behavior.`);
    if (!entry.keyboard.activation.trim()) failures.push(`${entry.id} is missing keyboard activation behavior.`);
    if (!entry.screenReader.summary.trim()) failures.push(`${entry.id} is missing screen-reader summary.`);
    if (!entry.screenReader.semantics.length) failures.push(`${entry.id} is missing screen-reader semantics evidence.`);
    if (!entry.screenReader.announcements.length) failures.push(`${entry.id} is missing screen-reader announcement evidence.`);
    if (!entry.atBrowserStatus.length) failures.push(`${entry.id} is missing AT/browser status rows.`);
    if (!entry.wcagMappings.length) failures.push(`${entry.id} is missing WCAG mappings.`);

    for (const criterion of requiredWcagCriteria) {
      if (!entry.wcagMappings.some((mapping) => mapping.criterion === criterion)) {
        failures.push(`${entry.id} is missing WCAG ${criterion}.`);
      }
    }

    const updatedAge = diffDays(entry.updatedAt);
    if (Number.isNaN(updatedAge) || updatedAge < 0) {
      failures.push(`${entry.id} has an invalid updatedAt value.`);
    }

    if (updatedAge > staleEvidenceDays && entry.status !== 'expired') {
      failures.push(`${entry.id} is older than ${staleEvidenceDays} days but not marked expired.`);
    }

    for (const status of entry.atBrowserStatus) {
      const age = diffDays(status.verifiedAt);
      if (Number.isNaN(age) || age < 0) {
        failures.push(`${entry.id} has an invalid AT/browser verifiedAt value.`);
      }
      if (age > staleEvidenceDays && status.status !== 'expired') {
        failures.push(`${entry.id} AT/browser status ${status.assistiveTechnology}/${status.browser} is older than ${staleEvidenceDays} days but not marked expired.`);
      }
    }

    if (entry.status === 'known-limitation' && !(entry.knownLimitations?.length)) {
      failures.push(`${entry.id} is marked known-limitation but has no limitation entries.`);
    }

    for (const limitation of entry.knownLimitations ?? []) {
      if (!limitation.owner.trim()) failures.push(`${entry.id} limitation ${limitation.title} is missing an owner.`);
      if (!limitation.replacementPath.trim()) failures.push(`${entry.id} limitation ${limitation.title} is missing a replacement path.`);
      if (!limitation.impact.trim()) failures.push(`${entry.id} limitation ${limitation.title} is missing an impact statement.`);
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    summary: getGdsAccessibilityEvidenceSummary(entries),
  };
}
