import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { ReportOutdatedLink, SourceBlock, ConfirmChecklist } from './TrustLayer.client';
import { TrustBadge, TRUST_BADGE_DEFINITIONS, PriceEstimateLabel, LastCheckedLabel } from './TrustLayer';
import type { GdsTrustLabel } from './TrustLayer';

describe('ReportOutdatedLink (issue 709)', () => {
  it('renders the default action label when idle', () => {
    renderWithGds(<ReportOutdatedLink onReport={() => {}} />);
    expect(screen.getByRole('button', { name: 'Report outdated info' })).toBeInTheDocument();
  });

  it('respects a custom label', () => {
    renderWithGds(<ReportOutdatedLink onReport={() => {}} label="Flag this" />);
    expect(screen.getByRole('button', { name: 'Flag this' })).toBeInTheDocument();
  });

  it('activation replaces the button with the thank-you confirmation and fires onReport once', async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();
    renderWithGds(<ReportOutdatedLink onReport={onReport} />);

    await user.click(screen.getByRole('button', { name: 'Report outdated info' }));

    expect(screen.queryByRole('button', { name: 'Report outdated info' })).not.toBeInTheDocument();
    // Two nodes carry the confirmation text: the visible replacement and the always-present
    // live region (asserted separately below).
    expect(screen.getAllByText("Thanks — we'll re-check this listing.").length).toBeGreaterThanOrEqual(1);
    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('announces the confirmation via a polite live region', async () => {
    const user = userEvent.setup();
    renderWithGds(<ReportOutdatedLink onReport={() => {}} />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion.textContent).toBe('');

    await user.click(screen.getByRole('button', { name: 'Report outdated info' }));
    expect(liveRegion.textContent).toBe("Thanks — we'll re-check this listing.");
  });

  it('is idempotent under rapid double-activation: onReport still fires exactly once', () => {
    const onReport = vi.fn();
    renderWithGds(<ReportOutdatedLink onReport={onReport} />);
    const button = screen.getByRole('button', { name: 'Report outdated info' });

    // Both dispatches inside one `act()` so React defers the re-render (and the DOM swap
    // that removes the button) until after both handler calls have run — the same-tick
    // race the ref guard (not just state, which would still read stale `false` for both
    // calls) is built to survive.
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('works with no onReport at all', async () => {
    const user = userEvent.setup();
    renderWithGds(<ReportOutdatedLink />);
    await user.click(screen.getByRole('button', { name: 'Report outdated info' }));
    expect(screen.getAllByText("Thanks — we'll re-check this listing.").length).toBeGreaterThanOrEqual(1);
  });
});

describe('SourceBlock (issue 709)', () => {
  it('renders all four rows with real data, and the standing confirm line', () => {
    renderWithGds(
      <SourceBlock
        sourceType="Official provider website"
        sourceUrl="https://example.org/listing"
        lastChecked="2 Jul 2026"
        priceStatus="confirmed"
        scheduleStatus="needs-confirmation"
      />,
    );
    expect(screen.getByRole('link', { name: 'Official provider website' })).toHaveAttribute('href', 'https://example.org/listing');
    expect(screen.getByText('Last checked 2 Jul 2026')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Needs provider confirmation')).toBeInTheDocument();
    expect(screen.getByText('Always confirm final details directly with the provider before attending.')).toBeInTheDocument();
  });

  it('never omits a row: every value renders the unknown wording when absent', () => {
    renderWithGds(<SourceBlock />);
    expect(screen.getAllByText('Unknown — confirm with provider').length).toBeGreaterThanOrEqual(4);
  });

  it('renders a bare source URL as a link labelled with the unknown wording, never as visible URL text', () => {
    renderWithGds(<SourceBlock sourceUrl="https://example.org/listing" />);
    const link = screen.getByRole('link', { name: 'Unknown — confirm with provider' });
    expect(link).toHaveAttribute('href', 'https://example.org/listing');
    expect(screen.queryByText('https://example.org/listing')).not.toBeInTheDocument();
  });

  it('renders the safe rel on the external source link', () => {
    renderWithGds(<SourceBlock sourceType="Official site" sourceUrl="https://example.org/listing" />);
    const link = screen.getByRole('link', { name: 'Official site' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('renders plain text (no link) when sourceUrl is not set', () => {
    renderWithGds(<SourceBlock sourceType="Official provider website" />);
    expect(screen.getByText('Official provider website')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the embedded report action only when onReport is set', () => {
    const { rerender, container } = renderWithGds(<SourceBlock />);
    expect(screen.queryByRole('button', { name: 'Report outdated info' })).not.toBeInTheDocument();

    rerender(<SourceBlock onReport={() => {}} />);
    expect(within(container).getByRole('button', { name: 'Report outdated info' })).toBeInTheDocument();
  });
});

describe('ConfirmChecklist (issue 709)', () => {
  it('renders the six default items when items is omitted', () => {
    renderWithGds(<ConfirmChecklist />);
    expect(screen.getByText('Check before booking')).toBeInTheDocument();
    for (const item of ['Exact schedule', 'Current price', 'Age fit', 'Registration requirements', 'Cancellation / refund policy', 'Parent presence requirement']) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
  });

  it('renders nothing for an explicit empty items array', () => {
    const { container } = renderWithGds(<ConfirmChecklist items={[]} />);
    expect(container.querySelector('[data-gds-confirm-checklist]')).toBeNull();
  });

  it('renders exactly one row for a single item', () => {
    renderWithGds(<ConfirmChecklist items={['Exact schedule']} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByText('Exact schedule')).toBeInTheDocument();
  });

  it('respects a custom title', () => {
    renderWithGds(<ConfirmChecklist title="Before you go" />);
    expect(screen.getByText('Before you go')).toBeInTheDocument();
  });

  it('toggling a checkbox updates its checked state; unchecked items stay real, labelled, unchecked checkboxes', async () => {
    const user = userEvent.setup();
    renderWithGds(<ConfirmChecklist items={['Exact schedule', 'Current price']} />);
    const [first, second] = screen.getAllByRole('checkbox');
    expect(first).not.toBeChecked();
    expect(second).not.toBeChecked();

    await user.click(first);
    expect(first).toBeChecked();
    expect(second).not.toBeChecked();
  });

  it('duplicate item strings render independent rows that toggle independently', async () => {
    const user = userEvent.setup();
    renderWithGds(<ConfirmChecklist items={['Exact schedule', 'Exact schedule']} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);

    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});

describe('Trust family vocabulary (issue 709)', () => {
  it('no rendered default string contains a forbidden term', () => {
    const forbidden = /verified|safe|guaranteed|best|perfect/i;

    const { container: badges, unmount: unmountBadges } = renderWithGds(
      <>
        {(Object.keys(TRUST_BADGE_DEFINITIONS) as GdsTrustLabel[]).map((label) => (
          <TrustBadge key={label} label={label} />
        ))}
      </>,
    );
    expect(badges.textContent).not.toMatch(forbidden);
    unmountBadges();

    const { container: prices, unmount: unmountPrices } = renderWithGds(
      <>
        <PriceEstimateLabel price={0} />
        <PriceEstimateLabel price={null} />
        <PriceEstimateLabel price={10} status="confirmed" unit="session" />
        <PriceEstimateLabel price={10} status="estimated" unit="session" />
      </>,
    );
    expect(prices.textContent).not.toMatch(forbidden);
    unmountPrices();

    const { container: freshness, unmount: unmountFreshness } = renderWithGds(
      <>
        <LastCheckedLabel date="2 Jul 2026" />
        <LastCheckedLabel date="2 Jul 2026" stale />
      </>,
    );
    expect(freshness.textContent).not.toMatch(forbidden);
    unmountFreshness();

    const { container: report, unmount: unmountReport } = renderWithGds(<ReportOutdatedLink onReport={() => {}} />);
    expect(report.textContent).not.toMatch(forbidden);
    unmountReport();

    const { container: source, unmount: unmountSource } = renderWithGds(
      <SourceBlock
        sourceType="Official provider website"
        sourceUrl="https://example.org/listing"
        lastChecked="2 Jul 2026"
        priceStatus="confirmed"
        scheduleStatus="estimate"
        onReport={() => {}}
      />,
    );
    expect(source.textContent).not.toMatch(forbidden);
    unmountSource();

    const { container: checklist, unmount: unmountChecklist } = renderWithGds(<ConfirmChecklist />);
    expect(checklist.textContent).not.toMatch(forbidden);
    unmountChecklist();
  });
});
