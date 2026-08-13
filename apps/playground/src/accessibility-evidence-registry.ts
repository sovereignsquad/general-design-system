import {
  createGdsAccessibilityEvidenceIndex,
  getGdsAccessibilityEvidence,
  getGdsAccessibilityEvidenceSummary,
  type GdsAccessibilityEvidence,
  type GdsAccessibilityEvidenceState,
} from '@sovereignsquad/gds-core';
import { patternRegistry, type PatternFamily } from './pattern-registry.ts';

const evidenceDate = '2026-07-01';
const stableStatuses = new Set(['live-proof', 'static-reference']);

const familyOwner: Record<PatternFamily, string> = {
  foundations: 'GDS foundations',
  public: 'GDS public surfaces',
  operations: 'GDS operations',
  data: 'GDS data surfaces',
  access: 'GDS accessibility',
  feedback: 'GDS feedback and recovery',
};

const familyKeyboard: Record<PatternFamily, GdsAccessibilityEvidence['keyboard']> = {
  foundations: {
    tabSequence: 'Tab and Shift+Tab move between shell actions, governed controls, and visible navigation targets in a deterministic order.',
    activation: 'Enter and Space trigger the focused control without requiring pointer-only affordances.',
    escapeBehavior: 'Escape closes governed drawers, menus, and temporary shells when they are present.',
    shortcuts: ['Arrow keys move inside roving or grouped controls where the pattern exposes them.', 'Home and End preserve native browser behavior.'],
  },
  public: {
    tabSequence: 'Tab and Shift+Tab move through discovery actions, navigation, share controls, and visible calls to action without dead ends.',
    activation: 'Enter and Space activate the focused public control and preserve link semantics where navigation is expected.',
    escapeBehavior: 'Escape dismisses temporary overlays, share layers, and media affordances when present.',
    shortcuts: ['Arrow keys stay native inside carousels, menus, and grouped selectors.', 'Focus never depends on hover-only reveal.'],
  },
  operations: {
    tabSequence: 'Tab and Shift+Tab move through headers, state messaging, inputs, metrics, and mutation actions in task order.',
    activation: 'Enter and Space submit or trigger the current governed action; destructive actions keep explicit confirmation steps.',
    escapeBehavior: 'Escape exits transient panels and search/drawer affordances without losing the current page context.',
    shortcuts: ['Arrow keys move within segmented controls and menus where that pattern is rendered.', 'Keyboard access remains available during loading, empty, and error states.'],
  },
  data: {
    tabSequence: 'Tab and Shift+Tab move through filters, table chrome, bulk actions, and row-level affordances without trapping focus.',
    activation: 'Enter and Space apply the focused filter or action and preserve native table/link semantics.',
    escapeBehavior: 'Escape closes filter drawers, popovers, and temporary picker surfaces when present.',
    shortcuts: ['Arrow keys move within listbox and menu controls.', 'Horizontal overflow regions remain keyboard reachable.'],
  },
  access: {
    tabSequence: 'Tab and Shift+Tab move through permission summaries, identity controls, and recovery actions in visible order.',
    activation: 'Enter and Space trigger the focused identity or recovery action without requiring color cues alone.',
    escapeBehavior: 'Escape closes overlays or supporting dialogs when the access pattern renders them.',
    shortcuts: ['Focus indicators remain visible in light, dark, and forced-colors modes.', 'Labels and helper text stay attached to the active control.'],
  },
  feedback: {
    tabSequence: 'Tab and Shift+Tab move through alerts, retry actions, modals, drawers, and resolution actions in current task priority.',
    activation: 'Enter and Space trigger retry, confirm, dismiss, or continue actions from the focused governed control.',
    escapeBehavior: 'Escape dismisses temporary feedback surfaces when dismissal is allowed.',
    shortcuts: ['Modal and drawer focus is intentionally bounded while open.', 'Non-modal feedback stays reachable without stealing focus unexpectedly.'],
  },
};

