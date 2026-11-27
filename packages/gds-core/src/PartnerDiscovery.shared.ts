import type { ReactNode } from 'react';

/** Price tier for a partner place, rendered as `$` through `$$$$`. */
export type PartnerPriceLevel = '$' | '$$' | '$$$' | '$$$$';

/** Selectable amenity option shown in filter chips and amenity grids. */
export interface PartnerAmenityOption {
  id: string;
  label: string;
  /** Optional leading icon rendered alongside the label. */
  icon?: ReactNode;
  description?: string;
}

/** Current discovery filter selection: free-text query, chosen amenity ids, and price tiers. */
export interface PartnerDiscoveryFilterState {
  query: string;
  amenities: string[];
  prices: PartnerPriceLevel[];
}

/** A place returned by discovery search, positioned on the map and rendered as a result card. */
export interface PartnerPlaceResult {
  id: string;
  title: string;
  category?: string;
  neighborhood?: string;
  amenities: string[];
  price?: PartnerPriceLevel;
  href: string;
  /** Optional map position; places without coordinates are treated as always in-viewport. */
  coordinates?: { lat: number; lng: number };
}

/** Geographic bounds of the visible map, used to keep only in-view places. */
export interface PartnerMapViewport {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Telemetry event names emitted across the partner-discovery components. */
export type PartnerDiscoveryEventName =
  | 'filter_open'
  | 'filter_apply'
  | 'filter_reset'
  | 'zero_results'
  | 'map_load'
  | 'map_error'
  | 'result_select'
  | 'pin_select'
  | 'detail_action_click'
  | 'share_success'
  | 'share_failure'
  | 'newsletter_submit_success'
  | 'newsletter_submit_failure'
  | 'submission_failure';

/** A single telemetry event with its source component, timestamp, and redacted metadata. */
export interface PartnerDiscoveryEvent {
  name: PartnerDiscoveryEventName;
  component: string;
  timestamp: string;
  /** Extra event context; sensitive keys are stripped by `redactPartnerDiscoveryEventMetadata`. */
  metadata?: Record<string, string | number | boolean | null>;
}

/** Consumer callback invoked with each emitted discovery telemetry event. */
export type PartnerDiscoveryEventHandler = (event: PartnerDiscoveryEvent) => void;

/** Default set of amenity filter options shipped with the discovery components. */
export const partnerDiscoveryDefaultAmenities: PartnerAmenityOption[] = [
  { id: 'wifi', label: 'Free wifi' },
  { id: 'step-free', label: 'Step-free access' },
  { id: 'quiet-area', label: 'Quiet area' },
  { id: 'power-outlets', label: 'Power outlets' },
  { id: 'card-payments', label: 'Card payments' },
  { id: 'pet-friendly', label: 'Pet friendly' },
  { id: 'outdoor-seating', label: 'Outdoor seating' },
  { id: 'reservations', label: 'Reservations' },
];

/** Family-oriented amenity options; the default set through 6.9.0. Pass it as the options to keep that set. */
export const partnerDiscoveryFamilyAmenities: PartnerAmenityOption[] = [
  { id: 'high-chairs', label: 'High chairs' },
  { id: 'booster-seats', label: 'Booster seats' },
  { id: 'changing-table', label: 'Changing table' },
  { id: 'menu-mods', label: 'Menu mods' },
  { id: 'stroller-storage', label: 'Stroller storage' },
  { id: 'kids-options', label: 'Kids options' },
  { id: 'outdoor-seating', label: 'Outdoor seating' },
  { id: 'reservations', label: 'Reservations' },
];

/** Empty starting filter state (no query, amenities, or prices selected). */
export const partnerDiscoveryDefaultFilterState: PartnerDiscoveryFilterState = {
  query: '',
  amenities: [],
  prices: [],
};

function createPartnerEvent(
  name: PartnerDiscoveryEventName,
  component: string,
  metadata?: PartnerDiscoveryEvent['metadata'],
): PartnerDiscoveryEvent {
  return {
    name,
    component,
    timestamp: new Date().toISOString(),
    metadata: redactPartnerDiscoveryEventMetadata(metadata),
  };
}

/**
 * Returns a copy of the metadata with sensitive keys (email, phone, query,
 * apiKey, token, location, lat, lng) replaced by `[redacted]`.
 */
export function redactPartnerDiscoveryEventMetadata(metadata: PartnerDiscoveryEvent['metadata'] = {}) {
  const blocked = new Set(['email', 'phone', 'query', 'apiKey', 'token', 'location', 'lat', 'lng']);
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      blocked.has(key) ? '[redacted]' : value,
    ]),
  );
}

/**
 * Builds a discovery event and dispatches it to `handler`; a no-op when no
 * handler is provided. Handler errors are swallowed so telemetry adapters can
 * never break the UI flow.
 */
export function emitPartnerDiscoveryEvent(
  handler: PartnerDiscoveryEventHandler | undefined,
  name: PartnerDiscoveryEventName,
  component: string,
  metadata?: PartnerDiscoveryEvent['metadata'],
) {
  if (!handler) {
    return;
  }

  try {
    handler(createPartnerEvent(name, component, metadata));
  } catch {
    // Telemetry adapters must never break the UI flow.
  }
}

/** Returns a new filter state with the given amenity id toggled on or off. */
export function togglePartnerAmenity(
  state: PartnerDiscoveryFilterState,
  amenityId: string,
): PartnerDiscoveryFilterState {
  const amenities = state.amenities.includes(amenityId)
    ? state.amenities.filter((id) => id !== amenityId)
    : [...state.amenities, amenityId];

  return { ...state, amenities };
}

/** Returns a new filter state with the given price tier toggled on or off. */
export function togglePartnerPrice(
  state: PartnerDiscoveryFilterState,
  price: PartnerPriceLevel,
): PartnerDiscoveryFilterState {
  const prices = state.prices.includes(price)
    ? state.prices.filter((value) => value !== price)
    : [...state.prices, price];

  return { ...state, prices };
}

/** Returns a fresh copy of the default (empty) discovery filter state. */
export function resetPartnerDiscoveryFilters(): PartnerDiscoveryFilterState {
  return { ...partnerDiscoveryDefaultFilterState };
}

/**
 * Filters places by case-insensitive query, required amenities, selected price
 * tiers, and (when supplied) the map viewport bounds. Places without
 * coordinates are always kept regardless of the viewport.
 */
export function filterPartnerPlaces(
  places: PartnerPlaceResult[],
  filters: PartnerDiscoveryFilterState,
  viewport?: PartnerMapViewport,
) {
  const query = filters.query.trim().toLocaleLowerCase();

  return places.filter((place) => {
    const haystack = [place.title, place.category, place.neighborhood, place.price, ...place.amenities]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
    const queryMatch = !query || haystack.includes(query);
    const amenityMatch = filters.amenities.every((amenity) => place.amenities.includes(amenity));
    const priceMatch = !filters.prices.length || (place.price ? filters.prices.includes(place.price) : false);
    const viewportMatch = !viewport || !place.coordinates || (
      place.coordinates.lat <= viewport.north
      && place.coordinates.lat >= viewport.south
      && place.coordinates.lng <= viewport.east
      && place.coordinates.lng >= viewport.west
    );

    return queryMatch && amenityMatch && priceMatch && viewportMatch;
  });
}
