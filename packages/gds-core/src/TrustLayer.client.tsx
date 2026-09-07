'use client';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Checkbox, Group, Paper, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useGdsTranslation, GDS_MIN_TARGET_PX } from '@sovereignsquad/gds-theme';
import { GdsIcon } from './icons';
import { GdsInlineLink } from './GdsInlineLink';
import { LastCheckedLabel } from './TrustLayer';

/**
 * The stateful half of the trust family (issue 709): `ReportOutdatedLink` (idle -> sent,
 * one-way), `ConfirmChecklist` (per-item checked map), and `SourceBlock` (embeds
 * `ReportOutdatedLink`). The stateless half lives in `TrustLayer.tsx`.
 */

const ROLE_SUCCESS = 'var(--gds-state-success, var(--mantine-color-green-7))';
const ROLE_WARNING = 'var(--gds-state-warning, var(--mantine-color-yellow-8))';
const ROLE_META = 'var(--gds-text-meta, var(--gds-vibe-muted, var(--mantine-color-gray-7)))';
const ROLE_WARNING_TINT_BG = 'var(--gds-badge-soft-warning, var(--mantine-color-yellow-0))';
const ROLE_WARNING_TINT_FG = 'var(--gds-badge-soft-warning-fg, var(--mantine-color-yellow-9))';

/** Props for {@link ReportOutdatedLink}. */
export interface ReportOutdatedLinkProps {
  /** Consumer-owned side effect; GDS performs no I/O. */
  onReport?: () => void;
  /** Overrides the default action label. */
  label?: string;
}

/**
 * Inline report action: idle renders a button, activation replaces it with a persistent
 * thank-you confirmation (announced via a polite live region) and fires `onReport` exactly
 * once. One-way — there is no revert, unlike `SemanticButton`'s transient feedback.
 */
export function ReportOutdatedLink({ onReport, label }: ReportOutdatedLinkProps) {
  const { t } = useGdsTranslation();
  const [sent, setSent] = useState(false);
  // A ref guard (not just state) so two activations in the same tick before React re-renders
  // still fire onReport exactly once.
  const sentRef = useRef(false);
  const actionLabel = label ?? t('gds.trust.report.action', 'Report outdated info');
  const thanksText = t('gds.trust.report.thanks', "Thanks — we'll re-check this listing.");

  const handleActivate = () => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSent(true);
    onReport?.();
  };

  return (
    <>
      {sent ? (
        <Text component="span" size="sm" fw={600} c={ROLE_SUCCESS}>
          {thanksText}
        </Text>
      ) : (
        <Button
          type="button"
          variant="subtle"
          color="gray"
          size="sm"
          leftSection={<GdsIcon icon="Flag" size="xs" />}
          onClick={handleActivate}
          styles={{ root: { minHeight: `${GDS_MIN_TARGET_PX}px` } }}
        >
          {actionLabel}
        </Button>
      )}
      {/* Always present so a screen reader already tracking it hears the change, rather
          than depending on a newly-mounted live region being announced. */}
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {sent ? thanksText : ''}
      </VisuallyHidden>
    </>
  );
}

/** Row-level data-provenance status for a {@link SourceBlock} price/schedule row. */
export type SourceRowStatus = 'estimate' | 'confirmed' | 'needs-confirmation';

/** Props for {@link SourceBlock}. */
export interface SourceBlockProps {
  /** e.g. "Official provider website", "Public event feed". */
  sourceType?: string;
  /** When set, the source type renders as a link. */
  sourceUrl?: string;
  /** When set, rendered via {@link LastCheckedLabel}; absent renders the unknown-value row. */
  lastChecked?: Date | string;
  /** Row status for the price. Absent renders the unknown-value row. */
  priceStatus?: SourceRowStatus;
  /** Row status for the schedule. Absent renders the unknown-value row. */
  scheduleStatus?: SourceRowStatus;
  /** When set, renders the embedded report-outdated action. */
  onReport?: () => void;
}

function useSourceRowStatusLabels(): Record<SourceRowStatus, string> {
  const { t } = useGdsTranslation();
  return {
    estimate: t('gds.trust.source.statusEstimate', 'Estimate'),
    confirmed: t('gds.trust.source.statusConfirmed', 'Confirmed'),
    'needs-confirmation': t('gds.trust.source.statusNeedsConfirmation', 'Needs provider confirmation'),
  };
}

function sourceRowStatusRole(status: SourceRowStatus) {
  return status === 'confirmed' ? ROLE_SUCCESS : ROLE_WARNING;
}

function SourceBlockRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="wrap"
      gap="xs"
      py={4}
      style={{ borderTop: '1px solid var(--gds-border-card, var(--mantine-color-gray-3))' }}
    >
      <Text size="sm" fw={500} c={ROLE_META}>{label}</Text>
      {children}
    </Group>
  );
}

/**
 * Detail-page information-source card: a title, four labelled rows that are never omitted
 * (an absent value states the unknown wording explicitly), a standing confirm-with-provider
 * line, and — when `onReport` is set — the embedded {@link ReportOutdatedLink}.
 */
