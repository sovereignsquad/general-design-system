import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { GdsMapPinPreviewCard } from './GdsMapPinPreviewCard';
import {
  PartnerPlaceDetailTemplate,
  partnerDiscoveryDefaultAmenities,
  partnerDiscoveryFamilyAmenities,
} from './PartnerDiscovery';

const labels = { back: 'Back', photos: 'Photos', website: 'Website', menu: 'Menu', share: 'Share', copied: 'Copied', shareFailed: 'Share failed' };

describe('generic names for activity- and family-specific APIs (#985)', () => {
  it('PartnerPlaceDetailTemplate shows the generic tip, and falls back to the deprecated parentTip', () => {
    const { unmount } = renderWithGds(
      <PartnerPlaceDetailTemplate backHref="#" labels={{ ...labels, tip: 'Tip' }} place={{ id: 'a', title: 'A', amenities: [], tip: 'Quiet in the mornings.' }} />,
    );
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('Quiet in the mornings.')).toBeInTheDocument();
    unmount();
    renderWithGds(
      <PartnerPlaceDetailTemplate backHref="#" labels={{ ...labels, parentTip: 'Old tip' }} place={{ id: 'b', title: 'B', amenities: [], parentTip: 'Legacy text.' }} />,
    );
    expect(screen.getByText('Old tip')).toBeInTheDocument();
    expect(screen.getByText('Legacy text.')).toBeInTheDocument();
  });

  it('GdsMapPinPreviewCard renders category and audience, and still accepts activity and ageRange', () => {
    const { unmount } = renderWithGds(<GdsMapPinPreviewCard title="Library" category="Reading" neighbourhood="Barbican" audience="All ages" />);
    expect(screen.getByText(/Reading/)).toBeInTheDocument();
    expect(screen.getByText('All ages')).toBeInTheDocument();
    unmount();
    renderWithGds(<GdsMapPinPreviewCard title="Studio" activity="Pottery" ageRange="16+" />);
    expect(screen.getByText(/Pottery/)).toBeInTheDocument();
    expect(screen.getByText('16+')).toBeInTheDocument();
  });

  it('ships a neutral default amenity set and keeps the family set as its own export', () => {
    const ids = partnerDiscoveryDefaultAmenities.map((amenity) => amenity.id);
    expect(ids).not.toContain('high-chairs');
    expect(ids).not.toContain('kids-options');
    expect(partnerDiscoveryFamilyAmenities.map((amenity) => amenity.id)).toEqual(
      ['high-chairs', 'booster-seats', 'changing-table', 'menu-mods', 'stroller-storage', 'kids-options', 'outdoor-seating', 'reservations'],
    );
  });
});
