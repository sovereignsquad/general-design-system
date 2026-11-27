'use client';
import { GdsMap } from '@sovereignsquad/gds-core/map';
import { GdsIcon } from '@sovereignsquad/gds-core/client';

const markers = [
  { id: 'a', position: { lat: 47.4979, lng: 19.0402 }, accent: 'ocean', label: 'Budapest' },
  { id: 'b', position: { lat: 51.5072, lng: -0.1276 }, accent: 'ocean', label: 'London' },
];

export default function MapClient() {
  return (
    <div>
      <p data-probe="client-icon"><GdsIcon icon="Search" label="Search" /> client icon</p>
      <div style={{ height: 400 }} data-probe="map-box">
        <GdsMap label="Venues" markers={markers as never} fitBounds={{ north: 52, south: 47, east: 20, west: -1 }} />
      </div>
    </div>
  );
}