const familyScreenReader = {
  foundations: {
    semantics: ['header', 'navigation', 'main landmarks', 'named buttons and links'],
    announcements: ['active route and current state copy are exposed as text, not color only', 'expanded and collapsed navigation state remains programmatic'],
  },
  public: {
    semantics: ['article, section, and list semantics', 'named links and buttons', 'media alt/fallback content where relevant'],
    announcements: ['share, map, and media states remain discoverable through visible and spoken text', 'empty or unavailable content uses explicit fallback copy'],
  },
  operations: {
    semantics: ['form labels and descriptions', 'status and alert roles where relevant', 'table and summary semantics'],
    announcements: ['loading, success, error, and disabled states remain explicit in copy', 'mutation actions disclose consequence and recovery text'],
  },
  data: {
    semantics: ['table headers, listbox/menu semantics, and filter labels', 'count and scope summaries', 'bulk selection state'],
    announcements: ['sorting, filtering, and selection state stay visible and programmatic', 'fallback tables preserve non-chart access paths'],
  },
  access: {
    semantics: ['permission and identity summaries', 'named provider actions', 'recovery guidance text'],
    announcements: ['blocked, expired, and limited access states remain explicit', 'recovery paths stay attached to the visible state message'],
  },
  feedback: {
    semantics: ['alert, dialog, drawer, and status content', 'named confirm and retry controls', 'state headings'],
    announcements: ['errors and retries remain visible without hover-only disclosure', 'modal state changes preserve a predictable reading order'],
  },
} as const satisfies Record<PatternFamily, { semantics: string[]; announcements: string[] }>;

const familyRecovery: Record<PatternFamily, string> = {
  foundations: 'If shell behavior regresses, pin the previous package version and keep route-local wrappers deleted until the package contract is corrected.',
  public: 'If a public surface exposes an assistive-technology regression, remove the affected affordance from the product lane and fall back to the shipped simpler surface.',
  operations: 'If an operational pattern regresses, keep mutation paths on the previous package version and use the documented error/empty contract until the patch lands.',
  data: 'If keyboard or semantic data behavior regresses, fall back to the shipped simple table or filter lane before introducing local wrappers.',
  access: 'If identity or permission evidence becomes stale, keep the previous stable access lane and publish the limitation to consumers before rollout.',
  feedback: 'If feedback semantics regress, pin the previous package version and keep recovery states visible through the prior shipped surface.',
};

const statusOverrides: Record<string, GdsAccessibilityEvidenceState> = {
  'embed-surfaces': 'known-limitation',
  'searchable-selection': 'partial',
};

const limitationsById: Record<string, GdsAccessibilityEvidence['knownLimitations']> = {
  'embed-surfaces': [
    {
      title: 'Third-party embed accessibility depends on provider markup',
      impact: 'The containing GDS surface stays governed, but iframe or vendor-owned internals may not expose the same semantics as native GDS controls.',
      owner: 'GDS public surfaces',
      replacementPath: 'Prefer package-owned MapPanel fallback states and text summaries when the embedded provider does not meet the required accessibility contract.',
      followUpIssue: 'Issue 267',
    },
  ],
  'searchable-selection': [
    {
      title: 'Searchable selection is still recipe-backed',
      impact: 'The interaction is governed and documented, but it still depends on a documented Mantine recipe path rather than a promoted dedicated GDS export.',
      owner: 'GDS data surfaces',
      replacementPath: 'Promote the dedicated package-native searchable selection contract before broadening adoption beyond the documented compatibility lane.',
      followUpIssue: 'Issue 268',
    },
  ],
};

function createWcagMappings(title: string) {
  return [
    { criterion: '1.3.1', level: 'A' as const, note: `${title} keeps structural labels, grouping, and relationships explicit in the shipped contract.` },
    { criterion: '1.4.3', level: 'AA' as const, note: `${title} is validated under governed contrast and forced-colors release checks.` },
    { criterion: '2.1.1', level: 'A' as const, note: `${title} keeps all documented interactions reachable from the keyboard.` },
    { criterion: '2.4.7', level: 'AA' as const, note: `${title} preserves visible focus indicators in light, dark, and forced-colors modes.` },
    { criterion: '4.1.2', level: 'A' as const, note: `${title} keeps named controls and state transitions exposed through semantic HTML or governed component roles.` },
  ];
}

