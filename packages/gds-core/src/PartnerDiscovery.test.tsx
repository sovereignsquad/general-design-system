import React from 'react';
import { Button } from '@mantine/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithGds } from '../../../test-utils/render';
import { AmenityChipGrid, PartnerDiscoveryFilters, PartnerDiscoveryFooter, PartnerDiscoveryHeader, PartnerDiscoveryShell, PartnerFaqList, PartnerListIndex, PartnerMapListShell, PartnerNewsletterCapture, PartnerPlaceDetailTemplate, PartnerSubmissionEntry, type PartnerDiscoveryFilterLabels } from './PartnerDiscovery';
import { emitPartnerDiscoveryEvent, filterPartnerPlaces, partnerDiscoveryDefaultAmenities, redactPartnerDiscoveryEventMetadata, resetPartnerDiscoveryFilters, togglePartnerAmenity, togglePartnerPrice, type PartnerDiscoveryFilterState, type PartnerPlaceResult } from './PartnerDiscovery.shared';

const filterLabels: PartnerDiscoveryFilterLabels = {
  search: 'Search places',
  searchPlaceholder: 'Search by amenity, cuisine, or neighborhood',
  filters: 'Filters',
  reset: 'Reset',
  close: 'Close',
  apply: 'Apply',
  amenities: 'Amenities',
  price: 'Price',
  selected: 'Selected filters',
};

const places: PartnerPlaceResult[] = [
  {
    id: 'one',
    title: 'Green Cafe',
    category: 'Cafe',
    neighborhood: 'Downtown',
    amenities: ['high-chairs', 'changing-table'],
    price: '$$',
    href: '/places/green-cafe',
    coordinates: { lat: 40.1, lng: -73.9 },
  },
  {
    id: 'two',
    title: 'Park Tacos',
    category: 'Mexican',
    neighborhood: 'Parkside',
    amenities: ['outdoor-seating'],
    price: '$',
    href: '/places/park-tacos',
  },
];

