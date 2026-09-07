import { Group, Text } from '@mantine/core';
import { useGdsTranslation } from '@sovereignsquad/gds-theme';
import { formatGdsCurrency, formatGdsDate } from './GdsI18nRuntime';
import { GdsBadge } from './GdsBadge';
import { GdsIcon } from './icons';
import type { GdsIconKey } from './icons';

/**
 * The trust family (issue 709) states data uncertainty instead of hiding it: prices are
 * labelled as estimates, freshness is dated, sources are named, and unknowns are stated
 * rather than omitted. `TrustBadge`, `PriceEstimateLabel`, and `LastCheckedLabel` are the
 * stateless, server-safe half of the family; the stateful half (`ReportOutdatedLink`,
 * `ConfirmChecklist`, `SourceBlock`) lives in `TrustLayer.client.tsx`.
 */

const ROLE_SUCCESS = 'var(--gds-state-success, var(--mantine-color-green-7))';
const ROLE_WARNING = 'var(--gds-state-warning, var(--mantine-color-yellow-8))';
const ROLE_META = 'var(--gds-text-meta, var(--gds-vibe-muted, var(--mantine-color-gray-7)))';
const ROLE_PRIMARY = 'var(--gds-text-primary, var(--mantine-color-dark-7))';

/** The 8 operational trust labels. Closed union; there is no way to add labels. */
export type GdsTrustLabel =
  | 'official_source'
  | 'public_source'
  | 'provider_claimed'
  | 'recently_checked'
  | 'price_estimate'
  | 'schedule_estimate'
  | 'age_not_confirmed'
  | 'reported_outdated';

/** Props for {@link TrustBadge}. */
export interface TrustBadgeProps {
  /** Unknown runtime values fall back to 'public_source'. Default: 'public_source'. */
  label?: GdsTrustLabel;
}

/** Source-of-truth mapping, exported so documentation derives from it (Rule 14). */
export const TRUST_BADGE_DEFINITIONS: Record<
  GdsTrustLabel,
  { tone: 'success' | 'warning' | 'danger' | 'neutral'; icon: GdsIconKey; messageId: string }
> = {
  official_source: { tone: 'success', icon: 'Verify', messageId: 'gds.trust.badge.officialSource' },
  public_source: { tone: 'neutral', icon: 'Globe', messageId: 'gds.trust.badge.publicSource' },
  provider_claimed: { tone: 'success', icon: 'Confirmed', messageId: 'gds.trust.badge.providerClaimed' },
  recently_checked: { tone: 'success', icon: 'Freshness', messageId: 'gds.trust.badge.recentlyChecked' },
  price_estimate: { tone: 'warning', icon: 'Price', messageId: 'gds.trust.badge.priceEstimate' },
  schedule_estimate: { tone: 'warning', icon: 'Schedule', messageId: 'gds.trust.badge.scheduleEstimate' },
  age_not_confirmed: { tone: 'warning', icon: 'Help', messageId: 'gds.trust.badge.ageNotConfirmed' },
  reported_outdated: { tone: 'danger', icon: 'Flag', messageId: 'gds.trust.badge.reportedOutdated' },
};

function isKnownTrustLabel(value: unknown): value is GdsTrustLabel {
  return typeof value === 'string' && value in TRUST_BADGE_DEFINITIONS;
}

/** Localized label text for all 8 trust labels, resolved through `t()` so every id is harvestable. */
function useTrustBadgeLabels(): Record<GdsTrustLabel, string> {
  const { t } = useGdsTranslation();
  return {
    official_source: t('gds.trust.badge.officialSource', 'Official source'),
    public_source: t('gds.trust.badge.publicSource', 'Public source'),
    provider_claimed: t('gds.trust.badge.providerClaimed', 'Provider claimed'),
    recently_checked: t('gds.trust.badge.recentlyChecked', 'Recently checked'),
    price_estimate: t('gds.trust.badge.priceEstimate', 'Price estimate'),
    schedule_estimate: t('gds.trust.badge.scheduleEstimate', 'Schedule estimate'),
    age_not_confirmed: t('gds.trust.badge.ageNotConfirmed', 'Age not confirmed'),
    reported_outdated: t('gds.trust.badge.reportedOutdated', 'Reported outdated'),
  };
}