export function SourceBlock({ sourceType, sourceUrl, lastChecked, priceStatus, scheduleStatus, onReport }: SourceBlockProps) {
  const { t } = useGdsTranslation();
  const statusLabels = useSourceRowStatusLabels();
  const unknownValue = t('gds.trust.source.unknownValue', 'Unknown — confirm with provider');

  let sourceTypeContent: ReactNode;
  if (sourceUrl) {
    // A link with no known source type still never shows a bare URL as its visible text.
    sourceTypeContent = <GdsInlineLink href={sourceUrl} external>{sourceType || unknownValue}</GdsInlineLink>;
  } else if (sourceType) {
    sourceTypeContent = <Text size="sm">{sourceType}</Text>;
  } else {
    sourceTypeContent = <Text size="sm" c={ROLE_META}>{unknownValue}</Text>;
  }

  return (
    <Paper withBorder radius="lg" p="md" data-gds-source-block="">
      <Stack gap="xs">
        <Group gap="xs">
          <GdsIcon icon="SourceInfo" size="sm" />
          <Text fw={600}>{t('gds.trust.source.title', 'Information source')}</Text>
        </Group>
        <Stack gap={0}>
          <SourceBlockRow label={t('gds.trust.source.sourceType', 'Source type')}>
            {sourceTypeContent}
          </SourceBlockRow>
          <SourceBlockRow label={t('gds.trust.source.lastChecked', 'Last checked')}>
            {lastChecked !== undefined ? <LastCheckedLabel date={lastChecked} /> : <Text size="sm" c={ROLE_META}>{unknownValue}</Text>}
          </SourceBlockRow>
          <SourceBlockRow label={t('gds.trust.source.priceStatus', 'Price status')}>
            {priceStatus ? <Text size="sm" c={sourceRowStatusRole(priceStatus)}>{statusLabels[priceStatus]}</Text> : <Text size="sm" c={ROLE_META}>{unknownValue}</Text>}
          </SourceBlockRow>
          <SourceBlockRow label={t('gds.trust.source.scheduleStatus', 'Schedule status')}>
            {scheduleStatus ? <Text size="sm" c={sourceRowStatusRole(scheduleStatus)}>{statusLabels[scheduleStatus]}</Text> : <Text size="sm" c={ROLE_META}>{unknownValue}</Text>}
          </SourceBlockRow>
        </Stack>
        <Text size="xs" c={ROLE_META}>
          {t('gds.trust.source.confirmLine', 'Always confirm final details directly with the provider before attending.')}
        </Text>
        {onReport ? <ReportOutdatedLink onReport={onReport} /> : null}
      </Stack>
    </Paper>
  );
}

/** Props for {@link ConfirmChecklist}. */
export interface ConfirmChecklistProps {
  /** Omitted = the six standard items. Explicit [] renders nothing. */
  items?: string[];
  /** Overrides the default title. */
  title?: string;
}

/**
 * Amber check-before-booking card: a title and a list of items the reader should verify
 * directly with the provider before committing. Checking an item applies a line-through and
 * reduced emphasis while it remains a real, labelled, checked checkbox. Renders `null` for
 * an explicit empty `items` array.
 */
export function ConfirmChecklist({ items, title }: ConfirmChecklistProps) {
  const { t } = useGdsTranslation();
  const defaultItems = [
    t('gds.trust.checklist.exactSchedule', 'Exact schedule'),
    t('gds.trust.checklist.currentPrice', 'Current price'),
    t('gds.trust.checklist.ageFit', 'Age fit'),
    t('gds.trust.checklist.registration', 'Registration requirements'),
    t('gds.trust.checklist.cancellation', 'Cancellation / refund policy'),
    t('gds.trust.checklist.parentPresence', 'Parent presence requirement'),
  ];
  const resolvedItems = items ?? defaultItems;
  const resolvedTitle = title ?? t('gds.trust.checklist.title', 'Check before booking');
  // Keyed by position, not text, so duplicate item strings toggle independently instead of
  // colliding on one shared state entry.
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (resolvedItems.length === 0) {
    return null;
  }

  const toggle = (key: string) => {
    setChecked((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      data-gds-confirm-checklist=""
      style={{ background: ROLE_WARNING_TINT_BG, borderColor: 'var(--gds-state-warning, var(--mantine-color-yellow-6))' }}
    >
      <fieldset style={{ border: 0, margin: 0, padding: 0, minInlineSize: 'auto' }}>
        <Group component="legend" gap="xs" wrap="nowrap" style={{ padding: 0, color: ROLE_WARNING_TINT_FG }}>
          <GdsIcon icon="Checklist" size="sm" />
          <Text fw={600} c="inherit">{resolvedTitle}</Text>
        </Group>
        <Stack gap="xs" mt="sm">
          {resolvedItems.map((item, index) => {
            const key = `${index}:${item}`;
            const isChecked = Boolean(checked[key]);
            return (
              <Group key={key} wrap="nowrap" align="center" gap="xs" style={{ minHeight: `${GDS_MIN_TARGET_PX}px` }}>
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggle(key)}
                  label={
                    <Text
                      component="span"
                      c={ROLE_WARNING_TINT_FG}
                      style={{ textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.75 : 1 }}
                    >
                      {item}
                    </Text>
                  }
                />
              </Group>
            );
          })}
        </Stack>
      </fieldset>
    </Paper>
  );
}