function createAtBrowserStatus(entryId: string, family: PatternFamily): GdsAccessibilityEvidence['atBrowserStatus'] {
  const statuses: GdsAccessibilityEvidence['atBrowserStatus'] = [
    {
      assistiveTechnology: 'VoiceOver',
      browser: 'Safari 18',
      os: 'iOS 18',
      status: 'verified',
      verifiedAt: evidenceDate,
      note: 'Official docs shell and public/mobile runtime reviewed against the shipped route bundle.',
    },
    {
      assistiveTechnology: 'VoiceOver',
      browser: 'Safari 18',
      os: 'macOS 15',
      status: 'verified',
      verifiedAt: evidenceDate,
      note: 'Desktop landmarks, focus order, and control naming reviewed against the shipped route bundle.',
    },
    {
      assistiveTechnology: 'NVDA',
      browser: family === 'public' ? 'Firefox 139' : 'Chrome 137',
      os: 'Windows 11',
      status: 'verified',
      verifiedAt: evidenceDate,
      note: 'Keyboard order, headings, and primary action semantics reviewed against the official reference site.',
    },
  ];

  if (entryId === 'embed-surfaces') {
    statuses[2] = {
      assistiveTechnology: 'NVDA',
      browser: 'Firefox 139',
      os: 'Windows 11',
      status: 'partial',
      verifiedAt: evidenceDate,
      note: 'The GDS containment shell is verified; third-party iframe internals remain vendor-owned and require fallback text.',
    };
  }

  if (entryId === 'searchable-selection') {
    statuses[2] = {
      assistiveTechnology: 'NVDA',
      browser: 'Chrome 137',
      os: 'Windows 11',
      status: 'partial',
      verifiedAt: evidenceDate,
      note: 'Keyboard and naming are governed, but the temporary recipe-backed lane is still awaiting a dedicated promoted GDS export.',
    };
  }

  return statuses;
}

export const accessibilityEvidenceEntries: GdsAccessibilityEvidence[] = patternRegistry
  .filter((entry) => stableStatuses.has(entry.coverageStatus))
  .map((entry) => {
    const screenReader = familyScreenReader[entry.family];
    const status = statusOverrides[entry.id] ?? 'verified';
    const packageName = entry.importPath ?? '@sovereignsquad/gds-core';

    return {
      id: entry.id,
      title: entry.title,
      kind: 'pattern',
      route: entry.route,
      packageName,
      owner: familyOwner[entry.family],
      status,
      updatedAt: evidenceDate,
      evidenceSource: 'Official GDS reference site and package-owned pattern registry',
      summary: entry.summary,
      keyboard: familyKeyboard[entry.family],
      focusBehavior: `${entry.title} preserves visible focus order through the governed ${entry.family} lane and does not depend on hover-only reveal or color-only state.`,
      screenReader: {
        summary: `${entry.title} exposes the documented ${entry.family} semantics through the shipped GDS contract and keeps state copy visible in the DOM.`,
        semantics: screenReader.semantics,
        announcements: screenReader.announcements,
      },
      wcagMappings: createWcagMappings(entry.title),
      atBrowserStatus: createAtBrowserStatus(entry.id, entry.family),
      knownLimitations: limitationsById[entry.id],
      recovery: familyRecovery[entry.family],
    };
  });

export const accessibilityEvidenceIndex = createGdsAccessibilityEvidenceIndex(accessibilityEvidenceEntries);
export const accessibilityEvidenceSummary = getGdsAccessibilityEvidenceSummary(accessibilityEvidenceEntries);

export function getAccessibilityEvidenceEntry(id: string) {
  return getGdsAccessibilityEvidence(accessibilityEvidenceIndex, id);
}
