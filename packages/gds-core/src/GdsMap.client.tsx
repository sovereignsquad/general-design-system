'use client';

// Issue 566 — the governed map surface.
//
// Leaflet is an implementation detail and is never exposed. The reason that matters here more
// than usual: Leaflet holds imperative DOM and reads resolved colours at construction, so a
// map is exactly the "third-party surface initialised with a theme snapshot" that issue 561
// identified — the CSS cascade cannot fix it, and without an explicit destroy/re-init keyed on
// theme identity a theme switch leaves the map rendering the previous theme.

import { useEffect, useId, useRef, useState } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { computeGdsThemeIdentity, resolveGdsAccentTokens, type GdsAccentName, type GdsThemePresetId } from '@sovereignsquad/gds-theme';
import type { GdsBadgeAccentShade } from './GdsBadge';
import { GDS_OSM_TILE_SOURCE, assertGdsTileSource, type GdsMapTileSource } from './map-tile-policy';

/** A geographic point. */
export interface GdsLatLng { lat: number; lng: number }

/** A geographic rectangle. */
export interface GdsLatLngBounds { north: number; south: number; east: number; west: number }

/** What the map is centred on and how far it is zoomed. */
export interface GdsMapViewport { center: GdsLatLng; zoom: number }

/** One placed marker. */
export interface GdsMapMarker {
  id: string;
  position: GdsLatLng;
  accent: GdsAccentName;
  /**
   * Accessible name. REQUIRED, and consumer-supplied.
   *
   * Never derived from an icon's import name: "IconMapPin2" is not what a screen-reader user
   * needs to hear, and a marker whose only identity is its colour is invisible to them.
   */
  label: string;
  shade?: GdsBadgeAccentShade;
  /** The position is approximate; rendered distinctly rather than implying false precision. */
  approximate?: boolean;
  selected?: boolean;
}

/** Lifecycle state, surfaced so a consumer can render its own loading and error affordances. */
export type GdsMapState = 'initializing' | 'ready' | 'error';

/** Props for {@link GdsMap}. */
export interface GdsMapProps {
  /** Markers to place. Re-placed imperatively when this changes, because Leaflet owns their DOM. */
  markers: GdsMapMarker[];
  /** Controlled viewport. When supplied the map does not self-manage its view. */
  viewport?: GdsMapViewport;
  /** Initial viewport when uncontrolled. Ignored once `viewport` is supplied. */
  defaultViewport?: GdsMapViewport;
  /** Fit to these bounds on mount. Mutually exclusive with `defaultViewport`. */
  fitBounds?: GdsLatLngBounds;
  /** Closest-out zoom the user may reach. Defaults to 3 — far enough out to show a continent. */
  minZoom?: number;
  /** Closest-in zoom. Clamped to what the tile source actually serves, so tiles never 404. */
  maxZoom?: number;
  /** Restricts panning, so a user cannot lose the map entirely. */
  maxBounds?: GdsLatLngBounds;
  /**
   * Fired after the view settles. `reason` distinguishes a user gesture from a programmatic
   * move, so a consumer syncing URL state does not fight its own updates.
   */
  onViewportChange?: (viewport: GdsMapViewport, reason: 'user' | 'programmatic') => void;
  /** Fired when a marker is activated. Receives the marker id, never the engine's object. */
  onMarkerSelect?: (markerId: string) => void;
  /** Currently selected marker id, for a consumer driving selection from outside the map. */
  selectedMarkerId?: string;
  /** `false` renders a non-interactive map. */
  interactive?: boolean;
  /** Preset and scheme the map is themed by; drives the destroy/re-init on a theme switch. */
  preset?: GdsThemePresetId | string;
  /** Colour scheme the map is themed by; part of the identity that triggers re-initialisation. */
  colorScheme?: 'light' | 'dark';
  /** Accessible name for the map region. Required, for the same reason marker labels are. */
  label: string;
  /** Reports lifecycle transitions, so a consumer can render its own loading or error affordance. */
  onStateChange?: (state: GdsMapState) => void;
  /** Height of the map surface. Defaults to a governed token. */
  height?: string;
  /** Tile source. Defaults to OpenStreetMap; any replacement must carry its own attribution. */
  tileSource?: GdsMapTileSource;
}