describe('PartnerDiscovery', () => {
  it('provides deterministic filter state helpers', () => {
    const empty = resetPartnerDiscoveryFilters();
    const withAmenity = togglePartnerAmenity(empty, 'high-chairs');
    const withPrice = togglePartnerPrice(withAmenity, '$$');

    expect(withAmenity.amenities).toEqual(['high-chairs']);
    expect(togglePartnerAmenity(withAmenity, 'high-chairs').amenities).toEqual([]);
    expect(withPrice.prices).toEqual(['$$']);
    expect(togglePartnerPrice(withPrice, '$$').prices).toEqual([]);
  });

  it('filters partner places by query, amenity, price, and viewport', () => {
    expect(filterPartnerPlaces(places, { query: 'cafe', amenities: [], prices: [] })).toHaveLength(1);
    expect(filterPartnerPlaces(places, { query: '', amenities: ['changing-table'], prices: ['$$'] })).toHaveLength(1);
    expect(filterPartnerPlaces(places, { query: '', amenities: ['changing-table'], prices: ['$$'] }, {
      north: 41,
      south: 40,
      east: -73,
      west: -74,
    })).toHaveLength(1);
    expect(filterPartnerPlaces(places, { query: '', amenities: ['changing-table'], prices: ['$$'] }, {
      north: 39,
      south: 38,
      east: -73,
      west: -74,
    })).toHaveLength(0);
  });

  it('redacts sensitive observability metadata and isolates adapter failures', () => {
    const eventHandler = vi.fn(() => {
      throw new Error('adapter failed');
    });

    expect(redactPartnerDiscoveryEventMetadata({
      email: 'person@example.com',
      query: 'family dinner',
      resultCount: 2,
    })).toEqual({
      email: '[redacted]',
      query: '[redacted]',
      resultCount: 2,
    });

    expect(() => emitPartnerDiscoveryEvent(eventHandler, 'filter_apply', 'test', { query: 'secret' })).not.toThrow();
    expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
      name: 'filter_apply',
      metadata: { query: '[redacted]' },
    }));
  });

  it('renders responsive public shell, header, and footer landmarks', () => {
    renderWithGds(
      <PartnerDiscoveryShell
        logo={<strong>Partner Baby</strong>}
        navItems={[
          { id: 'add', label: 'Add to Map', href: '/add' },
          { id: 'lists', label: 'Lists', href: '/lists', current: true },
        ]}
        footer={{
          copyright: 'Partner LLC ©2026',
          legalLinks: [{ id: 'privacy', label: 'Privacy Policy', href: '/privacy' }],
        }}
      >
        <div>Discovery content</div>
      </PartnerDiscoveryShell>,
    );

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lists' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Partner LLC ©2026');
    expect(screen.getByText('Discovery content')).toBeInTheDocument();
  });

  it('renders amenity filters with accessible selected states', async () => {
    const user = userEvent.setup();
    const onAmenityToggle = vi.fn();
    const onApply = vi.fn();
    const onReset = vi.fn();
    const onEvent = vi.fn();
    const value: PartnerDiscoveryFilterState = {
      query: 'cafe',
      amenities: ['wifi'],
      prices: ['$$'],
    };

    renderWithGds(
      <PartnerDiscoveryFilters
        value={value}
        labels={filterLabels}
        amenities={partnerDiscoveryDefaultAmenities}
        opened
        onAmenityToggle={onAmenityToggle}
        onApply={onApply}
        onReset={onReset}
        onEvent={onEvent}
      />,
    );

    expect(screen.getByLabelText('Search places')).toHaveValue('cafe');
    expect(screen.getByRole('button', { name: 'Free wifi' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Step-free access' }));
    expect(onAmenityToggle).toHaveBeenCalledWith('step-free');

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'filter_apply' }));

    await user.click(screen.getAllByRole('button', { name: 'Reset' })[0]);
    expect(onReset).toHaveBeenCalled();
  });

  it('renders map/list runtime states and list-only fallback', async () => {
    const user = userEvent.setup();
    const onActivePlaceChange = vi.fn();

    renderWithGds(
      <PartnerMapListShell
        places={places}
        filters={{ query: '', amenities: [], prices: [] }}
        activePlaceId="one"
        onActivePlaceChange={onActivePlaceChange}
        mapAdapter={({ onPinSelect }) => (
          <Button type="button" onClick={() => onPinSelect?.('two')}>Select pin</Button>
        )}
      />,
    );

    expect(screen.getByRole('button', { name: 'Select pin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Green Cafe' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select pin' }));
    expect(onActivePlaceChange).toHaveBeenCalledWith('two');
  });

  it('renders sparse and complete detail states without broken actions', () => {
    renderWithGds(
      <PartnerPlaceDetailTemplate
        backHref="/"
        labels={{
          back: 'Back',
          photos: 'Photos',
          website: 'Website',
          menu: 'Menu',
          share: 'Share',
          parentTip: 'Parent tip',
          copied: 'Copied',
          shareFailed: 'Share failed',
        }}
        shareState="failed"
        place={{
          id: 'one',
          title: 'Green Cafe',
          address: '1 Main St',
          neighborhood: 'Downtown',
          category: 'Cafe',
          parentTip: 'Room for strollers.',
          amenities: [{ id: 'high-chairs', label: 'High chairs' }],
          links: { website: 'https://example.com', shareUrl: 'https://example.com/green-cafe' },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Green Cafe', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Website' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.queryByRole('link', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share failed' })).toBeInTheDocument();
    expect(screen.getByText('Room for strollers.')).toBeInTheDocument();
  });

  it('renders newsletter capture and content/intake templates with visible recovery states', () => {
    renderWithGds(
      <>
        <PartnerNewsletterCapture
          opened
          email="bad"
          state="error"
          labels={{
            title: 'Your city got family-friendly',
            description: 'Get the weekly list.',
            emailLabel: 'Email',
            submitLabel: 'Join',
            dismissLabel: 'Close',
            successMessage: 'Subscribed',
            errorMessage: 'Try again',
          }}
        />
        <PartnerListIndex title="Lists" items={[{ id: 'one', title: 'Best cafes', href: '/lists/cafes' }]} />
        <PartnerFaqList items={[{ id: 'q1', question: 'How are places selected?', answer: 'By partner-owned criteria.' }]} />
        <PartnerSubmissionEntry title="Add to map" form={<Button>Submit place</Button>} error="Network timeout" />
      </>,
    );

    expect(screen.getByRole('dialog', { name: 'Your city got family-friendly' })).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Best cafes' })).toHaveAttribute('href', '/lists/cafes');
    expect(screen.getByRole('heading', { name: 'How are places selected?' })).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('exports focused building blocks for direct composition', () => {
    renderWithGds(
      <>
        <PartnerDiscoveryHeader logo="Logo" navItems={[]} />
        <PartnerDiscoveryFooter copyright="Copyright" legalLinks={[]} />
        <AmenityChipGrid amenities={[]} selected={[]} />
      </>,
    );

    expect(screen.getByText('Copyright')).toBeInTheDocument();
    expect(screen.getByText('No amenities')).toBeInTheDocument();
  });
});
