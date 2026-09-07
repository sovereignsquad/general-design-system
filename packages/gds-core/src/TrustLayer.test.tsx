import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { TrustBadge, TRUST_BADGE_DEFINITIONS, PriceEstimateLabel, LastCheckedLabel } from './TrustLayer';
import type { GdsTrustLabel } from './TrustLayer';
import { formatGdsCurrency, formatGdsDate } from './GdsI18nRuntime';

const TONE_TOKEN = {
  success: 'var(--gds-badge-solid-success)',
  warning: 'var(--gds-badge-solid-warning)',
  danger: 'var(--gds-badge-solid-danger)',
  neutral: undefined, // neutral reads from a fixed fallback chain, not a single solid token
};

describe('TrustBadge (issue 709)', () => {
  it('renders all 8 labels with their mapped tone, icon, and localized text', () => {
    const labelText: Record<GdsTrustLabel, string> = {
      official_source: 'Official source',
      public_source: 'Public source',
      provider_claimed: 'Provider claimed',
      recently_checked: 'Recently checked',
      price_estimate: 'Price estimate',
      schedule_estimate: 'Schedule estimate',
      age_not_confirmed: 'Age not confirmed',
      reported_outdated: 'Reported outdated',
    };

    (Object.keys(TRUST_BADGE_DEFINITIONS) as GdsTrustLabel[]).forEach((label) => {
      const { unmount } = renderWithGds(<TrustBadge label={label} />);
      const definition = TRUST_BADGE_DEFINITIONS[label];
      const badge = screen.getByText(labelText[label]).closest('[data-gds-badge]') as HTMLElement;
      expect(badge).not.toBeNull();
      expect(badge.querySelector(`[data-gds-icon="${definition.icon}"]`)).not.toBeNull();
      const expectedTone = TONE_TOKEN[definition.tone];
      if (expectedTone) {
        expect(badge.style.backgroundColor).toBe(expectedTone);
      }
      unmount();
    });
  });

  it('falls back to public_source for an unrecognized runtime value', () => {
    renderWithGds(<TrustBadge label={'not_a_real_label' as GdsTrustLabel} />);
    const badge = screen.getByText('Public source').closest('[data-gds-badge]') as HTMLElement;
    expect(badge.querySelector('[data-gds-icon="Globe"]')).not.toBeNull();
  });

  it('defaults to public_source when label is omitted', () => {
    renderWithGds(<TrustBadge />);
    expect(screen.getByText('Public source')).toBeInTheDocument();
  });
});

describe('PriceEstimateLabel (issue 709)', () => {
  it('renders "Free" for price 0', () => {
    renderWithGds(<PriceEstimateLabel price={0} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('branch order is contract: price 0 wins even when status is "unknown"', () => {
    renderWithGds(<PriceEstimateLabel price={0} status="unknown" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText(/Price unknown/)).not.toBeInTheDocument();
  });

  it('renders the unknown wording for a null price', () => {
    renderWithGds(<PriceEstimateLabel price={null} />);
    expect(screen.getByText('Price unknown — confirm with provider')).toBeInTheDocument();
  });

  it('renders the unknown wording for an undefined price', () => {
    renderWithGds(<PriceEstimateLabel />);
    expect(screen.getByText('Price unknown — confirm with provider')).toBeInTheDocument();
  });

  it('renders the unknown wording when status is "unknown" even with a real price', () => {
    renderWithGds(<PriceEstimateLabel price={45} status="unknown" />);
    expect(screen.getByText('Price unknown — confirm with provider')).toBeInTheDocument();
  });

  it('renders a confirmed price with currency formatting and no unit suffix when unit is omitted', () => {
    renderWithGds(<PriceEstimateLabel price={45} status="confirmed" />);
    const amount = formatGdsCurrency(45, 'USD', { locale: 'en' });
    expect(screen.getByText(amount)).toBeInTheDocument();
  });

  it('renders a confirmed price with a unit suffix', () => {
    renderWithGds(<PriceEstimateLabel price={45} status="confirmed" unit="session" />);
    const amount = formatGdsCurrency(45, 'USD', { locale: 'en' });
    expect(screen.getByText(`${amount}/session`)).toBeInTheDocument();
  });

  it('treats an empty-string unit the same as an omitted unit', () => {
    renderWithGds(<PriceEstimateLabel price={45} status="confirmed" unit="" />);
    const amount = formatGdsCurrency(45, 'USD', { locale: 'en' });
    expect(screen.getByText(amount)).toBeInTheDocument();
  });

  it('renders an estimated price (the default status) with the "Estimated from" wording', () => {
    renderWithGds(<PriceEstimateLabel price={45} unit="session" />);
    const amount = formatGdsCurrency(45, 'USD', { locale: 'en' });
    expect(screen.getByText(`Estimated from ${amount}/session`)).toBeInTheDocument();
  });

  it('formats a non-USD currency', () => {
    renderWithGds(<PriceEstimateLabel price={20} currency="EUR" status="confirmed" />);
    const amount = formatGdsCurrency(20, 'EUR', { locale: 'en' });
    expect(screen.getByText(amount)).toBeInTheDocument();
  });
});

describe('LastCheckedLabel (issue 709)', () => {
  it('formats a Date instance per locale', () => {
    const date = new Date('2026-06-01T00:00:00.000Z');
    renderWithGds(<LastCheckedLabel date={date} />);
    const formatted = formatGdsDate(date, { locale: 'en' });
    expect(screen.getByText(`Last checked ${formatted}`)).toBeInTheDocument();
  });

  it('renders a preformatted string verbatim', () => {
    renderWithGds(<LastCheckedLabel date="2 Jul 2026" />);
    expect(screen.getByText('Last checked 2 Jul 2026')).toBeInTheDocument();
  });

  it('renders the unknown wording when date is omitted', () => {
    renderWithGds(<LastCheckedLabel />);
    expect(screen.getByText('Last checked Unknown — confirm with provider')).toBeInTheDocument();
  });

  it('stale wins over a present date: the caution renders and the date does not', () => {
    renderWithGds(<LastCheckedLabel date="2 Jul 2026" stale />);
    expect(screen.getByText('Details may have changed. Please confirm with provider.')).toBeInTheDocument();
    expect(screen.queryByText(/2 Jul 2026/)).not.toBeInTheDocument();
  });
});