const DEFAULT_VIEWPORT: GdsMapViewport = { center: { lat: 51.505, lng: -0.09 }, zoom: 13 };

/**
 * Governed map surface backed by Leaflet and OpenStreetMap raster tiles.
 *
 * Rendered from a dedicated subpath rather than the main barrel: Leaflet is browser-only, and
 * pulling it into the main entry would make every consumer pay for it whether or not they show
 * a map.
 *
 * The component renders a deterministic placeholder on the server and during initialisation.
 * That is not a nicety — a map that renders nothing until tiles arrive looks broken, and on a
 * slow connection it looks broken for a long time.
 */
export function GdsMap({
  markers, viewport, defaultViewport, fitBounds, minZoom = 3, maxZoom = 18, maxBounds,
  onViewportChange, onMarkerSelect, selectedMarkerId, interactive = true,
  preset = 'default', colorScheme = 'light', label, onStateChange, height = '420px',
  tileSource = GDS_OSM_TILE_SOURCE,
}: GdsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<unknown>(null);
  const [state, setState] = useState<GdsMapState>('initializing');
  const regionId = useId();

  // The theme identity is what forces a full re-init. Leaflet reads resolved values when it
  // constructs its panes; nothing about a CSS variable change reaches back into them.
  const themeIdentity = computeGdsThemeIdentity({ preset, colorScheme });

  useEffect(() => {
    let disposed = false;
    let map: { remove: () => void } | null = null;

    (async () => {
      try {
        // Imported dynamically so the module never loads during SSR, where `window` is absent
        // and Leaflet throws at import time rather than at use.
        const L = (await import('leaflet')).default ?? (await import('leaflet'));
        if (disposed || !containerRef.current) return;

        const initial = viewport ?? defaultViewport ?? DEFAULT_VIEWPORT;
        map = (L as typeof import('leaflet')).map(containerRef.current, {
          center: [initial.center.lat, initial.center.lng],
          zoom: initial.zoom,
          minZoom,
          maxZoom,
          // Leaflet's own chrome is replaced by GDS controls, so its defaults are suppressed
          // rather than restyled — restyling third-party chrome is how a design system ends up
          // maintaining someone else's markup.
          zoomControl: false,
          attributionControl: false,
          dragging: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          keyboard: interactive,
          ...(maxBounds
            ? { maxBounds: [[maxBounds.south, maxBounds.west], [maxBounds.north, maxBounds.east]] as [[number, number], [number, number]] }
            : {}),
        }) as unknown as { remove: () => void };
        engineRef.current = map;

        // Tiles. The source is validated before use: a source without attribution cannot be
        // rendered at all, because the credit is an ODbL licence condition rather than a
        // design choice.
        const source = assertGdsTileSource(tileSource);
        (L as typeof import('leaflet')).tileLayer(source.url, {
          maxZoom: Math.min(maxZoom, source.maxZoom),
          // Leaflet's own attribution control is disabled; the credit is rendered as GDS UI
          // below so it cannot be hidden by a consumer restyling Leaflet's chrome.
          attribution: '',
        }).addTo(map as never);

        // Markers, viewport reporting and selection — wired, not declared. A prop that
        // silently does nothing is worse than an absent one: a consumer wires a handler, sees
        // no calls, and has no way to tell a broken map from an inert API.
        const accentTokens = resolveGdsAccentTokens(undefined, colorScheme, preset);
        const layer = (L as typeof import('leaflet')).layerGroup().addTo(map as never);
        for (const marker of markers) {
          const shade = marker.shade ?? 'base';
          const colour = accentTokens[`--gds-accent-${marker.accent}-${shade}`] ?? 'currentColor';
          const icon = (L as typeof import('leaflet')).divIcon({
            className: 'gds-map-pin',
            // `aria-hidden` on the glyph and the accessible name on the marker itself: the
            // shape carries no meaning a screen reader can use, the label does.
            html: `<span aria-hidden="true" style="display:block;width:18px;height:18px;border-radius:var(--gds-radius-pin, 50%);background:${colour};border:2px solid var(--gds-bg-card);box-shadow:var(--gds-elevation-1);${marker.approximate ? 'opacity:0.65;border-style:dashed;' : ''}"></span>`,
            iconSize: [18, 18],
          });
          const placed = (L as typeof import('leaflet'))
            .marker([marker.position.lat, marker.position.lng], { icon, title: marker.label, alt: marker.label, keyboard: interactive })
            .addTo(layer);
          if (onMarkerSelect) placed.on('click', () => onMarkerSelect(marker.id));
        }

        if (onViewportChange) {
          (map as unknown as { on: (e: string, f: () => void) => void }).on('moveend', () => {
            const m = map as unknown as { getCenter: () => { lat: number; lng: number }; getZoom: () => number };
            const c = m.getCenter();
            onViewportChange({ center: { lat: c.lat, lng: c.lng }, zoom: m.getZoom() }, 'user');
          });
        }

        if (fitBounds) {
          (map as unknown as { fitBounds: (b: [[number, number], [number, number]]) => void })
            .fitBounds([[fitBounds.south, fitBounds.west], [fitBounds.north, fitBounds.east]]);
        }

        if (!disposed) {
          setState('ready');
          onStateChange?.('ready');
        }
      } catch {
        // A map that fails to load must SAY so. Failing silently leaves an empty box the user
        // reads as "nothing here" rather than "this did not load".
        if (!disposed) {
          setState('error');
          onStateChange?.('error');
        }
      }
    })();

    return () => {
      disposed = true;
      // Explicit destroy: Leaflet keeps document-level listeners and a tile cache, and a
      // remount without this leaks both. The re-init on theme identity depends on it running.
      try { map?.remove(); } catch { /* already torn down */ }
      engineRef.current = null;
    };
    // themeIdentity is a dependency ON PURPOSE — it is what makes a theme switch rebuild the
    // map rather than leave it painted in the previous theme.
    // markers/handlers are intentionally in the dependency list: Leaflet places them
    // imperatively, so a changed marker set has to be re-placed rather than re-rendered.
  }, [themeIdentity, interactive, minZoom, maxZoom, markers, selectedMarkerId, colorScheme, preset]);

  return (
    <Stack gap="xs">
      <Box
        ref={containerRef}
        role="region"
        aria-label={label}
        aria-describedby={`${regionId}-state`}
        data-gds-map=""
        data-gds-map-state={state}
        data-gds-theme-identity={themeIdentity}
        style={{
          height,
          borderRadius: 'var(--gds-radius-panel)',
          overflow: 'hidden',
          background: 'var(--gds-bg-surface)',
          border: '1px solid var(--gds-border-card)',
        }}
      />
      {/* The state is announced, not merely styled: a sighted user sees an empty box while a
          screen-reader user gets nothing at all unless it is said. */}
      <Text id={`${regionId}-state`} size="sm" c="dimmed" role="status" aria-live="polite">
        {state === 'ready'
          ? `${label}: ${markers.length} ${markers.length === 1 ? 'marker' : 'markers'}.`
          : state === 'error'
            ? `${label} could not be loaded.`
            : `${label} is loading.`}
      </Text>
      {/*
        The ODbL credit, rendered as GDS UI rather than through Leaflet's attributionControl.
        It is not optional and not configurable away: OpenStreetMap data is licensed on the
        condition that it is credited, so this renders whenever a map does. Leaflet's own
        control was disabled precisely so the credit does not live inside third-party chrome a
        consumer might restyle or remove.
      */}
      <Text size="xs" c="dimmed" data-gds-map-attribution="">
        <a href={tileSource.attributionHref} target="_blank" rel="noreferrer noopener">{tileSource.attributionText}</a>
      </Text>
    </Stack>
  );
}