/**
 * Trust-vocabulary badge restricted to the eight operational trust labels the product uses
 * to state data provenance and uncertainty. An unrecognized runtime `label` (an untyped
 * consumer passing an arbitrary string) falls back to `'public_source'` rather than
 * rendering unstyled; meaning always renders as text, never color or icon alone.
 */
export function TrustBadge({ label = 'public_source' }: TrustBadgeProps) {
  const labels = useTrustBadgeLabels();
  const resolvedLabel: GdsTrustLabel = isKnownTrustLabel(label) ? label : 'public_source';
  const definition = TRUST_BADGE_DEFINITIONS[resolvedLabel];
  return <GdsBadge tone={definition.tone} icon={definition.icon} label={labels[resolvedLabel]} />;
}

/** The four price-certainty states {@link PriceEstimateLabel} renders. */
export type PriceEstimateStatus = 'estimated' | 'confirmed' | 'unknown';

/** Props for {@link PriceEstimateLabel}. */
export interface PriceEstimateLabelProps {
  /** 0 renders "Free"; null/undefined renders the unknown wording. */
  price?: number | null;
  /** ISO 4217 code for formatGdsCurrency. Default: 'USD'. */
  currency?: string;
  /** Consumer-supplied unit label (e.g. "session"). No baked-in default; omitted = price only. */
  unit?: string;
  /** Default: 'estimated'. */
  status?: PriceEstimateStatus;
}

/**
 * States price certainty instead of implying a fixed number: free, an unknown price that
 * asks the reader to confirm, a provider-confirmed amount, or an estimate. Branch order is
 * contract — an explicit `0` always renders "Free", even when `status` is `'unknown'`.
 */
export function PriceEstimateLabel({ price, currency = 'USD', unit, status = 'estimated' }: PriceEstimateLabelProps) {
  const { t, locale } = useGdsTranslation();

  if (price === 0) {
    return (
      <Text component="span" fw={600} c={ROLE_SUCCESS}>
        {t('gds.trust.price.free', 'Free')}
      </Text>
    );
  }

  if (price == null || status === 'unknown') {
    return (
      <Text component="span" c={ROLE_META}>
        {t('gds.trust.price.unknown', 'Price unknown — confirm with provider')}
      </Text>
    );
  }

  const amount = formatGdsCurrency(price, currency, { locale });
  const priceWithUnit = unit
    ? t('gds.trust.price.perUnit', '{price}/{unit}').replace('{price}', amount).replace('{unit}', unit)
    : amount;

  if (status === 'confirmed') {
    return (
      <Text component="span" c={ROLE_PRIMARY}>
        {priceWithUnit}
      </Text>
    );
  }

  return (
    <Text component="span" c={ROLE_WARNING}>
      {t('gds.trust.price.estimatedFrom', 'Estimated from {price}').replace('{price}', priceWithUnit)}
    </Text>
  );
}

/** Props for {@link LastCheckedLabel}. */
export interface LastCheckedLabelProps {
  /** Date instances are formatted via formatGdsDate; strings render as given. */
  date?: Date | string;
  /** Past the consumer's freshness window — renders the stale caution instead. */
  stale?: boolean;
}

/**
 * States when a listing's data was last checked, or — when `stale` is set by the consumer —
 * a caution that it may have changed since. GDS never computes staleness itself; `stale` is
 * always an explicit prop.
 */
export function LastCheckedLabel({ date, stale = false }: LastCheckedLabelProps) {
  const { t, locale } = useGdsTranslation();

  if (stale) {
    return (
      <Group gap={4} wrap="nowrap">
        <GdsIcon icon="Stale" size="xs" tone="warning" />
        <Text component="span" size="sm" c={ROLE_WARNING}>
          {t('gds.trust.lastChecked.stale', 'Details may have changed. Please confirm with provider.')}
        </Text>
      </Group>
    );
  }

  const formattedDate = date === undefined
    ? t('gds.trust.source.unknownValue', 'Unknown — confirm with provider')
    : date instanceof Date
      ? formatGdsDate(date, { locale })
      : date;

  return (
    <Group gap={4} wrap="nowrap">
      <GdsIcon icon="Freshness" size="xs" tone="muted" />
      <Text component="span" size="sm" c={ROLE_META}>
        {t('gds.trust.lastChecked.fresh', 'Last checked {date}').replace('{date}', formattedDate)}
      </Text>
    </Group>
  );
}
