import { describe, expect, it, vi } from 'vitest';
import { renderWithGds } from '../../../test-utils/render';
import { fireEvent } from '@testing-library/react';
import { Button } from '@mantine/core';
import { GdsMapPinPreviewCard } from './GdsMapPinPreviewCard';

const FULL = {
  title: 'Riverside Swim Club',
  activity: 'Swimming',
  neighbourhood: 'Riverside',
  summary: 'Family club with heated pools and beginner lanes.',
  ageRange: '6\u201312',
  trust: { variant: 'validation', label: 'Verified provider' } as const,
  priceEstimate: '~\u20ac40 / month',
  lastChecked: 'Checked last week',
  thumbnailSeed: 'listing-42',
  categories: [{ key: 'swim', label: 'Swimming', icon: 'Habit' as const }],
  saved: false,
  saveLabel: 'Save Riverside Swim Club',
  unsaveLabel: 'Remove Riverside Swim Club from saved',
  closeLabel: 'Close preview',
};

describe('GdsMapPinPreviewCard (#548)', () => {
  it('composes the full card: media, meta line, badges, estimate block, actions', () => {
    const onClose = vi.fn();
    const { container, getByText, getByLabelText } = renderWithGds(
      <GdsMapPinPreviewCard {...FULL} onClose={onClose} primaryAction={<Button fullWidth>View provider</Button>} />,
    );
    expect(getByText('Riverside Swim Club')).toBeTruthy();
    const meta = container.querySelector('[data-gds-map-pin-preview-meta]') as HTMLElement;
    expect(meta.textContent).toBe('Swimming \u00b7 Riverside');
    expect(container.querySelector('[data-gds-map-pin-preview-estimate]')).not.toBeNull();
    // The thumbnail suppresses its badges at this tile size — the activity is named in text.
    expect(container.querySelector('[data-gds-generated-thumbnail-badges]')).toBeNull();
    fireEvent.click(getByLabelText('Close preview'));
    expect(onClose).toHaveBeenCalled();
    // The save control is the governed labelled toggle, not a bare icon.
    expect(getByLabelText('Save Riverside Swim Club').getAttribute('aria-pressed')).toBe('false');
  });

  it('no categories -> no media region at all, never a placeholder', () => {
    const { container } = renderWithGds(
      <GdsMapPinPreviewCard title="No art yet" closeLabel="Close" onClose={() => {}} />,
    );
    expect(container.querySelector('svg[data-gds-generated-thumbnail]')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    // The close control survives the missing media — it moves above the title.
    expect(container.querySelector('[aria-label="Close"]')).not.toBeNull();
  });

  it('no trust badge -> the row is omitted; the absence of a claim is not a claim', () => {
    const { container } = renderWithGds(<GdsMapPinPreviewCard title="x" ageRange={undefined} />);
    expect(container.querySelector('[data-gds-badge]')).toBeNull();
  });

  it('estimate block renders with either line alone and disappears with neither', () => {
    const withPrice = renderWithGds(<GdsMapPinPreviewCard title="x" priceEstimate="~\u20ac10" />);
    expect(withPrice.container.querySelector('[data-gds-map-pin-preview-estimate]')).not.toBeNull();
    const withChecked = renderWithGds(<GdsMapPinPreviewCard title="x" lastChecked="Checked today" />);
    expect(withChecked.container.querySelector('[data-gds-map-pin-preview-estimate]')).not.toBeNull();
    const bare = renderWithGds(<GdsMapPinPreviewCard title="x" />);
    expect(bare.container.querySelector('[data-gds-map-pin-preview-estimate]')).toBeNull();
  });

  it('loading renders a skeleton, not partial data', () => {
    const { container, queryByText } = renderWithGds(<GdsMapPinPreviewCard {...FULL} loading />);
    expect(container.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(2);
    expect(queryByText('Riverside Swim Club')).toBeNull();
  });

  it('surface shadow comes from the elevation axis, not a literal', () => {
    const { container } = renderWithGds(<GdsMapPinPreviewCard title="x" />);
    const card = container.querySelector('[data-gds-map-pin-preview-card]') as HTMLElement;
    expect(card.style.boxShadow).toContain('--gds-elevation-sheet');
  });
});
