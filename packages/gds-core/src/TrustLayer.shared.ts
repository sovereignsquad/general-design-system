import type { GdsIconKey } from './icons';

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

/** Source-of-truth mapping, exported so documentation derives from it. */
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
